/**
 * @fileoverview Rota da API para buscar transações do pastor logado.
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { transactions as transactionsTable, users, churchProfiles } from '@/db/schema'
import { eq, desc, and, isNull } from 'drizzle-orm'
import { format } from 'date-fns'
import { authenticateApiKey } from '@/lib/api-auth'
import { validateRequest } from '@/lib/auth'
import type { UserRole } from '@/lib/types'
import { getErrorMessage } from '@/lib/error-types'

export async function GET(): Promise<NextResponse> {
  const authResponse = await authenticateApiKey()
  if (authResponse) return authResponse

  const { user: sessionUser } = await validateRequest()
  if (!sessionUser || (sessionUser.role as UserRole) !== 'pastor') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const results = await db
      .select({
        id: transactionsTable.gatewayTransactionId,
        contributor: users.email,
        church: churchProfiles.nomeFantasia,
        amount: transactionsTable.amount,
        method: transactionsTable.paymentMethod,
        status: transactionsTable.status,
        date: transactionsTable.createdAt,
        refundRequestReason: transactionsTable.refundRequestReason,
      })
      .from(transactionsTable)
      .leftJoin(users, eq(transactionsTable.contributorId, users.id))
      .leftJoin(churchProfiles, eq(transactionsTable.originChurchId, churchProfiles.userId))
      .where(
        and(
          eq(transactionsTable.contributorId, sessionUser.id),
          isNull(transactionsTable.deletedAt),
        ),
      )
      .orderBy(desc(transactionsTable.createdAt))

    const formattedTransactions = results.map((t) => ({
      ...t,
      id: t.id ?? '',
      amount: Number(t.amount),
      date: format(new Date(t.date), 'dd/MM/yyyy'),
    }))

    return NextResponse.json({ transactions: formattedTransactions })
  } catch (error: unknown) {
    console.error('Erro ao buscar transações do pastor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor.', details: getErrorMessage(error) },
      { status: 500 },
    )
  }
}
