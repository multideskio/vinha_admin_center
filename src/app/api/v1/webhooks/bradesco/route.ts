import { NextRequest, NextResponse } from 'next/server'
import { logBradescoWebhook } from '@/lib/bradesco-logger'
import { queryBradescoPixPayment, queryBradescoBoletoPayment } from '@/lib/bradesco'
import { reconcileTransactionState } from '@/lib/webhook-reconciliation'
import { logger } from '@/lib/logger'
import { invalidateCache } from '@/lib/cache'
import { onTransactionCreated } from '@/lib/notification-hooks'
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

        // ✅ SEGURANÇA: Consultar API do Bradesco para confirmar status real do pagamento
        const bradescoStatus = await queryBradescoPixPayment(txid)
        let confirmedStatus: 'approved' | 'pending' = 'pending'

        if (bradescoStatus.status === 'CONCLUIDA') {
          confirmedStatus = 'approved'
        } else {
          logger.warn('Webhook PIX - status não confirmado pelo Bradesco', {
            txid,
            webhookStatus: 'approved',
            bradescoStatus: bradescoStatus.status,
          })
          // Manter como pending se o Bradesco não confirmar
          confirmedStatus = 'pending'
        }

        const reconciliation = await reconcileTransactionState(txid, confirmedStatus, {
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

          // ✅ Disparar notificações (email + WhatsApp) se aprovado
          if (confirmedStatus === 'approved' && reconciliation.transactionId) {
            onTransactionCreated(reconciliation.transactionId).catch((err) => {
              logger.error('Error sending PIX notification hooks', err)
            })
          }
        }

        logger.info('Webhook PIX processado', {
          txid,
          confirmedStatus,
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

      // ✅ SEGURANÇA: Consultar API do Bradesco para confirmar status real do boleto
      const bradescoStatus = await queryBradescoBoletoPayment(nossoNumero)

      let newStatus: 'approved' | 'pending' | 'refused' = 'pending'
      if (bradescoStatus.status === 'pago') {
        newStatus = 'approved'
      } else if (bradescoStatus.status === 'cancelado') {
        newStatus = 'refused'
      } else {
        // Se o Bradesco não confirmar, usar status do webhook como fallback
        // mas apenas para cancelamento/recusa (nunca confiar em aprovação sem confirmação)
        if (boletoStatus === 'cancelado' || boletoStatus === 'baixado') {
          newStatus = 'refused'
        } else {
          newStatus = 'pending'
        }
        logger.warn('Webhook Boleto - status não confirmado pelo Bradesco', {
          nossoNumero,
          webhookStatus: boletoStatus,
          bradescoStatus: bradescoStatus.status,
          resolvedStatus: newStatus,
        })
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

        // ✅ Disparar notificações (email + WhatsApp) se aprovado
        if (reconciliation.transactionId) {
          onTransactionCreated(reconciliation.transactionId).catch((err) => {
            logger.error('Error sending Boleto notification hooks', err)
          })
        }
      }

      logger.info('Webhook Boleto processado', {
        nossoNumero,
        confirmedStatus: newStatus,
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
