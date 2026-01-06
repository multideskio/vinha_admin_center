/**
 * @fileoverview API para envio de mensagens (email e WhatsApp)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validateRequest } from '@/lib/jwt'
import { db } from '@/db/drizzle'
import { otherSettings, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { sendEmail as sendEmailWithLog } from '@/lib/email'
import { WhatsAppService } from '@/lib/notifications'

const sendMessageSchema = z.object({
  type: z.enum(['email', 'whatsapp']),
  to: z.string().min(1),
  subject: z.string().optional(),
  message: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    // Buscar o companyId do usuário
    const [userData] = await db
      .select({ companyId: users.companyId })
      .from(users)
      .where(eq(users.id, user.id))

    if (!userData?.companyId) {
      return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 400 })
    }

    const body = await request.json()
    const { type, to, subject, message } = sendMessageSchema.parse(body)

    if (type === 'email') {
      await sendEmailWithLog({
        to,
        subject: subject || 'Mensagem',
        html: message.replace(/\n/g, '<br>'),
        userId: user.id,
        notificationType: 'manual_message',
      })
    } else {
      await sendWhatsApp(to, message, userData.companyId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending message:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function sendWhatsApp(to: string, message: string, companyId: string) {
  const [settings] = await db
    .select()
    .from(otherSettings)
    .where(eq(otherSettings.companyId, companyId))

  if (!settings?.whatsappApiUrl || !settings?.whatsappApiKey || !settings?.whatsappApiInstance) {
    throw new Error('Configurações do WhatsApp não encontradas')
  }

  const whatsappService = new WhatsAppService({
    companyId: companyId,
    whatsappApiUrl: settings.whatsappApiUrl,
    whatsappApiKey: settings.whatsappApiKey,
    whatsappApiInstance: settings.whatsappApiInstance,
  })

  const success = await whatsappService.sendMessage({
    number: to,
    text: message,
  })

  if (!success) {
    throw new Error('Falha ao enviar mensagem WhatsApp')
  }
}
