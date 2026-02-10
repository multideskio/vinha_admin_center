/**
 * @fileoverview Rota da API para buscar dados para o dashboard do supervisor.
 * @version 1.3
 * @date 2025-01-06
 * @author Sistema de Padronização
 * @lastReview 2025-01-06 17:00
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, transactions, pastorProfiles, churchProfiles } from '@/db/schema'
import { count, sum, eq, isNull, and, desc, sql, inArray, gte, lt } from 'drizzle-orm'
import { format, subMonths, startOfMonth } from 'date-fns'
import { authenticateApiKey } from '@/lib/api-auth'
import { validateRequest } from '@/lib/jwt'
import { type UserRole } from '@/lib/types'
import { getErrorMessage } from '@/lib/error-types'
import { rateLimit } from '@/lib/rate-limit'

const calculateChange = (current: number, previous: number): string => {
  if (previous === 0) {
    return current > 0 ? '+100% (era 0)' : 'Nenhuma alteração'
  }
  const percentage = ((current - previous) / previous) * 100
  if (Math.abs(percentage) < 0.1) return 'Nenhuma alteração'
  const sign = percentage > 0 ? '+' : ''
  return `${sign}${percentage.toFixed(1)}% em relação ao período anterior`
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    // Rate limiting: 60 requests per minute
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('supervisor-dashboard', ip, 60, 60) // 60 requests per minute
    if (!rateLimitResult.allowed) {
      console.error('[SUPERVISOR_DASHBOARD_RATE_LIMIT]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 },
      )
    }

    // Primeiro tenta autenticação JWT (usuário logado via web)
    const { user: sessionUser } = await validateRequest()

    if (!sessionUser) {
      // Se não há usuário logado, tenta autenticação por API Key
      const authResponse = await authenticateApiKey()
      if (authResponse) return authResponse

      // Se nem JWT nem API Key funcionaram, retorna 401
      console.error('[SUPERVISOR_DASHBOARD_AUTH_ERROR]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    // Verifica se o usuário tem a role correta
    if ((sessionUser.role as UserRole) !== 'supervisor') {
      console.error('[SUPERVISOR_DASHBOARD_ROLE_ERROR]', {
        userId: sessionUser.id,
        role: sessionUser.role,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Acesso negado. Role supervisor necessária.' },
        { status: 403 },
      )
    }
    const supervisorId = sessionUser.id

    // Extrair parâmetros de data da URL
    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    // Usar datas fornecidas ou padrão (mês atual)
    const now = new Date()
    const startOfCurrentMonth = startDateParam ? new Date(startDateParam) : startOfMonth(now)
    const endOfCurrentMonth = endDateParam ? new Date(endDateParam) : now
    const startOfPreviousMonth = startOfMonth(subMonths(startOfCurrentMonth, 1))

    const pastorsResult = await db
      .select({ id: pastorProfiles.userId })
      .from(pastorProfiles)
      .leftJoin(users, eq(pastorProfiles.userId, users.id))
      .where(and(eq(pastorProfiles.supervisorId, supervisorId), isNull(users.deletedAt)))
    const pastorIds = pastorsResult.map((p) => p.id).filter(Boolean)

    const churchesResult = await db
      .select({ id: churchProfiles.userId })
      .from(churchProfiles)
      .leftJoin(users, eq(churchProfiles.userId, users.id))
      .where(and(eq(churchProfiles.supervisorId, supervisorId), isNull(users.deletedAt)))
    const churchIds = churchesResult.map((c) => c.id).filter(Boolean)

    const networkUserIds = [supervisorId, ...pastorIds, ...churchIds]

    const totalPastors = pastorIds.length
    const totalChurches = churchIds.length
    const totalMembers = 1 + totalPastors + totalChurches

    // KPI Calculations
    const revenueCurrentMonthResult =
      networkUserIds.length > 0
        ? await db
            .select({ value: sum(transactions.amount) })
            .from(transactions)
            .where(
              and(
                eq(transactions.status, 'approved'),
                gte(transactions.createdAt, startOfCurrentMonth),
                lt(transactions.createdAt, endOfCurrentMonth),
                inArray(transactions.contributorId, networkUserIds),
              ),
            )
        : [{ value: '0' }]
    const revenuePreviousMonthResult =
      networkUserIds.length > 0
        ? await db
            .select({ value: sum(transactions.amount) })
            .from(transactions)
            .where(
              and(
                eq(transactions.status, 'approved'),
                gte(transactions.createdAt, startOfPreviousMonth),
                lt(transactions.createdAt, startOfCurrentMonth),
                inArray(transactions.contributorId, networkUserIds),
              ),
            )
        : [{ value: '0' }]
    const totalRevenueCurrentMonth = parseFloat(revenueCurrentMonthResult[0]?.value || '0')
    const totalRevenuePreviousMonth = parseFloat(revenuePreviousMonthResult[0]?.value || '0')

    const newMembersThisMonthResult =
      networkUserIds.length > 0
        ? await db
            .select({ value: count() })
            .from(users)
            .where(
              and(
                gte(users.createdAt, startOfCurrentMonth),
                lt(users.createdAt, endOfCurrentMonth),
                inArray(users.id, networkUserIds),
              ),
            )
        : [{ value: 0 }]
    const newMembersThisMonth = newMembersThisMonthResult[0]?.value || 0

    const newTransactionsThisMonthResult =
      networkUserIds.length > 0
        ? await db
            .select({ value: count() })
            .from(transactions)
            .where(
              and(
                gte(transactions.createdAt, startOfCurrentMonth),
                lt(transactions.createdAt, endOfCurrentMonth),
                inArray(transactions.contributorId, networkUserIds),
              ),
            )
        : [{ value: 0 }]
    const newTransactionsLastMonthResult =
      networkUserIds.length > 0
        ? await db
            .select({ value: count() })
            .from(transactions)
            .where(
              and(
                gte(transactions.createdAt, startOfPreviousMonth),
                lt(transactions.createdAt, startOfCurrentMonth),
                inArray(transactions.contributorId, networkUserIds),
              ),
            )
        : [{ value: 0 }]
    const totalTransactionsThisMonth = newTransactionsThisMonthResult[0]?.value || 0
    const totalTransactionsLastMonth = newTransactionsLastMonthResult[0]?.value || 0

    const kpis = {
      totalRevenue: {
        value: `R$ ${totalRevenueCurrentMonth.toFixed(2)}`,
        change: calculateChange(totalRevenueCurrentMonth, totalRevenuePreviousMonth),
      },
      totalMembers: { value: `${totalMembers}`, change: `+${newMembersThisMonth} no período` },
      totalTransactions: {
        value: `+${totalTransactionsThisMonth}`,
        change: calculateChange(totalTransactionsThisMonth, totalTransactionsLastMonth),
      },
      totalChurches: { value: `${totalChurches}`, change: '' },
      totalPastors: { value: `${totalPastors}`, change: '' },
    }

    const revenueByMethod =
      networkUserIds.length > 0
        ? await db
            .select({
              method: transactions.paymentMethod,
              value: sum(transactions.amount).mapWith(Number),
            })
            .from(transactions)
            .where(
              and(
                eq(transactions.status, 'approved'),
                gte(transactions.createdAt, startOfCurrentMonth),
                lt(transactions.createdAt, endOfCurrentMonth),
                inArray(transactions.contributorId, networkUserIds),
              ),
            )
            .groupBy(transactions.paymentMethod)
        : []

    const recentTransactions =
      networkUserIds.length > 0
        ? await db
            .select({
              id: transactions.id,
              name: users.email,
              amount: transactions.amount,
              date: transactions.createdAt,
              status: transactions.status,
            })
            .from(transactions)
            .innerJoin(users, eq(transactions.contributorId, users.id))
            .where(
              and(
                gte(transactions.createdAt, startOfCurrentMonth),
                lt(transactions.createdAt, endOfCurrentMonth),
                inArray(transactions.contributorId, networkUserIds),
              ),
            )
            .orderBy(desc(transactions.createdAt))
            .limit(10)
        : []

    const recentRegistrations =
      networkUserIds.length > 0
        ? await db
            .select({
              id: users.id,
              name: users.email,
              role: users.role,
              date: users.createdAt,
            })
            .from(users)
            .where(
              and(
                gte(users.createdAt, startOfCurrentMonth),
                lt(users.createdAt, endOfCurrentMonth),
                inArray(users.id, networkUserIds),
              ),
            )
            .orderBy(desc(users.createdAt))
            .limit(10)
        : []

    const startOfSixMonthsAgo = startOfMonth(subMonths(now, 5))
    const newMembersByMonthData =
      networkUserIds.length > 0
        ? await db
            .select({
              month: sql<string>`TO_CHAR(${users.createdAt}, 'YYYY-MM')`,
              count: count(users.id),
            })
            .from(users)
            .where(
              and(gte(users.createdAt, startOfSixMonthsAgo), inArray(users.id, networkUserIds)),
            )
            .groupBy(sql`TO_CHAR(${users.createdAt}, 'YYYY-MM')`)
            .orderBy(sql`TO_CHAR(${users.createdAt}, 'YYYY-MM')`)
        : []

    const monthNames = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ]
    const formattedNewMembers = newMembersByMonthData.map((item) => ({
      month: monthNames[parseInt(item.month.substring(5, 7)) - 1],
      count: item.count,
    }))

    const formattedRevenueByMethod = revenueByMethod.map((item) => ({
      ...item,
      fill:
        item.method === 'pix' ? '#10b981' : item.method === 'credit_card' ? '#3b82f6' : '#f59e0b',
    }))

    const revenueByChurchData =
      churchIds.length > 0
        ? await db
            .select({
              name: churchProfiles.nomeFantasia,
              revenue: sum(transactions.amount).mapWith(Number),
            })
            .from(transactions)
            .innerJoin(churchProfiles, eq(transactions.originChurchId, churchProfiles.userId))
            .where(
              and(
                inArray(transactions.originChurchId, churchIds),
                eq(transactions.status, 'approved'),
                gte(transactions.createdAt, startOfCurrentMonth),
                lt(transactions.createdAt, endOfCurrentMonth),
              ),
            )
            .groupBy(churchProfiles.nomeFantasia)
        : []

    const membersByChurchData =
      churchIds.length > 0
        ? await db
            .select({
              name: churchProfiles.nomeFantasia,
              count: count(pastorProfiles.userId),
            })
            .from(churchProfiles)
            .leftJoin(pastorProfiles, eq(churchProfiles.supervisorId, pastorProfiles.supervisorId))
            .where(inArray(churchProfiles.userId, churchIds))
            .groupBy(churchProfiles.nomeFantasia)
        : []

    const colors = ['#16a34a', '#3b82f6', '#f97316', '#ef4444', '#8b5cf6']
    const revenueByChurch = revenueByChurchData.map((d, i) => ({
      ...d,
      revenue: Number(d.revenue),
      fill: colors[i % colors.length],
    }))
    const membersByChurch = membersByChurchData.map((d, i) => ({
      ...d,
      fill: colors[i % colors.length],
    }))

    return NextResponse.json({
      kpis,
      revenueByMethod: formattedRevenueByMethod,
      revenueByChurch,
      membersByChurch,
      recentTransactions: recentTransactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
        date: format(new Date(t.date), 'dd/MM/yyyy'),
      })),
      recentRegistrations: recentRegistrations.map((u) => ({
        ...u,
        type: u.role,
        avatar: u.name.substring(0, 2).toUpperCase(),
        date: format(new Date(u.date), 'dd/MM/yyyy'),
      })),
      newMembers: formattedNewMembers,
    })
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error)
    console.error('[SUPERVISOR_DASHBOARD_ERROR]', {
      error: errorMessage,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json(
      { error: 'Erro ao buscar dados do dashboard do supervisor', details: errorMessage },
      { status: 500 },
    )
  }
}
