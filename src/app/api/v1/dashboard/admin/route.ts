/**
 * @fileoverview Rota da API para buscar dados para o dashboard do administrador.
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import {
  users,
  regions,
  transactions,
  pastorProfiles,
  supervisorProfiles,
  churchProfiles,
  managerProfiles,
  adminProfiles,
} from '@/db/schema'
import { count, sum, eq, isNull, and, desc, sql, gte, lt, inArray } from 'drizzle-orm'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { validateRequest } from '@/lib/jwt'
import type { UserRole } from '@/lib/types'
import { getErrorMessage } from '@/lib/error-types'
import { getCache, setCache } from '@/lib/cache'

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
  const { user } = await validateRequest()
  if (!user || (user.role as UserRole) !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const cacheKey = `dashboard:admin:${user.id}:from:${from || 'null'}:to:${to || 'null'}`
    const cached = await getCache(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const now = new Date()
    const startDate = from ? new Date(from) : startOfMonth(now)
    const endDate = to ? new Date(to) : now

    const startOfCurrentMonth = startOfMonth(now)
    const startOfPreviousMonth = startOfMonth(subMonths(now, 1))
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const endOfPreviousMonth = endOfMonth(startOfPreviousMonth)

    // --- KPI Calculations ---
    const totalManagers = await db
      .select({ value: count() })
      .from(users)
      .where(and(eq(users.role, 'manager'), isNull(users.deletedAt)))
    const totalSupervisors = await db
      .select({ value: count() })
      .from(users)
      .where(and(eq(users.role, 'supervisor'), isNull(users.deletedAt)))
    const totalPastors = await db
      .select({ value: count() })
      .from(users)
      .where(and(eq(users.role, 'pastor'), isNull(users.deletedAt)))
    const totalChurches = await db
      .select({ value: count() })
      .from(users)
      .where(and(eq(users.role, 'church_account'), isNull(users.deletedAt)))

    // Revenue (filtered by date range)
    const revenueCurrentMonthResult = await db
      .select({ value: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.status, 'approved'),
          gte(transactions.createdAt, startDate),
          lt(transactions.createdAt, endDate),
        ),
      )
    const revenuePreviousMonthResult = await db
      .select({ value: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.status, 'approved'),
          gte(transactions.createdAt, startOfPreviousMonth),
          lt(transactions.createdAt, startOfCurrentMonth),
        ),
      )
    const totalRevenueCurrentMonth = parseFloat(revenueCurrentMonthResult[0]?.value || '0')
    const totalRevenuePreviousMonth = parseFloat(revenuePreviousMonthResult[0]?.value || '0')

    // Members
    const totalMembersResult = await db
      .select({ value: count() })
      .from(users)
      .where(isNull(users.deletedAt))
    const newMembersThisMonthResult = await db
      .select({ value: count() })
      .from(users)
      .where(gte(users.createdAt, startOfCurrentMonth))
    const totalMembers = totalMembersResult[0]?.value || 0
    const newMembersThisMonth = newMembersThisMonthResult[0]?.value || 0

    // Transactions
    const totalTransactionsResult = await db.select({ value: count() }).from(transactions)
    const newTransactionsThisMonthResult = await db
      .select({ value: count() })
      .from(transactions)
      .where(gte(transactions.createdAt, startOfCurrentMonth))
    const newTransactionsLastMonthResult = await db
      .select({ value: count() })
      .from(transactions)
      .where(
        and(
          gte(transactions.createdAt, startOfPreviousMonth),
          lt(transactions.createdAt, startOfCurrentMonth),
        ),
      )
    const totalTransactions = totalTransactionsResult[0]?.value || 0
    const newTransactionsThisMonth = newTransactionsThisMonthResult[0]?.value || 0
    const newTransactionsLastMonth = newTransactionsLastMonthResult[0]?.value || 0

    const revenueByMethod = await db
      .select({
        method: transactions.paymentMethod,
        value: sum(transactions.amount).mapWith(Number),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.status, 'approved'),
          gte(transactions.createdAt, startDate),
          lt(transactions.createdAt, endDate),
        ),
      )
      .groupBy(transactions.paymentMethod)

    // Revenue por região: considerar transações de pastores e igrejas, somando por região do supervisor
    const revenueByRegionPastors = await db
      .select({
        name: regions.name,
        color: regions.color,
        revenue: sql<number>`sum(${transactions.amount})`.mapWith(Number),
      })
      .from(pastorProfiles)
      .innerJoin(users, eq(pastorProfiles.userId, users.id))
      .innerJoin(transactions, eq(users.id, transactions.contributorId))
      .innerJoin(supervisorProfiles, eq(pastorProfiles.supervisorId, supervisorProfiles.userId))
      .innerJoin(regions, eq(supervisorProfiles.regionId, regions.id))
      .where(
        and(
          eq(transactions.status, 'approved'),
          gte(transactions.createdAt, startDate),
          lt(transactions.createdAt, endDate),
        ),
      )
      .groupBy(regions.id, regions.name, regions.color)

    const revenueByRegionChurches = await db
      .select({
        name: regions.name,
        color: regions.color,
        revenue: sql<number>`sum(${transactions.amount})`.mapWith(Number),
      })
      .from(churchProfiles)
      .innerJoin(users, eq(churchProfiles.userId, users.id))
      .innerJoin(transactions, eq(users.id, transactions.contributorId))
      .innerJoin(supervisorProfiles, eq(churchProfiles.supervisorId, supervisorProfiles.userId))
      .innerJoin(regions, eq(supervisorProfiles.regionId, regions.id))
      .where(
        and(
          eq(transactions.status, 'approved'),
          gte(transactions.createdAt, startDate),
          lt(transactions.createdAt, endDate),
        ),
      )
      .groupBy(regions.id, regions.name, regions.color)

    const revenueByRegionMap = new Map<
      string,
      { name: string; color: string | null; revenue: number }
    >()
    for (const row of [...revenueByRegionPastors, ...revenueByRegionChurches]) {
      const key = row.name
      const existing = revenueByRegionMap.get(key)
      if (existing) {
        existing.revenue += Number(row.revenue || 0)
      } else {
        revenueByRegionMap.set(key, {
          name: row.name,
          color: row.color,
          revenue: Number(row.revenue || 0),
        })
      }
    }
    const revenueByRegionData = Array.from(revenueByRegionMap.values())

    const churchesByRegionData = await db
      .select({
        name: regions.name,
        color: regions.color,
        count: count(churchProfiles.id),
      })
      .from(regions)
      .leftJoin(supervisorProfiles, eq(regions.id, supervisorProfiles.regionId))
      .leftJoin(churchProfiles, eq(supervisorProfiles.userId, churchProfiles.supervisorId))
      .groupBy(regions.id, regions.name, regions.color)

    const recentTransactionsData = await db
      .select({
        id: transactions.id,
        email: users.email,
        amount: transactions.amount,
        date: transactions.createdAt,
        status: transactions.status,
        contributorId: users.id,
        contributorRole: users.role,
      })
      .from(transactions)
      .innerJoin(users, eq(transactions.contributorId, users.id))
      .where(and(gte(transactions.createdAt, startDate), lt(transactions.createdAt, endDate)))
      .orderBy(desc(transactions.createdAt))
      .limit(10)

    // Buscar nomes reais dos contribuintes das transações recentes
    const contributorIds = recentTransactionsData.map((t) => t.contributorId)

    console.log('[DASHBOARD_DEBUG] Contributor IDs:', contributorIds)

    // Buscar nomes de pastores
    const pastorNames =
      contributorIds.length > 0
        ? await db
            .select({
              id: pastorProfiles.userId,
              name: sql<string>`${pastorProfiles.firstName} || ' ' || ${pastorProfiles.lastName}`,
            })
            .from(pastorProfiles)
            .where(inArray(pastorProfiles.userId, contributorIds))
        : []

    console.log('[DASHBOARD_DEBUG] Pastor names found:', pastorNames.length)

    // Buscar nomes de supervisores
    const supervisorNames =
      contributorIds.length > 0
        ? await db
            .select({
              id: supervisorProfiles.userId,
              name: sql<string>`${supervisorProfiles.firstName} || ' ' || ${supervisorProfiles.lastName}`,
            })
            .from(supervisorProfiles)
            .where(inArray(supervisorProfiles.userId, contributorIds))
        : []

    console.log('[DASHBOARD_DEBUG] Supervisor names found:', supervisorNames.length)

    // Buscar nomes de igrejas
    const churchNames =
      contributorIds.length > 0
        ? await db
            .select({
              id: churchProfiles.userId,
              name: churchProfiles.nomeFantasia,
            })
            .from(churchProfiles)
            .where(inArray(churchProfiles.userId, contributorIds))
        : []

    console.log('[DASHBOARD_DEBUG] Church names found:', churchNames.length)

    // Buscar nomes de managers
    const managerNames =
      contributorIds.length > 0
        ? await db
            .select({
              id: managerProfiles.userId,
              name: sql<string>`${managerProfiles.firstName} || ' ' || ${managerProfiles.lastName}`,
            })
            .from(managerProfiles)
            .where(inArray(managerProfiles.userId, contributorIds))
        : []

    console.log('[DASHBOARD_DEBUG] Manager names found:', managerNames.length)

    // Buscar nomes de admins
    const adminNames =
      contributorIds.length > 0
        ? await db
            .select({
              id: adminProfiles.userId,
              name: sql<string>`${adminProfiles.firstName} || ' ' || ${adminProfiles.lastName}`,
            })
            .from(adminProfiles)
            .where(inArray(adminProfiles.userId, contributorIds))
        : []

    console.log('[DASHBOARD_DEBUG] Admin names found:', adminNames.length)

    // Criar mapa de nomes
    const nameMap = new Map<string, string>()
    for (const p of pastorNames) nameMap.set(p.id, p.name)
    for (const s of supervisorNames) nameMap.set(s.id, s.name)
    for (const c of churchNames) nameMap.set(c.id, c.name)
    for (const m of managerNames) nameMap.set(m.id, m.name)
    for (const a of adminNames) nameMap.set(a.id, a.name)

    console.log('[DASHBOARD_DEBUG] Name map size:', nameMap.size)
    console.log('[DASHBOARD_DEBUG] Name map entries:', Array.from(nameMap.entries()))

    const recentRegistrationsData = await db
      .select({
        id: users.id,
        name: users.email,
        role: users.role,
        date: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(10)

    const startOfSixMonthsAgo = startOfMonth(subMonths(now, 5))
    const newMembersByMonthData = await db
      .select({
        month: sql<string>`TO_CHAR(${users.createdAt}, 'YYYY-MM')`,
        count: count(users.id),
      })
      .from(users)
      .where(gte(users.createdAt, startOfSixMonthsAgo))
      .groupBy(sql`TO_CHAR(${users.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${users.createdAt}, 'YYYY-MM')`)

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

    // --- Inadimplentes (Pastores e Igrejas que não contribuíram nos últimos 3 meses) ---
    const threeMonthsAgo = startOfMonth(subMonths(now, 3))

    // Buscar pastores inadimplentes
    const pastorsWithTitheDay = await db
      .select({
        id: users.id,
        firstName: pastorProfiles.firstName,
        lastName: pastorProfiles.lastName,
        titheDay: users.titheDay,
      })
      .from(users)
      .innerJoin(pastorProfiles, eq(users.id, pastorProfiles.userId))
      .where(and(eq(users.role, 'pastor'), isNull(users.deletedAt)))

    // Buscar igrejas inadimplentes
    const churchesWithTitheDay = await db
      .select({
        id: users.id,
        nomeFantasia: churchProfiles.nomeFantasia,
        titheDay: users.titheDay,
      })
      .from(users)
      .innerJoin(churchProfiles, eq(users.id, churchProfiles.userId))
      .where(and(eq(users.role, 'church_account'), isNull(users.deletedAt)))

    // ✅ CORRIGIDO: Buscar todos os últimos pagamentos de uma vez (otimização N+1)
    const allContributorIds = [
      ...pastorsWithTitheDay.map((p) => p.id),
      ...churchesWithTitheDay.map((c) => c.id),
    ]

    // ✅ CORRIGIDO: Evitar SQL error quando não há contributors (empty IN clause)
    const lastPaymentsData =
      allContributorIds.length > 0
        ? await db
            .select({
              contributorId: transactions.contributorId,
              lastPayment: sql<Date>`MAX(${transactions.createdAt})`.mapWith(
                (val) => new Date(val),
              ),
            })
            .from(transactions)
            .where(
              and(
                eq(transactions.status, 'approved'),
                sql`${transactions.contributorId} IN ${allContributorIds}`,
              ),
            )
            .groupBy(transactions.contributorId)
        : []

    // Criar Map para acesso O(1)
    const lastPaymentMap = new Map(lastPaymentsData.map((p) => [p.contributorId, p.lastPayment]))

    const defaulters = []

    // ✅ CORRIGIDO: Verificar pastores sem queries adicionais
    for (const pastor of pastorsWithTitheDay) {
      const lastPaymentDate = lastPaymentMap.get(pastor.id)

      // Se não tem pagamento OU o último foi antes de 3 meses atrás
      if (!lastPaymentDate || lastPaymentDate < threeMonthsAgo) {
        const daysSince = lastPaymentDate
          ? Math.floor((now.getTime() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24))
          : Math.floor((now.getTime() - threeMonthsAgo.getTime()) / (1000 * 60 * 60 * 24))

        defaulters.push({
          id: pastor.id,
          name: `${pastor.firstName} ${pastor.lastName}`,
          type: 'pastor' as const,
          titheDay: pastor.titheDay,
          lastPayment: lastPaymentDate ? format(lastPaymentDate, 'dd/MM/yyyy') : null,
          daysLate: daysSince,
        })
      }
    }

    // ✅ CORRIGIDO: Verificar igrejas sem queries adicionais
    for (const church of churchesWithTitheDay) {
      const lastPaymentDate = lastPaymentMap.get(church.id)

      // Se não tem pagamento OU o último foi antes de 3 meses atrás
      if (!lastPaymentDate || lastPaymentDate < threeMonthsAgo) {
        const daysSince = lastPaymentDate
          ? Math.floor((now.getTime() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24))
          : Math.floor((now.getTime() - threeMonthsAgo.getTime()) / (1000 * 60 * 60 * 24))

        defaulters.push({
          id: church.id,
          name: church.nomeFantasia,
          type: 'church' as const,
          titheDay: church.titheDay,
          lastPayment: lastPaymentDate ? format(lastPaymentDate, 'dd/MM/yyyy') : null,
          daysLate: daysSince,
        })
      }
    }

    // Ordenar por dias de atraso (maior primeiro)
    defaulters.sort((a, b) => b.daysLate - a.daysLate)

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
      totalMembers: {
        value: `+${totalMembers}`,
        change: `+${newMembersThisMonth} este mês`,
      },
      totalTransactions: {
        value: `+${totalTransactions}`,
        change: calculateChange(newTransactionsThisMonth, newTransactionsLastMonth),
      },
      totalChurches: { value: `${totalChurches[0]?.value || 0}`, change: '' },
      totalPastors: { value: `${totalPastors[0]?.value || 0}`, change: '' },
      totalSupervisors: { value: `${totalSupervisors[0]?.value || 0}`, change: '' },
      totalManagers: { value: `${totalManagers[0]?.value || 0}`, change: '' },
    }

    const recentTransactions = recentTransactionsData.map((t) => ({
      ...t,
      name: nameMap.get(t.contributorId) || t.email,
      amount: Number(t.amount),
      date: format(new Date(t.date), 'dd/MM/yyyy'),
    }))
    const recentRegistrations = recentRegistrationsData.map((u) => ({
      ...u,
      type: u.role,
      avatar: u.name.substring(0, 2).toUpperCase(),
      date: format(new Date(u.date), 'dd/MM/yyyy'),
    }))

    const result = {
      kpis,
      revenueByMethod: formattedRevenueByMethod,
      revenueByRegion: revenueByRegionData.map((r) => ({
        ...r,
        revenue: Number(r.revenue),
        fill: r.color ?? '#000000',
      })),
      churchesByRegion: churchesByRegionData.map((r) => ({ ...r, fill: r.color ?? '#000000' })),
      recentTransactions,
      recentRegistrations,
      newMembers: formattedNewMembers,
      defaulters,
    }
    await setCache(cacheKey, result, 120)
    return NextResponse.json(result)
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error)
    console.error('Erro ao buscar dados para o dashboard do admin:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados do dashboard', details: errorMessage },
      { status: 500 },
    )
  }
}
