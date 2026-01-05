import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { notificationRules, messageTemplates } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'

export async function POST(_request: NextRequest) {
  try {
    const { user } = await validateRequest()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const companyId = user.companyId as string
    if (!companyId) {
      return NextResponse.json({ error: 'companyId ausente' }, { status: 400 })
    }

    // Criar templates padrão (idempotente)
    const defaultTemplates = [
      {
        templateType: 'payment_reminder',
        name: 'Lembrete de Pagamento',
        whatsappTemplate: 'Olá {name}! Lembramos que seu dízimo de R$ {amount} vence em {dueDate}.',
        emailSubjectTemplate: 'Lembrete de Pagamento - vence em {dueDate}',
        emailHtmlTemplate:
          '<p>Olá {name},</p><p>Seu dízimo de <strong>R$ {amount}</strong> vence em <strong>{dueDate}</strong>.</p>',
      },
      {
        templateType: 'payment_overdue',
        name: 'Pagamento em Atraso',
        whatsappTemplate: 'Olá {name}! Seu dízimo de R$ {amount} está em atraso desde {dueDate}.',
        emailSubjectTemplate: 'Pagamento em atraso desde {dueDate}',
        emailHtmlTemplate:
          '<p>Olá {name},</p><p>Seu dízimo de <strong>R$ {amount}</strong> está em atraso desde <strong>{dueDate}</strong>.</p>',
      },
    ] as const

    for (const tpl of defaultTemplates) {
      const exists = await db
        .select({ id: messageTemplates.id })
        .from(messageTemplates)
        .where(
          and(
            eq(messageTemplates.companyId, companyId),
            eq(messageTemplates.templateType, tpl.templateType),
          ),
        )
        .limit(1)
      if (exists.length === 0) {
        await db.insert(messageTemplates).values({
          companyId,
          templateType: tpl.templateType,
          name: tpl.name,
          whatsappTemplate: tpl.whatsappTemplate,
          emailSubjectTemplate: tpl.emailSubjectTemplate,
          emailHtmlTemplate: tpl.emailHtmlTemplate,
          isActive: true,
        })
      }
    }

    // Criar regras padrão (idempotente)
    const defaultRules = [
      {
        name: 'Lembrete 5 dias antes',
        eventTrigger: 'payment_due_reminder',
        daysOffset: 5,
        sendViaEmail: true,
        sendViaWhatsapp: true,
      },
      {
        name: 'Lembrete no dia',
        eventTrigger: 'payment_due_reminder',
        daysOffset: 0,
        sendViaEmail: true,
        sendViaWhatsapp: true,
      },
      {
        name: 'Aviso atraso 1 dia',
        eventTrigger: 'payment_overdue',
        daysOffset: 1,
        sendViaEmail: true,
        sendViaWhatsapp: true,
      },
    ] as const

    for (const rule of defaultRules) {
      const exists = await db
        .select({ id: notificationRules.id })
        .from(notificationRules)
        .where(
          and(eq(notificationRules.companyId, companyId), eq(notificationRules.name, rule.name)),
        )
        .limit(1)
      if (exists.length === 0) {
        await db.insert(notificationRules).values({
          companyId,
          name: rule.name,
          eventTrigger: rule.eventTrigger as any,
          daysOffset: rule.daysOffset,
          messageTemplate: '{nome_usuario}',
          sendViaEmail: rule.sendViaEmail,
          sendViaWhatsapp: rule.sendViaWhatsapp,
          isActive: true,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao criar regras/templates padrão:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
