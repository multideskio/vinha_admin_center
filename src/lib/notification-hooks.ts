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

// Hook para quando um usuário é excluído
export async function onUserDeleted(userId: string, deletionReason: string, deletedByUserId: string): Promise<void> {
  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        phone: users.phone,
        companyId: users.companyId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) return

    const [deletedByUser] = await db
      .select({
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, deletedByUserId))
      .limit(1)

    const [settings] = await db
      .select()
      .from(otherSettings)
      .where(eq(otherSettings.companyId, user.companyId))
      .limit(1)

    if (!settings || !deletedByUser) return

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

    // Notificar administradores sobre a exclusão
    const subject = `Usuário ${user.role} excluído do sistema`
    const message = `
      Um usuário foi excluído do sistema:
      
      ID: ${userId}
      Tipo: ${user.role}
      Email: ${user.email}
      Motivo: ${deletionReason}
      Excluído por: ${deletedByUser.email}
      Data: ${new Date().toLocaleString('pt-BR')}
    `

    // Enviar notificação por email para o administrador que fez a exclusão
    if (deletedByUser.email) {
      const emailService = new (await import('./notifications')).EmailService({
        sesRegion: settings.s3Region || undefined,
        sesAccessKeyId: settings.s3AccessKeyId || undefined,
        sesSecretAccessKey: settings.s3SecretAccessKey || undefined,
        fromEmail: settings.smtpFrom || undefined,
      })
      
      await emailService.sendEmail({
        to: deletedByUser.email,
        subject,
        html: message.replace(/\n/g, '<br>'),
      })
    }

    console.log(`User deletion notification sent for user ${userId}`)
  } catch (error) {
    console.error('Error in onUserDeleted hook:', error)
  }
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