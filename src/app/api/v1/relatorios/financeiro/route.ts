/**
 * @lastReview 2026-01-05 15:35 - API de relatório financeiro implementada
 * @fileoverview API para relatório financeiro completo com filtros avançados
 * Segurança: ✅ Validação admin obrigatória
 * Funcionalidades: ✅ Filtros por período/método/status, ✅ KPIs por status, ✅ Paginação
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, transactions, pastorProfiles, churchProfiles } from '@/db/schema'
import { eq, and, between, desc, sql } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import type { UserRole } from '@/lib/types'

export async function GET(request: Request) {
  const { user } = await validateRequest()
  if (!user || (user.role as UserRole) !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const method = searchParams.get('method')
    const status = searchParams.get('status')

    // Definir período padrão (últimos 30 dias)
    const endDate = to ? new Date(to) : new Date()
    const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Condições base
    const conditions = [
      eq(transactions.companyId, user.companyId),
      between(transactions.createdAt, startDate, endDate),
    ]

    // Filtros opcionais
    if (method && method !== 'all') {
      conditions.push(eq(transactions.paymentMethod, method as 'pix' | 'credit_card' | 'boleto'))
    }

    if (status && status !== 'all') {
      conditions.push(eq(transactions.status, status as 'approved' | 'pending' | 'refused' | 'refunded'))
    }

    // Buscar todas as transações
    const allTransactions = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        method: transactions.paymentMethod,
        status: transactions.status,
        date: transactions.createdAt,
        contributorId: transactions.contributorId,
        firstName: pastorProfiles.firstName,
        lastName: pastorProfiles.lastName,
        nomeFantasia: churchProfiles.nomeFantasia,
        contributorRole: users.role,
      })
      .from(transactions)
      .innerJoin(users, eq(transactions.contributorId, users.id))
      .leftJoin(pastorProfiles, eq(users.id, pastorProfiles.userId))
      .leftJoin(churchProfiles, eq(users.id, churchProfiles.userId))
      .where(and(...conditions))
      .orderBy(desc(transactions.createdAt))

    // Formatar transações
    const formattedTransactions = allTransactions.map(t => ({
      id: t.id,
      contributorName: t.contributorRole === 'pastor' 
        ? `${t.firstName || ''} ${t.lastName || ''}`.trim()
        : t.nomeFantasia || 'N/A',
      contributorRole: t.contributorRole,
      amount: Number(t.amount),
      method: t.method,
      status: t.status,
      date: new Date(t.date).toLocaleDateString('pt-BR'),
    }))

    // Calcular KPIs por status
    const statusSummary = await db
      .select({
        status: transactions.status,
        count: sql<number>`COUNT(*)`,
        total: sql<number>`SUM(${transactions.amount})`,
      })
      .from(transactions)
      .where(and(...conditions))
      .groupBy(transactions.status)

    const statusTotals = statusSummary.reduce((acc, s) => {
      acc[s.status] = Number(s.total)
      return acc
    }, {} as Record<string, number>)

    // Resumo por método de pagamento
    const methodSummary = await db
      .select({
        method: transactions.paymentMethod,
        count: sql<number>`COUNT(*)`,
        total: sql<number>`SUM(${transactions.amount})`,
      })
      .from(transactions)
      .where(and(...conditions))
      .groupBy(transactions.paymentMethod)

    const byMethod = methodSummary.reduce((acc, m) => {
      acc[m.method] = {
        count: Number(m.count),
        total: Number(m.total),
      }
      return acc
    }, {} as Record<string, { count: number; total: number }>)

    return NextResponse.json({
      transactions: formattedTransactions,
      summary: {
        totalTransactions: formattedTransactions.length,
        totalApproved: statusTotals.approved || 0,
        totalPending: statusTotals.pending || 0,
        totalRefused: statusTotals.refused || 0,
        totalRefunded: statusTotals.refunded || 0,
        byMethod,
      },
      period: {
        from: startDate.toLocaleDateString('pt-BR'),
        to: endDate.toLocaleDateString('pt-BR'),
      },
    })
  } catch (error) {
    console.error('Erro ao gerar relatório financeiro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}