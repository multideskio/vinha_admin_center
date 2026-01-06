/**
 * @fileoverview API para buscar detalhes de uma transação específica (visão do supervisor).
 * @version 1.3
 * @date 2025-01-06
 * @author Sistema de Padronização
 * @lastReview 2025-01-06 18:30
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import {
  transactions as transactionsTable,
  gatewayConfigurations,
  pastorProfiles,
  churchProfiles,
} from '@/db/schema'
import { eq } from 'drizzle-orm'
import { authenticateApiKey } from '@/lib/api-auth'
import { validateRequest } from '@/lib/jwt'
import { rateLimit } from '@/lib/rate-limit'
import { ApiError } from '@/lib/errors'

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
  supervisorId: string,
): Promise<boolean> {
  const [transaction] = await db
    .select({ contributorId: transactionsTable.contributorId })
    .from(transactionsTable)
    .where(eq(transactionsTable.id, transactionId))
    .limit(1)

  if (!transaction || !transaction.contributorId) return false

  const contributorId = transaction.contributorId

  if (contributorId === supervisorId) return true

  const pastorIdsResult = await db
    .select({ id: pastorProfiles.userId })
    .from(pastorProfiles)
    .where(eq(pastorProfiles.supervisorId, supervisorId))
  const pastorIds = pastorIdsResult.map((p) => p.id)
  if (pastorIds.includes(contributorId)) return true

  const churchIdsResult = await db
    .select({ id: churchProfiles.userId })
    .from(churchProfiles)
    .where(eq(churchProfiles.supervisorId, supervisorId))
  const churchIds = churchIdsResult.map((c) => c.id)
  if (churchIds.includes(contributorId)) return true

  return false
}

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const params = await props.params
  const { id } = params
  let sessionUser: any = null

  try {
    // Rate limiting: 60 requests per minute
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('supervisor-transacoes-individual', ip, 60, 60)
    if (!rateLimitResult.allowed) {
      console.error('[SUPERVISOR_TRANSACOES_INDIVIDUAL_RATE_LIMIT]', { ip, timestamp: new Date().toISOString() })
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 },
      )
    }

    // Primeiro tenta autenticação JWT (usuário logado via web)
    const { user: authUser } = await validateRequest()
    sessionUser = authUser

    if (!sessionUser) {
      // Se não há usuário logado, tenta autenticação por API Key
      const authResponse = await authenticateApiKey()
      if (authResponse) return authResponse

      // Se nem JWT nem API Key funcionaram, retorna 401
      console.error('[SUPERVISOR_TRANSACOES_INDIVIDUAL_AUTH_ERROR]', { ip, timestamp: new Date().toISOString() })
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    // Verifica se o usuário tem a role correta
    if (sessionUser.role !== 'supervisor') {
      console.error('[SUPERVISOR_TRANSACOES_INDIVIDUAL_ROLE_ERROR]', { 
        userId: sessionUser.id, 
        role: sessionUser.role, 
        timestamp: new Date().toISOString() 
      })
      return NextResponse.json(
        { error: 'Acesso negado. Role supervisor necessária.' },
        { status: 403 },
      )
    }

    if (!id) {
      return NextResponse.json({ error: 'ID da transação não fornecido.' }, { status: 400 })
    }

    console.log('[SUPERVISOR_TRANSACOES_INDIVIDUAL_REQUEST]', { 
      supervisorId: sessionUser.id, 
      transactionId: id,
      timestamp: new Date().toISOString() 
    })
    const isAuthorized = await verifyTransactionOwnership(id, sessionUser.id)
    if (!isAuthorized) {
      throw new ApiError(
        404,
        'Transação não encontrada ou você não tem permissão para visualizá-la.',
      )
    }

    const [transaction] = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, id))
    if (!transaction || !transaction.gatewayTransactionId) {
      throw new ApiError(
        404,
        'Transação não encontrada no banco de dados local ou não possui ID de gateway.',
      )
    }

    const credentials = await getCieloCredentials()

    console.log('[SUPERVISOR] Consultando transação na Cielo:', {
      transactionId: transaction.id,
      gatewayTransactionId: transaction.gatewayTransactionId,
      url: `${credentials.apiUrl}/1/sales/${transaction.gatewayTransactionId}`,
    })

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
      let errorBody = null
      try {
        const text = await response.text()
        if (text) {
          errorBody = JSON.parse(text)
        }
      } catch (parseError) {
        console.error('Erro ao fazer parse da resposta de erro da Cielo:', parseError)
      }

      console.error('Erro ao consultar transação na Cielo:', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      })

      // Se for 404, significa que a transação ainda não foi processada pela Cielo
      if (response.status === 404) {
        return NextResponse.json(
          {
            success: false,
            pending: true,
            message: 'Transação ainda não processada pela Cielo.',
            transaction: {
              id: transaction.id,
              gatewayTransactionId: transaction.gatewayTransactionId,
              status: transaction.status,
              amount: transaction.amount,
            },
          },
          { status: 202 },
        )
      }

      throw new Error('Falha ao consultar o status da transação na Cielo.')
    }

    let cieloData = null
    try {
      const text = await response.text()
      if (text) {
        cieloData = JSON.parse(text)
      }
    } catch (parseError) {
      console.error('Erro ao fazer parse da resposta de sucesso da Cielo:', parseError)
      throw new Error('Resposta inválida da Cielo.')
    }

    return NextResponse.json({ success: true, transaction: cieloData })
  } catch (error: unknown) {
    console.error('[SUPERVISOR_TRANSACOES_INDIVIDUAL_ERROR]', { 
      supervisorId: sessionUser?.id, 
      transactionId: id,
      error: error instanceof Error ? error.message : 'Unknown error', 
      timestamp: new Date().toISOString() 
    })
    
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro interno do servidor.', details: errorMessage },
      { status: 500 },
    )
  }
}
