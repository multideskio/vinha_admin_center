/**
 * @fileoverview Hooks para integrar notificações com eventos do sistema
 */

import { NotificationService } from './notifications'
import { db } from '@/db/drizzle'
import { otherSettings, users, transactions, notificationRules } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { notificationQueue } from './queues'
import { shouldSendNotificationWithConfig } from './notification-dedup'
import { logger } from './logger'

// Hook para quando um novo usuário é criado
export async function onUserCreated(userId: string): Promise<void> {
  try {
    // Configurar contexto do logger
    logger.setContext({
      userId,
      operation: 'onUserCreated',
    })

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

    if (!user) {
      logger.warn('Usuário não encontrado para envio de boas-vindas', { userId })
      logger.clearContext()
      return
    }

    // ✅ DEDUPLICAÇÃO: Verificar se notificação de boas-vindas já foi enviada
    const shouldSend = await shouldSendNotificationWithConfig(userId, 'welcome_email')

    if (!shouldSend) {
      logger.warn('Notificação de boas-vindas duplicada bloqueada', {
        userId,
        notificationType: 'welcome_email',
      })
      logger.clearContext()
      return
    }

    const [settings] = await db
      .select()
      .from(otherSettings)
      .where(eq(otherSettings.companyId, user.companyId))
      .limit(1)

    if (!settings) {
      logger.warn('Configurações da empresa não encontradas', {
        userId,
        companyId: user.companyId,
      })
      logger.clearContext()
      return
    }

    const notificationService = new NotificationService({
      whatsappApiUrl: settings.whatsappApiUrl || undefined,
      whatsappApiKey: settings.whatsappApiKey || undefined,
      whatsappApiInstance: settings.whatsappApiInstance || undefined,
      sesRegion: 'us-east-1', // ✅ CORRIGIDO: SES region fixa
      sesAccessKeyId: settings.smtpUser || undefined, // ✅ CORRIGIDO: Usar credenciais SES, não S3
      sesSecretAccessKey: settings.smtpPass || undefined, // ✅ CORRIGIDO: Usar credenciais SES, não S3
      fromEmail: settings.smtpFrom || undefined,
      companyId: user.companyId,
    })

    // Enviar boas-vindas após 5 minutos (para dar tempo do usuário completar o cadastro)
    setTimeout(
      async () => {
        await notificationService.sendWelcome(
          userId,
          'Novo Membro',
          'Nossa Igreja',
          user.phone || undefined,
          user.email || undefined,
        )

        logger.info('Notificação de boas-vindas enviada com sucesso', {
          userId,
        })
      },
      5 * 60 * 1000,
    )

    logger.clearContext()
  } catch (error) {
    logger.error('Erro ao disparar notificação de boas-vindas', error, {
      userId,
    })
    logger.clearContext()
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
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, transaction.contributorId))
      .limit(1)
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

    // ✅ DEDUPLICAÇÃO: Verificar se notificação já foi enviada
    logger.setContext({
      userId: user.id,
      transactionId: transaction.id,
      operation: 'onTransactionCreated',
    })

    const shouldSend = await shouldSendNotificationWithConfig(user.id, 'payment_confirmation')

    if (!shouldSend) {
      logger.warn('Notificação de pagamento duplicada bloqueada', {
        userId: user.id,
        transactionId: transaction.id,
        notificationType: 'payment_confirmation',
      })
      logger.clearContext()
      return
    }

    // Prepara notification service
    const notificationService = new NotificationService({
      whatsappApiUrl: settings.whatsappApiUrl || undefined,
      whatsappApiKey: settings.whatsappApiKey || undefined,
      whatsappApiInstance: settings.whatsappApiInstance || undefined,
      sesRegion: 'us-east-1', // ✅ CORRIGIDO: SES region fixa
      sesAccessKeyId: settings.smtpUser || undefined, // ✅ CORRIGIDO: Usar credenciais SES, não S3
      sesSecretAccessKey: settings.smtpPass || undefined, // ✅ CORRIGIDO: Usar credenciais SES, não S3
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

    logger.info('Notificação de pagamento enviada com sucesso', {
      userId: user.id,
      transactionId: transaction.id,
      amount,
    })

    logger.clearContext()
  } catch (e) {
    logger.error('Erro ao disparar notificação de transação', e, {
      transactionId,
    })
    logger.clearContext()
  }
}

// Hook para quando uma transação falha
export async function onTransactionFailed(transactionId: string): Promise<void> {
  try {
    // Configurar contexto do logger
    logger.setContext({
      transactionId,
      operation: 'onTransactionFailed',
    })

    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .limit(1)

    if (!transaction) {
      logger.warn('Transação não encontrada para notificação de falha', { transactionId })
      logger.clearContext()
      return
    }

    // Buscar usuário
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, transaction.contributorId))
      .limit(1)

    if (!user) {
      logger.warn('Usuário não encontrado para notificação de falha', {
        transactionId,
        contributorId: transaction.contributorId,
      })
      logger.clearContext()
      return
    }

    // ✅ DEDUPLICAÇÃO: Verificar se notificação de falha já foi enviada
    const shouldSend = await shouldSendNotificationWithConfig(user.id, 'payment_failed')

    if (!shouldSend) {
      logger.warn('Notificação de falha de pagamento duplicada bloqueada', {
        userId: user.id,
        transactionId,
        notificationType: 'payment_failed',
      })
      logger.clearContext()
      return
    }

    // Buscar configurações da empresa
    const [settings] = await db
      .select()
      .from(otherSettings)
      .where(eq(otherSettings.companyId, transaction.companyId))
      .limit(1)

    if (!settings) {
      logger.warn('Configurações da empresa não encontradas', {
        transactionId,
        companyId: transaction.companyId,
      })
      logger.clearContext()
      return
    }

    // Preparar serviço de notificação
    const notificationService = new NotificationService({
      whatsappApiUrl: settings.whatsappApiUrl || undefined,
      whatsappApiKey: settings.whatsappApiKey || undefined,
      whatsappApiInstance: settings.whatsappApiInstance || undefined,
      sesRegion: 'us-east-1',
      sesAccessKeyId: settings.smtpUser || undefined,
      sesSecretAccessKey: settings.smtpPass || undefined,
      fromEmail: settings.smtpFrom || undefined,
      companyId: transaction.companyId,
    })

    // Dados para notificação
    const amount = String(transaction.amount)
    const name = user.email.split('@')[0] || 'Membro'

    // Enviar notificação de falha via email genérico
    // TODO: Implementar método específico sendPaymentFailed no NotificationService
    if (user.email) {
      await notificationService.sendEmail({
        to: user.email,
        subject: 'Falha no Processamento do Pagamento',
        html: `
          <p>Olá ${name},</p>
          <p>Infelizmente, não conseguimos processar seu pagamento de R$ ${amount}.</p>
          <p>Por favor, verifique seus dados de pagamento e tente novamente.</p>
          <p>Se o problema persistir, entre em contato conosco.</p>
        `,
      })
    }

    logger.info('Notificação de falha de pagamento enviada com sucesso', {
      userId: user.id,
      transactionId,
      amount,
    })

    logger.clearContext()
  } catch (error) {
    logger.error('Erro ao disparar notificação de falha de transação', error, {
      transactionId,
    })
    logger.clearContext()
  }
}

// Hook para quando um usuário é excluído
export async function onUserDeleted(
  userId: string,
  deletionReason: string,
  deletedByUserId: string,
): Promise<void> {
  try {
    // Configurar contexto do logger
    logger.setContext({
      userId,
      operation: 'onUserDeleted',
    })

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

    if (!user) {
      logger.warn('Usuário não encontrado para notificação de exclusão', { userId })
      logger.clearContext()
      return
    }

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

    if (!settings || !deletedByUser) {
      logger.warn('Configurações ou usuário deletor não encontrados', {
        userId,
        deletedByUserId,
        companyId: user.companyId,
      })
      logger.clearContext()
      return
    }

    // ✅ DEDUPLICAÇÃO: Verificar se notificação de exclusão já foi enviada
    // Usar deletedByUserId como chave para evitar múltiplas notificações ao admin
    const shouldSend = await shouldSendNotificationWithConfig(
      deletedByUserId,
      'account_deleted_notification',
    )

    if (!shouldSend) {
      logger.warn('Notificação de exclusão de usuário duplicada bloqueada', {
        userId,
        deletedByUserId,
        notificationType: 'account_deleted_notification',
      })
      logger.clearContext()
      return
    }

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
        companyId: user.companyId,
        sesRegion: 'us-east-1', // ✅ CORRIGIDO: SES region fixa
        sesAccessKeyId: settings.smtpUser || undefined, // ✅ CORRIGIDO: Usar credenciais SES, não S3
        sesSecretAccessKey: settings.smtpPass || undefined, // ✅ CORRIGIDO: Usar credenciais SES, não S3
        fromEmail: settings.smtpFrom || undefined,
        // SMTP config
        smtpHost: settings.smtpHost || undefined,
        smtpPort: settings.smtpPort || undefined,
        smtpUser: settings.smtpUser || undefined,
        smtpPass: settings.smtpPass || undefined,
        smtpFrom: settings.smtpFrom || undefined,
      })

      await emailService.sendEmail({
        to: deletedByUser.email,
        subject,
        html: message.replace(/\n/g, '<br>'),
      })

      logger.info('Notificação de exclusão de usuário enviada com sucesso', {
        userId,
        deletedByUserId,
        deletedByEmail: deletedByUser.email,
      })
    }

    logger.clearContext()
  } catch (error) {
    logger.error('Erro ao disparar notificação de exclusão de usuário', error, {
      userId,
      deletedByUserId,
    })
    logger.clearContext()
  }
}

// Central Notification Event Processor
export async function processNotificationEvent(
  eventType: string,
  data: Record<string, unknown>,
): Promise<void> {
  // eventType: Ex: 'user_registered', 'payment_received', etc
  // data: userId, amount, transactionId, email, phone, etc
  try {
    const userId = data.userId
    if (!userId || typeof userId !== 'string') return

    // Configurar contexto do logger
    logger.setContext({
      userId,
      operation: 'processNotificationEvent',
    })

    // Busca usuário e settings
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!user) {
      logger.warn('Usuário não encontrado para processamento de notificação', { userId })
      logger.clearContext()
      return
    }

    const [settings] = await db
      .select()
      .from(otherSettings)
      .where(eq(otherSettings.companyId, user.companyId))
      .limit(1)
    if (!settings) {
      logger.warn('Configurações da empresa não encontradas', {
        userId,
        companyId: user.companyId,
      })
      logger.clearContext()
      return
    }

    // ✅ DEDUPLICAÇÃO: Verificar se notificação já foi enviada
    // Mapear eventType para notificationType
    const notificationTypeMap: Record<string, string> = {
      user_registered: 'welcome_email',
      payment_received: 'payment_confirmation',
      payment_due_reminder: 'tithe_reminder',
      payment_overdue: 'tithe_due_soon',
    }

    const notificationType = notificationTypeMap[eventType] || eventType

    const shouldSend = await shouldSendNotificationWithConfig(userId, notificationType)

    if (!shouldSend) {
      logger.warn('Notificação de evento duplicada bloqueada', {
        userId,
        eventType,
        notificationType,
      })
      logger.clearContext()
      return
    }

    // Busca regras ativas para o evento
    const activeRules = await db
      .select()
      .from(notificationRules)
      .where(
        and(
          eq(notificationRules.isActive, true),
          eq(
            notificationRules.eventTrigger,
            eventType as
              | 'user_registered'
              | 'payment_received'
              | 'payment_due_reminder'
              | 'payment_overdue',
          ),
        ),
      )

    if (activeRules.length === 0) {
      logger.info('Nenhuma regra ativa encontrada para o evento', { eventType })
      logger.clearContext()
      return
    }

    // ✅ OTIMIZADO: Criar NotificationService uma vez fora do loop (mesmos params para todas as regras)
    const notificationService = new NotificationService({
      whatsappApiUrl: settings.whatsappApiUrl || undefined,
      whatsappApiKey: settings.whatsappApiKey || undefined,
      whatsappApiInstance: settings.whatsappApiInstance || undefined,
      sesRegion: 'us-east-1',
      sesAccessKeyId: settings.smtpUser || undefined,
      sesSecretAccessKey: settings.smtpPass || undefined,
      fromEmail: settings.smtpFrom || undefined,
      companyId: user.companyId,
    })

    for (const rule of activeRules) {
      // Monta mensagem a partir do template da regra (substitui variáveis)
      const variables: Record<string, string> = {
        nome_usuario: user.email.split('@')[0] || '',
        ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      }
      let message = rule.messageTemplate
      message = message.replace(/\{(\w+)\}/g, (_, key) => variables[key] || `{${key}}`)

      // Email
      if (rule.sendViaEmail && user.email) {
        await notificationService.sendEmail({
          to: user.email,
          subject: eventType.replace('_', ' ').toUpperCase(),
          html: `<p>${message}</p>`,
        })
        logger.info('Email enviado via regra de notificação', {
          userId,
          eventType,
          ruleId: rule.id,
        })
      }
      // WhatsApp
      if (rule.sendViaWhatsapp && user.phone) {
        await notificationService.sendWhatsApp({ phone: user.phone, message })
        logger.info('WhatsApp enviado via regra de notificação', {
          userId,
          eventType,
          ruleId: rule.id,
        })
      }
    }

    logger.info('Processamento de evento de notificação concluído', {
      userId,
      eventType,
      rulesProcessed: activeRules.length,
    })

    logger.clearContext()
  } catch (err) {
    logger.error('Erro no processNotificationEvent', err, {
      eventType,
      data,
    })
    logger.clearContext()
  }
}

// Producer: Enfileira job de notificação
export async function addNotificationJob(eventType: string, data: Record<string, unknown>) {
  if (!notificationQueue) {
    console.error(
      '[NOTIFICATION_QUEUE] Fila indisponível — Redis não conectado. Job descartado:',
      eventType,
    )
    return
  }
  await notificationQueue.add('send', { eventType, data })
}

// Função utilitária para testar notificações (apenas em desenvolvimento)
export async function testNotifications(companyId: string): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    console.warn('testNotifications não deve ser chamada em produção')
    return
  }

  const [settings] = await db
    .select()
    .from(otherSettings)
    .where(eq(otherSettings.companyId, companyId))
    .limit(1)

  if (!settings) {
    logger.error('Company settings not found', undefined, { companyId })
    return
  }

  const notificationService = new NotificationService({
    whatsappApiUrl: settings.whatsappApiUrl || undefined,
    whatsappApiKey: settings.whatsappApiKey || undefined,
    whatsappApiInstance: settings.whatsappApiInstance || undefined,
    sesRegion: 'us-east-1', // ✅ CORRIGIDO: SES region fixa
    sesAccessKeyId: settings.smtpUser || undefined, // ✅ CORRIGIDO: Usar credenciais SES, não S3
    sesSecretAccessKey: settings.smtpPass || undefined, // ✅ CORRIGIDO: Usar credenciais SES, não S3
    fromEmail: settings.smtpFrom || undefined,
    companyId: companyId,
  })

  // Teste de boas-vindas
  logger.info('Testing welcome notification...', { companyId })
  const welcomeResult = await notificationService.sendWelcome(
    'Teste Usuario',
    'Igreja Teste',
    '5511999999999', // Número de teste
    'teste@exemplo.com',
  )
  logger.info('Welcome result:', { success: !!welcomeResult })

  // Teste de lembrete de pagamento
  logger.info('Testing payment reminder...', { companyId })
  const reminderResult = await notificationService.sendPaymentReminder(
    'Teste Usuario',
    '100,00',
    '15/01/2024',
    '5511999999999',
    'teste@exemplo.com',
  )
  logger.info('Reminder result:', { success: !!reminderResult })
}
