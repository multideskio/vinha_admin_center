/**
 * @fileoverview Hooks para integrar notificações com eventos do sistema
 */

import { NotificationService } from './notifications'
import { db } from '@/db/drizzle'
import { otherSettings, users } from '@/db/schema'
import { eq } from 'drizzle-orm'

// Hook para quando um novo usuário é criado
export async function onUserCreated(userId: string): Promise<void> {
    try {
      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          phone: users.phone,
          companyId: users.companyId,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (!user) return

      const [settings] = await db
        .select()
        .from(otherSettings)
        .where(eq(otherSettings.companyId, user.companyId))
        .limit(1)

      if (!settings) return

      const notificationService = new NotificationService({
        whatsappApiUrl: settings.whatsappApiUrl || undefined,
        whatsappApiKey: settings.whatsappApiKey || undefined,
        whatsappApiInstance: settings.whatsappApiInstance || undefined,
        sesRegion: settings.s3Region || undefined,
        sesAccessKeyId: settings.s3AccessKeyId || undefined,
        sesSecretAccessKey: settings.s3SecretAccessKey || undefined,
        fromEmail: settings.smtpFrom || undefined,
        companyId: user.companyId,
      })

      // Enviar boas-vindas após 5 minutos (para dar tempo do usuário completar o cadastro)
      setTimeout(async () => {
        await notificationService.sendWelcome(
          userId,
          'Novo Membro',
          'Nossa Igreja',
          user.phone || undefined,
          user.email || undefined
        )
      }, 5 * 60 * 1000)

    } catch (error) {
      console.error('Error in onUserCreated hook:', error)
    }
  }

// Hook para quando uma transação é criada
export async function onTransactionCreated(transactionId: string): Promise<void> {
  // Implementar lógica para notificar sobre nova transação
  console.log(`Transaction created: ${transactionId}`)
}

// Hook para quando uma transação falha
export async function onTransactionFailed(transactionId: string): Promise<void> {
  // Implementar lógica para notificar sobre falha na transação
  console.log(`Transaction failed: ${transactionId}`)
}

// Função utilitária para testar notificações
export async function testNotifications(companyId: string): Promise<void> {
  const [settings] = await db
    .select()
    .from(otherSettings)
    .where(eq(otherSettings.companyId, companyId))
    .limit(1)

  if (!settings) {
    console.error('Company settings not found')
    return
  }

  const notificationService = new NotificationService({
    whatsappApiUrl: settings.whatsappApiUrl || undefined,
    whatsappApiKey: settings.whatsappApiKey || undefined,
    whatsappApiInstance: settings.whatsappApiInstance || undefined,
    sesRegion: settings.s3Region || undefined,
    sesAccessKeyId: settings.s3AccessKeyId || undefined,
    sesSecretAccessKey: settings.s3SecretAccessKey || undefined,
    fromEmail: settings.smtpFrom || undefined,
    companyId: companyId,
  })

  // Teste de boas-vindas
  console.log('Testing welcome notification...')
  const welcomeResult = await notificationService.sendWelcome(
    'Teste Usuario',
    'Igreja Teste',
    '5511999999999', // Número de teste
    'teste@exemplo.com'
  )
  console.log('Welcome result:', welcomeResult)

  // Teste de lembrete de pagamento
  console.log('Testing payment reminder...')
  const reminderResult = await notificationService.sendPaymentReminder(
    'Teste Usuario',
    '100,00',
    '15/01/2024',
    '5511999999999',
    'teste@exemplo.com'
  )
  console.log('Reminder result:', reminderResult)
}