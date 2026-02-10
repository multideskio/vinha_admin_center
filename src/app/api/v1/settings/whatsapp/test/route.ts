/**
 * @fileoverview Rota da API para testar envio de mensagem via WhatsApp.
 * @version 1.1
 * @date 2024-08-08
 * @author PH
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { validateRequest } from '@/lib/jwt'

const testMessageSchema = z.object({
  phone: z.string().min(10),
  message: z.string().min(1),
  config: z.object({
    apiUrl: z.string().url(),
    apiKey: z.string(),
    apiInstance: z.string(),
  }),
})

export async function POST(request: Request): Promise<NextResponse> {
  // Validar autenticação e role admin
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = testMessageSchema.parse(body)

    const { phone, message, config } = validatedData

    const url = `${config.apiUrl.replace(/\/$/, '')}/message/sendText/${config.apiInstance}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10_000)
    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: config.apiKey,
        },
        body: JSON.stringify({
          number: phone,
          text: message,
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('[WHATSAPP_TIMEOUT] Timeout ao enviar mensagem de teste')
        return NextResponse.json(
          { error: 'Timeout ao comunicar com Evolution API' },
          { status: 504 },
        )
      }
      throw fetchError
    }

    if (!response.ok) {
      const errorBody = await response.json()
      console.error('Erro da Evolution API:', {
        status: response.status,
        message: errorBody?.message,
      })
      throw new Error(errorBody.message || 'Falha ao enviar mensagem pela API do WhatsApp.')
    }

    const responseData = await response.json()

    return NextResponse.json({ success: true, data: responseData })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: error.errors },
        { status: 400 },
      )
    }
    console.error('Erro ao enviar mensagem de teste do WhatsApp:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor.'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
