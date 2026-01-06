/**
 * @fileoverview Rota da API para buscar transações da igreja logada.
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { transactions as transactionsTable, users, churchProfiles } from '@/db/schema'
import { eq, desc, and, isNull, or, like, gte, lte } from 'drizzle-orm'
import { format } from 'date-fns'
import { authenticateApiKey } from '@/lib/api-auth'
import { validateRequest } from '@/lib/jwt'
import { getErrorMessage } from '@/lib/error-types'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: Request): Promise<NextResponse> {
  let sessionUser: any = null

  try {
    // Rate limiting: 60 requests per minute
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('igreja-transacoes-list', ip, 60, 60)
    if (!rateLimitResult.allowed) {
      console.error('[IGREJA_TRANSACOES_LIST_RATE_LIMIT]', {
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
      console.error('[IGREJA_TRANSACOES_LIST_AUTH_ERROR]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    if (!['igreja', 'church_account'].includes(sessionUser.role)) {
      console.error('[IGREJA_TRANSACOES_LIST_ROLE_ERROR]', {
        userId: sessionUser.id,
        role: sessionUser.role,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Acesso negado. Role igreja necessária.' }, { status: 403 })
    }

    // Extrair parâmetros de busca e filtro
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    console.log('[IGREJA_TRANSACOES_LIST_REQUEST]', {
      churchId: sessionUser.id,
      search,
      startDate,
      endDate,
      timestamp: new Date().toISOString(),
    })

    // Construir condições de filtro
    const conditions = [
      eq(transactionsTable.originChurchId, sessionUser.id), // SEMPRE filtrar por igreja logada
      isNull(transactionsTable.deletedAt),
    ]

    // Filtro de busca (ID da transação ou gatewayTransactionId)
    if (search) {
      const searchCondition = or(
        like(transactionsTable.id, `%${search}%`),
        like(transactionsTable.gatewayTransactionId, `%${search}%`),
      )
      if (searchCondition) {
        conditions.push(searchCondition as any)
      }
    }

    // Filtro de data
    if (startDate) {
      conditions.push(gte(transactionsTable.createdAt, new Date(startDate)))
    }
    if (endDate) {
      const endDateObj = new Date(endDate)
      endDateObj.setHours(23, 59, 59, 999) // Fim do dia
      conditions.push(lte(transactionsTable.createdAt, endDateObj))
    }
    const results = await db
      .select({
        id: transactionsTable.id, // Usar id da tabela, não gatewayTransactionId
        gatewayTransactionId: transactionsTable.gatewayTransactionId,
        contributor: users.email,
        church: churchProfiles.nomeFantasia,
        amount: transactionsTable.amount,
        method: transactionsTable.paymentMethod,
        status: transactionsTable.status,
        description: transactionsTable.description,
        date: transactionsTable.createdAt,
        refundRequestReason: transactionsTable.refundRequestReason,
      })
      .from(transactionsTable)
      .leftJoin(users, eq(transactionsTable.contributorId, users.id))
      .leftJoin(churchProfiles, eq(transactionsTable.originChurchId, churchProfiles.userId))
      .where(and(...conditions))
      .orderBy(desc(transactionsTable.createdAt))
      .limit(100) // Limitar a 100 transações

    const formattedTransactions = results.map((t) => ({
      id: t.id, // ID da tabela para usar na URL
      gatewayTransactionId: t.gatewayTransactionId, // ID do gateway para referência
      contributor: t.contributor || 'N/A',
      church: t.church || 'N/A',
      amount: Number(t.amount),
      method: t.method || 'N/A',
      status: t.status,
      description: t.description || null,
      date: format(new Date(t.date), 'dd/MM/yyyy'),
      refundRequestReason: t.refundRequestReason,
    }))

    console.log('[IGREJA_TRANSACOES_LIST_SUCCESS]', {
      churchId: sessionUser.id,
      count: formattedTransactions.length,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ transactions: formattedTransactions })
  } catch (error: unknown) {
    console.error('[IGREJA_TRANSACOES_LIST_ERROR]', {
      churchId: sessionUser?.id,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json(
      { error: 'Erro interno do servidor.', details: getErrorMessage(error) },
      { status: 500 },
    )
  }
}
