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

    const query = db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        status: transactions.status,
        createdAt: transactions.createdAt,
        paymentMethod: transactions.paymentMethod,
        contributorId: transactions.contributorId,
        originChurchId: transactions.originChurchId,
        refundRequestReason: transactions.refundRequestReason,
      })
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(100)

    const userTransactions = userId
      ? await query.where(eq(transactions.contributorId, userId))
      : await query

    const formattedTransactions = userTransactions.map(t => ({
      id: t.id,
      contributor: t.contributorId,
      church: t.originChurchId,
      amount: parseFloat(t.amount),
      method: t.paymentMethod,
      status: t.status,
      date: t.createdAt.toISOString(),
      refundRequestReason: t.refundRequestReason,
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
