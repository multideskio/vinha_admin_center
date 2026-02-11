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
import { validateRequest } from '@/lib/jwt'
import type { UserRole } from '@/lib/types'
import { getErrorMessage } from '@/lib/error-types'
import { getCache, setCache } from '@/lib/cache'
import {
  getBrazilDate,
  getBrazilStartOfMonth,
  subtractMonthsBrazil,
  getDaysSince,
  formatBrazilDate,
  toBrazilDate,
} from '@/lib/date-utils'
import { dashboardParamsSchema } from '@/lib/types/dashboard-types'

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

    // Validar parâmetros com Zod
    const validation = dashboardParamsSchema.safeParse({ from, to })
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: validation.error.format() },
        { status: 400 },
      )
    }

    const cacheKey = `dashboard:admin:${user.id}:from:${from || 'null'}:to:${to || 'null'}`
    const cached = await getCache(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const now = getBrazilDate()
    const startDate = from ? toBrazilDate(from) : getBrazilStartOfMonth(now)
    const endDate = to ? toBrazilDate(to) : now

    const startOfCurrentMonth = getBrazilStartOfMonth(now)
    const startOfPreviousMonth = getBrazilStartOfMonth(subtractMonthsBrazil(now, 1))

    // --- KPI Calculations (parallelized) ---
    const [
      roleCountsData,
      revenueCurrentMonthResult,
      revenuePreviousMonthResult,
      totalMembersResult,
      newMembersThisMonthResult,
      totalTransactionsResult,
      newTransactionsThisMonthResult,
      newTransactionsLastMonthResult,
    ] = await Promise.all([
      // 1. Contagem por role em uma única query com GROUP BY
      db
        .select({ role: users.role, value: count() })
        .from(users)
        .where(isNull(users.deletedAt))
        .groupBy(users.role),
      // 2. Receita período atual
      db
        .select({ value: sum(transactions.amount) })
        .from(transactions)
        .where(
          and(
            eq(transactions.status, 'approved'),
            gte(transactions.createdAt, startDate),
            lt(transactions.createdAt, endDate),
          ),
        ),
      // 3. Receita mês anterior
      db
        .select({ value: sum(transactions.amount) })
        .from(transactions)
        .where(
          and(
            eq(transactions.status, 'approved'),
            gte(transactions.createdAt, startOfPreviousMonth),
            lt(transactions.createdAt, startOfCurrentMonth),
          ),
        ),
      // 4. Total membros (já incluso no GROUP BY acima, mas precisamos do total geral)
      db.select({ value: count() }).from(users).where(isNull(users.deletedAt)),
      // 5. Novos membros este mês
      db.select({ value: count() }).from(users).where(gte(users.createdAt, startOfCurrentMonth)),
      // 6. Total transações
      db.select({ value: count() }).from(transactions),
      // 7. Transações este mês
      db
        .select({ value: count() })
        .from(transactions)
        .where(gte(transactions.createdAt, startOfCurrentMonth)),
      // 8. Transações mês passado
      db
        .select({ value: count() })
        .from(transactions)
        .where(
          and(
            gte(transactions.createdAt, startOfPreviousMonth),
            lt(transactions.createdAt, startOfCurrentMonth),
          ),
        ),
    ])

    // Extrair contagens por role do GROUP BY
    const roleCountsMap = new Map(roleCountsData.map((r) => [r.role, r.value]))
    const totalManagers = roleCountsMap.get('manager') || 0
    const totalSupervisors = roleCountsMap.get('supervisor') || 0
    const totalPastors = roleCountsMap.get('pastor') || 0
    const totalChurches = roleCountsMap.get('church_account') || 0

    const totalRevenueCurrentMonth = parseFloat(revenueCurrentMonthResult[0]?.value || '0')
    const totalRevenuePreviousMonth = parseFloat(revenuePreviousMonthResult[0]?.value || '0')
    const totalMembers = totalMembersResult[0]?.value || 0
    const newMembersThisMonth = newMembersThisMonthResult[0]?.value || 0
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
      .limit(100)

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
      .limit(100)

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

    // ✅ OTIMIZADO: Buscar nomes de todos os perfis em paralelo
    const [pastorNames, supervisorNames, churchNames, managerNames, adminNames] =
      contributorIds.length > 0
        ? await Promise.all([
            db
              .select({
                id: pastorProfiles.userId,
                name: sql<string>`${pastorProfiles.firstName} || ' ' || ${pastorProfiles.lastName}`,
              })
              .from(pastorProfiles)
              .where(inArray(pastorProfiles.userId, contributorIds)),
            db
              .select({
                id: supervisorProfiles.userId,
                name: sql<string>`${supervisorProfiles.firstName} || ' ' || ${supervisorProfiles.lastName}`,
              })
              .from(supervisorProfiles)
              .where(inArray(supervisorProfiles.userId, contributorIds)),
            db
              .select({
                id: churchProfiles.userId,
                name: churchProfiles.nomeFantasia,
              })
              .from(churchProfiles)
              .where(inArray(churchProfiles.userId, contributorIds)),
            db
              .select({
                id: managerProfiles.userId,
                name: sql<string>`${managerProfiles.firstName} || ' ' || ${managerProfiles.lastName}`,
              })
              .from(managerProfiles)
              .where(inArray(managerProfiles.userId, contributorIds)),
            db
              .select({
                id: adminProfiles.userId,
                name: sql<string>`${adminProfiles.firstName} || ' ' || ${adminProfiles.lastName}`,
              })
              .from(adminProfiles)
              .where(inArray(adminProfiles.userId, contributorIds)),
          ])
        : [[], [], [], [], []]

    // Criar mapa de nomes
    const nameMap = new Map<string, string>()
    for (const p of pastorNames) nameMap.set(p.id, p.name)
    for (const s of supervisorNames) nameMap.set(s.id, s.name)
    for (const c of churchNames) nameMap.set(c.id, c.name)
    for (const m of managerNames) nameMap.set(m.id, m.name)
    for (const a of adminNames) nameMap.set(a.id, a.name)

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

    const startOfSixMonthsAgo = getBrazilStartOfMonth(subtractMonthsBrazil(now, 5))
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
    const threeMonthsAgo = getBrazilStartOfMonth(subtractMonthsBrazil(now, 3))

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
      .limit(1000)

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
      .limit(1000)

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
          ? getDaysSince(lastPaymentDate)
          : getDaysSince(threeMonthsAgo)

        defaulters.push({
          id: pastor.id,
          name: `${pastor.firstName} ${pastor.lastName}`,
          type: 'pastor' as const,
          titheDay: pastor.titheDay,
          lastPayment: lastPaymentDate ? formatBrazilDate(lastPaymentDate) : null,
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
          ? getDaysSince(lastPaymentDate)
          : getDaysSince(threeMonthsAgo)

        defaulters.push({
          id: church.id,
          name: church.nomeFantasia,
          type: 'church' as const,
          titheDay: church.titheDay,
          lastPayment: lastPaymentDate ? formatBrazilDate(lastPaymentDate) : null,
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
      totalChurches: { value: `${totalChurches}`, change: '' },
      totalPastors: { value: `${totalPastors}`, change: '' },
      totalSupervisors: { value: `${totalSupervisors}`, change: '' },
      totalManagers: { value: `${totalManagers}`, change: '' },
    }

    const recentTransactions = recentTransactionsData.map((t) => ({
      ...t,
      name: nameMap.get(t.contributorId) || t.email,
      amount: Number(t.amount),
      date: formatBrazilDate(t.date),
    }))
    const recentRegistrations = recentRegistrationsData.map((u) => ({
      ...u,
      type: u.role,
      avatar: u.name.substring(0, 2).toUpperCase(),
      date: formatBrazilDate(u.date),
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
