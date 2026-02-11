import { redirect } from 'next/navigation'
import { validateRequest } from '@/lib/jwt'
import { db } from '@/db/drizzle'
import {
  users,
  transactions,
  pastorProfiles,
  supervisorProfiles,
  churchProfiles,
  managerProfiles,
  adminProfiles,
} from '@/db/schema'
import { count, sum, eq, isNull, and, desc, sql, gte, lt, inArray } from 'drizzle-orm'
import type { UserRole } from '@/lib/types'
import type { DashboardData } from '@/lib/types/dashboard-types'
import { DashboardClient } from './_components/dashboard-client'
import {
  getBrazilDate,
  getBrazilStartOfMonth,
  subtractMonthsBrazil,
  formatBrazilDate,
} from '@/lib/date-utils'

/**
 * Dashboard do Administrador - Server Component
 * Busca dados diretamente do banco e renderiza componente client
 */
export default async function DashboardPage() {
  // Validar autenticação
  const { user } = await validateRequest()
  if (!user || (user.role as UserRole) !== 'admin') {
    redirect('/login')
  }

  // Buscar nome do usuário
  const userProfile = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: {
      email: true,
    },
  })

  // Buscar dados do dashboard diretamente do banco
  const now = getBrazilDate()
  const startOfCurrentMonth = getBrazilStartOfMonth(now)
  const startOfPreviousMonth = getBrazilStartOfMonth(subtractMonthsBrazil(now, 1))

  // Buscar KPIs em paralelo
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
    db
      .select({ role: users.role, value: count() })
      .from(users)
      .where(isNull(users.deletedAt))
      .groupBy(users.role),
    db
      .select({ value: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.status, 'approved'),
          gte(transactions.createdAt, startOfCurrentMonth),
          lt(transactions.createdAt, now),
        ),
      ),
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
    db.select({ value: count() }).from(users).where(isNull(users.deletedAt)),
    db.select({ value: count() }).from(users).where(gte(users.createdAt, startOfCurrentMonth)),
    db.select({ value: count() }).from(transactions),
    db
      .select({ value: count() })
      .from(transactions)
      .where(gte(transactions.createdAt, startOfCurrentMonth)),
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

  // Processar contagens por role
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

  // Função auxiliar para calcular mudança
  const calculateChange = (current: number, previous: number): string => {
    if (previous === 0) {
      return current > 0 ? '+100% (era 0)' : 'Nenhuma alteração'
    }
    const percentage = ((current - previous) / previous) * 100
    if (Math.abs(percentage) < 0.1) return 'Nenhuma alteração'
    const sign = percentage > 0 ? '+' : ''
    return `${sign}${percentage.toFixed(1)}% em relação ao mês passado`
  }

  // Buscar dados adicionais
  const [revenueByMethod, recentTransactionsData, newMembersByMonthData] = await Promise.all([
    db
      .select({
        method: transactions.paymentMethod,
        value: sum(transactions.amount).mapWith(Number),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.status, 'approved'),
          gte(transactions.createdAt, startOfCurrentMonth),
          lt(transactions.createdAt, now),
        ),
      )
      .groupBy(transactions.paymentMethod),
    db
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
      .where(and(gte(transactions.createdAt, startOfCurrentMonth), lt(transactions.createdAt, now)))
      .orderBy(desc(transactions.createdAt))
      .limit(10),
    db
      .select({
        month: sql<string>`TO_CHAR(${users.createdAt}, 'YYYY-MM')`,
        count: count(users.id),
      })
      .from(users)
      .where(gte(users.createdAt, getBrazilStartOfMonth(subtractMonthsBrazil(now, 5))))
      .groupBy(sql`TO_CHAR(${users.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${users.createdAt}, 'YYYY-MM')`),
  ])

  // Buscar nomes dos contribuintes
  const contributorIds = recentTransactionsData.map((t) => t.contributorId)
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

  // Formatar dados
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

  const initialData: DashboardData = {
    kpis: {
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
    },
    revenueByMethod: revenueByMethod.map((item) => ({
      ...item,
      fill:
        item.method === 'pix' ? '#10b981' : item.method === 'credit_card' ? '#3b82f6' : '#f59e0b',
    })),
    revenueByRegion: [],
    churchesByRegion: [],
    recentTransactions: recentTransactionsData.map((t) => ({
      ...t,
      name: nameMap.get(t.contributorId) || t.email,
      amount: Number(t.amount),
      date: formatBrazilDate(t.date),
    })),
    recentRegistrations: [],
    newMembers: newMembersByMonthData.map((item) => ({
      month: monthNames[parseInt(item.month.substring(5, 7)) - 1] || '',
      count: item.count,
    })),
    defaulters: [],
  }

  // Extrair primeiro nome do email
  const userName = userProfile?.email.split('@')[0] || 'Admin'

  return <DashboardClient initialData={initialData} userName={userName} />
}
