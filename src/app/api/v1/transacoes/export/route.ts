import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { transactions, users } from '@/db/schema'
import { eq, gte, lt } from 'drizzle-orm'
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
        contributorEmail: users.email,
        refundRequestReason: transactions.refundRequestReason,
      })
      .from(transactions)
      .innerJoin(users, eq(transactions.contributorId, users.id))
      .$dynamic()

    if (from) {
      query = query.where(gte(transactions.createdAt, new Date(from)))
    }

    if (to) {
      query = query.where(lt(transactions.createdAt, new Date(to)))
    }

    const data = await query

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
      'ID,Data,Contribuinte,Valor,Método,Status,Motivo Reembolso',
      ...data.map(t => {
        const date = new Date(t.createdAt).toLocaleDateString('pt-BR')
        const amount = parseFloat(t.amount).toFixed(2)
        const status = statusMap[t.status] || t.status
        const method = methodMap[t.paymentMethod] || t.paymentMethod
        const reason = t.refundRequestReason || '-'
        return `${t.id},${date},${t.contributorEmail},R$ ${amount},${method},${status},"${reason}"`
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
