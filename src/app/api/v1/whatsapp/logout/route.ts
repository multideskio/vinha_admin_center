import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const logoutRequestSchema = z.object({
  apiUrl: z.string().url(),
  apiKey: z.string().min(1),
  instanceName: z.string().min(1),
})

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiUrl, apiKey, instanceName } = logoutRequestSchema.parse(body)

    // Remove trailing slash from apiUrl
    const baseUrl = apiUrl.replace(/\/$/, '')

    // Logout instance using Evolution API
    const response = await fetch(`${baseUrl}/instance/logout/${instanceName}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        {
          error: 'Erro ao fazer logout da instância',
          details: errorData,
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log('Logout response:', data)

    return NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso',
      data,
    })
  } catch (error) {
    console.error('Erro ao fazer logout:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
