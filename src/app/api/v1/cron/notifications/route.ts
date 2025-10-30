import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { notificationRules, users, transactions, notificationLogs } from '@/db/schema'
import { eq, and, gte } from 'drizzle-orm'
import { NotificationService } from '@/lib/notifications'
import { rateLimit } from '@/lib/rate-limit'

const CRON_SECRET = process.env.CRON_SECRET || 'change-me-in-production'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ip = (request.headers as any).get?.('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const rl = await rateLimit('api:cron:notifications', ip, 2, 60)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Cron executado muitas vezes. Aguarde um minuto.' }, { status: 429 })
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
      { status: 500 }
    )
  }
}

async function processNewUsers(rule: { messageTemplate: string; sendViaEmail: boolean; sendViaWhatsapp: boolean }) {
  const recentUsers = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.welcomeSent, false),
        gte(users.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
      )
    )
    .limit(50)

  for (const user of recentUsers) {
    const notificationService = new NotificationService({ companyId: user.companyId })
    try {
      // Utiliza templates via NotificationService (se configurados)
      await notificationService.sendWelcome(
        user.id,
        user.email.split('@')[0] || 'Membro',
        'Nossa Igreja',
        user.phone || undefined,
        user.email || undefined
      )
      // Marcar como enviado APENAS se sucesso (não temos retorno granular por canal aqui)
      await db.update(users).set({ welcomeSent: true }).where(eq(users.id, user.id))
    } catch (error) {
      console.error(`Failed to send welcome to user ${user.id}:`, error)
    }
  }
}

async function processPayments(rule: { messageTemplate: string; sendViaEmail: boolean; sendViaWhatsapp: boolean }) {
  const recentTransactions = await db
    .select({ transaction: transactions, user: users })
    .from(transactions)
    .innerJoin(users, eq(transactions.contributorId, users.id))
    .where(
      and(
        eq(transactions.status, 'approved'),
        gte(transactions.createdAt, new Date(Date.now() - 2 * 60 * 60 * 1000))
      )
    )
    .limit(50)

  for (const { transaction, user } of recentTransactions) {
    const alreadySent = await db
      .select()
      .from(notificationLogs)
      .where(
        and(
          eq(notificationLogs.userId, user.id),
          eq(notificationLogs.notificationType, `payment_received_${transaction.id}`)
        )
      )
      .limit(1)

    if (alreadySent.length > 0) continue

    const notificationService = new NotificationService({ companyId: user.companyId })

    try {
      // Envio manual (mantemos conforme regra), templates podem ser adicionados no futuro
      if (rule.sendViaEmail && user.email) {
        await notificationService.sendEmail({
          to: user.email,
          subject: 'Pagamento Confirmado',
          html: `<p>Pagamento confirmado! Valor: R$ ${transaction.amount}</p>`,
        })
      }

      if (rule.sendViaWhatsapp && user.phone) {
        await notificationService.sendWhatsApp({ phone: user.phone, message: `Pagamento confirmado! Valor: R$ ${transaction.amount}` })
      }

      await db.insert(notificationLogs).values({
        companyId: user.companyId,
        userId: user.id,
        notificationType: `payment_received_${transaction.id}`,
        channel: rule.sendViaWhatsapp ? 'whatsapp' : 'email',
        status: 'sent',
        messageContent: `Pagamento confirmado! Valor: R$ ${transaction.amount}`,
      })
    } catch (error) {
      console.error(`Failed to send payment notification:`, error)
    }
  }
}

async function processReminders(rule: { id: string; messageTemplate: string; sendViaEmail: boolean; sendViaWhatsapp: boolean; daysOffset: number }) {
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + rule.daysOffset)
  const today = new Date().toISOString().split('T')[0]

  const usersToRemind = await db
    .select()
    .from(users)
    .where(and(eq(users.titheDay, targetDate.getDate()), eq(users.status, 'active')))
    .limit(100)

  for (const user of usersToRemind) {
    const alreadySent = await db
      .select()
      .from(notificationLogs)
      .where(
        and(
          eq(notificationLogs.userId, user.id),
          eq(notificationLogs.notificationType, `reminder_${rule.id}_${today}`)
        )
      )
      .limit(1)

    if (alreadySent.length > 0) continue

    const notificationService = new NotificationService({ companyId: user.companyId })
    const dueDate = targetDate.toLocaleDateString('pt-BR')
    const name = user.email.split('@')[0] || 'Membro'
    const amount = '100,00' // valor default; pode ser ajustado conforme regra/consulta

    try {
      await notificationService.sendPaymentReminder(
        user.id,
        name,
        amount,
        dueDate,
        user.phone || undefined,
        user.email || undefined
      )

      await db.insert(notificationLogs).values({
        companyId: user.companyId,
        userId: user.id,
        notificationType: `reminder_${rule.id}_${today}`,
        channel: rule.sendViaWhatsapp ? 'whatsapp' : 'email',
        status: 'sent',
        messageContent: `Lembrete de pagamento - vencimento ${dueDate}`,
      })
    } catch (error) {
      console.error(`Failed to send reminder:`, error)
    }
  }
}

async function processOverdue(rule: { id: string; messageTemplate: string; sendViaEmail: boolean; sendViaWhatsapp: boolean; daysOffset: number }) {
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() - rule.daysOffset)
  const today = new Date().toISOString().split('T')[0]

  const overdueUsers = await db
    .select()
    .from(users)
    .where(and(eq(users.titheDay, targetDate.getDate()), eq(users.status, 'active')))
    .limit(100)

  for (const user of overdueUsers) {
    const alreadySent = await db
      .select()
      .from(notificationLogs)
      .where(
        and(
          eq(notificationLogs.userId, user.id),
          eq(notificationLogs.notificationType, `overdue_${rule.id}_${today}`)
        )
      )
      .limit(1)

    if (alreadySent.length > 0) continue

    const notificationService = new NotificationService({ companyId: user.companyId })
    const dueDate = targetDate.toLocaleDateString('pt-BR')
    const name = user.email.split('@')[0] || 'Membro'
    const amount = '100,00'

    try {
      await notificationService.sendPaymentOverdue(
        user.id,
        name,
        amount,
        dueDate,
        user.phone || undefined,
        user.email || undefined
      )

      await db.insert(notificationLogs).values({
        companyId: user.companyId,
        userId: user.id,
        notificationType: `overdue_${rule.id}_${today}`,
        channel: rule.sendViaWhatsapp ? 'whatsapp' : 'email',
        status: 'sent',
        messageContent: `Pagamento em atraso - vencimento ${dueDate}`,
      })
    } catch (error) {
      console.error(`Failed to send overdue notification:`, error)
    }
  }
}
