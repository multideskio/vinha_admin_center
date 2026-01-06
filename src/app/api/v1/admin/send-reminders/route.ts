import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, notificationRules, notificationLogs } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import { NotificationService } from '@/lib/notifications'
import { formatBrazilDate, getBrazilDate } from '@/lib/date-utils'

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

      for (const u of dueUsers) {
        const already = await db
          .select({ id: notificationLogs.id })
          .from(notificationLogs)
          .where(
            and(
              eq(notificationLogs.userId, u.id),
              eq(notificationLogs.notificationType, `rem_${rule.id.slice(0, 8)}_${todayStr}`), // Mesmo formato encurtado
            ),
          )
          .limit(1)
        if (already.length > 0) {
          skipped++
          continue
        }

        const svc = await NotificationService.createFromDatabase(companyId)
        const name = u.email.split('@')[0] || 'Membro'
        const dueDate = formatBrazilDate(targetDate) // Usar timezone do Brasil
        const amount = '100,00'

        // Processar template da regra com variáveis
        const processedMessage = rule.messageTemplate
          .replace(/{nome_usuario}/g, name)
          .replace(/{name}/g, name)
          .replace(/{data_vencimento}/g, dueDate)
          .replace(/{dueDate}/g, dueDate)
          .replace(/{valor_transacao}/g, amount)
          .replace(/{amount}/g, amount)
          .replace(/{nome_igreja}/g, 'Igreja')
          .replace(/{link_pagamento}/g, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002/')

        // Enviar usando os canais configurados na regra
        let emailSent = false
        let whatsappSent = false

        if (rule.sendViaEmail && u.email) {
          try {
            emailSent = await svc.sendEmail({
              to: u.email,
              subject: 'Lembrete de Dízimo',
              html: processedMessage.replace(/\n/g, '<br>')
            })
          } catch (error) {
            console.error('Erro ao enviar email:', error)
            emailSent = false
          }

          // Log específico para email com erro detalhado
          await db.insert(notificationLogs).values({
            companyId,
            userId: u.id,
            notificationType: `rem_${rule.id.slice(0, 8)}_${todayStr}`,
            channel: 'email',
            status: emailSent ? 'sent' : 'failed',
            recipient: u.email,
            subject: 'Lembrete de Dízimo',
            messageContent: processedMessage,
            errorMessage: emailSent ? null : 'Credenciais SMTP inválidas - verifique as configurações em /admin/configuracoes/smtp'
          })
        }

        if (rule.sendViaWhatsapp && u.phone) {
          whatsappSent = await svc.sendWhatsApp({
            phone: u.phone,
            message: processedMessage
          })

          // Log específico para WhatsApp
          await db.insert(notificationLogs).values({
            companyId,
            userId: u.id,
            notificationType: `rem_${rule.id.slice(0, 8)}_${todayStr}`,
            channel: 'whatsapp',
            status: whatsappSent ? 'sent' : 'failed',
            recipient: u.phone,
            messageContent: processedMessage,
          })
        }

        // Contar apenas se pelo menos um canal foi enviado com sucesso
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

      for (const u of overdueUsers) {
        const already = await db
          .select({ id: notificationLogs.id })
          .from(notificationLogs)
          .where(
            and(
              eq(notificationLogs.userId, u.id),
              eq(notificationLogs.notificationType, `ovr_${rule.id.slice(0, 8)}_${todayStr}`), // Encurtado
            ),
          )
          .limit(1)
        if (already.length > 0) {
          skipped++
          continue
        }

        const svc = await NotificationService.createFromDatabase(companyId)
        const name = u.email.split('@')[0] || 'Membro'
        const dueDate = formatBrazilDate(targetDate) // Usar timezone do Brasil
        const amount = '100,00'

        // Processar template da regra com variáveis
        const processedMessage = rule.messageTemplate
          .replace(/{nome_usuario}/g, name)
          .replace(/{name}/g, name)
          .replace(/{data_vencimento}/g, dueDate)
          .replace(/{dueDate}/g, dueDate)
          .replace(/{valor_transacao}/g, amount)
          .replace(/{amount}/g, amount)
          .replace(/{nome_igreja}/g, 'Igreja')
          .replace(/{link_pagamento}/g, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002/')

        // Enviar usando os canais configurados na regra
        let emailSent = false
        let whatsappSent = false

        if (rule.sendViaEmail && u.email) {
          try {
            emailSent = await svc.sendEmail({
              to: u.email,
              subject: 'Pagamento em Atraso',
              html: processedMessage.replace(/\n/g, '<br>')
            })
          } catch (error) {
            console.error('Erro ao enviar email:', error)
            emailSent = false
          }

          // Log específico para email com erro detalhado
          await db.insert(notificationLogs).values({
            companyId,
            userId: u.id,
            notificationType: `ovr_${rule.id.slice(0, 8)}_${todayStr}`,
            channel: 'email',
            status: emailSent ? 'sent' : 'failed',
            recipient: u.email,
            subject: 'Pagamento em Atraso',
            messageContent: processedMessage,
            errorMessage: emailSent ? null : 'Credenciais SMTP inválidas - verifique as configurações em /admin/configuracoes/smtp'
          })
        }

        if (rule.sendViaWhatsapp && u.phone) {
          whatsappSent = await svc.sendWhatsApp({
            phone: u.phone,
            message: processedMessage
          })

          // Log específico para WhatsApp
          await db.insert(notificationLogs).values({
            companyId,
            userId: u.id,
            notificationType: `ovr_${rule.id.slice(0, 8)}_${todayStr}`,
            channel: 'whatsapp',
            status: whatsappSent ? 'sent' : 'failed',
            recipient: u.phone,
            messageContent: processedMessage,
          })
        }

        // Contar apenas se pelo menos um canal foi enviado com sucesso
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
