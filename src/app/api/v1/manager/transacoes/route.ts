import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { transactions, users, churchProfiles, supervisorProfiles } from '@/db/schema'
import { validateRequest } from '@/lib/jwt'
import { eq, inArray } from 'drizzle-orm'

export async function GET() {
  try {
    const { user } = await validateRequest()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (user.role !== 'manager') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
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
    const allTransactions = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        method: transactions.method,
        status: transactions.status,
        createdAt: transactions.createdAt,
        refundRequestReason: transactions.refundRequestReason,
        contributorId: transactions.contributorId,
        churchId: transactions.churchId,
      })
      .from(transactions)
      .where(inArray(transactions.churchId, churchUserIds))
      .orderBy(transactions.createdAt)

    // Get contributor and church names
    const contributorIds = [...new Set(allTransactions.map((t) => t.contributorId))]
    const contributors = await db
      .select({
        id: users.id,
        name: users.name,
      })
      .from(users)
      .where(inArray(users.id, contributorIds))

    const churchUsers = await db
      .select({
        id: users.id,
        name: users.name,
      })
      .from(users)
      .where(inArray(users.id, churchUserIds))

    const contributorMap = new Map(contributors.map((c) => [c.id, c.name]))
    const churchMap = new Map(churchUsers.map((c) => [c.id, c.name]))

    const formattedTransactions = allTransactions.map((transaction) => ({
      id: transaction.id,
      contributor: contributorMap.get(transaction.contributorId) || 'Desconhecido',
      church: churchMap.get(transaction.churchId) || null,
      amount: Number(transaction.amount),
      method: transaction.method,
      status: transaction.status,
      date: transaction.createdAt,
      refundRequestReason: transaction.refundRequestReason,
    }))

    return NextResponse.json({ transactions: formattedTransactions })
  } catch (error) {
    console.error('Error fetching manager transactions:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar transações' },
      { status: 500 }
    )
  }
}
