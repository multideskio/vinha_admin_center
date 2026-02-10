import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { emailBlacklist, notificationLogs } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import MessageValidator from 'sns-validator'
import { env } from '@/lib/env'

const COMPANY_ID = env.COMPANY_INIT
const companyId: string = COMPANY_ID

const validator = new MessageValidator()

type SNSMessageType = 'SubscriptionConfirmation' | 'Notification'

interface SNSMessage {
  Type: SNSMessageType
  MessageId: string
  Token?: string
  TopicArn: string
  Subject?: string
  Message: string
  Timestamp: string
  SignatureVersion: string
  Signature: string
  SigningCertURL: string
  SubscribeURL?: string
}

interface SESBounce {
  bounceType: 'Permanent' | 'Transient' | 'Undetermined'
  bounceSubType: string
  bouncedRecipients: Array<{
    emailAddress: string
    status?: string
    diagnosticCode?: string
  }>
  timestamp: string
}

interface SESComplaint {
  complainedRecipients: Array<{
    emailAddress: string
  }>
  timestamp: string
  complaintFeedbackType?: string
}

interface SESMessage {
  notificationType: 'Bounce' | 'Complaint' | 'Delivery'
  bounce?: SESBounce
  complaint?: SESComplaint
  mail: {
    messageId: string
    timestamp: string
    source: string
    destination: string[]
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = (await request.json()) as Record<string, unknown>

    // CRÍTICO: Validar assinatura SNS
    try {
      await new Promise((resolve, reject) => {
        validator.validate(rawBody, (error: Error | null) => {
          if (error) {
            reject(error)
          } else {
            resolve(true)
          }
        })
      })
    } catch (validationError) {
      console.error('SNS signature validation failed:', {
        error: validationError instanceof Error ? validationError.message : 'Unknown error',
        messageId: rawBody.MessageId,
      })
      return NextResponse.json({ error: 'Assinatura SNS inválida' }, { status: 403 })
    }

    // Após validação, podemos fazer cast seguro
    const body = rawBody as unknown as SNSMessage

    // Confirmar subscrição SNS
    if (body.Type === 'SubscriptionConfirmation') {
      if (body.SubscribeURL) {
        const snsController = new AbortController()
        const snsTimeoutId = setTimeout(() => snsController.abort(), 5_000)
        try {
          await fetch(body.SubscribeURL, { signal: snsController.signal })
          clearTimeout(snsTimeoutId)
        } catch (fetchError) {
          clearTimeout(snsTimeoutId)
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            console.error('[SNS_TIMEOUT] Timeout ao confirmar subscrição SNS')
            return NextResponse.json(
              { error: 'Timeout ao confirmar subscrição SNS' },
              { status: 504 },
            )
          }
          throw fetchError
        }
        return NextResponse.json({ message: 'Subscription confirmed' })
      }
      return NextResponse.json({ error: 'No SubscribeURL' }, { status: 400 })
    }

    // Processar notificação
    if (body.Type === 'Notification') {
      const message: SESMessage = JSON.parse(body.Message)

      // Processar Bounce
      if (message.notificationType === 'Bounce' && message.bounce) {
        await handleBounce(message.bounce, message.mail.messageId)
      }

      // Processar Complaint
      if (message.notificationType === 'Complaint' && message.complaint) {
        await handleComplaint(message.complaint, message.mail.messageId)
      }

      return NextResponse.json({ message: 'Processed' })
    }

    return NextResponse.json({ error: 'Unknown message type' }, { status: 400 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('SNS webhook error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: errorMessage },
      { status: 500 },
    )
  }
}

async function handleBounce(bounce: SESBounce, messageId: string) {
  try {
    for (const recipient of bounce.bouncedRecipients) {
      const email = recipient.emailAddress.toLowerCase()

      // ✅ CORRIGIDO: Transação atômica por recipient (blacklist + log)
      await db.transaction(async (tx) => {
        // Apenas bounces permanentes vão para blacklist
        if (bounce.bounceType === 'Permanent') {
          const [existing] = await tx
            .select()
            .from(emailBlacklist)
            .where(and(eq(emailBlacklist.companyId, companyId), eq(emailBlacklist.email, email)))
            .limit(1)

          if (existing) {
            await tx
              .update(emailBlacklist)
              .set({
                lastAttemptAt: new Date(),
                attemptCount: existing.attemptCount + 1,
                errorMessage: recipient.diagnosticCode || bounce.bounceSubType,
                isActive: true,
              })
              .where(eq(emailBlacklist.id, existing.id))
          } else {
            await tx.insert(emailBlacklist).values({
              companyId: companyId,
              email,
              reason: 'bounce',
              errorCode: bounce.bounceSubType,
              errorMessage: recipient.diagnosticCode || `Permanent bounce: ${bounce.bounceSubType}`,
              firstFailedAt: new Date(),
              lastAttemptAt: new Date(),
              attemptCount: 1,
              isActive: true,
            })
          }
        }

        // Log da notificação
        await tx.insert(notificationLogs).values({
          companyId: companyId,
          userId: companyId, // Sistema
          notificationType: 'sns_bounce',
          channel: 'email',
          status: 'failed',
          recipient: email,
          subject: `Bounce: ${bounce.bounceType}`,
          messageContent: JSON.stringify({ bounce, messageId }),
          errorMessage: recipient.diagnosticCode || bounce.bounceSubType,
          errorCode: bounce.bounceSubType,
        })
      })
    }
  } catch (error) {
    console.error('Erro ao processar bounce:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      messageId,
      bounceType: bounce.bounceType,
    })
    // Não lançar erro para não afetar outros processamentos
  }
}

async function handleComplaint(complaint: SESComplaint, messageId: string) {
  try {
    for (const recipient of complaint.complainedRecipients) {
      const email = recipient.emailAddress.toLowerCase()

      // ✅ CORRIGIDO: Transação atômica por recipient (blacklist + log)
      await db.transaction(async (tx) => {
        const [existing] = await tx
          .select()
          .from(emailBlacklist)
          .where(and(eq(emailBlacklist.companyId, companyId), eq(emailBlacklist.email, email)))
          .limit(1)

        if (existing) {
          await tx
            .update(emailBlacklist)
            .set({
              lastAttemptAt: new Date(),
              attemptCount: existing.attemptCount + 1,
              reason: 'complaint',
              errorMessage: complaint.complaintFeedbackType || 'User complaint',
              isActive: true,
            })
            .where(eq(emailBlacklist.id, existing.id))
        } else {
          await tx.insert(emailBlacklist).values({
            companyId: companyId,
            email,
            reason: 'complaint',
            errorCode: complaint.complaintFeedbackType || 'abuse',
            errorMessage: `User marked as spam: ${complaint.complaintFeedbackType || 'unknown'}`,
            firstFailedAt: new Date(),
            lastAttemptAt: new Date(),
            attemptCount: 1,
            isActive: true,
          })
        }

        // Log da notificação
        await tx.insert(notificationLogs).values({
          companyId: companyId,
          userId: companyId, // Sistema
          notificationType: 'sns_complaint',
          channel: 'email',
          status: 'failed',
          recipient: email,
          subject: 'Complaint received',
          messageContent: JSON.stringify({ complaint, messageId }),
          errorMessage: complaint.complaintFeedbackType || 'User complaint',
          errorCode: complaint.complaintFeedbackType || 'abuse',
        })
      })
    }
  } catch (error) {
    console.error('Erro ao processar complaint:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      messageId,
    })
    // Não lançar erro para não afetar outros processamentos
  }
}
