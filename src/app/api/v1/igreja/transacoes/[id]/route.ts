/**
 * @fileoverview Rota da API para buscar detalhes de uma transação específica (visão da igreja).
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import {
  transactions as transactionsTable,
  gatewayConfigurations,
  users,
  churchProfiles,
} from '@/db/schema'
import { eq } from 'drizzle-orm'
import { authenticateApiKey } from '@/lib/api-auth'
import { format, parseISO } from 'date-fns'
import { validateRequest } from '@/lib/jwt'
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

export async function GET(request: Request, props: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const params = await props.params;
  const { user: sessionUser } = await validateRequest()
  
  if (!sessionUser) {
    const authResponse = await authenticateApiKey()
    if (authResponse) return authResponse
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  
  if (!['igreja', 'church_account'].includes(sessionUser.role)) {
    return NextResponse.json({ error: 'Acesso negado. Role igreja necessária.' }, { status: 403 })
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
      return NextResponse.json(
        { error: 'Transação não encontrada no banco de dados local ou não possui ID de gateway.' },
        { status: 404 },
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
    const [contributor] = await db
      .select()
      .from(users)
      .where(eq(users.id, transaction.contributorId))
    if (!transaction.originChurchId) {
      return NextResponse.json(
        { error: 'ID da igreja de origem não encontrado na transação.' },
        { status: 400 },
      )
    }

    const [church] = await db
      .select()
      .from(churchProfiles)
      .where(eq(churchProfiles.userId, transaction.originChurchId))

    const payment = cieloData.Payment

    // Mapear status da Cielo
    let status: 'approved' | 'pending' | 'refused' | 'refunded' = 'pending'
    if (payment.Status === 2) status = 'approved'
    else if (payment.Status === 3) status = 'refused'
    else if (payment.Status === 10 || payment.Status === 11) status = 'refunded'

    const formattedData = {
      id: payment.PaymentId,
      date: payment.ReceivedDate ? format(parseISO(payment.ReceivedDate), 'dd/MM/yyyy HH:mm:ss') : 'N/A',
      amount: payment.Amount / 100,
      status,
      contributor: {
        name: contributor?.email ?? 'N/A',
        email: contributor?.email ?? 'N/A',
      },
      church: {
        name: church?.nomeFantasia ?? 'N/A',
        address: `${church?.address ?? ''}, ${church?.city ?? ''} - ${church?.state ?? ''}`,
      },
      payment: {
        method: payment.Type === 'CreditCard' ? 'Cartão de Crédito' : payment.Type === 'Pix' ? 'Pix' : 'Boleto',
        details:
          payment.Type === 'CreditCard' && payment.CreditCard
            ? `${payment.CreditCard.Brand} final ${payment.CreditCard.CardNumber.slice(-4)}`
            : payment.ProofOfSale || 'N/A',
      },
      refundRequestReason: payment.VoidReason || null,
    }

    return NextResponse.json({ success: true, transaction: formattedData })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Erro ao consultar transação:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor.'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
