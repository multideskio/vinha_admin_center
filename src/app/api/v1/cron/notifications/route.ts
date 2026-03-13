import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import {
  notificationRules,
  users,
  transactions,
  notificationLogs,
  userNotificationSettings,
  companies,
} from '@/db/schema'
import { eq, and, gte, inArray, isNull } from 'drizzle-orm'
import { NotificationService } from '@/lib/notifications'
import { rateLimit } from '@/lib/rate-limit'
import { env } from '@/lib/env'
import { redis } from '@/lib/redis'
import { generatePaymentLink } from '@/lib/payment-token'

const CRON_SECRET = env.CRON_SECRET
const LOCK_KEY = 'cron:v1:notifications:lock'
const LOCK_TTL_SECONDS = 120

// Tipo para preferências de notificação do usuário
type UserPreferences = Map<string, { email: boolean; whatsapp: boolean }>

// Buscar preferências de notificação de múltiplos usuários
async function getUserNotificationPreferences(
  userIds: string[],
  notificationType: 'payment_notifications' | 'due_date_reminders' | 'network_reports',
): Promise<UserPreferences> {
  if (userIds.length === 0) return new Map()

  const settings = await db
    .select({
      userId: userNotificationSettings.userId,
      email: userNotificationSettings.email,
      whatsapp: userNotificationSettings.whatsapp,
    })
    .from(userNotificationSettings)
    .where(
      and(
        inArray(userNotificationSettings.userId, userIds),
        eq(userNotificationSettings.notificationType, notificationType),
      ),
    )

  const prefsMap: UserPreferences = new Map()
  for (const s of settings) {
    prefsMap.set(s.userId, { email: s.email, whatsapp: s.whatsapp })
  }

  return prefsMap
}

// Buscar nome da empresa
async function getCompanyName(companyId: string): Promise<string> {
  const [company] = await db
    .select({ name: companies.name })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1)
  return company?.name || 'Nossa Igreja'
}

export async function GET(request: Request) {
  if (!CRON_SECRET) {
    console.error('[CRON] CRON_SECRET não configurado')
    return NextResponse.json({ error: 'Cron não configurado' }, { status: 503 })
  }

  // Aceitar autenticação via header OU query param (para Uptime Kuma)
  const authHeader = request.headers.get('authorization')
  const url = new URL(request.url)
  const querySecret = url.searchParams.get('secret')

  const isAuthorized = authHeader === `Bearer ${CRON_SECRET}` || querySecret === CRON_SECRET

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const forwardedFor = request.headers.get('x-forwarded-for')
  const ip = forwardedFor?.split(',')[0]?.trim() || 'local'
  const rl = await rateLimit('api:cron:notifications', ip, 2, 60)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Cron executado muitas vezes. Aguarde um minuto.' },
      { status: 429 },
    )
  }

  // Distributed lock via Redis para prevenir execução paralela
  if (redis) {
    const lockAcquired = await redis.set(
      LOCK_KEY,
      Date.now().toString(),
      'EX',
      LOCK_TTL_SECONDS,
      'NX',
    )
    if (!lockAcquired) {
      return NextResponse.json({
        success: true,
        message: 'Cron já em execução por outra instância',
        skipped: true,
      })
    }
  }

  const results = { processed: 0, sent: 0, failed: 0, skipped: 0, errors: [] as string[] }

  try {
    const activeRules = await db
      .select()
      .from(notificationRules)
      .where(eq(notificationRules.isActive, true))

    for (const rule of activeRules) {
      results.processed++
      try {
        let ruleResult = { sent: 0, skipped: 0 }
        switch (rule.eventTrigger) {
          case 'user_registered':
            ruleResult = await processNewUsers(rule)
            break
          case 'payment_received':
            ruleResult = await processPayments(rule)
            break
          case 'payment_due_reminder':
            ruleResult = await processReminders(rule)
            break
          case 'payment_overdue':
            ruleResult = await processOverdue(rule)
            break
        }
        results.sent += ruleResult.sent
        results.skipped += ruleResult.skipped
      } catch (error) {
        results.failed++
        results.errors.push(`${rule.name}: ${error instanceof Error ? error.message : 'Error'}`)
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    return NextResponse.json(
      { error: 'Cron failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 },
    )
  } finally {
    if (redis) {
      await redis.del(LOCK_KEY).catch((err: Error) => {
        console.error('[CRON] Erro ao liberar lock:', err.message)
      })
    }
  }
}

async function processNewUsers(rule: {
  companyId: string
  messageTemplate: string
  sendViaEmail: boolean
  sendViaWhatsapp: boolean
}): Promise<{ sent: number; skipped: number }> {
  let sent = 0
  let skipped = 0

  // Buscar usuários recentes da mesma empresa da regra
  const recentUsers = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.companyId, rule.companyId),
        eq(users.welcomeSent, false),
        eq(users.status, 'active'),
        isNull(users.deletedAt),
        gte(users.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)),
      ),
    )
    .limit(50)

  if (recentUsers.length === 0) return { sent, skipped }

  // Buscar preferências de notificação
  const userIds = recentUsers.map((u) => u.id)
  const prefs = await getUserNotificationPreferences(userIds, 'payment_notifications')
  const companyName = await getCompanyName(rule.companyId)

  for (const user of recentUsers) {
    // Verificar preferências do usuário (padrão: aceita tudo se não configurou)
    const userPrefs = prefs.get(user.id) || { email: true, whatsapp: true }
    const canSendEmail = rule.sendViaEmail && userPrefs.email && user.email
    const canSendWhatsapp = rule.sendViaWhatsapp && userPrefs.whatsapp && user.phone

    if (!canSendEmail && !canSendWhatsapp) {
      skipped++
      continue
    }

    const notificationService = new NotificationService({ companyId: user.companyId })

    const variables: Record<string, string> = {
      nome_usuario: user.email.split('@')[0] || 'Membro',
      nome_igreja: companyName,
      link_pagamento: await generatePaymentLink(user.id, user.companyId),
    }

    let message = rule.messageTemplate
    message = message.replace(/\{(\w+)\}/g, (_, key) => variables[key] || '')

    try {
      if (canSendEmail) {
        await notificationService.sendEmail({
          to: user.email,
          subject: `Bem-vindo(a) à ${companyName}!`,
          html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
        })
      }

      if (canSendWhatsapp) {
        await notificationService.sendWhatsApp({
          phone: user.phone!,
          message: message,
        })
      }

      await db.update(users).set({ welcomeSent: true }).where(eq(users.id, user.id))
      sent++
    } catch (error) {
      console.error(`[CRON] Falha ao enviar boas-vindas para ${user.id}:`, error)
    }
  }

  return { sent, skipped }
}

async function processPayments(rule: {
  companyId: string
  messageTemplate: string
  sendViaEmail: boolean
  sendViaWhatsapp: boolean
}): Promise<{ sent: number; skipped: number }> {
  let sent = 0
  let skipped = 0

  // Buscar transações recentes da empresa da regra
  const recentTransactions = await db
    .select({ transaction: transactions, user: users })
    .from(transactions)
    .innerJoin(users, eq(transactions.contributorId, users.id))
    .where(
      and(
        eq(transactions.companyId, rule.companyId),
        eq(transactions.status, 'approved'),
        isNull(users.deletedAt),
        gte(transactions.createdAt, new Date(Date.now() - 2 * 60 * 60 * 1000)),
      ),
    )
    .limit(50)

  if (recentTransactions.length === 0) return { sent, skipped }

  // Verificar quais já foram notificadas
  const transactionIds = recentTransactions.map((r) => r.transaction.id)
  const notificationTypes = transactionIds.map((id) => `payment_received_${id}`)
  const existingLogs = await db
    .select({ notificationType: notificationLogs.notificationType })
    .from(notificationLogs)
    .where(inArray(notificationLogs.notificationType, notificationTypes))
  const alreadySentSet = new Set(existingLogs.map((l) => l.notificationType))

  // Buscar preferências
  const userIds = recentTransactions.map((r) => r.user.id)
  const prefs = await getUserNotificationPreferences(userIds, 'payment_notifications')
  const companyName = await getCompanyName(rule.companyId)

  for (const { transaction, user } of recentTransactions) {
    if (alreadySentSet.has(`payment_received_${transaction.id}`)) continue

    const userPrefs = prefs.get(user.id) || { email: true, whatsapp: true }
    const canSendEmail = rule.sendViaEmail && userPrefs.email && user.email
    const canSendWhatsapp = rule.sendViaWhatsapp && userPrefs.whatsapp && user.phone

    if (!canSendEmail && !canSendWhatsapp) {
      skipped++
      continue
    }

    const notificationService = new NotificationService({ companyId: user.companyId })

    const variables: Record<string, string> = {
      nome_usuario: user.email.split('@')[0] || 'Membro',
      nome_igreja: companyName,
      valor_transacao: `R$ ${Number(transaction.amount).toFixed(2).replace('.', ',')}`,
      data_pagamento: new Date(transaction.createdAt).toLocaleDateString('pt-BR'),
    }

    let message = rule.messageTemplate
    message = message.replace(/\{(\w+)\}/g, (_, key) => variables[key] || '')

    try {
      if (canSendEmail) {
        await notificationService.sendEmail({
          to: user.email,
          subject: `✅ Pagamento Confirmado - ${companyName}`,
          html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
        })
      }

      if (canSendWhatsapp) {
        await notificationService.sendWhatsApp({ phone: user.phone!, message })
      }

      await db.insert(notificationLogs).values({
        companyId: user.companyId,
        userId: user.id,
        notificationType: `payment_received_${transaction.id}`,
        channel: canSendWhatsapp ? 'whatsapp' : 'email',
        status: 'sent',
        messageContent: message,
      })
      sent++
    } catch (error) {
      console.error(`[CRON] Falha ao enviar confirmação de pagamento:`, error)
    }
  }

  return { sent, skipped }
}

async function processReminders(rule: {
  id: string
  companyId: string
  messageTemplate: string
  sendViaEmail: boolean
  sendViaWhatsapp: boolean
  daysOffset: number
}): Promise<{ sent: number; skipped: number }> {
  let sent = 0
  let skipped = 0

  // Calcular data alvo (X dias no futuro)
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + rule.daysOffset)
  const targetDay = targetDate.getDate()
  const today = new Date().toISOString().split('T')[0]

  // Buscar usuários da empresa com titheDay correspondente
  const usersToRemind = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.companyId, rule.companyId),
        eq(users.titheDay, targetDay),
        eq(users.status, 'active'),
        isNull(users.deletedAt),
      ),
    )
    .limit(100)

  if (usersToRemind.length === 0) return { sent, skipped }

  // Verificar quais já receberam hoje
  const userIds = usersToRemind.map((u) => u.id)
  const notificationType = `reminder_${rule.id}_${today}`
  const existingLogs = await db
    .select({ userId: notificationLogs.userId })
    .from(notificationLogs)
    .where(
      and(
        inArray(notificationLogs.userId, userIds),
        eq(notificationLogs.notificationType, notificationType),
      ),
    )
  const alreadySentSet = new Set(existingLogs.map((l) => l.userId))

  // Buscar preferências (due_date_reminders para lembretes)
  const prefs = await getUserNotificationPreferences(userIds, 'due_date_reminders')
  const companyName = await getCompanyName(rule.companyId)

  for (const user of usersToRemind) {
    if (alreadySentSet.has(user.id)) continue

    // Verificar preferências do usuário
    const userPrefs = prefs.get(user.id) || { email: true, whatsapp: true }
    const canSendEmail = rule.sendViaEmail && userPrefs.email && user.email
    const canSendWhatsapp = rule.sendViaWhatsapp && userPrefs.whatsapp && user.phone

    if (!canSendEmail && !canSendWhatsapp) {
      skipped++
      continue
    }

    const notificationService = new NotificationService({ companyId: user.companyId })
    const dueDate = targetDate.toLocaleDateString('pt-BR')
    const name = user.email.split('@')[0] || 'Membro'

    const variables: Record<string, string> = {
      nome_usuario: name,
      nome_igreja: companyName,
      data_vencimento: dueDate,
      link_pagamento: await generatePaymentLink(user.id, user.companyId),
    }

    let message = rule.messageTemplate
    message = message.replace(/\{(\w+)\}/g, (_, key) => variables[key] || '')

    try {
      if (canSendEmail) {
        await notificationService.sendEmail({
          to: user.email,
          subject: `💰 Lembrete: Vencimento em ${dueDate} - ${companyName}`,
          html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
        })
      }

      if (canSendWhatsapp) {
        await notificationService.sendWhatsApp({ phone: user.phone!, message })
      }

      await db.insert(notificationLogs).values({
        companyId: user.companyId,
        userId: user.id,
        notificationType,
        channel: canSendWhatsapp ? 'whatsapp' : 'email',
        status: 'sent',
        messageContent: message,
      })
      sent++
    } catch (error) {
      console.error(`[CRON] Falha ao enviar lembrete para ${user.id}:`, error)
    }
  }

  return { sent, skipped }
}

async function processOverdue(rule: {
  id: string
  companyId: string
  messageTemplate: string
  sendViaEmail: boolean
  sendViaWhatsapp: boolean
  daysOffset: number
}): Promise<{ sent: number; skipped: number }> {
  let sent = 0
  let skipped = 0

  // Calcular data alvo (X dias no passado)
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() - rule.daysOffset)
  const targetDay = targetDate.getDate()
  const today = new Date().toISOString().split('T')[0]

  // Buscar usuários da empresa com titheDay correspondente (em atraso)
  const overdueUsers = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.companyId, rule.companyId),
        eq(users.titheDay, targetDay),
        eq(users.status, 'active'),
        isNull(users.deletedAt),
      ),
    )
    .limit(100)

  if (overdueUsers.length === 0) return { sent, skipped }

  // Verificar quais já receberam hoje
  const userIds = overdueUsers.map((u) => u.id)
  const notificationType = `overdue_${rule.id}_${today}`
  const existingLogs = await db
    .select({ userId: notificationLogs.userId })
    .from(notificationLogs)
    .where(
      and(
        inArray(notificationLogs.userId, userIds),
        eq(notificationLogs.notificationType, notificationType),
      ),
    )
  const alreadySentSet = new Set(existingLogs.map((l) => l.userId))

  // Buscar preferências
  const prefs = await getUserNotificationPreferences(userIds, 'due_date_reminders')
  const companyName = await getCompanyName(rule.companyId)

  for (const user of overdueUsers) {
    if (alreadySentSet.has(user.id)) continue

    const userPrefs = prefs.get(user.id) || { email: true, whatsapp: true }
    const canSendEmail = rule.sendViaEmail && userPrefs.email && user.email
    const canSendWhatsapp = rule.sendViaWhatsapp && userPrefs.whatsapp && user.phone

    if (!canSendEmail && !canSendWhatsapp) {
      skipped++
      continue
    }

    const notificationService = new NotificationService({ companyId: user.companyId })
    const dueDate = targetDate.toLocaleDateString('pt-BR')
    const name = user.email.split('@')[0] || 'Membro'

    const variables: Record<string, string> = {
      nome_usuario: name,
      nome_igreja: companyName,
      data_vencimento: dueDate,
      link_pagamento: await generatePaymentLink(user.id, user.companyId),
    }

    let message = rule.messageTemplate
    message = message.replace(/\{(\w+)\}/g, (_, key) => variables[key] || '')

    try {
      if (canSendEmail) {
        await notificationService.sendEmail({
          to: user.email,
          subject: `🚨 Aviso: Pagamento em atraso - ${companyName}`,
          html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
        })
      }

      if (canSendWhatsapp) {
        await notificationService.sendWhatsApp({ phone: user.phone!, message })
      }

      await db.insert(notificationLogs).values({
        companyId: user.companyId,
        userId: user.id,
        notificationType,
        channel: canSendWhatsapp ? 'whatsapp' : 'email',
        status: 'sent',
        messageContent: message,
      })
      sent++
    } catch (error) {
      console.error(`[CRON] Falha ao enviar aviso de atraso para ${user.id}:`, error)
    }
  }

  return { sent, skipped }
}
