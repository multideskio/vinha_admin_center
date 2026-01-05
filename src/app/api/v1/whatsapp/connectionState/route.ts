/**
 * @fileoverview API para verificar o estado de conexão de uma instância WhatsApp
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const connectionStateSchema = z.object({
  apiUrl: z.string().url(),
  apiKey: z.string().min(1),
  instanceName: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiUrl, apiKey, instanceName } = connectionStateSchema.parse(body)

    // Remove trailing slash from apiUrl
    const baseUrl = apiUrl.replace(/\/$/, '')

    // Verificar estado de conexão usando Evolution API v2
    const response = await fetch(`${baseUrl}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: {
        apikey: apiKey,
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Erro ao verificar estado de conexão da instância' },
        { status: response.status },
      )
    }

    const data = await response.json()

    // Retornar no formato esperado
    return NextResponse.json({
      instance: {
        instanceName: data.instance?.instanceName || instanceName,
        state: data.instance?.state || 'close',
      },
    })
  } catch (error) {
    console.error('Error checking connection state:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
