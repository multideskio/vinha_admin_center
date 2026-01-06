/**
 * @fileoverview Rota da API para buscar dados para o dashboard do gerente.
 * @version 1.3
 * @date 2024-08-07
 * @author PH
 * @lastReview 2025-01-05 22:00
 */
import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import {
  users,
  transactions,
  pastorProfiles,
  supervisorProfiles,
  churchProfiles,
} from '@/db/schema'
import { count, sum, eq, isNull, and, desc, sql, inArray, gte, lt } from 'drizzle-orm'
import { format, subMonths, startOfMonth } from 'date-fns'
import { validateRequest } from '@/lib/jwt'
import { type UserRole } from '@/lib/types'
import { handleApiError, ApiError } from '@/lib/api-error-handler'
import { rateLimit } from '@/lib/rate-limit'

const calculateChange = (current: number, previous: number): string => {
  if (previous === 0) {
    return current > 0 ? '+100% (era 0)' : 'Nenhuma alteração'
  }
  const percentage = ((current - previous) / previous) * 100
  if (Math.abs(percentage) < 0.1) return 'Nenhuma alteração'
  const sign = percentage > 0 ? '+' : ''
  return `${sign}${percentage.toFixed(1)}% em relação ao mês passado`
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('manager-dashboard', ip, 60, 60) // 60 requests per minute
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 }
      )
    }

    const { user } = await validateRequest()
    if (!user || (user.role as UserRole) !== 'manager') {
      throw new ApiError(401, 'Não autorizado')
    }
    const managerId = user.id
    const now = new Date()
    const startOfCurrentMonth = startOfMonth(now)
    const startOfPreviousMonth = startOfMonth(subMonths(now, 1))

    const supervisorsResult = await db
      .select({ id: supervisorProfiles.userId })
      .from(supervisorProfiles)
      .where(and(eq(supervisorProfiles.managerId, managerId), isNull(users.deletedAt)))
      .leftJoin(users, eq(supervisorProfiles.userId, users.id))

    const supervisorIds = supervisorsResult.map((s) => s.id)

    let pastorIds: string[] = []
    if (supervisorIds.length > 0) {
      const pastorsResult = await db
        .select({ id: pastorProfiles.userId })
        .from(pastorProfiles)
        .where(and(inArray(pastorProfiles.supervisorId, supervisorIds), isNull(users.deletedAt)))
        .leftJoin(users, eq(pastorProfiles.userId, users.id))
      pastorIds = pastorsResult.map((p) => p.id)
    }

    let churchIds: string[] = []
    if (supervisorIds.length > 0) {
      const churchesResult = await db
        .select({ id: churchProfiles.userId })
        .from(churchProfiles)
        .where(and(inArray(churchProfiles.supervisorId, supervisorIds), isNull(users.deletedAt)))
        .leftJoin(users, eq(churchProfiles.userId, users.id))
      churchIds = churchesResult.map((c) => c.id)
    }

    const networkUserIds = [managerId, ...supervisorIds, ...pastorIds, ...churchIds]

    const totalSupervisors = supervisorIds.length
    const totalPastors = pastorIds.length
    const totalChurches = churchIds.length
    const totalMembers = 1 + totalSupervisors + totalPastors + totalChurches

    // KPI Calculations with previous month comparison
    const revenueCurrentMonthResult =
      networkUserIds.length > 0
        ? await db
            .select({ value: sum(transactions.amount) })
            .from(transactions)
            .where(
              and(
                eq(transactions.status, 'approved'),
                gte(transactions.createdAt, startOfCurrentMonth),
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
              and(gte(users.createdAt, startOfCurrentMonth), inArray(users.id, networkUserIds)),
            )
        : [{ value: 0 }]
    const newMembersThisMonth = newMembersThisMonthResult[0]?.value ?? 0

    const newTransactionsThisMonthResult =
      networkUserIds.length > 0
        ? await db
            .select({ value: count() })
            .from(transactions)
            .where(
              and(
                gte(transactions.createdAt, startOfCurrentMonth),
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
    const totalTransactionsThisMonth = newTransactionsThisMonthResult[0]?.value ?? 0
    const totalTransactionsLastMonth = newTransactionsLastMonthResult[0]?.value ?? 0

    const revenueByMethod =
      networkUserIds.length > 1
        ? await db
            .select({
              method: transactions.paymentMethod,
              value: sum(transactions.amount).mapWith(Number),
            })
            .from(transactions)
            .where(
              and(
                eq(transactions.status, 'approved'),
                inArray(transactions.contributorId, networkUserIds),
              ),
            )
            .groupBy(transactions.paymentMethod)
        : []

    const recentTransactionsData =
      networkUserIds.length > 0
        ? await db
            .select({
              id: transactions.id,
              contributorId: transactions.contributorId,
              contributorRole: users.role,
              email: users.email,
              amount: transactions.amount,
              date: transactions.createdAt,
              status: transactions.status,
            })
            .from(transactions)
            .innerJoin(users, eq(transactions.contributorId, users.id))
            .where(inArray(transactions.contributorId, networkUserIds))
            .orderBy(desc(transactions.createdAt))
            .limit(10)
        : []

    const recentRegistrationsData =
      networkUserIds.length > 0
        ? await db
            .select({
              id: users.id,
              name: users.email,
              role: users.role,
              date: users.createdAt,
            })
            .from(users)
            .where(inArray(users.id, networkUserIds))
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

    const kpis = {
      totalRevenue: {
        value: `R$ ${totalRevenueCurrentMonth.toFixed(2)}`,
        change: calculateChange(totalRevenueCurrentMonth, totalRevenuePreviousMonth),
      },
      totalMembers: { value: `${totalMembers}`, change: `+${newMembersThisMonth} este mês` },
      totalTransactions: {
        value: `+${totalTransactionsThisMonth}`,
        change: calculateChange(totalTransactionsThisMonth, totalTransactionsLastMonth),
      },
      totalChurches: { value: `${totalChurches}`, change: '' },
      totalPastors: { value: `${totalPastors}`, change: '' },
      totalSupervisors: { value: `${totalSupervisors}`, change: '' },
    }

    // Buscar nomes dos contribuintes
    const contributorIds = recentTransactionsData.map((t) => t.contributorId)
    const contributorPastorNames =
      contributorIds.length > 0
        ? await db
            .select({
              userId: pastorProfiles.userId,
              firstName: pastorProfiles.firstName,
              lastName: pastorProfiles.lastName,
            })
            .from(pastorProfiles)
            .where(inArray(pastorProfiles.userId, contributorIds))
        : []
    const contributorChurchNames =
      contributorIds.length > 0
        ? await db
            .select({ userId: churchProfiles.userId, nomeFantasia: churchProfiles.nomeFantasia })
            .from(churchProfiles)
            .where(inArray(churchProfiles.userId, contributorIds))
        : []
    const contributorSupervisorNames =
      contributorIds.length > 0
        ? await db
            .select({
              userId: supervisorProfiles.userId,
              firstName: supervisorProfiles.firstName,
              lastName: supervisorProfiles.lastName,
            })
            .from(supervisorProfiles)
            .where(inArray(supervisorProfiles.userId, contributorIds))
        : []

    const contributorNameMap = new Map<string, string>()
    contributorPastorNames.forEach((p) =>
      contributorNameMap.set(p.userId, `${p.firstName} ${p.lastName}`),
    )
    contributorChurchNames.forEach((c) => contributorNameMap.set(c.userId, c.nomeFantasia || ''))
    contributorSupervisorNames.forEach((s) =>
      contributorNameMap.set(s.userId, `${s.firstName} ${s.lastName}`),
    )

    const recentTransactions = recentTransactionsData.map((t) => ({
      id: t.id,
      name: contributorNameMap.get(t.contributorId) || t.email,
      amount: Number(t.amount),
      date: format(new Date(t.date), 'dd/MM/yyyy'),
      status: t.status,
    }))
    const recentRegistrations = recentRegistrationsData.map((u) => ({
      ...u,
      type: u.role,
      avatar: u.name.substring(0, 2).toUpperCase(),
      date: format(new Date(u.date), 'dd/MM/yyyy'),
    }))

    const colors = ['#16a34a', '#3b82f6', '#f97316', '#ef4444', '#8b5cf6']

    const revenueByChurchData =
      churchIds.length > 0
        ? await db
            .select({
              churchId: transactions.originChurchId,
              revenue: sum(transactions.amount).mapWith(Number),
            })
            .from(transactions)
            .where(
              and(
                eq(transactions.status, 'approved'),
                inArray(transactions.originChurchId, churchIds),
              ),
            )
            .groupBy(transactions.originChurchId)
        : []

    const churchNames =
      churchIds.length > 0
        ? await db
            .select({ id: users.id, name: users.email })
            .from(users)
            .where(inArray(users.id, churchIds))
        : []

    const churchNameMap = new Map(churchNames.map((c) => [c.id, c.name]))

    const revenueByChurch = revenueByChurchData.map((item, index) => ({
      name: churchNameMap.get(item.churchId || '') || 'Igreja',
      revenue: item.revenue,
      fill: colors[index % colors.length],
    }))

    const contributionsByChurchData =
      churchIds.length > 0
        ? await db
            .select({
              churchId: transactions.originChurchId,
              count: count(transactions.id),
            })
            .from(transactions)
            .where(
              and(
                eq(transactions.status, 'approved'),
                inArray(transactions.originChurchId, churchIds),
              ),
            )
            .groupBy(transactions.originChurchId)
        : []

    const membersByChurch = contributionsByChurchData.map((item, index) => ({
      name: churchNameMap.get(item.churchId || '') || 'Igreja',
      count: item.count,
      fill: colors[index % colors.length],
    }))

    return NextResponse.json({
      kpis,
      revenueByMethod: formattedRevenueByMethod,
      revenueByChurch,
      membersByChurch,
      recentTransactions,
      recentRegistrations,
      newMembers: formattedNewMembers,
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
