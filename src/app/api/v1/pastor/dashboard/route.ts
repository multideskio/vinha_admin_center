/**
 * @fileoverview Rota da API para buscar dados para o dashboard do pastor.
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { transactions, pastorProfiles, users } from '@/db/schema'
import { count, sum, eq, and, gte, lt, lte, sql } from 'drizzle-orm'
import { subMonths, startOfMonth, endOfDay, startOfDay } from 'date-fns'
import { authenticateApiKey } from '@/lib/api-auth'
import { validateRequest } from '@/lib/jwt'
import { getErrorMessage } from '@/lib/error-types'
import { rateLimit } from '@/lib/rate-limit'
import { SessionUser } from '@/lib/types'

const calculateChange = (current: number, previous: number): string => {
  if (previous === 0) {
    return current > 0 ? '+100%' : 'Nenhuma alteração'
  }
  const percentage = ((current - previous) / previous) * 100
  if (Math.abs(percentage) < 0.1) return 'Nenhuma alteração'
  const sign = percentage > 0 ? '+' : ''
  return `${sign}${percentage.toFixed(1)}% em relação ao mês passado`
}

export async function GET(request: Request): Promise<NextResponse> {
  let sessionUser: SessionUser | null = null

  try {
    // Rate limiting: 60 requests per minute
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('pastor-dashboard', ip, 60, 60)
    if (!rateLimitResult.allowed) {
      console.error('[PASTOR_DASHBOARD_RATE_LIMIT]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 },
      )
    }

    const { user: authUser } = await validateRequest()
    sessionUser = authUser

    if (!sessionUser) {
      const authResponse = await authenticateApiKey()
      if (authResponse) return authResponse
      console.error('[PASTOR_DASHBOARD_AUTH_ERROR]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    if (sessionUser.role !== 'pastor') {
      console.error('[PASTOR_DASHBOARD_ROLE_ERROR]', {
        userId: sessionUser.id,
        role: sessionUser.role,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Acesso negado. Role pastor necessária.' }, { status: 403 })
    }

    const pastorId = sessionUser.id

    // Extrair parâmetros de data da URL
    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    const now = new Date()

    // Se há parâmetros de data, usar eles; senão usar mês atual
    const dateFrom = startDateParam ? startOfDay(new Date(startDateParam)) : startOfMonth(now)
    const dateTo = endDateParam ? endOfDay(new Date(endDateParam)) : now

    // Para comparação com mês anterior (quando não há filtro de período)
    const startOfCurrentMonth = startOfMonth(now)
    const startOfPreviousMonth = startOfMonth(subMonths(now, 1))

    // Buscar dados do perfil do pastor com JOIN na tabela users para pegar titheDay
    const [profileResult] = await db
      .select({
        profile: pastorProfiles,
        user: {
          titheDay: users.titheDay,
          phone: users.phone,
          email: users.email,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(pastorProfiles)
      .leftJoin(users, eq(pastorProfiles.userId, users.id))
      .where(eq(pastorProfiles.userId, pastorId))
      .limit(1)

    const profileData = profileResult?.profile
    const userData = profileResult?.user

    // KPI Calculations
    // Total Contribuído: sempre todas as transações aprovadas (sem filtro de período)
    const totalContributedResult = await db
      .select({ value: sum(transactions.amount) })
      .from(transactions)
      .where(and(eq(transactions.contributorId, pastorId), eq(transactions.status, 'approved')))
    const totalContributed = parseFloat(totalContributedResult[0]?.value || '0')

    // Contribuição no período selecionado (ou mês atual se não houver filtro)
    const contributionSelectedPeriodResult = await db
      .select({ value: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.contributorId, pastorId),
          eq(transactions.status, 'approved'),
          gte(transactions.createdAt, dateFrom),
          lte(transactions.createdAt, dateTo),
        ),
      )
    const contributionSelectedPeriod = parseFloat(contributionSelectedPeriodResult[0]?.value || '0')

    // Para calcular a mudança, comparar com período anterior de mesma duração
    let contributionPreviousPeriod = 0
    if (startDateParam && endDateParam) {
      // Se há filtro de período, calcular período anterior de mesma duração
      const periodDuration = dateTo.getTime() - dateFrom.getTime()
      const previousPeriodEnd = new Date(dateFrom.getTime() - 1) // 1ms antes do início
      const previousPeriodStart = new Date(previousPeriodEnd.getTime() - periodDuration)

      const contributionPreviousPeriodResult = await db
        .select({ value: sum(transactions.amount) })
        .from(transactions)
        .where(
          and(
            eq(transactions.contributorId, pastorId),
            eq(transactions.status, 'approved'),
            gte(transactions.createdAt, previousPeriodStart),
            lte(transactions.createdAt, previousPeriodEnd),
          ),
        )
      contributionPreviousPeriod = parseFloat(contributionPreviousPeriodResult[0]?.value || '0')
    } else {
      // Se não há filtro, comparar com mês anterior
      const contributionPreviousMonthResult = await db
        .select({ value: sum(transactions.amount) })
        .from(transactions)
        .where(
          and(
            eq(transactions.contributorId, pastorId),
            eq(transactions.status, 'approved'),
            gte(transactions.createdAt, startOfPreviousMonth),
            lt(transactions.createdAt, startOfCurrentMonth),
          ),
        )
      contributionPreviousPeriod = parseFloat(contributionPreviousMonthResult[0]?.value || '0')
    }

    // Total de transações no período selecionado (ou todas se não houver filtro)
    const totalTransactionsResult = await db
      .select({ value: count() })
      .from(transactions)
      .where(
        startDateParam || endDateParam
          ? and(
              eq(transactions.contributorId, pastorId),
              gte(transactions.createdAt, dateFrom),
              lte(transactions.createdAt, dateTo),
            )
          : eq(transactions.contributorId, pastorId),
      )

    const kpis = {
      totalContributed: {
        value: `R$ ${totalContributed.toFixed(2)}`,
        change:
          startDateParam || endDateParam
            ? `R$ ${contributionSelectedPeriod.toFixed(2)} no período`
            : `R$ ${contributionSelectedPeriod.toFixed(2)} este mês`,
      },
      monthlyContribution: {
        value: `R$ ${contributionSelectedPeriod.toFixed(2)}`,
        change: calculateChange(contributionSelectedPeriod, contributionPreviousPeriod),
      },
      totalTransactions: {
        value: `${totalTransactionsResult[0]?.value ?? 0}`,
        change: startDateParam || endDateParam ? 'no período selecionado' : '',
      },
    }

    // Gráfico mensal: usar período selecionado ou últimos 6 meses
    const chartStartDate = startDateParam
      ? startOfDay(new Date(startDateParam))
      : startOfMonth(subMonths(now, 5))
    const chartEndDate = endDateParam ? endOfDay(new Date(endDateParam)) : now

    const monthlyContributionsData = await db
      .select({
        month: sql<string>`TO_CHAR(${transactions.createdAt}, 'YYYY-MM')`,
        total: sum(transactions.amount).mapWith(Number),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.contributorId, pastorId),
          eq(transactions.status, 'approved'),
          gte(transactions.createdAt, chartStartDate),
          lte(transactions.createdAt, chartEndDate),
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

    // Métodos de pagamento: filtrar por período se fornecido
    const paymentMethodsData = await db
      .select({
        method: transactions.paymentMethod,
        value: sum(transactions.amount).mapWith(Number),
      })
      .from(transactions)
      .where(
        startDateParam || endDateParam
          ? and(
              eq(transactions.contributorId, pastorId),
              eq(transactions.status, 'approved'),
              gte(transactions.createdAt, dateFrom),
              lte(transactions.createdAt, dateTo),
            )
          : and(eq(transactions.contributorId, pastorId), eq(transactions.status, 'approved')),
      )
      .groupBy(transactions.paymentMethod)

    const formattedPaymentMethods = paymentMethodsData.map((item) => ({
      ...item,
      fill:
        item.method === 'pix' ? '#10b981' : item.method === 'credit_card' ? '#3b82f6' : '#f59e0b',
    }))

    // Montar objeto de perfil completo incluindo titheDay e outros campos de users
    const completeProfile = {
      ...sessionUser,
      ...profileData,
      titheDay: userData?.titheDay ?? null,
      phone: userData?.phone ?? null,
      email: userData?.email ?? sessionUser.email,
      avatarUrl: userData?.avatarUrl ?? sessionUser.avatarUrl,
    }

    return NextResponse.json({
      profile: completeProfile,
      kpis,
      monthlyContributions: formattedMonthlyContributions,
      paymentMethods: formattedPaymentMethods,
    })
  } catch (error: unknown) {
    console.error('[PASTOR_DASHBOARD_ERROR]', {
      pastorId: sessionUser?.id,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json(
      { error: 'Erro ao buscar dados do dashboard do pastor', details: getErrorMessage(error) },
      { status: 500 },
    )
  }
}
