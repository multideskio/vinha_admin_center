import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { db } from '@/db/drizzle'
import { otherSettings } from '@/db/schema'
import { eq } from 'drizzle-orm'

const COMPANY_ID = process.env.COMPANY_INIT || ''

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
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

  await sesClient.send(command)
}
