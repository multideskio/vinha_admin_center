import { NextRequest, NextResponse } from 'next/server'
import { logBradescoWebhook } from '@/lib/bradesco-logger'
import { reconcileTransactionState } from '@/lib/webhook-reconciliation'
import { logger } from '@/lib/logger'
import { invalidateCache } from '@/lib/cache'
import { z } from 'zod'

// Zod schemas para validação de webhooks Bradesco
const bradescoPixWebhookSchema = z.object({
  pix: z
    .array(
      z.object({
        endToEndId: z.string(),
        txid: z.string(),
        valor: z.string(),
        horario: z.string(),
        infoPagador: z.string().optional(),
      }),
    )
    .min(1),
})

const bradescoBoletoWebhookSchema = z.object({
  nossoNumero: z.string(),
  status: z.string(),
  valorPago: z.number().optional(),
  dataPagamento: z.string().optional(),
})

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    logger.setContext({ operation: 'bradesco_webhook' })
    logger.info('Webhook recebido do Bradesco', { body })

    // Registrar webhook no banco via bradesco-logger
    await logBradescoWebhook({
      paymentId: body?.pix?.[0]?.txid || body?.nossoNumero || undefined,
      requestBody: body,
    })

    // Tentar validar como webhook PIX primeiro
    const pixResult = bradescoPixWebhookSchema.safeParse(body)
    if (pixResult.success) {
      for (const pixPayment of pixResult.data.pix) {
        const txid = pixPayment.txid

        logger.info('Processando webhook PIX', { txid, valor: pixPayment.valor })

        const reconciliation = await reconcileTransactionState(txid, 'approved', {
          maxAttempts: 5,
          initialDelayMs: 100,
          maxDelayMs: 5000,
        })

        if (!reconciliation.transactionFound) {
          logger.warn('Webhook PIX - transação não encontrada', { txid })
          return NextResponse.json(
            { success: false, error: 'Transação não encontrada' },
            { status: 500 },
          )
        }

        if (!reconciliation.success) {
          logger.error('Webhook PIX - falha na reconciliação', { error: reconciliation.error })
          return NextResponse.json(
            { success: false, error: 'Erro na reconciliação' },
            { status: 500 },
          )
        }

        if (reconciliation.statusUpdated) {
          await invalidateCache('dashboard:admin:*')
          await invalidateCache('relatorio:*')
          await invalidateCache('insights:*')
        }

        logger.info('Webhook PIX processado', {
          txid,
          statusUpdated: reconciliation.statusUpdated,
        })
      }

      logger.clearContext()
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // Tentar validar como webhook Boleto
    const boletoResult = bradescoBoletoWebhookSchema.safeParse(body)
    if (boletoResult.success) {
      const { nossoNumero, status: boletoStatus } = boletoResult.data

      logger.info('Processando webhook Boleto', { nossoNumero, status: boletoStatus })

      // Mapear status do Bradesco para status interno
      let newStatus: 'approved' | 'pending' | 'refused' = 'pending'
      if (boletoStatus === 'pago' || boletoStatus === 'liquidado') {
        newStatus = 'approved'
      } else if (boletoStatus === 'cancelado' || boletoStatus === 'baixado') {
        newStatus = 'refused'
      }

      const reconciliation = await reconcileTransactionState(nossoNumero, newStatus, {
        maxAttempts: 5,
        initialDelayMs: 100,
        maxDelayMs: 5000,
      })

      if (!reconciliation.transactionFound) {
        logger.warn('Webhook Boleto - transação não encontrada', { nossoNumero })
        return NextResponse.json(
          { success: false, error: 'Transação não encontrada' },
          { status: 500 },
        )
      }

      if (!reconciliation.success) {
        logger.error('Webhook Boleto - falha na reconciliação', { error: reconciliation.error })
        return NextResponse.json(
          { success: false, error: 'Erro na reconciliação' },
          { status: 500 },
        )
      }

      if (reconciliation.statusUpdated && newStatus === 'approved') {
        await invalidateCache('dashboard:admin:*')
        await invalidateCache('relatorio:*')
        await invalidateCache('insights:*')
      }

      logger.info('Webhook Boleto processado', {
        nossoNumero,
        statusUpdated: reconciliation.statusUpdated,
      })

      logger.clearContext()
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // Payload não corresponde a PIX nem Boleto — inválido
    logger.warn('Payload de webhook inválido - não é PIX nem Boleto', {
      pixErrors: pixResult.error?.errors,
      boletoErrors: boletoResult.error?.errors,
    })

    logger.clearContext()
    // Retornar 200 para payloads inválidos para evitar retentativas desnecessárias
    return NextResponse.json(
      { success: true, message: 'Webhook recebido mas ignorado - payload inválido' },
      { status: 200 },
    )
  } catch (error) {
    logger.error('Erro no processamento do webhook Bradesco', error)
    logger.clearContext()

    // Erros de processamento retornam 500 para que o Bradesco retente
    return NextResponse.json(
      {
        success: false,
        error: 'Erro de processamento',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    )
  }
}
