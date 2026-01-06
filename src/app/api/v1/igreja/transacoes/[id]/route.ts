/**
 * @fileoverview Rota da API para buscar detalhes de uma transação específica (visão da igreja).
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { transactions as transactionsTable, gatewayConfigurations, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { authenticateApiKey } from '@/lib/api-auth'
import { validateRequest } from '@/lib/jwt'
import { ApiError } from '@/lib/errors'
import { rateLimit } from '@/lib/rate-limit'

async function getCieloCredentials(): Promise<{
  merchantId: string | null
  merchantKey: string | null
  apiUrl: string
}> {
  const [config] = await db
    .select()
    .from(gatewayConfigurations)
    .where(eq(gatewayConfigurations.gatewayName, 'Cielo'))
    .limit(1)

  if (!config) throw new Error('Configuração do gateway Cielo não encontrada.')

  const isProduction = config.environment === 'production'
  return {
    merchantId: isProduction ? config.prodClientId : config.devClientId,
    merchantKey: isProduction ? config.prodClientSecret : config.devClientSecret,
    apiUrl: isProduction
      ? 'https://apiquery.cieloecommerce.cielo.com.br'
      : 'https://apiquerysandbox.cieloecommerce.cielo.com.br',
  }
}

async function verifyTransactionOwnership(
  transactionId: string,
  churchId: string,
): Promise<boolean> {
  const [transaction] = await db
    .select({ originChurchId: transactionsTable.originChurchId })
    .from(transactionsTable)
    .where(eq(transactionsTable.id, transactionId))
    .limit(1)

  if (!transaction || transaction.originChurchId !== churchId) {
    return false
  }

  return true
}

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const params = await props.params
  let sessionUser: any = null

  try {
    // Rate limiting: 60 requests per minute
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('igreja-transacoes-detail', ip, 60, 60)
    if (!rateLimitResult.allowed) {
      console.error('[IGREJA_TRANSACOES_DETAIL_RATE_LIMIT]', {
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
      console.error('[IGREJA_TRANSACOES_DETAIL_AUTH_ERROR]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    if (!['igreja', 'church_account'].includes(sessionUser.role)) {
      console.error('[IGREJA_TRANSACOES_DETAIL_ROLE_ERROR]', {
        userId: sessionUser.id,
        role: sessionUser.role,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Acesso negado. Role igreja necessária.' }, { status: 403 })
    }

    const { id: transactionId } = params

    if (!transactionId) {
      console.error('[IGREJA_TRANSACOES_DETAIL_MISSING_ID]', {
        churchId: sessionUser.id,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'ID da transação não fornecido.' }, { status: 400 })
    }

    console.log('[IGREJA_TRANSACOES_DETAIL_REQUEST]', {
      churchId: sessionUser.id,
      transactionId,
      timestamp: new Date().toISOString(),
    })
    // Verificar propriedade da transação ANTES de buscar dados
    const isAuthorized = await verifyTransactionOwnership(transactionId, sessionUser.id)
    if (!isAuthorized) {
      console.error('[IGREJA_TRANSACOES_DETAIL_UNAUTHORIZED]', {
        churchId: sessionUser.id,
        transactionId,
        timestamp: new Date().toISOString(),
      })
      throw new ApiError(
        404,
        'Transação não encontrada ou você não tem permissão para visualizá-la.',
      )
    }

    // Buscar transação com JOIN para pegar email do contribuinte
    const [transactionData] = await db
      .select({
        transaction: transactionsTable,
        contributorEmail: users.email,
      })
      .from(transactionsTable)
      .leftJoin(users, eq(transactionsTable.contributorId, users.id))
      .where(eq(transactionsTable.id, transactionId))
      .limit(1)

    if (!transactionData || !transactionData.transaction) {
      console.error('[IGREJA_TRANSACOES_DETAIL_NOT_FOUND]', {
        churchId: sessionUser.id,
        transactionId,
        timestamp: new Date().toISOString(),
      })
      throw new ApiError(404, 'Transação não encontrada no banco de dados local.')
    }

    const transaction = transactionData.transaction

    if (!transaction.gatewayTransactionId) {
      // Se não tem gatewayTransactionId, retornar dados básicos do banco
      console.log('[IGREJA_TRANSACOES_DETAIL_NO_GATEWAY_ID]', {
        churchId: sessionUser.id,
        transactionId,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({
        success: true,
        pending: true,
        message: 'Transação ainda não processada pela Cielo.',
        transaction: {
          id: transaction.id,
          amount: Number(transaction.amount),
          status: transaction.status,
          paymentMethod: transaction.paymentMethod,
          description: transaction.description,
        },
        contributorEmail: transactionData.contributorEmail,
      })
    }

    const credentials = await getCieloCredentials()

    const response = await fetch(
      `${credentials.apiUrl}/1/sales/${transaction.gatewayTransactionId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          MerchantId: credentials.merchantId || '',
          MerchantKey: credentials.merchantKey || '',
        },
      },
    )

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      console.error('[IGREJA_TRANSACOES_DETAIL_CIELO_ERROR]', {
        churchId: sessionUser.id,
        transactionId,
        cieloError: errorBody,
        timestamp: new Date().toISOString(),
      })
      throw new Error('Falha ao consultar o status da transação na Cielo.')
    }

    const cieloData = await response.json()

    console.log('[IGREJA_TRANSACOES_DETAIL_SUCCESS]', {
      churchId: sessionUser.id,
      transactionId,
      timestamp: new Date().toISOString(),
    })

    // Retornar dados da Cielo junto com email do contribuinte e dados locais
    return NextResponse.json({
      success: true,
      transaction: cieloData,
      contributorEmail: transactionData.contributorEmail,
      originChurchId: transaction.originChurchId,
      description: transaction.description,
    })
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[IGREJA_TRANSACOES_DETAIL_ERROR]', {
      churchId: sessionUser?.id,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
    })
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor.'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
