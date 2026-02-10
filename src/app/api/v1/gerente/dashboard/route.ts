/**
 * @fileoverview Rota da API para buscar dados para o dashboard do gerente (legado).
 * @version 1.2
 * @date 2024-08-07
 * @author PH
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
import { count, sum, eq, and, desc, inArray } from 'drizzle-orm'
import { format } from 'date-fns'
import { getErrorMessage } from '@/lib/error-types'
import { validateRequest } from '@/lib/jwt'

export async function GET(): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user || user.role !== 'manager') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const managerId = user.id

  try {
    const supervisorsResult = await db
      .select({ id: supervisorProfiles.userId })
      .from(supervisorProfiles)
      .where(eq(supervisorProfiles.managerId, managerId))

    const supervisorIds = supervisorsResult.map((s) => s.id)

    let pastorIds: string[] = []
    if (supervisorIds.length > 0) {
      const pastorsResult = await db
        .select({ id: pastorProfiles.userId })
        .from(pastorProfiles)
        .where(inArray(pastorProfiles.supervisorId, supervisorIds))
      pastorIds = pastorsResult.map((p) => p.id)
    }

    let churchIds: string[] = []
    if (supervisorIds.length > 0) {
      const churchesResult = await db
        .select({ id: churchProfiles.userId })
        .from(churchProfiles)
        .where(inArray(churchProfiles.supervisorId, supervisorIds))
      churchIds = churchesResult.map((c) => c.id)
    }

    const networkUserIds = [managerId, ...supervisorIds, ...pastorIds, ...churchIds]
    if (networkUserIds.length === 1 && networkUserIds[0] === managerId) {
      networkUserIds.push('00000000-0000-0000-0000-000000000000')
    }

    const totalSupervisors = supervisorIds.length
    const totalPastors = pastorIds.length
    const totalChurches = churchIds.length
    const totalMembers = 1 + totalSupervisors + totalPastors + totalChurches

    const totalTransactionsResult = await db
      .select({ value: count() })
      .from(transactions)
      .where(inArray(transactions.contributorId, networkUserIds))
    const totalRevenueResult = await db
      .select({ value: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.status, 'approved'),
          inArray(transactions.contributorId, networkUserIds),
        ),
      )
    const totalRevenue = parseFloat(totalRevenueResult[0]?.value || '0')

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
      .where(inArray(transactions.contributorId, networkUserIds))
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
      .where(inArray(users.id, networkUserIds))
      .orderBy(desc(users.createdAt))
      .limit(10)

    const formattedRevenueByMethod = revenueByMethod.map((item) => ({
      ...item,
      fill:
        item.method === 'pix' ? '#10b981' : item.method === 'credit_card' ? '#3b82f6' : '#f59e0b',
    }))

    const kpis = {
      totalRevenue,
      totalMembers,
      totalTransactions: totalTransactionsResult[0]?.value || 0,
      totalChurches,
      totalPastors,
      totalSupervisors,
      totalManagers: 1,
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

    const colors = ['#16a34a', '#3b82f6', '#f97316', '#ef4444', '#8b5cf6']
    const revenueByChurch = [
      { name: 'Igreja A', revenue: 4000, fill: colors[0] },
      { name: 'Igreja B', revenue: 3200, fill: colors[1] },
    ]
    const membersByChurch = [
      { name: 'Igreja A', count: 120, fill: colors[0] },
      { name: 'Igreja B', count: 80, fill: colors[1] },
    ]

    return NextResponse.json({
      kpis,
      revenueByMethod: formattedRevenueByMethod,
      revenueByChurch,
      membersByChurch,
      recentTransactions,
      recentRegistrations,
      newMembers: [
        { month: 'Jan', count: 12 },
        { month: 'Fev', count: 15 },
        { month: 'Mar', count: 17 },
        { month: 'Abr', count: 20 },
        { month: 'Mai', count: 23 },
        { month: 'Jun', count: 18 },
      ],
    })
  } catch (error: unknown) {
    console.error('Erro ao buscar dados para o dashboard do gerente:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados do dashboard do gerente', details: getErrorMessage(error) },
      { status: 500 },
    )
  }
}
