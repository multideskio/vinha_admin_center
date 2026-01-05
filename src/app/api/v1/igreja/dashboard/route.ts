/**
 * @fileoverview Rota da API para buscar dados para o dashboard da igreja.
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { transactions, churchProfiles, users } from '@/db/schema'
import { count, sum, eq, and, gte, lt, sql } from 'drizzle-orm'
import { subMonths, startOfMonth } from 'date-fns'
import { authenticateApiKey } from '@/lib/api-auth'
import { validateRequest } from '@/lib/jwt'
import { getErrorMessage } from '@/lib/error-types'

const calculateChange = (current: number, previous: number): string => {
  if (previous === 0) {
    return current > 0 ? '+100%' : 'Nenhuma alteração'
  }
  const percentage = ((current - previous) / previous) * 100
  if (Math.abs(percentage) < 0.1) return 'Nenhuma alteração'
  const sign = percentage > 0 ? '+' : ''
  return `${sign}${percentage.toFixed(1)}% em relação ao mês passado`
}

export async function GET() {
  const { user: sessionUser } = await validateRequest()

  if (!sessionUser) {
    const authResponse = await authenticateApiKey()
    if (authResponse) return authResponse
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  if (!['igreja', 'church_account'].includes(sessionUser.role)) {
    return NextResponse.json({ error: 'Acesso negado. Role igreja necessária.' }, { status: 403 })
  }
  const churchId = sessionUser.id

  try {
    // const { searchParams } = new URL(request.url)
    // const startDateParam = searchParams.get('startDate')
    // const endDateParam = searchParams.get('endDate')

    const now = new Date()
    const startOfCurrentMonth = startOfMonth(now)
    const startOfPreviousMonth = startOfMonth(subMonths(now, 1))

    const [profileData] = await db
      .select({
        nomeFantasia: churchProfiles.nomeFantasia,
        razaoSocial: churchProfiles.razaoSocial,
        cnpj: churchProfiles.cnpj,
        email: users.email,
        phone: users.phone,
        address: churchProfiles.address,
        neighborhood: churchProfiles.neighborhood,
        city: churchProfiles.city,
        state: churchProfiles.state,
        foundationDate: churchProfiles.foundationDate,
        titheDay: users.titheDay,
        treasurerFirstName: churchProfiles.treasurerFirstName,
        treasurerLastName: churchProfiles.treasurerLastName,
        treasurerCpf: churchProfiles.treasurerCpf,
        avatarUrl: users.avatarUrl,
      })
      .from(churchProfiles)
      .leftJoin(users, eq(users.id, churchProfiles.userId))
      .where(eq(churchProfiles.userId, churchId))

    const totalContributedResult = await db
      .select({ value: sum(transactions.amount) })
      .from(transactions)
      .where(and(eq(transactions.originChurchId, churchId), eq(transactions.status, 'approved')))
    const totalContributed = parseFloat(totalContributedResult[0]?.value || '0')

    const contributionCurrentMonthResult = await db
      .select({ value: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.originChurchId, churchId),
          eq(transactions.status, 'approved'),
          gte(transactions.createdAt, startOfCurrentMonth),
        ),
      )
    const contributionPreviousMonthResult = await db
      .select({ value: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.originChurchId, churchId),
          eq(transactions.status, 'approved'),
          gte(transactions.createdAt, startOfPreviousMonth),
          lt(transactions.createdAt, startOfCurrentMonth),
        ),
      )
    const contributionCurrentMonth = parseFloat(contributionCurrentMonthResult[0]?.value || '0')
    const contributionPreviousMonth = parseFloat(contributionPreviousMonthResult[0]?.value || '0')

    const totalTransactionsResult = await db
      .select({ value: count() })
      .from(transactions)
      .where(eq(transactions.originChurchId, churchId))
    const newTransactionsThisMonthResult = await db
      .select({ value: count() })
      .from(transactions)
      .where(
        and(
          eq(transactions.originChurchId, churchId),
          gte(transactions.createdAt, startOfCurrentMonth),
        ),
      )

    const kpis = {
      totalContributed: {
        value: `R$ ${totalContributed.toFixed(2)}`,
        change: `+${newTransactionsThisMonthResult[0]?.value || 0} transações este mês`,
      },
      monthlyContribution: {
        value: `R$ ${contributionCurrentMonth.toFixed(2)}`,
        change: calculateChange(contributionCurrentMonth, contributionPreviousMonth),
      },
      totalTransactions: {
        value: `${totalTransactionsResult[0]?.value || 0}`,
        change: '',
      },
    }

    const startOfSixMonthsAgo = startOfMonth(subMonths(now, 5))
    const monthlyContributionsData = await db
      .select({
        month: sql<string>`TO_CHAR(${transactions.createdAt}, 'YYYY-MM')`,
        total: sum(transactions.amount).mapWith(Number),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.originChurchId, churchId),
          eq(transactions.status, 'approved'),
          gte(transactions.createdAt, startOfSixMonthsAgo),
        ),
      )
      .groupBy(sql`TO_CHAR(${transactions.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${transactions.createdAt}, 'YYYY-MM')`)

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
    const formattedMonthlyContributions = monthlyContributionsData.map((item) => ({
      month: monthNames[parseInt(item.month.substring(5, 7)) - 1],
      total: item.total,
    }))

    const paymentMethodsData = await db
      .select({
        method: transactions.paymentMethod,
        value: sum(transactions.amount).mapWith(Number),
      })
      .from(transactions)
      .where(and(eq(transactions.originChurchId, churchId), eq(transactions.status, 'approved')))
      .groupBy(transactions.paymentMethod)

    const formattedPaymentMethods = paymentMethodsData.map((item) => ({
      ...item,
      fill:
        item.method === 'pix' ? '#10b981' : item.method === 'credit_card' ? '#3b82f6' : '#f59e0b',
    }))

    return NextResponse.json({
      profile: profileData,
      kpis,
      monthlyContributions: formattedMonthlyContributions,
      paymentMethods: formattedPaymentMethods,
    })
  } catch (error: unknown) {
    console.error('Erro ao buscar dados para o dashboard da igreja:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados do dashboard da igreja', details: getErrorMessage(error) },
      { status: 500 },
    )
  }
}
