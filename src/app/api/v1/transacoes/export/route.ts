import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import {
  transactions,
  users,
  churchProfiles,
  managerProfiles,
  supervisorProfiles,
  pastorProfiles,
} from '@/db/schema'
import { eq, gte, lt, desc } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    let query = db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        status: transactions.status,
        createdAt: transactions.createdAt,
        paymentMethod: transactions.paymentMethod,
        contributorId: users.id,
        contributorRole: users.role,
        contributorEmail: users.email,
        refundRequestReason: transactions.refundRequestReason,
      })
      .from(transactions)
      .innerJoin(users, eq(transactions.contributorId, users.id))
      .orderBy(desc(transactions.createdAt))
      .$dynamic()

    if (from) {
      query = query.where(gte(transactions.createdAt, new Date(from)))
    }

    if (to) {
      query = query.where(lt(transactions.createdAt, new Date(to)))
    }

    const data = await query

    // Enriquecer com nomes dos contribuintes
    const enrichedData = await Promise.all(
      data.map(async (t) => {
        let contributorName = t.contributorEmail

        try {
          if (t.contributorRole === 'manager') {
            const [profile] = await db
              .select({ firstName: managerProfiles.firstName, lastName: managerProfiles.lastName })
              .from(managerProfiles)
              .where(eq(managerProfiles.userId, t.contributorId))
              .limit(1)
            if (profile) contributorName = `${profile.firstName} ${profile.lastName}`
          } else if (t.contributorRole === 'supervisor') {
            const [profile] = await db
              .select({
                firstName: supervisorProfiles.firstName,
                lastName: supervisorProfiles.lastName,
              })
              .from(supervisorProfiles)
              .where(eq(supervisorProfiles.userId, t.contributorId))
              .limit(1)
            if (profile) contributorName = `${profile.firstName} ${profile.lastName}`
          } else if (t.contributorRole === 'pastor') {
            const [profile] = await db
              .select({ firstName: pastorProfiles.firstName, lastName: pastorProfiles.lastName })
              .from(pastorProfiles)
              .where(eq(pastorProfiles.userId, t.contributorId))
              .limit(1)
            if (profile) contributorName = `${profile.firstName} ${profile.lastName}`
          } else if (t.contributorRole === 'church_account') {
            const [profile] = await db
              .select({ nomeFantasia: churchProfiles.nomeFantasia })
              .from(churchProfiles)
              .where(eq(churchProfiles.userId, t.contributorId))
              .limit(1)
            if (profile) contributorName = profile.nomeFantasia
          }
        } catch (error) {
          console.error(`Erro ao buscar nome do contribuinte ${t.contributorId}:`, error)
        }

        return { ...t, contributorName }
      }),
    )

    const statusMap: Record<string, string> = {
      approved: 'Aprovada',
      pending: 'Pendente',
      refused: 'Recusada',
      refunded: 'Reembolsada',
    }

    const methodMap: Record<string, string> = {
      pix: 'PIX',
      credit_card: 'Cartão de Crédito',
      boleto: 'Boleto',
    }

    const csv = [
      'ID,Data,Contribuinte,Email,Valor,Método,Status,Motivo Reembolso',
      ...enrichedData.map((t) => {
        const date = new Date(t.createdAt).toLocaleDateString('pt-BR')
        const amount = parseFloat(t.amount).toFixed(2)
        const status = statusMap[t.status] || t.status
        const method = methodMap[t.paymentMethod] || t.paymentMethod
        const reason = t.refundRequestReason || '-'
        return `${t.id},${date},${t.contributorName},${t.contributorEmail},R$ ${amount},${method},${status},"${reason}"`
      }),
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="transacoes-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting transactions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
