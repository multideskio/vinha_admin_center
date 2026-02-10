/**
 * @fileoverview Webhook para receber eventos da Evolution API
 */

import { NextRequest, NextResponse } from 'next/server'
import { EvolutionWebhookData } from '@/lib/evolution-api-types'

export async function POST(request: NextRequest) {
  try {
    const data: EvolutionWebhookData = await request.json()

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
