/**
 * @fileoverview Rota da API para buscar detalhes de uma transação específica (visão do pastor).
 * @version 1.3
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
import { queryBradescoPixPayment, queryBradescoBoletoPayment } from '@/lib/bradesco'
import { SessionUser } from '@/lib/types'

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

async function verifyTransactionOwnership(transactionId: string, userId: string): Promise<boolean> {
  const [transaction] = await db
    .select({ contributorId: transactionsTable.contributorId })
    .from(transactionsTable)
    .where(eq(transactionsTable.id, transactionId))
    .limit(1)

  if (!transaction || transaction.contributorId !== userId) {
    return false
  }

  return true
}

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  let sessionUser: SessionUser | null = null

  try {
    // Rate limiting: 60 requests per minute
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('pastor-transacoes-detail', ip, 60, 60)
    if (!rateLimitResult.allowed) {
      console.error('[PASTOR_TRANSACOES_DETAIL_RATE_LIMIT]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 },
      )
    }

    const params = await props.params
    const { user: authUser } = await validateRequest()
    sessionUser = authUser

    if (!sessionUser) {
      const authResponse = await authenticateApiKey()
      if (authResponse) return authResponse
      console.error('[PASTOR_TRANSACOES_DETAIL_AUTH_ERROR]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    if (sessionUser.role !== 'pastor') {
      console.error('[PASTOR_TRANSACOES_DETAIL_ROLE_ERROR]', {
        userId: sessionUser.id,
        role: sessionUser.role,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Acesso negado. Role pastor necessária.' }, { status: 403 })
    }

    const { id: transactionId } = params

    if (!transactionId) {
      console.error('[PASTOR_TRANSACOES_DETAIL_MISSING_ID]', {
        pastorId: sessionUser.id,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'ID da transação não fornecido.' }, { status: 400 })
    }

    // Verificar propriedade da transação ANTES de buscar dados
    const isAuthorized = await verifyTransactionOwnership(transactionId, sessionUser.id)
    if (!isAuthorized) {
      console.error('[PASTOR_TRANSACOES_DETAIL_UNAUTHORIZED]', {
        pastorId: sessionUser.id,
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
      console.error('[PASTOR_TRANSACOES_DETAIL_NOT_FOUND]', {
        pastorId: sessionUser.id,
        transactionId,
        timestamp: new Date().toISOString(),
      })
      throw new ApiError(404, 'Transação não encontrada no banco de dados local.')
    }

    const transaction = transactionData.transaction

    if (!transaction.gatewayTransactionId) {
      // Se não tem gatewayTransactionId, retornar dados básicos do banco
      return NextResponse.json({
        success: true,
        pending: true,
        message: 'Transação ainda não processada pelo gateway.',
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

    // Consultar gateway baseado no campo `gateway` da transação
    if (transaction.gateway === 'Bradesco') {
      // Bradesco: consultar status via API PIX ou Boleto
      let bradescoStatus = 'pending'
      if (transaction.paymentMethod === 'pix') {
        const pixResponse = await queryBradescoPixPayment(transaction.gatewayTransactionId)
        if (pixResponse.status === 'CONCLUIDA') bradescoStatus = 'approved'
        else if (
          pixResponse.status === 'REMOVIDA_PELO_USUARIO_RECEBEDOR' ||
          pixResponse.status === 'REMOVIDA_PELO_PSP'
        )
          bradescoStatus = 'refused'
      } else if (transaction.paymentMethod === 'boleto') {
        const boletoResponse = await queryBradescoBoletoPayment(transaction.gatewayTransactionId)
        if (boletoResponse.status === 'pago') bradescoStatus = 'approved'
        else if (boletoResponse.status === 'vencido' || boletoResponse.status === 'cancelado')
          bradescoStatus = 'refused'
      }

      // Normalizar resposta no mesmo formato que o frontend espera
      return NextResponse.json({
        success: true,
        transaction: {
          id: transaction.id,
          amount: Number(transaction.amount),
          status: bradescoStatus,
          paymentMethod: transaction.paymentMethod,
          description: transaction.description,
          gateway: 'Bradesco',
          Payment: {
            Status: bradescoStatus === 'approved' ? 2 : bradescoStatus === 'refused' ? 3 : 0,
          },
        },
        contributorEmail: transactionData.contributorEmail,
        originChurchId: transaction.originChurchId,
        description: transaction.description,
      })
    }

    // Cielo: consultar via API REST
    const credentials = await getCieloCredentials()

    const cieloController = new AbortController()
    const cieloTimeoutId = setTimeout(() => cieloController.abort(), 15_000)
    let response: Response
    try {
      response = await fetch(`${credentials.apiUrl}/1/sales/${transaction.gatewayTransactionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          MerchantId: credentials.merchantId || '',
          MerchantKey: credentials.merchantKey || '',
        },
        signal: cieloController.signal,
      })
      clearTimeout(cieloTimeoutId)
    } catch (fetchError) {
      clearTimeout(cieloTimeoutId)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('[GATEWAY_TIMEOUT] Timeout ao consultar transação no gateway', {
          transactionId,
        })
        return NextResponse.json(
          { error: 'Timeout ao comunicar com o gateway. Tente novamente.' },
          { status: 504 },
        )
      }
      throw fetchError
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      console.error('[PASTOR_TRANSACOES_DETAIL_GATEWAY_ERROR]', {
        pastorId: sessionUser.id,
        transactionId,
        gatewayError: errorBody,
        timestamp: new Date().toISOString(),
      })
      throw new Error('Falha ao consultar o status da transação no gateway.')
    }

    const gatewayData: Record<string, unknown> = await response.json()

    // Retornar dados do gateway junto com email do contribuinte e dados locais
    return NextResponse.json({
      success: true,
      transaction: gatewayData,
      contributorEmail: transactionData.contributorEmail,
      originChurchId: transaction.originChurchId,
      description: transaction.description,
    })
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[PASTOR_TRANSACOES_DETAIL_ERROR]', {
      pastorId: sessionUser?.id,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
    })
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro interno do servidor.', details: errorMessage },
      { status: 500 },
    )
  }
}
