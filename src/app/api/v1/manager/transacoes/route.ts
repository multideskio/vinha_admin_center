import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import {
  transactions,
  churchProfiles,
  supervisorProfiles,
  pastorProfiles,
  managerProfiles,
} from '@/db/schema'
import { validateRequest } from '@/lib/jwt'
import { eq, inArray, desc, asc, count, and, gte, lte } from 'drizzle-orm'
import { rateLimit } from '@/lib/rate-limit'

// @lastReview 2025-01-05 21:30

export async function GET(request: Request) {
  try {
    // Rate limiting: 60 requests per minute for GET
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('manager-transacoes-get', ip, 60, 60) // 60 requests per minute
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 },
      )
    }

    const { user } = await validateRequest()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (user.role !== 'manager') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const sortOrder = searchParams.get('sort') === 'asc' ? asc : desc

    // If userId is provided and it's the manager's own ID, return their transactions
    if (userId && userId === user.id) {
      const conditions = [eq(transactions.contributorId, userId)]
      if (startDate) conditions.push(gte(transactions.createdAt, new Date(startDate)))
      if (endDate) conditions.push(lte(transactions.createdAt, new Date(endDate)))
      const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0]

      const [userTransactions, totalResult] = await Promise.all([
        db
          .select({
            id: transactions.id,
            amount: transactions.amount,
            status: transactions.status,
            createdAt: transactions.createdAt,
            paymentMethod: transactions.paymentMethod,
          })
          .from(transactions)
          .where(whereClause)
          .orderBy(sortOrder(transactions.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ total: count() }).from(transactions).where(whereClause),
      ])

      const total = totalResult[0]?.total || 0
      const formattedTransactions = userTransactions.map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        status: t.status,
        date: new Date(t.createdAt).toLocaleDateString('pt-BR'),
      }))

      return NextResponse.json({
        transactions: formattedTransactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    }

    // Get all supervisors under this manager
    const supervisors = await db
      .select({ userId: supervisorProfiles.userId })
      .from(supervisorProfiles)
      .where(eq(supervisorProfiles.managerId, user.id))

    const supervisorUserIds = supervisors.map((s) => s.userId)

    // Get all pastors under these supervisors
    const pastors =
      supervisorUserIds.length > 0
        ? await db
            .select({ userId: pastorProfiles.userId })
            .from(pastorProfiles)
            .where(inArray(pastorProfiles.supervisorId, supervisorUserIds))
        : []

    const pastorUserIds = pastors.map((p) => p.userId)

    // Get all churches under these supervisors
    const churches =
      supervisorUserIds.length > 0
        ? await db
            .select({ userId: churchProfiles.userId })
            .from(churchProfiles)
            .where(inArray(churchProfiles.supervisorId, supervisorUserIds))
        : []

    const churchUserIds = churches.map((c) => c.userId)

    // Get all transactions from manager + supervisors + pastors + churches
    const allContributorIds = [user.id, ...supervisorUserIds, ...pastorUserIds, ...churchUserIds]

    if (allContributorIds.length === 1) {
      return NextResponse.json({
        transactions: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      })
    }
    const conditions = [inArray(transactions.contributorId, allContributorIds)]
    if (startDate) conditions.push(gte(transactions.createdAt, new Date(startDate)))
    if (endDate) conditions.push(lte(transactions.createdAt, new Date(endDate)))
    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0]

    const [allTransactions, totalResult] = await Promise.all([
      db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          status: transactions.status,
          createdAt: transactions.createdAt,
          refundRequestReason: transactions.refundRequestReason,
          contributorId: transactions.contributorId,
        })
        .from(transactions)
        .where(whereClause)
        .orderBy(sortOrder(transactions.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(transactions).where(whereClause),
    ])

    // Get contributor names from profiles
    const contributorIds = [...new Set(allTransactions.map((t) => t.contributorId))]

    const [managers, supervisorsData, pastorsData, churchesData] = await Promise.all([
      db
        .select({
          userId: managerProfiles.userId,
          firstName: managerProfiles.firstName,
          lastName: managerProfiles.lastName,
        })
        .from(managerProfiles)
        .where(inArray(managerProfiles.userId, contributorIds)),
      db
        .select({
          userId: supervisorProfiles.userId,
          firstName: supervisorProfiles.firstName,
          lastName: supervisorProfiles.lastName,
        })
        .from(supervisorProfiles)
        .where(inArray(supervisorProfiles.userId, contributorIds)),
      db
        .select({
          userId: pastorProfiles.userId,
          firstName: pastorProfiles.firstName,
          lastName: pastorProfiles.lastName,
        })
        .from(pastorProfiles)
        .where(inArray(pastorProfiles.userId, contributorIds)),
      db
        .select({ userId: churchProfiles.userId, nomeFantasia: churchProfiles.nomeFantasia })
        .from(churchProfiles)
        .where(inArray(churchProfiles.userId, contributorIds)),
    ])

    const contributorMap = new Map<string, string>()
    managers.forEach((m) => contributorMap.set(m.userId, `${m.firstName} ${m.lastName}`))
    supervisorsData.forEach((s) => contributorMap.set(s.userId, `${s.firstName} ${s.lastName}`))
    pastorsData.forEach((p) => contributorMap.set(p.userId, `${p.firstName} ${p.lastName}`))
    churchesData.forEach((c) => contributorMap.set(c.userId, c.nomeFantasia))

    const total = totalResult[0]?.total || 0
    const formattedTransactions = allTransactions.map((transaction) => ({
      id: transaction.id,
      contributor: contributorMap.get(transaction.contributorId) || 'Desconhecido',
      church: null,
      amount: Number(transaction.amount),
      status: transaction.status,
      date: new Date(transaction.createdAt).toLocaleDateString('pt-BR'),
      refundRequestReason: transaction.refundRequestReason,
    }))

    return NextResponse.json({
      transactions: formattedTransactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[MANAGER_TRANSACOES_GET_ERROR]', {
      userId: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Erro ao buscar transações' }, { status: 500 })
  }
}
