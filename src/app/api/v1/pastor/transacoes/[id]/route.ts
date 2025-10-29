/**
 * @fileoverview Rota da API para buscar detalhes de uma transação específica (visão do pastor).
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { transactions as transactionsTable, gatewayConfigurations } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { authenticateApiKey } from '@/lib/api-auth'
import { validateRequest } from '@/lib/jwt'
import { ApiError } from '@/lib/errors'
import type { UserRole } from '@/lib/types'

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

export async function GET(request: Request, props: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const params = await props.params;
  const { user: sessionUser } = await validateRequest()
  
  if (!sessionUser) {
    const authResponse = await authenticateApiKey()
    if (authResponse) return authResponse
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  
  if (sessionUser.role !== 'pastor') {
    return NextResponse.json({ error: 'Acesso negado. Role pastor necessária.' }, { status: 403 })
  }

  const { id: transactionId } = params

  if (!transactionId) {
    return NextResponse.json({ error: 'ID da transação não fornecido.' }, { status: 400 })
  }

  try {
    const isAuthorized = await verifyTransactionOwnership(transactionId, sessionUser.id)
    if (!isAuthorized) {
      throw new ApiError(
        404,
        'Transação não encontrada ou você não tem permissão para visualizá-la.',
      )
    }

    const [transaction] = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, transactionId))
    if (!transaction || !transaction.gatewayTransactionId) {
      throw new ApiError(
        404,
        'Transação não encontrada no banco de dados local ou não possui ID de gateway.',
      )
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
      const errorBody = await response.json()
      console.error('Erro ao consultar transação na Cielo:', errorBody)
      throw new Error('Falha ao consultar o status da transação na Cielo.')
    }

    const cieloData = await response.json()

    return NextResponse.json({ success: true, transaction: cieloData })
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Erro ao consultar transação:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro interno do servidor.', details: errorMessage },
      { status: 500 },
    )
  }
}
