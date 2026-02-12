import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import {
  transactions,
  users,
  userNotificationSettings,
  companies,
  notificationLogs,
} from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { sendEmail } from '@/lib/email'
import { createTransactionReceiptEmail } from '@/lib/email-templates'
import { logCieloWebhook } from '@/lib/cielo-logger'
import { env } from '@/lib/env'
import { reconcileTransactionState } from '@/lib/webhook-reconciliation'
import { logger } from '@/lib/logger'
import { invalidateCache } from '@/lib/cache'
import { onTransactionCreated } from '@/lib/notification-hooks'
import { z } from 'zod'

// Schema Zod para validação do webhook da Cielo
const cieloWebhookSchema = z.object({
  PaymentId: z.string().uuid(),
  ChangeType: z.number().int().min(1).max(6),
})

const COMPANY_ID = env.COMPANY_INIT

// ✅ CORRIGIDO: Classe para erros de validação (que devem retornar 200)
class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Configurar contexto do logger
    logger.setContext({
      operation: 'cielo_webhook',
      paymentId: body.PaymentId,
    })

    logger.info('Webhook received from Cielo', {
      changeType: body.ChangeType,
      paymentId: body.PaymentId,
    })

    // Registrar webhook recebido
    await logCieloWebhook({
      paymentId: body.PaymentId,
      requestBody: body,
    })

    // ✅ Validação Zod do payload do webhook
    const parseResult = cieloWebhookSchema.safeParse(body)
    if (!parseResult.success) {
      logger.warn('Webhook validation failed', {
        errors: parseResult.error.errors,
      })
      throw new ValidationError('Dados do webhook inválidos')
    }

    const { PaymentId, ChangeType } = parseResult.data

    // Determinar o novo status baseado no ChangeType
    let newStatus: 'approved' | 'pending' | 'refused' | 'refunded' = 'pending'

    switch (ChangeType) {
      case 1: // Payment status changed
      case 3: {
        // Recurrence created
        // Consultar status atual na Cielo
        const { queryPayment } = await import('@/lib/cielo')
        const paymentData = await queryPayment(PaymentId)
        const cieloStatus = paymentData.Payment?.Status

        logger.info('Cielo payment status queried', { cieloStatus })

        // Status Cielo: 0=NotFinished, 1=Authorized, 2=PaymentConfirmed, 3=Denied,
        // 10=Voided, 11=Refunded, 12=Pending, 13=Aborted, 20=Scheduled
        if (cieloStatus === 2)
          newStatus = 'approved' // Pago
        else if (cieloStatus === 1)
          newStatus = 'approved' // Autorizado (cartão)
        else if (cieloStatus === 3 || cieloStatus === 13)
          newStatus = 'refused' // Negado/Abortado
        else if (cieloStatus === 10 || cieloStatus === 11)
          newStatus = 'refunded' // Cancelado/Estornado
        else newStatus = 'pending' // Outros status
        break
      }

      case 2: // Boleto status changed (pago)
        newStatus = 'approved'
        break

      case 4: // Antifraud status changed
        // Consultar para verificar se foi aprovado ou negado
        try {
          const { queryPayment } = await import('@/lib/cielo')
          const paymentData = await queryPayment(PaymentId)
          const cieloStatus = paymentData.Payment?.Status
          if (cieloStatus === 3 || cieloStatus === 13) newStatus = 'refused'
        } catch (error) {
          logger.error('Error querying antifraud status', error)
        }
        break

      case 5: // Recurrence deactivated
      case 6: // Chargeback
        newStatus = 'refunded'
        break

      default:
        logger.warn('Unknown ChangeType received', { changeType: ChangeType })
    }

    // ✅ NOVO: Usar reconciliação para tratar race conditions e early arrivals
    const reconciliationResult = await reconcileTransactionState(PaymentId, newStatus, {
      maxAttempts: 5,
      initialDelayMs: 100,
      maxDelayMs: 5000,
    })

    // Se a transação não foi encontrada após todas as tentativas
    if (!reconciliationResult.transactionFound) {
      logger.warn('Webhook early arrival - transaction not found after retries', {
        webhookStatus: newStatus,
        recommendation: 'Transaction may be created later, Cielo will retry webhook',
      })

      // Retornar 500 para que a Cielo retente o webhook mais tarde
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction not found',
          message: 'Webhook arrived before transaction creation, will be retried',
        },
        { status: 500 },
      )
    }

    // Se houve erro na reconciliação
    if (!reconciliationResult.success) {
      logger.error('Reconciliation failed', {
        error: reconciliationResult.error,
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Reconciliation error',
          message: reconciliationResult.error,
        },
        { status: 500 },
      )
    }

    // Buscar transação atualizada para enviar email
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.gatewayTransactionId, PaymentId))
      .limit(1)

    if (!transaction) {
      logger.error('Transaction not found after reconciliation')
      throw new Error('Transaction not found after reconciliation')
    }

    logger.info('Transaction reconciled successfully', {
      transactionId: transaction.id,
      statusUpdated: reconciliationResult.statusUpdated,
      previousStatus: reconciliationResult.previousStatus,
      newStatus: reconciliationResult.newStatus,
    })

    // ✅ Invalidar cache do dashboard e relatórios após mudança de status via webhook
    if (reconciliationResult.statusUpdated) {
      await invalidateCache('dashboard:admin:*')
      await invalidateCache('relatorio:*')
      await invalidateCache('insights:*')
    }

    // Enviar email de comprovante se aprovado e status foi atualizado
    if (newStatus === 'approved' && reconciliationResult.statusUpdated) {
      try {
        // Verificar se usuário quer receber notificações de transação por email
        const [notificationSettings] = await db
          .select()
          .from(userNotificationSettings)
          .where(
            and(
              eq(userNotificationSettings.userId, transaction.contributorId),
              eq(userNotificationSettings.notificationType, 'payment_notifications'),
            ),
          )
          .limit(1)

        if (notificationSettings?.email) {
          // ✅ CORRIGIDO: Deduplicação — verificar se recibo já foi enviado para esta transação
          const dedupType = `receipt_${transaction.id}`
          const [alreadySent] = await db
            .select({ id: notificationLogs.id })
            .from(notificationLogs)
            .where(
              and(
                eq(notificationLogs.userId, transaction.contributorId),
                eq(notificationLogs.notificationType, dedupType),
                eq(notificationLogs.status, 'sent'),
              ),
            )
            .limit(1)

          if (alreadySent) {
            logger.info('Receipt email already sent, skipping duplicate', {
              transactionId: transaction.id,
            })
          } else {
            const [user] = await db
              .select({ email: users.email })
              .from(users)
              .where(eq(users.id, transaction.contributorId))
              .limit(1)

            const [company] = await db
              .select()
              .from(companies)
              .where(eq(companies.id, COMPANY_ID))
              .limit(1)

            if (user?.email) {
              const emailHtml = createTransactionReceiptEmail({
                companyName: company?.name || 'Vinha Ministérios',
                amount: Number(transaction.amount),
                transactionId: transaction.gatewayTransactionId || transaction.id,
                status: 'Aprovado',
                date: new Date(),
              })

              await sendEmail({
                to: user.email,
                subject: `✅ Pagamento Aprovado - ${company?.name || 'Vinha Ministérios'}`,
                html: emailHtml,
              })

              // Registrar envio para deduplicação
              await db.insert(notificationLogs).values({
                companyId: COMPANY_ID,
                userId: transaction.contributorId,
                notificationType: dedupType,
                channel: 'email',
                status: 'sent',
                recipient: user.email,
                subject: `Pagamento Aprovado - ${company?.name || 'Vinha Ministérios'}`,
                messageContent: 'Receipt email',
              })

              logger.info('Receipt email sent successfully', {
                recipientEmail: user.email,
                transactionId: transaction.id,
              })
            }
          }
        }
      } catch (emailError) {
        logger.error('Error sending receipt email', emailError)
        // Não falha o webhook se o email falhar
      }

      // ✅ Disparar notificações via templates (WhatsApp + email personalizado)
      onTransactionCreated(transaction.id).catch((err) => {
        logger.error('Error sending notification hooks', err)
      })
    }

    logger.clearContext()

    return NextResponse.json({ success: true, status: newStatus }, { status: 200 })
  } catch (error) {
    logger.error('Webhook processing error', error)
    logger.clearContext()

    // ✅ CORRIGIDO: Diferenciar erros de validação (200) de erros de processamento (500)
    if (error instanceof ValidationError) {
      // Erros de validação: webhook válido mas sem dados para processar
      return NextResponse.json(
        { success: true, message: 'Webhook validated but skipped', reason: error.message },
        { status: 200 },
      )
    }

    // ✅ CORRIGIDO: Erros reais de processamento devem retornar 500 para Cielo retentar
    // Isso permite que a Cielo saiba que houve um problema e retente o webhook
    return NextResponse.json(
      {
        success: false,
        error: 'Processing error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
