/**
 * @fileoverview API para estatísticas de fraude de um usuário
 * @version 1.0
 * @date 2025-01-06
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { transactions, users } from '@/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await validateRequest()
  if (!user || !['admin', 'manager', 'supervisor'].includes(user.role)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const { id } = await params

    // Verificar se o usuário existe
    const [targetUser] = await db.select().from(users).where(eq(users.id, id)).limit(1)

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Buscar transações marcadas como fraude
    const fraudTransactions = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        fraudMarkedAt: transactions.fraudMarkedAt,
        fraudReason: transactions.fraudReason,
        paymentMethod: transactions.paymentMethod,
        gatewayTransactionId: transactions.gatewayTransactionId,
      })
      .from(transactions)
      .where(and(eq(transactions.contributorId, id), eq(transactions.isFraud, true)))
      .orderBy(desc(transactions.fraudMarkedAt))
      .limit(100)

    // Calcular estatísticas
    const totalFraudTransactions = fraudTransactions.length
    const totalFraudAmount = fraudTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0)

    const lastTransaction = fraudTransactions[fraudTransactions.length - 1]
    const firstTransaction = fraudTransactions[0]

    const firstFraudDate = lastTransaction?.fraudMarkedAt || null
    const lastFraudDate = firstTransaction?.fraudMarkedAt || null

    // Buscar total de transações do usuário para calcular percentual
    const [countResult] = await db
      .select({ total: sql<number>`COUNT(*)` })
      .from(transactions)
      .where(eq(transactions.contributorId, id))
      .limit(1)

    const totalTransactions = Number(countResult?.total ?? 0)
    const fraudPercentage =
      totalTransactions > 0 ? (totalFraudTransactions / totalTransactions) * 100 : 0

    return NextResponse.json({
      success: true,
      stats: {
        totalFraudTransactions,
        totalFraudAmount,
        totalTransactions,
        fraudPercentage: Math.round(fraudPercentage * 100) / 100,
        firstFraudDate,
        lastFraudDate,
      },
      fraudTransactions: fraudTransactions.map((t) => ({
        ...t,
        amount: parseFloat(t.amount),
        fraudMarkedAt: t.fraudMarkedAt?.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error fetching fraud stats:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao buscar estatísticas de fraude' },
      { status: 500 },
    )
  }
}
