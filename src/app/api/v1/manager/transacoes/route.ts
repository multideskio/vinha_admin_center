import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { transactions, users, churchProfiles, supervisorProfiles } from '@/db/schema'
import { validateRequest } from '@/lib/jwt'
import { eq, inArray, desc, asc, count, and, gte, lte, sql } from 'drizzle-orm'

export async function GET(request: Request) {
  try {
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

      const [userTransactions, [{ total }]] = await Promise.all([
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
        db
          .select({ total: count() })
          .from(transactions)
          .where(whereClause),
      ])

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
      .select({ id: supervisorProfiles.id })
      .from(supervisorProfiles)
      .where(eq(supervisorProfiles.managerId, user.id))

    const supervisorIds = supervisors.map((s) => s.id)

    if (supervisorIds.length === 0) {
      return NextResponse.json({ transactions: [] })
    }

    // Get all churches under these supervisors
    const churches = await db
      .select({ userId: churchProfiles.userId })
      .from(churchProfiles)
      .where(inArray(churchProfiles.supervisorId, supervisorIds))

    const churchUserIds = churches.map((c) => c.userId)

    if (churchUserIds.length === 0) {
      return NextResponse.json({ transactions: [] })
    }

    // Get all transactions from these churches
    const conditions = [inArray(transactions.originChurchId, churchUserIds)]
    if (startDate) conditions.push(gte(transactions.createdAt, new Date(startDate)))
    if (endDate) conditions.push(lte(transactions.createdAt, new Date(endDate)))
    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0]

    const [allTransactions, [{ total }]] = await Promise.all([
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
      db
        .select({ total: count() })
        .from(transactions)
        .where(whereClause),
    ])

    const formattedTransactions = allTransactions.map((transaction) => ({
      id: transaction.id,
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
    console.error('Error fetching manager transactions:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar transações' },
      { status: 500 }
    )
  }
}
