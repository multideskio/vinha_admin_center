import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from '@/lib/jwt'
import { db } from '@/db/drizzle'
import { users, otherSettings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { NotificationService } from '@/lib/notifications'

export async function GET(request: NextRequest) {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  try {
    const url = new URL(request.url)
    const dryRun = url.searchParams.get('dryRun') === 'true'

    const [target] = await db
      .select({ id: users.id, email: users.email, phone: users.phone })
      .from(users)
      .where(eq(users.companyId, user.companyId))
      .limit(1)

    if (!target) {
      return NextResponse.json({ error: 'Nenhum usuário encontrado para teste.' }, { status: 400 })
    }

    const [settings] = await db.select().from(otherSettings).where(eq(otherSettings.companyId, user.companyId)).limit(1)
    if (!settings) return NextResponse.json({ error: 'Configurações da empresa não encontradas.' }, { status: 400 })

    const service = new NotificationService({
      whatsappApiUrl: settings.whatsappApiUrl || undefined,
      whatsappApiKey: settings.whatsappApiKey || undefined,
      whatsappApiInstance: settings.whatsappApiInstance || undefined,
      sesRegion: settings.s3Region || undefined,
      sesAccessKeyId: settings.s3AccessKeyId || undefined,
      sesSecretAccessKey: settings.s3SecretAccessKey || undefined,
      fromEmail: settings.smtpFrom || undefined,
      companyId: user.companyId,
    })

    const name = (target.email?.split('@')[0] || 'Membro')
    const amount = '100,00'
    const dueDate = new Date(Date.now() + 3 * 86400000).toLocaleDateString('pt-BR')
    const paidAt = new Date().toLocaleString('pt-BR')

    if (dryRun) {
      // Apenas renderiza exemplos de templates via regras padrão do NotificationService
      return NextResponse.json({
        ok: true,
        preview: {
          payment_received: {
            vars: { nome_usuario: name, valor_transacao: amount, data_pagamento: paidAt },
          },
          payment_due_reminder: {
            vars: { nome_usuario: name, valor_transacao: amount, data_vencimento: dueDate },
          },
        },
      })
    }

    // Envio real (somente email/whatsapp se configurados)
    const received = await service.sendPaymentReceived(
      target.id,
      name,
      amount,
      paidAt,
      target.phone || undefined,
      target.email || undefined,
    )

    const reminder = await service.sendPaymentReminder(
      target.id,
      name,
      amount,
      dueDate,
      target.phone || undefined,
      target.email || undefined,
      undefined,
    )

    return NextResponse.json({ ok: true, received, reminder })
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
