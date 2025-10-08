/**
 * @fileoverview API para listar transações
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { transactions } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const userTransactions = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        status: transactions.status,
        createdAt: transactions.createdAt,
        paymentMethod: transactions.paymentMethod,
      })
      .from(transactions)
      .where(eq(transactions.contributorId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(50)

    const formattedTransactions = userTransactions.map(t => ({
      id: t.id,
      amount: parseFloat(t.amount),
      status: t.status,
      date: t.createdAt.toLocaleDateString('pt-BR'),
      paymentMethod: t.paymentMethod,
    }))

    return NextResponse.json({ transactions: formattedTransactions })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
