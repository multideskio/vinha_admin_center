/**
 * @fileoverview Webhook para receber eventos da Evolution API
 */

import { NextRequest, NextResponse } from 'next/server'
import { EvolutionWebhookData } from '@/lib/evolution-api-types'

export async function POST(request: NextRequest) {
  try {
    const data: EvolutionWebhookData = await request.json()
    
    console.log('Evolution webhook received:', {
      event: data.event,
      instance: data.instance,
      messageId: data.data?.key?.id,
      status: data.data?.status,
    })

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
        console.log('Unhandled event:', data.event)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Evolution webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleMessageReceived(data: EvolutionWebhookData) {
  // Processar mensagem recebida
  console.log('Message received:', data.data.key.id)
}

async function handleMessageUpdate(data: EvolutionWebhookData) {
  // Processar atualização de status da mensagem
  console.log('Message status updated:', data.data.status)
}

async function handleConnectionUpdate() {
  // Processar mudança de status da conexão
  console.log('Connection status updated')
}