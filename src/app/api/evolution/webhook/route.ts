/**
 * @fileoverview Webhook para receber eventos da Evolution API
 */

import { NextRequest, NextResponse } from 'next/server'
import { EvolutionWebhookData } from '@/lib/evolution-api-types'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'

// Schema Zod para validação do webhook da Evolution API
const evolutionWebhookSchema = z.object({
  event: z.string().min(1),
  instance: z.string().min(1),
  data: z
    .object({
      key: z.object({
        id: z.string(),
        remoteJid: z.string(),
        fromMe: z.boolean(),
      }),
      message: z.record(z.unknown()).optional(),
      messageTimestamp: z.number(),
      status: z.enum(['ERROR', 'PENDING', 'SERVER_ACK', 'DELIVERY_ACK', 'READ']).optional(),
    })
    .optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 60 req/min por IP
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('evolution-webhook', ip, 60, 60)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 },
      )
    }

    const body = await request.json()

    // ✅ Validação Zod do payload do webhook
    const parseResult = evolutionWebhookSchema.safeParse(body)
    if (!parseResult.success) {
      console.warn('[EVOLUTION_WEBHOOK] Payload inválido:', parseResult.error.errors)
      return NextResponse.json(
        { error: 'Dados inválidos', details: parseResult.error.errors },
        { status: 400 },
      )
    }

    const data = parseResult.data as EvolutionWebhookData

    // Processar diferentes tipos de eventos
    switch (data.event) {
      case 'messages.upsert':
        await handleMessageReceived(data)
        break

      case 'messages.update':
        await handleMessageUpdate(data)
        break

      case 'connection.update':
        await handleConnectionUpdate()
        break

      default:
        console.warn('[EVOLUTION_WEBHOOK] Evento não tratado:', data.event)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[EVOLUTION_WEBHOOK] Erro ao processar webhook:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handleMessageReceived(_data: EvolutionWebhookData) {
  // Processar mensagem recebida
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handleMessageUpdate(_data: EvolutionWebhookData) {
  // Processar atualização de status da mensagem
}

async function handleConnectionUpdate() {
  // Processar mudança de status da conexão
}
