import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { db } from '@/db/drizzle'
import {
  transactions,
  users,
  churchProfiles,
  managerProfiles,
  supervisorProfiles,
  pastorProfiles,
} from '@/db/schema'
import { eq, gte, lt, desc, inArray, and, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { validateRequest } from '@/lib/jwt'
import { env } from '@/lib/env'

export async function GET(request: NextRequest) {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    // BUG-05 fix: Validação Zod dos parâmetros de exportação
    const exportParamsSchema = z.object({
      from: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
      to: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
    })
    const paramsValidation = exportParamsSchema.safeParse({
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
    })
    if (!paramsValidation.success) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: paramsValidation.error.errors },
        { status: 400 },
      )
    }
    const { from, to } = paramsValidation.data

    // BUG-11 fix: Adicionar filtro companyId para isolamento multi-tenant
    const COMPANY_ID = env.COMPANY_INIT
    const conditions: SQL[] = [eq(transactions.companyId, COMPANY_ID)]
    if (from) conditions.push(gte(transactions.createdAt, new Date(from)))
    if (to) conditions.push(lt(transactions.createdAt, new Date(to)))

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

    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    const data = await query.limit(10000)
    type DataRow = (typeof data)[number]

    // ✅ OTIMIZADO: Buscar todos os perfis de uma vez com inArray por role (em vez de query por transação)
    const contributorIds = [...new Set(data.map((t: DataRow) => t.contributorId))]
    const nameMap = new Map<string, string>()

    if (contributorIds.length > 0) {
      const managerIds = data
        .filter((t: DataRow) => t.contributorRole === 'manager')
        .map((t: DataRow) => t.contributorId) as string[]
      const supervisorIds = data
        .filter((t: DataRow) => t.contributorRole === 'supervisor')
        .map((t: DataRow) => t.contributorId) as string[]
      const pastorIds = data
        .filter((t: DataRow) => t.contributorRole === 'pastor')
        .map((t: DataRow) => t.contributorId) as string[]
      const churchIds = data
        .filter((t: DataRow) => t.contributorRole === 'church_account')
        .map((t: DataRow) => t.contributorId) as string[]

      const [managers, supervisors, pastors, churches] = await Promise.all([
        managerIds.length > 0
          ? db
              .select({
                userId: managerProfiles.userId,
                firstName: managerProfiles.firstName,
                lastName: managerProfiles.lastName,
              })
              .from(managerProfiles)
              .where(inArray(managerProfiles.userId, [...new Set(managerIds)]))
          : Promise.resolve([]),
        supervisorIds.length > 0
          ? db
              .select({
                userId: supervisorProfiles.userId,
                firstName: supervisorProfiles.firstName,
                lastName: supervisorProfiles.lastName,
              })
              .from(supervisorProfiles)
              .where(inArray(supervisorProfiles.userId, [...new Set(supervisorIds)]))
          : Promise.resolve([]),
        pastorIds.length > 0
          ? db
              .select({
                userId: pastorProfiles.userId,
                firstName: pastorProfiles.firstName,
                lastName: pastorProfiles.lastName,
              })
              .from(pastorProfiles)
              .where(inArray(pastorProfiles.userId, [...new Set(pastorIds)]))
          : Promise.resolve([]),
        churchIds.length > 0
          ? db
              .select({ userId: churchProfiles.userId, nomeFantasia: churchProfiles.nomeFantasia })
              .from(churchProfiles)
              .where(inArray(churchProfiles.userId, [...new Set(churchIds)]))
          : Promise.resolve([]),
      ])

      for (const p of managers) nameMap.set(p.userId, `${p.firstName} ${p.lastName}`)
      for (const p of supervisors) nameMap.set(p.userId, `${p.firstName} ${p.lastName}`)
      for (const p of pastors) nameMap.set(p.userId, `${p.firstName} ${p.lastName}`)
      for (const p of churches) nameMap.set(p.userId, p.nomeFantasia || '')
    }

    const enrichedData = data.map((t: DataRow) => ({
      ...t,
      contributorName: nameMap.get(t.contributorId) || t.contributorEmail,
    }))

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
      ...enrichedData.map((t: DataRow & { contributorName: string }) => {
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
