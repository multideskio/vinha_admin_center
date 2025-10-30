/**
 * @fileoverview Hooks para integrar notificações com eventos do sistema
 */

import { NotificationService } from './notifications'
import { db } from '@/db/drizzle'
import { otherSettings, users, transactions, notificationRules } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { notificationQueue } from './queues';

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
  // Busca transação e usuário
  try {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .limit(1)
    if (!transaction) return

    // Busca usuário doador
    const [user] = await db.select().from(users).where(eq(users.id, transaction.contributorId)).limit(1)
    if (!user) return

    // Busca settings da empresa
    const [settings] = await db
      .select()
      .from(otherSettings)
      .where(eq(otherSettings.companyId, transaction.companyId))
      .limit(1)
    if (!settings) return

    // Só notifica se transação aprovada
    if (transaction.status !== 'approved') return

    // Prepara notification service
    const notificationService = new NotificationService({
      whatsappApiUrl: settings.whatsappApiUrl || undefined,
      whatsappApiKey: settings.whatsappApiKey || undefined,
      whatsappApiInstance: settings.whatsappApiInstance || undefined,
      sesRegion: settings.s3Region || undefined,
      sesAccessKeyId: settings.s3AccessKeyId || undefined,
      sesSecretAccessKey: settings.s3SecretAccessKey || undefined,
      fromEmail: settings.smtpFrom || undefined,
      companyId: transaction.companyId,
    })
    // Dados para templates
    const amount = String(transaction.amount)
    const name = user.email.split('@')[0] || 'Membro'
    const paidAt = new Date(transaction.createdAt).toLocaleString('pt-BR')

    await notificationService.sendPaymentReceived(
      user.id,
      name,
      amount,
      paidAt,
      user.phone || undefined,
      user.email || undefined,
    )
  } catch (e) {
    console.error('Erro ao disparar notificação de transação:', e)
  }
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

// Central Notification Event Processor
export async function processNotificationEvent(eventType: string, data: Record<string, any>): Promise<void> {
  // eventType: Ex: 'user_registered', 'payment_received', etc
  // data: userId, amount, transactionId, email, phone, etc
  try {
    const userId = data.userId
    if (!userId) return
    // Busca usuário e settings
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!user) return
    const [settings] = await db.select().from(otherSettings).where(eq(otherSettings.companyId, user.companyId)).limit(1)
    if (!settings) return
    // Busca regras ativas para o evento
    const activeRules = await db
      .select()
      .from(notificationRules)
      .where(and(eq(notificationRules.isActive, true), eq(notificationRules.eventTrigger, eventType as any)))
    for (const rule of activeRules) {
      // Monta mensagem a partir do template da regra (substitui variáveis)
      let variables: Record<string, string> = {
        nome_usuario: user.email.split('@')[0] || '',
        ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      }
      let message = rule.messageTemplate
      message = message.replace(/\{(\w+)\}/g, (_, key) => variables[key] || `{${key}}`)
      // Usa serviço central (envia preferencial/dos dados)
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
      // Email
      if (rule.sendViaEmail && user.email)
        await notificationService.sendEmail({
          to: user.email,
          subject: eventType.replace('_', ' ').toUpperCase(),
          html: `<p>${message}</p>`,
        })
      // WhatsApp
      if (rule.sendViaWhatsapp && user.phone)
        await notificationService.sendWhatsApp({ phone: user.phone, message })
    }
  } catch (err) {
    console.error('Erro no processNotificationEvent:', err)
  }
}

// Producer: Enfileira job de notificação
export async function addNotificationJob(eventType: string, data: Record<string, any>) {
  await notificationQueue.add('send', { eventType, data })
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