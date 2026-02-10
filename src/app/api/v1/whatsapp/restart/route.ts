import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validateRequest } from '@/lib/jwt'

const restartRequestSchema = z.object({
  apiUrl: z.string().url(),
  apiKey: z.string().min(1),
  instanceName: z.string().min(1),
})

export async function PUT(request: NextRequest) {
  // Validar autenticação e role admin
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { apiUrl, apiKey, instanceName } = restartRequestSchema.parse(body)

    // Remove trailing slash from apiUrl
    const baseUrl = apiUrl.replace(/\/$/, '')

    // Restart instance using Evolution API
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10_000)
    let response: Response
    try {
      response = await fetch(`${baseUrl}/instance/restart/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: apiKey,
        },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('[WHATSAPP_TIMEOUT] Timeout ao reiniciar instância')
        return NextResponse.json(
          { error: 'Timeout ao comunicar com Evolution API' },
          { status: 504 },
        )
      }
      throw fetchError
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        {
          error: 'Erro ao reiniciar a instância',
          details: errorData,
        },
        { status: response.status },
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Instância reiniciada com sucesso',
      data,
    })
  } catch (error) {
    console.error('Erro ao reiniciar:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
