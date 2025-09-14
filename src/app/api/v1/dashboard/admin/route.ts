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
} from '@/db/schema'
import { count, sum, eq, isNull, and, desc, sql, gte, lt } from 'drizzle-orm'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { validateRequest } from '@/lib/auth'
import type { UserRole } from '@/lib/types'
import { getErrorMessage } from '@/lib/error-types'

const calculateChange = (current: number, previous: number): string => {
  if (previous === 0) {
    return current > 0 ? '+100% (era 0)' : 'Nenhuma alteração'
  }
  const percentage = ((current - previous) / previous) * 100
  if (Math.abs(percentage) < 0.1) return 'Nenhuma alteração'
  const sign = percentage > 0 ? '+' : ''
  return `${sign}${percentage.toFixed(1)}% em relação ao mês passado`
}

export async function GET(): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user || (user.role as UserRole) !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const now = new Date()
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

    // Revenue
    const revenueCurrentMonthResult = await db
      .select({ value: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(eq(transactions.status, 'approved'), gte(transactions.createdAt, startOfCurrentMonth)),
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
      .where(eq(transactions.status, 'approved'))
      .groupBy(transactions.paymentMethod)

    const revenueByRegionData = await db
      .select({
        name: regions.name,
        color: regions.color,
        revenue: sql<number>`sum(${transactions.amount})`.mapWith(Number),
      })
      .from(supervisorProfiles)
      .innerJoin(regions, eq(supervisorProfiles.regionId, regions.id))
      .innerJoin(pastorProfiles, eq(supervisorProfiles.userId, pastorProfiles.supervisorId))
      .innerJoin(users, eq(pastorProfiles.userId, users.id))
      .innerJoin(transactions, eq(users.id, transactions.contributorId))
      .where(eq(transactions.status, 'approved'))
      .groupBy(regions.id, regions.name, regions.color)

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
        name: users.email,
        amount: transactions.amount,
        date: transactions.createdAt,
        status: transactions.status,
      })
      .from(transactions)
      .innerJoin(users, eq(transactions.contributorId, users.id))
      .orderBy(desc(transactions.createdAt))
      .limit(10)

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
      amount: Number(t.amount),
      date: format(new Date(t.date), 'dd/MM/yyyy'),
    }))
    const recentRegistrations = recentRegistrationsData.map((u) => ({
      ...u,
      type: u.role,
      avatar: u.name.substring(0, 2).toUpperCase(),
      date: format(new Date(u.date), 'dd/MM/yyyy'),
    }))

    return NextResponse.json({
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
    })
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error)
    console.error('Erro ao buscar dados para o dashboard do admin:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados do dashboard', details: errorMessage },
      { status: 500 },
    )
  }
}
