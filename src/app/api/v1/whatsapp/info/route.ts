import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validateRequest } from '@/lib/jwt'

const infoRequestSchema = z.object({
  apiUrl: z.string().url(),
  apiKey: z.string().min(1),
  instanceName: z.string().min(1),
})

export async function POST(request: NextRequest) {
  // Validar autenticação e role admin
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { apiUrl, apiKey, instanceName } = infoRequestSchema.parse(body)

    // Remove trailing slash from apiUrl
    const baseUrl = apiUrl.replace(/\/$/, '')

    // Get instance information using Evolution API v2
    const response = await fetch(
      `${baseUrl}/instance/fetchInstances?instanceName=${instanceName}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          apikey: apiKey,
        },
      },
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Erro ao obter informações da instância' },
        { status: response.status },
      )
    }

    const instances = await response.json()
    const instance = instances[0]

    if (!instance) {
      return NextResponse.json(
        {
          error: 'Instância não encontrada',
        },
        { status: 404 },
      )
    }

    const connectionState = instance.instance?.connectionStatus || 'close'
    const isConnected = connectionState === 'open'

    if (!isConnected) {
      return NextResponse.json({
        connected: false,
        status: connectionState,
        message: 'WhatsApp não está conectado',
      })
    }

    // Get additional profile information if available
    let profileInfo = null
    try {
      const profileResponse = await fetch(`${baseUrl}/chat/whatsappProfile/${instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          apikey: apiKey,
        },
      })

      if (profileResponse.ok) {
        profileInfo = await profileResponse.json()
      }
    } catch (error) {
      console.warn('Erro ao obter perfil adicional:', error)
    }

    return NextResponse.json({
      connected: true,
      status: connectionState,
      instance: {
        name: instanceName,
        profileName: instance.instance?.profileName || profileInfo?.name || 'Nome não disponível',
        profilePictureUrl: instance.instance?.profilePictureUrl || profileInfo?.picture || null,
        number: instance.instance?.owner || profileInfo?.wuid || 'Número não disponível',
        businessProfile: profileInfo?.business || null,
        description: profileInfo?.description || null,
      },
      connectionInfo: {
        connectedAt: instance.instance?.createdAt || null,
        serverUrl: instance.instance?.serverUrl || null,
        integration: instance.instance?.integration || 'WHATSAPP-BAILEYS',
      },
    })
  } catch (error) {
    console.error('Erro ao obter informações:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
