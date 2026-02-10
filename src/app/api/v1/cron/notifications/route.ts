import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { notificationRules, users, transactions, notificationLogs } from '@/db/schema'
import { eq, and, gte, inArray } from 'drizzle-orm'
import { NotificationService } from '@/lib/notifications'
import { rateLimit } from '@/lib/rate-limit'

const CRON_SECRET = process.env.CRON_SECRET || 'change-me-in-production'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
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

  const results = { processed: 0, sent: 0, failed: 0, errors: [] as string[] }

  try {
    const activeRules = await db
      .select()
      .from(notificationRules)
      .where(eq(notificationRules.isActive, true))

    for (const rule of activeRules) {
      results.processed++
      try {
        switch (rule.eventTrigger) {
          case 'user_registered':
            await processNewUsers(rule)
            break
          case 'payment_received':
            await processPayments(rule)
            break
          case 'payment_due_reminder':
            await processReminders(rule)
            break
          case 'payment_overdue':
            await processOverdue(rule)
            break
        }
        results.sent++
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
  }
}

async function processNewUsers(rule: {
  messageTemplate: string
  sendViaEmail: boolean
  sendViaWhatsapp: boolean
}) {
  const recentUsers = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.welcomeSent, false),
        gte(users.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)),
      ),
    )
    .limit(50)

  for (const user of recentUsers) {
    const notificationService = new NotificationService({ companyId: user.companyId })

    // ✅ CORRIGIDO: Usar template configurado da regra
    const variables: Record<string, string> = {
      nome_usuario: user.email.split('@')[0] || 'Membro',
      nome_igreja: 'Nossa Igreja',
      valor_transacao: '0,00',
      data_vencimento: new Date().toLocaleDateString('pt-BR'),
      link_pagamento: `${process.env.NEXT_PUBLIC_APP_URL || ''}/contribuir`,
    }

    let message = rule.messageTemplate
    message = message.replace(/\{(\w+)\}/g, (_, key) => variables[key] || `{${key}}`)

    try {
      // ✅ CORRIGIDO: Enviar via canais configurados
      if (rule.sendViaEmail && user.email) {
        await notificationService.sendEmail({
          to: user.email,
          subject: 'Bem-vindo(a)!',
          html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
        })
      }

      if (rule.sendViaWhatsapp && user.phone) {
        await notificationService.sendWhatsApp({
          phone: user.phone,
          message: message,
        })
      }

      await db.update(users).set({ welcomeSent: true }).where(eq(users.id, user.id))
    } catch (error) {
      console.error(`Failed to send welcome to user ${user.id}:`, error)
    }
  }
}

async function processPayments(rule: {
  messageTemplate: string
  sendViaEmail: boolean
  sendViaWhatsapp: boolean
}) {
  const recentTransactions = await db
    .select({ transaction: transactions, user: users })
    .from(transactions)
    .innerJoin(users, eq(transactions.contributorId, users.id))
    .where(
      and(
        eq(transactions.status, 'approved'),
        gte(transactions.createdAt, new Date(Date.now() - 2 * 60 * 60 * 1000)),
      ),
    )
    .limit(50)

  if (recentTransactions.length === 0) return

  // ✅ OTIMIZADO: Buscar todos os logs de uma vez em vez de query por iteração
  const transactionIds = recentTransactions.map((r) => r.transaction.id)
  const notificationTypes = transactionIds.map((id) => `payment_received_${id}`)
  const existingLogs = await db
    .select({ notificationType: notificationLogs.notificationType })
    .from(notificationLogs)
    .where(inArray(notificationLogs.notificationType, notificationTypes))
  const alreadySentSet = new Set(existingLogs.map((l) => l.notificationType))

  for (const { transaction, user } of recentTransactions) {
    if (alreadySentSet.has(`payment_received_${transaction.id}`)) continue

    const notificationService = new NotificationService({ companyId: user.companyId })

    const variables: Record<string, string> = {
      nome_usuario: user.email.split('@')[0] || 'Membro',
      nome_igreja: 'Nossa Igreja',
      valor_transacao: String(transaction.amount),
      data_pagamento: new Date(transaction.createdAt).toLocaleDateString('pt-BR'),
      data_vencimento: new Date(transaction.createdAt).toLocaleDateString('pt-BR'),
      link_pagamento: `${process.env.NEXT_PUBLIC_APP_URL || ''}/contribuir`,
    }

    let message = rule.messageTemplate
    message = message.replace(/\{(\w+)\}/g, (_, key) => variables[key] || `{${key}}`)

    try {
      if (rule.sendViaEmail && user.email) {
        await notificationService.sendEmail({
          to: user.email,
          subject: 'Pagamento Confirmado',
          html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
        })
      }

      if (rule.sendViaWhatsapp && user.phone) {
        await notificationService.sendWhatsApp({
          phone: user.phone,
          message: message,
        })
      }

      await db.insert(notificationLogs).values({
        companyId: user.companyId,
        userId: user.id,
        notificationType: `payment_received_${transaction.id}`,
        channel: rule.sendViaWhatsapp ? 'whatsapp' : 'email',
        status: 'sent',
        messageContent: message,
      })
    } catch (error) {
      console.error(`Failed to send payment notification:`, error)
    }
  }
}

async function processReminders(rule: {
  id: string
  messageTemplate: string
  sendViaEmail: boolean
  sendViaWhatsapp: boolean
  daysOffset: number
}) {
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + rule.daysOffset)
  const today = new Date().toISOString().split('T')[0]

  const usersToRemind = await db
    .select()
    .from(users)
    .where(and(eq(users.titheDay, targetDate.getDate()), eq(users.status, 'active')))
    .limit(100)

  if (usersToRemind.length === 0) return

  // ✅ OTIMIZADO: Buscar todos os logs de uma vez em vez de query por iteração
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

  for (const user of usersToRemind) {
    if (alreadySentSet.has(user.id)) continue

    const notificationService = new NotificationService({ companyId: user.companyId })
    const dueDate = targetDate.toLocaleDateString('pt-BR')
    const name = user.email.split('@')[0] || 'Membro'
    const amount = '100,00'

    const variables: Record<string, string> = {
      nome_usuario: name,
      valor_transacao: amount,
      data_vencimento: dueDate,
      link_pagamento: `${process.env.NEXT_PUBLIC_APP_URL || ''}/contribuir`,
      nome_igreja: 'Nossa Igreja',
    }

    let message = rule.messageTemplate
    message = message.replace(/\{(\w+)\}/g, (_, key) => variables[key] || `{${key}}`)

    try {
      if (rule.sendViaEmail && user.email) {
        await notificationService.sendEmail({
          to: user.email,
          subject: `Lembrete: Vencimento em ${dueDate}`,
          html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
        })
      }

      if (rule.sendViaWhatsapp && user.phone) {
        await notificationService.sendWhatsApp({
          phone: user.phone,
          message: message,
        })
      }

      await db.insert(notificationLogs).values({
        companyId: user.companyId,
        userId: user.id,
        notificationType,
        channel: rule.sendViaWhatsapp ? 'whatsapp' : 'email',
        status: 'sent',
        messageContent: message,
      })
    } catch (error) {
      console.error(`Failed to send reminder:`, error)
    }
  }
}

async function processOverdue(rule: {
  id: string
  messageTemplate: string
  sendViaEmail: boolean
  sendViaWhatsapp: boolean
  daysOffset: number
}) {
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() - rule.daysOffset)
  const today = new Date().toISOString().split('T')[0]

  const overdueUsers = await db
    .select()
    .from(users)
    .where(and(eq(users.titheDay, targetDate.getDate()), eq(users.status, 'active')))
    .limit(100)

  if (overdueUsers.length === 0) return

  // ✅ OTIMIZADO: Buscar todos os logs de uma vez em vez de query por iteração
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

  for (const user of overdueUsers) {
    if (alreadySentSet.has(user.id)) continue

    const notificationService = new NotificationService({ companyId: user.companyId })
    const dueDate = targetDate.toLocaleDateString('pt-BR')
    const name = user.email.split('@')[0] || 'Membro'
    const amount = '100,00'

    const variables: Record<string, string> = {
      nome_usuario: name,
      valor_transacao: amount,
      data_vencimento: dueDate,
      link_pagamento: `${process.env.NEXT_PUBLIC_APP_URL || ''}/contribuir`,
      nome_igreja: 'Nossa Igreja',
    }

    let message = rule.messageTemplate
    message = message.replace(/\{(\w+)\}/g, (_, key) => variables[key] || `{${key}}`)

    try {
      if (rule.sendViaEmail && user.email) {
        await notificationService.sendEmail({
          to: user.email,
          subject: `Aviso: Pagamento em atraso desde ${dueDate}`,
          html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
        })
      }

      if (rule.sendViaWhatsapp && user.phone) {
        await notificationService.sendWhatsApp({
          phone: user.phone,
          message: message,
        })
      }

      await db.insert(notificationLogs).values({
        companyId: user.companyId,
        userId: user.id,
        notificationType,
        channel: rule.sendViaWhatsapp ? 'whatsapp' : 'email',
        status: 'sent',
        messageContent: message,
      })
    } catch (error) {
      console.error(`Failed to send overdue notification:`, error)
    }
  }
}
