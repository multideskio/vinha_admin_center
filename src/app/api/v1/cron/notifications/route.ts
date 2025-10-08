import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { notificationRules, users, transactions, notificationLogs } from '@/db/schema'
import { eq, and, gte } from 'drizzle-orm'
import { NotificationService } from '@/lib/notifications'

const CRON_SECRET = process.env.CRON_SECRET || 'change-me-in-production'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

async function processNewUsers(rule: any) {
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
    const message = rule.messageTemplate.replace('{nome_usuario}', user.email.split('@')[0])
    const notificationService = new NotificationService({ companyId: user.companyId })

    try {
      if (rule.sendViaEmail && user.email) {
        await notificationService.sendEmail({
          to: user.email,
          subject: 'Bem-vindo!',
          html: `<p>${message}</p>`,
        })
      }

      if (rule.sendViaWhatsapp && user.phone) {
        await notificationService.sendWhatsApp({ phone: user.phone, message })
      }

      // Marcar como enviado APENAS se sucesso
      await db.update(users).set({ welcomeSent: true }).where(eq(users.id, user.id))
    } catch (error) {
      console.error(`Failed to send welcome to user ${user.id}:`, error)
      // Não marca como enviado - tentará novamente na próxima execução
    }
  }
}

async function processPayments(rule: any) {
  const recentTransactions = await db
    .select({ transaction: transactions, user: users })
    .from(transactions)
    .innerJoin(users, eq(transactions.contributorId, users.id))
    .where(
      and(
        eq(transactions.status, 'approved'),
        gte(transactions.createdAt, new Date(Date.now() - 2 * 60 * 60 * 1000)) // 2 horas
      )
    )
    .limit(50)

  for (const { transaction, user } of recentTransactions) {
    // Verificar se já foi notificado
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

    if (alreadySent.length > 0) continue // Já enviado

    const message = rule.messageTemplate
      .replace('{nome_usuario}', user.email.split('@')[0])
      .replace('{valor_transacao}', transaction.amount)

    const notificationService = new NotificationService({ companyId: user.companyId })

    try {
      if (rule.sendViaEmail && user.email) {
        await notificationService.sendEmail({
          to: user.email,
          subject: 'Pagamento Confirmado',
          html: `<p>${message}</p>`,
        })
      }

      if (rule.sendViaWhatsapp && user.phone) {
        await notificationService.sendWhatsApp({ phone: user.phone, message })
      }

      // Registrar envio
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

async function processReminders(rule: any) {
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + rule.daysOffset)
  const today = new Date().toISOString().split('T')[0]

  const usersToRemind = await db
    .select()
    .from(users)
    .where(and(eq(users.titheDay, targetDate.getDate()), eq(users.status, 'active')))
    .limit(100)

  for (const user of usersToRemind) {
    // Verificar se já enviou hoje
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

    const message = rule.messageTemplate
      .replace('{nome_usuario}', user.email.split('@')[0])
      .replace('{data_vencimento}', targetDate.toLocaleDateString('pt-BR'))

    const notificationService = new NotificationService({ companyId: user.companyId })

    try {
      if (rule.sendViaEmail && user.email) {
        await notificationService.sendEmail({
          to: user.email,
          subject: 'Lembrete de Pagamento',
          html: `<p>${message}</p>`,
        })
      }

      if (rule.sendViaWhatsapp && user.phone) {
        await notificationService.sendWhatsApp({ phone: user.phone, message })
      }

      await db.insert(notificationLogs).values({
        companyId: user.companyId,
        userId: user.id,
        notificationType: `reminder_${rule.id}_${today}`,
        channel: rule.sendViaWhatsapp ? 'whatsapp' : 'email',
        status: 'sent',
        messageContent: message,
      })
    } catch (error) {
      console.error(`Failed to send reminder:`, error)
    }
  }
}

async function processOverdue(rule: any) {
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() - rule.daysOffset)
  const today = new Date().toISOString().split('T')[0]

  const overdueUsers = await db
    .select()
    .from(users)
    .where(and(eq(users.titheDay, targetDate.getDate()), eq(users.status, 'active')))
    .limit(100)

  for (const user of overdueUsers) {
    // Verificar se já enviou hoje
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

    const message = rule.messageTemplate
      .replace('{nome_usuario}', user.email.split('@')[0])
      .replace('{data_vencimento}', targetDate.toLocaleDateString('pt-BR'))

    const notificationService = new NotificationService({ companyId: user.companyId })

    try {
      if (rule.sendViaEmail && user.email) {
        await notificationService.sendEmail({
          to: user.email,
          subject: 'Pagamento em Atraso',
          html: `<p>${message}</p>`,
        })
      }

      if (rule.sendViaWhatsapp && user.phone) {
        await notificationService.sendWhatsApp({ phone: user.phone, message })
      }

      await db.insert(notificationLogs).values({
        companyId: user.companyId,
        userId: user.id,
        notificationType: `overdue_${rule.id}_${today}`,
        channel: rule.sendViaWhatsapp ? 'whatsapp' : 'email',
        status: 'sent',
        messageContent: message,
      })
    } catch (error) {
      console.error(`Failed to send overdue notification:`, error)
    }
  }
}
