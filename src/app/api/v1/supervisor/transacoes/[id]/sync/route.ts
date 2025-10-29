import { NextResponse } from 'next/server'
import { validateRequest } from '@/lib/jwt'
import { logUserAction } from '@/lib/action-logger'
import { db } from '@/db/drizzle'
import { transactions, gatewayConfigurations } from '@/db/schema'
import { eq } from 'drizzle-orm'

async function getCieloCredentials() {
  const [config] = await db
    .select()
    .from(gatewayConfigurations)
    .where(eq(gatewayConfigurations.gatewayName, 'Cielo'))
    .limit(1)

  if (!config) throw new Error('Configuração do gateway Cielo não encontrada')

  const isProduction = config.environment === 'production'
  return {
    merchantId: isProduction ? config.prodClientId : config.devClientId,
    merchantKey: isProduction ? config.prodClientSecret : config.devClientSecret,
    apiUrl: isProduction
      ? 'https://apiquery.cieloecommerce.cielo.com.br'
      : 'https://apiquerysandbox.cieloecommerce.cielo.com.br',
  }
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  const { user } = await validateRequest()

  if (!user || user.role !== 'supervisor') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = params

  try {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1)

    if (!transaction) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
    }

    if (transaction.status !== 'pending') {
      return NextResponse.json(
        { error: 'Apenas transações pendentes podem ser sincronizadas' },
        { status: 400 }
      )
    }

    if (!transaction.gatewayTransactionId) {
      return NextResponse.json({ error: 'Transação não possui ID do gateway' }, { status: 400 })
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
      }
    )

    if (!response.ok) {
      throw new Error('Falha ao consultar transação na Cielo')
    }

    const cieloData = await response.json()
    const cieloStatus = cieloData.Payment.Status

    let newStatus: 'approved' | 'pending' | 'refused' | 'refunded' = 'pending'
    if (cieloStatus === 2) newStatus = 'approved'
    else if (cieloStatus === 3) newStatus = 'refused'
    else if (cieloStatus === 10 || cieloStatus === 13) newStatus = 'refunded'

    await db.update(transactions).set({ status: newStatus }).where(eq(transactions.id, id))

    await logUserAction(
      user.id,
      'sync_transaction',
      'transaction',
      id,
      `Transação sincronizada: ${transaction.status} → ${newStatus}`
    )

    return NextResponse.json({
      success: true,
      oldStatus: transaction.status,
      newStatus,
      message: 'Transação sincronizada com sucesso',
    })
  } catch (error) {
    console.error('Erro ao sincronizar transação:', error)
    return NextResponse.json({ error: 'Erro ao sincronizar transação' }, { status: 500 })
  }
}
