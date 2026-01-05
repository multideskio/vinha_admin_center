import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, notificationRules, notificationLogs } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import { NotificationService } from '@/lib/notifications'

export async function POST(_request: NextRequest) {
  try {
    const { user } = await validateRequest()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const companyId = user.companyId as string
    if (!companyId) return NextResponse.json({ error: 'companyId ausente' }, { status: 400 })

    const activeRules = await db
      .select()
      .from(notificationRules)
      .where(and(eq(notificationRules.isActive, true), eq(notificationRules.companyId, companyId)))

    const reminderRules = activeRules.filter((r) => r.eventTrigger === 'payment_due_reminder')
    const overdueRules = activeRules.filter((r) => r.eventTrigger === 'payment_overdue')

    const sent = 0
    const skipped = 0

    // Helper para dia formatado (dedupe diária)
    const todayStr = new Date().toISOString().split('T')[0]

    // Lembretes (antes e no dia)
    for (const rule of reminderRules) {
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + rule.daysOffset)

      const dueUsers = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.companyId, companyId),
            eq(users.titheDay, targetDate.getDate()),
            eq(users.status, 'active'),
          ),
        )
        .limit(500)

      for (const u of dueUsers) {
        const already = await db
          .select({ id: notificationLogs.id })
          .from(notificationLogs)
          .where(
            and(
              eq(notificationLogs.userId, u.id),
              eq(notificationLogs.notificationType, `reminder_${rule.id}_${todayStr}`),
            ),
          )
          .limit(1)
        if (already.length > 0) {
          skipped++
          continue
        }

        const svc = new NotificationService({ companyId })
        const name = u.email.split('@')[0] || 'Membro'
        const dueDate = targetDate.toLocaleDateString('pt-BR')
        const amount = '100,00'

        // Enviar apenas e-mail (phone undefined)
        await svc.sendPaymentReminder(u.id, name, amount, dueDate, undefined, u.email || undefined)

        await db.insert(notificationLogs).values({
          companyId,
          userId: u.id,
          notificationType: `reminder_${rule.id}_${todayStr}`,
          channel: 'email',
          status: 'sent',
          messageContent: `Lembrete de pagamento - vencimento ${dueDate}`,
        })
        sent++
      }
    }

    // Atrasados (após)
    for (const rule of overdueRules) {
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() - rule.daysOffset)

      const overdueUsers = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.companyId, companyId),
            eq(users.titheDay, targetDate.getDate()),
            eq(users.status, 'active'),
          ),
        )
        .limit(500)

      for (const u of overdueUsers) {
        const already = await db
          .select({ id: notificationLogs.id })
          .from(notificationLogs)
          .where(
            and(
              eq(notificationLogs.userId, u.id),
              eq(notificationLogs.notificationType, `overdue_${rule.id}_${todayStr}`),
            ),
          )
          .limit(1)
        if (already.length > 0) {
          skipped++
          continue
        }

        const svc = new NotificationService({ companyId })
        const name = u.email.split('@')[0] || 'Membro'
        const dueDate = targetDate.toLocaleDateString('pt-BR')
        const amount = '100,00'

        await svc.sendPaymentOverdue(u.id, name, amount, dueDate, undefined, u.email || undefined)

        await db.insert(notificationLogs).values({
          companyId,
          userId: u.id,
          notificationType: `overdue_${rule.id}_${todayStr}`,
          channel: 'email',
          status: 'sent',
          messageContent: `Pagamento em atraso - vencimento ${dueDate}`,
        })
        sent++
      }
    }

    return NextResponse.json({ success: true, sent, skipped })
  } catch (error) {
    console.error('Erro ao enviar lembretes:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
