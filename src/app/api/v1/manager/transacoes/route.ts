import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import {
  transactions as transactionsTable,
  users,
  churchProfiles,
  pastorProfiles,
  supervisorProfiles,
} from '@/db/schema'
import { eq, desc, inArray } from 'drizzle-orm'
import { format } from 'date-fns'
import { authenticateApiKey } from '@/lib/api-auth'
import { getErrorMessage } from '@/lib/error-types'

const GERENTE_INIT_ID = process.env.GERENTE_INIT

export async function GET() {
  const authResponse = await authenticateApiKey()
  if (authResponse) return authResponse

  if (!GERENTE_INIT_ID) {
    return NextResponse.json(
      { error: 'ID do Gerente não configurado no ambiente.' },
      { status: 500 },
    )
  }

  try {
    const supervisorsResult = await db
      .select({ id: supervisorProfiles.userId })
      .from(supervisorProfiles)
      .where(eq(supervisorProfiles.managerId, GERENTE_INIT_ID))

    const supervisorIds = supervisorsResult.map((s) => s.id)
    if (supervisorIds.length === 0) {
      return NextResponse.json({ transactions: [] })
    }

    const pastorsResult = await db
      .select({ id: pastorProfiles.userId })
      .from(pastorProfiles)
      .where(inArray(pastorProfiles.supervisorId, supervisorIds))
    const pastorIds = pastorsResult.map((p) => p.id)

    const churchesResult = await db
      .select({ id: churchProfiles.userId })
      .from(churchProfiles)
      .where(inArray(churchProfiles.supervisorId, supervisorIds))
    const churchIds = churchesResult.map((c) => c.id)

    const networkUserIds = [...supervisorIds, ...pastorIds, ...churchIds]
    if (networkUserIds.length === 0) {
      return NextResponse.json({ transactions: [] })
    }

    const results = await db
      .select({
        id: transactionsTable.id,
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
      .where(inArray(transactionsTable.contributorId, networkUserIds))
      .orderBy(desc(transactionsTable.createdAt))

    const formattedTransactions = results.map((t) => ({
      ...t,
      amount: Number(t.amount),
      date: format(new Date(t.date), 'dd/MM/yyyy'),
    }))

    return NextResponse.json({ transactions: formattedTransactions })
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error)
    console.error('Erro ao buscar transações da rede do gerente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor.', details: errorMessage },
      { status: 500 },
    )
  }
}
