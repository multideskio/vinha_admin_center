import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { transactions, users, userNotificationSettings, companies } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { sendEmail } from '@/lib/email'
import { createTransactionReceiptEmail } from '@/lib/email-templates'
import { logCieloWebhook } from '@/lib/cielo-logger'
import { env } from '@/lib/env'

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

    console.log('[CIELO_WEBHOOK] Received:', JSON.stringify(body, null, 2))

    // Registrar webhook recebido
    await logCieloWebhook({
      paymentId: body.PaymentId,
      requestBody: body,
    })

    const { PaymentId, ChangeType } = body

    // ✅ CORRIGIDO: Validação da Cielo - throw ValidationError para retornar 200
    if (!PaymentId) {
      console.log('[CIELO_WEBHOOK] Validation request - no PaymentId')
      throw new ValidationError('Validation request - no PaymentId')
    }

    // Buscar transação por gatewayTransactionId
    let [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.gatewayTransactionId, PaymentId))
      .limit(1)

    // Se não encontrar, tenta buscar por ID direto (fallback)
    if (!transaction) {
      console.log('[CIELO_WEBHOOK] Not found by gatewayTransactionId, trying by ID')
      ;[transaction] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, PaymentId))
        .limit(1)
    }

    // ✅ CORRIGIDO: Throw ValidationError se transação não existir (validação da Cielo)
    if (!transaction) {
      console.log('[CIELO_WEBHOOK] Transaction not found:', PaymentId)
      throw new ValidationError(`Transaction not found: ${PaymentId}`)
    }

    console.log('[CIELO_WEBHOOK] Transaction found:', {
      id: transaction.id,
      gatewayTransactionId: transaction.gatewayTransactionId,
      currentStatus: transaction.status,
    })

    console.log(
      '[CIELO_WEBHOOK] Processing transaction:',
      transaction.id,
      'ChangeType:',
      ChangeType,
    )

    // Mapear status Cielo para nosso status
    let newStatus: 'approved' | 'pending' | 'refused' | 'refunded' = transaction.status

    switch (ChangeType) {
      case 1: // Payment status changed
      case 3: {
        // Recurrence created
        // Consultar status atual na Cielo
        const { queryPayment } = await import('@/lib/cielo')
        const paymentData = await queryPayment(PaymentId)
        const cieloStatus = paymentData.Payment?.Status

        console.log('[CIELO_WEBHOOK] Cielo status:', cieloStatus)

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
          console.error('[CIELO_WEBHOOK] Error querying antifraud status:', error)
        }
        break

      case 5: // Recurrence deactivated
      case 6: // Chargeback
        newStatus = 'refunded'
        break

      default:
        console.log('[CIELO_WEBHOOK] Unknown ChangeType:', ChangeType)
    }

    // Atualizar transação se status mudou
    if (newStatus !== transaction.status) {
      await db
        .update(transactions)
        .set({ status: newStatus })
        .where(eq(transactions.id, transaction.id))

      console.log(`Transaction ${transaction.id} updated: ${transaction.status} -> ${newStatus}`)

      // Enviar email de comprovante se aprovado
      if (newStatus === 'approved') {
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

              console.log(`Receipt email sent to ${user.email} for transaction ${transaction.id}`)
            }
          }
        } catch (emailError) {
          console.error('Error sending receipt email:', emailError)
          // Não falha o webhook se o email falhar
        }
      }
    }

    return NextResponse.json({ success: true, status: newStatus }, { status: 200 })
  } catch (error) {
    console.error('[CIELO_WEBHOOK] Error:', error)

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
