/**
 * @fileoverview API para relatório financeiro completo
 * @version 1.0
 * @date 2025-11-05
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { transactions, users, pastorProfiles, churchProfiles } from '@/db/schema'
import { and, eq, gte, lt, desc } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import type { UserRole } from '@/lib/types'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user || (user.role as UserRole) !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)

    // Filtros
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const method = searchParams.get('method') // 'all', 'pix', 'credit_card', 'boleto'
    const status = searchParams.get('status') // 'all', 'approved', 'pending', 'refused', 'refunded'

    const now = new Date()
    const startDate = from ? new Date(from) : startOfMonth(now)
    const endDate = to ? new Date(to) : endOfMonth(now)

    // Construir condições
    const conditions = [gte(transactions.createdAt, startDate), lt(transactions.createdAt, endDate)]

    if (method && method !== 'all') {
      if (method === 'pix' || method === 'credit_card' || method === 'boleto') {
        conditions.push(eq(transactions.paymentMethod, method))
      }
    }

    if (status && status !== 'all') {
      if (
        status === 'approved' ||
        status === 'pending' ||
        status === 'refused' ||
        status === 'refunded'
      ) {
        conditions.push(eq(transactions.status, status))
      }
    }

    // Buscar transações
    const transactionsData = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        method: transactions.paymentMethod,
        status: transactions.status,
        date: transactions.createdAt,
        contributorId: transactions.contributorId,
        contributorEmail: users.email,
        contributorRole: users.role,
      })
      .from(transactions)
      .innerJoin(users, eq(transactions.contributorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(transactions.createdAt))
      .limit(1000)

    // Buscar nomes dos contribuintes
    const enrichedTransactions = await Promise.all(
      transactionsData.map(async (t) => {
        let contributorName = t.contributorEmail

        if (t.contributorRole === 'pastor') {
          const [pastor] = await db
            .select({
              firstName: pastorProfiles.firstName,
              lastName: pastorProfiles.lastName,
            })
            .from(pastorProfiles)
            .where(eq(pastorProfiles.userId, t.contributorId))
            .limit(1)
          if (pastor) {
            contributorName = `${pastor.firstName} ${pastor.lastName}`
          }
        } else if (t.contributorRole === 'church_account') {
          const [church] = await db
            .select({
              nomeFantasia: churchProfiles.nomeFantasia,
            })
            .from(churchProfiles)
            .where(eq(churchProfiles.userId, t.contributorId))
            .limit(1)
          if (church) {
            contributorName = church.nomeFantasia
          }
        }

        return {
          id: t.id,
          contributorName,
          contributorRole: t.contributorRole,
          amount: Number(t.amount),
          method: t.method,
          status: t.status,
          date: format(new Date(t.date), 'dd/MM/yyyy HH:mm'),
        }
      }),
    )

    // Calcular resumo
    const totalApproved = enrichedTransactions
      .filter((t) => t.status === 'approved')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalPending = enrichedTransactions
      .filter((t) => t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalRefused = enrichedTransactions
      .filter((t) => t.status === 'refused')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalRefunded = enrichedTransactions
      .filter((t) => t.status === 'refunded')
      .reduce((sum, t) => sum + t.amount, 0)

    // Agrupar por método
    const byMethod = enrichedTransactions.reduce(
      (acc, t) => {
        if (!acc[t.method]) {
          acc[t.method] = { count: 0, total: 0 }
        }
        const methodData = acc[t.method]
        if (methodData) {
          methodData.count++
          methodData.total += t.amount
        }
        return acc
      },
      {} as Record<string, { count: number; total: number }>,
    )

    return NextResponse.json({
      transactions: enrichedTransactions,
      summary: {
        totalTransactions: enrichedTransactions.length,
        totalApproved,
        totalPending,
        totalRefused,
        totalRefunded,
        byMethod,
      },
      period: {
        from: format(startDate, 'dd/MM/yyyy'),
        to: format(endDate, 'dd/MM/yyyy'),
      },
    })
  } catch (error: unknown) {
    console.error('Erro ao buscar relatório financeiro:', error)
    return NextResponse.json(
      {
        error: 'Erro ao buscar relatório financeiro',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    )
  }
}
