import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { db } from '@/db/drizzle'
import { otherSettings, emailBlacklist, notificationLogs } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { env } from '@/lib/env'

const COMPANY_ID = env.COMPANY_INIT

export async function sendEmail({
  to,
  subject,
  html,
  userId,
  notificationType = 'general',
}: {
  to: string
  subject: string
  html: string
  userId?: string
  notificationType?: string
}) {
  // Verificar blacklist
  const [blacklisted] = await db
    .select()
    .from(emailBlacklist)
    .where(
      and(
        eq(emailBlacklist.companyId, COMPANY_ID),
        eq(emailBlacklist.email, to),
        eq(emailBlacklist.isActive, true),
      ),
    )
    .limit(1)

  if (blacklisted) {
    const error = `Email bloqueado: ${blacklisted.reason}`
    if (userId) {
      await logEmail(
        userId,
        to,
        subject,
        html,
        false,
        error,
        blacklisted.errorCode || 'BLACKLISTED',
        notificationType,
      )
    }
    throw new Error(error)
  }

  const [settings] = await db
    .select()
    .from(otherSettings)
    .where(eq(otherSettings.companyId, COMPANY_ID))
    .limit(1)

  if (!settings?.smtpUser || !settings?.smtpPass) {
    throw new Error('Configurações AWS SES não encontradas')
  }

  const sesClient = new SESClient({
    region: 'us-east-1',
    credentials: {
      accessKeyId: settings.smtpUser,
      secretAccessKey: settings.smtpPass,
    },
  })

  const fromAddress = settings.smtpFrom || 'contato@multidesk.io'

  const command = new SendEmailCommand({
    Source: fromAddress,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: html,
          Charset: 'UTF-8',
        },
      },
    },
  })

  try {
    await sesClient.send(command)
    if (userId) {
      await logEmail(userId, to, subject, html, true, undefined, undefined, notificationType)
    }
  } catch (error: unknown) {
    const errorObj = error as { name?: string; Code?: string; message?: string }
    const errorCode = errorObj.name || errorObj.Code || 'UNKNOWN'
    const errorMessage = errorObj.message || String(error)

    // Adicionar à blacklist se for erro permanente
    if (shouldBlacklist(errorCode)) {
      await addToBlacklist(to, errorCode, errorMessage)
    }

    if (userId) {
      await logEmail(userId, to, subject, html, false, errorMessage, errorCode, notificationType)
    }
    throw error
  }
}

function shouldBlacklist(errorCode: string): boolean {
  const permanentErrors = [
    'MessageRejected',
    'MailFromDomainNotVerified',
    'InvalidParameterValue',
    'AccountSendingPausedException',
  ]
  return (
    permanentErrors.includes(errorCode) ||
    errorCode.includes('Bounce') ||
    errorCode.includes('Complaint')
  )
}

async function addToBlacklist(email: string, errorCode: string, errorMessage: string) {
  try {
    const [existing] = await db
      .select()
      .from(emailBlacklist)
      .where(and(eq(emailBlacklist.companyId, COMPANY_ID), eq(emailBlacklist.email, email)))
      .limit(1)

    if (existing) {
      await db
        .update(emailBlacklist)
        .set({
          lastAttemptAt: new Date(),
          attemptCount: existing.attemptCount + 1,
          errorCode,
          errorMessage,
          isActive: true,
        })
        .where(eq(emailBlacklist.id, existing.id))
    } else {
      await db.insert(emailBlacklist).values({
        companyId: COMPANY_ID,
        email,
        reason: errorCode.includes('Bounce')
          ? 'bounce'
          : errorCode.includes('Complaint')
            ? 'complaint'
            : 'error',
        errorCode,
        errorMessage,
      })
    }
  } catch (error) {
    console.error('Erro ao adicionar email à blacklist:', error)
  }
}

async function logEmail(
  userId: string,
  recipient: string,
  subject: string,
  content: string,
  success: boolean,
  errorMessage?: string,
  errorCode?: string,
  notificationType?: string,
) {
  try {
    await db.insert(notificationLogs).values({
      companyId: COMPANY_ID,
      userId,
      notificationType: notificationType || 'general',
      channel: 'email',
      status: success ? 'sent' : 'failed',
      recipient,
      subject,
      messageContent: content,
      errorMessage,
      errorCode,
    })
  } catch (error) {
    console.error('Erro ao logar email:', error)
  }
}
