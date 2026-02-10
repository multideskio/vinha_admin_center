import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, notificationRules, notificationLogs } from '@/db/schema'
import { and, eq, inArray } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import { NotificationService } from '@/lib/notifications'
import { formatBrazilDate, getBrazilDate } from '@/lib/date-utils'
import { env } from '@/lib/env'

export async function POST() {
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

    let sent = 0
    let skipped = 0

    // Helper para dia formatado (dedupe diária) - usando timezone do Brasil
    const todayStr = formatBrazilDate(getBrazilDate()).split('/').reverse().join('-') // YYYY-MM-DD

    // ✅ OTIMIZADO: Criar NotificationService uma vez (mesmo companyId para todos os usuários)
    const svc = await NotificationService.createFromDatabase(companyId)

    // Lembretes (antes e no dia)
    for (const rule of reminderRules) {
      const targetDate = getBrazilDate()
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

      if (dueUsers.length === 0) continue

      // ✅ OTIMIZADO: Buscar todos os logs de dedup de uma vez com inArray
      const dedupType = `rem_${rule.id.slice(0, 8)}_${todayStr}`
      const userIds = dueUsers.map((u) => u.id)
      const existingLogs = await db
        .select({ userId: notificationLogs.userId })
        .from(notificationLogs)
        .where(
          and(
            inArray(notificationLogs.userId, userIds),
            eq(notificationLogs.notificationType, dedupType),
          ),
        )
      const alreadySentSet = new Set(existingLogs.map((l) => l.userId))

      for (const u of dueUsers) {
        if (alreadySentSet.has(u.id)) {
          skipped++
          continue
        }

        const name = u.email.split('@')[0] || 'Membro'
        const dueDate = formatBrazilDate(targetDate)
        const amount = '100,00'

        const processedMessage = rule.messageTemplate
          .replace(/{nome_usuario}/g, name)
          .replace(/{name}/g, name)
          .replace(/{data_vencimento}/g, dueDate)
          .replace(/{dueDate}/g, dueDate)
          .replace(/{valor_transacao}/g, amount)
          .replace(/{amount}/g, amount)
          .replace(/{nome_igreja}/g, 'Igreja')
          .replace(/{link_pagamento}/g, env.NEXT_PUBLIC_APP_URL || '')

        let emailSent = false
        let whatsappSent = false

        if (rule.sendViaEmail && u.email) {
          try {
            emailSent = await svc.sendEmail({
              to: u.email,
              subject: 'Lembrete de Dízimo',
              html: processedMessage.replace(/\n/g, '<br>'),
            })
          } catch (error) {
            console.error('Erro ao enviar email:', error)
            emailSent = false
          }

          await db.insert(notificationLogs).values({
            companyId,
            userId: u.id,
            notificationType: dedupType,
            channel: 'email',
            status: emailSent ? 'sent' : 'failed',
            recipient: u.email,
            subject: 'Lembrete de Dízimo',
            messageContent: processedMessage,
            errorMessage: emailSent
              ? null
              : 'Credenciais SMTP inválidas - verifique as configurações em /admin/configuracoes/smtp',
          })
        }

        if (rule.sendViaWhatsapp && u.phone) {
          whatsappSent = await svc.sendWhatsApp({
            phone: u.phone,
            message: processedMessage,
          })

          await db.insert(notificationLogs).values({
            companyId,
            userId: u.id,
            notificationType: dedupType,
            channel: 'whatsapp',
            status: whatsappSent ? 'sent' : 'failed',
            recipient: u.phone,
            messageContent: processedMessage,
          })
        }

        if (emailSent || whatsappSent) {
          sent++
        }
      }
    }

    // Atrasados (após)
    for (const rule of overdueRules) {
      const targetDate = getBrazilDate()
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

      if (overdueUsers.length === 0) continue

      // ✅ OTIMIZADO: Buscar todos os logs de dedup de uma vez com inArray
      const dedupType = `ovr_${rule.id.slice(0, 8)}_${todayStr}`
      const userIds = overdueUsers.map((u) => u.id)
      const existingLogs = await db
        .select({ userId: notificationLogs.userId })
        .from(notificationLogs)
        .where(
          and(
            inArray(notificationLogs.userId, userIds),
            eq(notificationLogs.notificationType, dedupType),
          ),
        )
      const alreadySentSet = new Set(existingLogs.map((l) => l.userId))

      for (const u of overdueUsers) {
        if (alreadySentSet.has(u.id)) {
          skipped++
          continue
        }

        const name = u.email.split('@')[0] || 'Membro'
        const dueDate = formatBrazilDate(targetDate)
        const amount = '100,00'

        const processedMessage = rule.messageTemplate
          .replace(/{nome_usuario}/g, name)
          .replace(/{name}/g, name)
          .replace(/{data_vencimento}/g, dueDate)
          .replace(/{dueDate}/g, dueDate)
          .replace(/{valor_transacao}/g, amount)
          .replace(/{amount}/g, amount)
          .replace(/{nome_igreja}/g, 'Igreja')
          .replace(/{link_pagamento}/g, env.NEXT_PUBLIC_APP_URL || '')

        let emailSent = false
        let whatsappSent = false

        if (rule.sendViaEmail && u.email) {
          try {
            emailSent = await svc.sendEmail({
              to: u.email,
              subject: 'Pagamento em Atraso',
              html: processedMessage.replace(/\n/g, '<br>'),
            })
          } catch (error) {
            console.error('Erro ao enviar email:', error)
            emailSent = false
          }

          await db.insert(notificationLogs).values({
            companyId,
            userId: u.id,
            notificationType: dedupType,
            channel: 'email',
            status: emailSent ? 'sent' : 'failed',
            recipient: u.email,
            subject: 'Pagamento em Atraso',
            messageContent: processedMessage,
            errorMessage: emailSent
              ? null
              : 'Credenciais SMTP inválidas - verifique as configurações em /admin/configuracoes/smtp',
          })
        }

        if (rule.sendViaWhatsapp && u.phone) {
          whatsappSent = await svc.sendWhatsApp({
            phone: u.phone,
            message: processedMessage,
          })

          await db.insert(notificationLogs).values({
            companyId,
            userId: u.id,
            notificationType: dedupType,
            channel: 'whatsapp',
            status: whatsappSent ? 'sent' : 'failed',
            recipient: u.phone,
            messageContent: processedMessage,
          })
        }

        if (emailSent || whatsappSent) {
          sent++
        }
      }
    }

    return NextResponse.json({ success: true, sent, skipped })
  } catch (error) {
    console.error('Erro ao enviar lembretes:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
