/**
 * @fileoverview API para sincronizar status de transação com gateway (visão do supervisor).
 * @version 1.0
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

  // Verificar se é o próprio supervisor
  if (contributorId === supervisorId) return true

  // Verificar se é um pastor da supervisão
  const pastorIdsResult = await db
    .select({ id: pastorProfiles.userId })
    .from(pastorProfiles)
    .where(eq(pastorProfiles.supervisorId, supervisorId))
  const pastorIds = pastorIdsResult.map((p) => p.id)
  if (pastorIds.includes(contributorId)) return true

  // Verificar se é uma igreja da supervisão
  const churchIdsResult = await db
    .select({ id: churchProfiles.userId })
    .from(churchProfiles)
    .where(eq(churchProfiles.supervisorId, supervisorId))
  const churchIds = churchIdsResult.map((c) => c.id)
  if (churchIds.includes(contributorId)) return true

  return false
}

function mapCieloStatus(status: number): 'approved' | 'pending' | 'refused' | 'refunded' {
  // Mapear status da Cielo: 0=Pendente, 1=Autorizado, 2=Pago, 3=Negado, 10=Cancelado, 13=Estornado
  if (status === 2) return 'approved'
  if (status === 3) return 'refused'
  if (status === 10 || status === 13) return 'refunded'
  return 'pending'
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const params = await props.params
  const { id } = params
  let sessionUser: SessionUser | null = null

  try {
    // Rate limiting: 30 requests per minute
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('supervisor-transacoes-sync', ip, 30, 60)
    if (!rateLimitResult.allowed) {
      console.error('[SUPERVISOR_TRANSACOES_SYNC_RATE_LIMIT]', {
        ip,
        timestamp: new Date().toISOString(),
      })
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
      console.error('[SUPERVISOR_TRANSACOES_SYNC_AUTH_ERROR]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    // Verifica se o usuário tem a role correta
    if (sessionUser.role !== 'supervisor') {
      console.error('[SUPERVISOR_TRANSACOES_SYNC_ROLE_ERROR]', {
        userId: sessionUser.id,
        role: sessionUser.role,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Acesso negado. Role supervisor necessária.' },
        { status: 403 },
      )
    }

    if (!id) {
      return NextResponse.json({ error: 'ID da transação não fornecido.' }, { status: 400 })
    }

    // Verificar se o supervisor tem acesso a esta transação
    const isAuthorized = await verifyTransactionOwnership(id, sessionUser.id)
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Transação não encontrada ou você não tem permissão para acessá-la.' },
        { status: 404 },
      )
    }

    // Buscar transação no banco local
    const [transaction] = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, id))
      .limit(1)

    if (!transaction || !transaction.gatewayTransactionId) {
      return NextResponse.json(
        { error: 'Transação não encontrada ou não possui ID de gateway.' },
        { status: 404 },
      )
    }

    // Buscar credenciais da Cielo
    const credentials = await getCieloCredentials()

    // Consultar status na Cielo
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
      console.error('[SUPERVISOR_TRANSACOES_SYNC_CIELO_ERROR]', {
        supervisorId: sessionUser.id,
        transactionId: id,
        status: response.status,
        statusText: response.statusText,
        timestamp: new Date().toISOString(),
      })

      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Transação ainda não processada pela Cielo.' },
          { status: 404 },
        )
      }

      throw new Error('Falha ao consultar status na Cielo.')
    }

    const cieloData = await response.json()
    const newStatus = mapCieloStatus(cieloData.Payment.Status)

    // Atualizar status no banco local se mudou
    if (newStatus !== transaction.status) {
      await db
        .update(transactionsTable)
        .set({
          status: newStatus,
        })
        .where(eq(transactionsTable.id, id))

      return NextResponse.json({
        success: true,
        message: `Status atualizado de "${transaction.status}" para "${newStatus}".`,
        oldStatus: transaction.status,
        newStatus: newStatus,
      })
    } else {
      return NextResponse.json({
        success: true,
        message: 'Status já está atualizado.',
        status: newStatus,
      })
    }
  } catch (error: unknown) {
    console.error('[SUPERVISOR_TRANSACOES_SYNC_ERROR]', {
      supervisorId: sessionUser?.id,
      transactionId: id,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })

    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro interno do servidor.', details: errorMessage },
      { status: 500 },
    )
  }
}
