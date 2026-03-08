/**
 * @fileoverview Rota da API para buscar transações do pastor logado.
 * @version 1.3
 * @date 2024-08-07
 * @author PH
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { transactions as transactionsTable, users, churchProfiles } from '@/db/schema'
import { eq, desc, and, isNull, or, ilike, gte, lte } from 'drizzle-orm'
import { format } from 'date-fns'
import { authenticateApiKey } from '@/lib/api-auth'
import { validateRequest } from '@/lib/jwt'
import { rateLimit } from '@/lib/rate-limit'
import { SessionUser } from '@/lib/types'
import { z } from 'zod'

export async function GET(request: Request): Promise<NextResponse> {
  let sessionUser: SessionUser | null = null

  try {
    // Rate limiting: 60 requests per minute
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('pastor-transacoes-list', ip, 60, 60)
    if (!rateLimitResult.allowed) {
      console.error('[PASTOR_TRANSACOES_LIST_RATE_LIMIT]', {
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
      console.error('[PASTOR_TRANSACOES_LIST_AUTH_ERROR]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    if (sessionUser.role !== 'pastor') {
      console.error('[PASTOR_TRANSACOES_LIST_ROLE_ERROR]', {
        userId: sessionUser.id,
        role: sessionUser.role,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Acesso negado. Role pastor necessária.' }, { status: 403 })
    }

    // BUG-05 fix: Validação Zod dos parâmetros
    const { searchParams } = new URL(request.url)
    const pastorTransacoesParamsSchema = z.object({
      search: z.string().max(200).optional(),
      startDate: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
      endDate: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
    })
    const paramsValidation = pastorTransacoesParamsSchema.safeParse({
      search: searchParams.get('search') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    })
    if (!paramsValidation.success) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: paramsValidation.error.errors },
        { status: 400 },
      )
    }
    const { search, startDate, endDate } = paramsValidation.data

    // Construir condições de filtro
    const conditions = [
      eq(transactionsTable.contributorId, sessionUser.id), // SEMPRE filtrar por pastor logado
      isNull(transactionsTable.deletedAt),
    ]

    // BUG-06 fix: Usar ilike para busca case-insensitive
    if (search) {
      const searchCondition = or(
        ilike(transactionsTable.id, `%${search}%`),
        ilike(transactionsTable.gatewayTransactionId, `%${search}%`),
      )
      if (searchCondition) {
        conditions.push(searchCondition)
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

    return NextResponse.json({ transactions: formattedTransactions })
  } catch (error: unknown) {
    console.error('[PASTOR_TRANSACOES_LIST_ERROR]', {
      pastorId: sessionUser?.id,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
    })
    // BUG-10 fix: Não expor detalhes do erro
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
