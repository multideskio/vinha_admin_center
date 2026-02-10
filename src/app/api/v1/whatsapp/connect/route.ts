import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validateRequest } from '@/lib/jwt'

// Force recompilation - connect API
const connectRequestSchema = z.object({
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
    const { apiUrl, apiKey, instanceName } = connectRequestSchema.parse(body)

    // Remove trailing slash from apiUrl
    const baseUrl = apiUrl.replace(/\/$/, '')

    // First, check if instance exists, if not create it
    const instancesResponse = await fetch(`${baseUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
      },
    })

    if (!instancesResponse.ok) {
      return NextResponse.json(
        { error: 'Erro ao verificar instâncias existentes' },
        { status: instancesResponse.status },
      )
    }

    const instances = await instancesResponse.json()

    // A estrutura pode variar, vamos verificar diferentes possibilidades
    let existingInstance = null

    if (Array.isArray(instances)) {
      // Tentar diferentes estruturas possíveis
      existingInstance = instances.find(
        (inst: {
          instanceName?: string
          name?: string
          instance?: {
            instanceName?: string
            name?: string
          }
        }) => {
          return (
            inst.instanceName === instanceName ||
            inst.instance?.instanceName === instanceName ||
            inst.name === instanceName ||
            inst.instance?.name === instanceName
          )
        },
      )
    }

    // Create instance if it doesn't exist
    if (!existingInstance) {
      const createResponse = await fetch(`${baseUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: apiKey,
        },
        body: JSON.stringify({
          instanceName: instanceName,
          integration: 'WHATSAPP-BAILEYS',
        }),
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}))
        return NextResponse.json(
          { error: 'Erro ao criar instância', details: errorData },
          { status: createResponse.status },
        )
      }
    }

    // Connect to WhatsApp and get QR code
    const connectResponse = await fetch(`${baseUrl}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
      },
    })

    if (!connectResponse.ok) {
      const errorData = await connectResponse.json().catch(() => ({}))
      return NextResponse.json(
        { error: 'Erro ao conectar instância', details: errorData },
        { status: connectResponse.status },
      )
    }

    const connectData = await connectResponse.json()

    // Check if QR code is available
    if (connectData.base64) {
      return NextResponse.json({
        success: true,
        qrCode: connectData.base64,
        message: 'QR Code gerado com sucesso. Escaneie com seu WhatsApp.',
        instanceName: instanceName,
      })
    }

    // If no QR code, check connection status
    if (connectData.instance?.connectionStatus === 'open') {
      return NextResponse.json({
        success: true,
        connected: true,
        message: 'WhatsApp já está conectado',
        instanceName: instanceName,
        instance: {
          profileName: connectData.instance.profileName,
          profilePictureUrl: connectData.instance.profilePictureUrl,
          number: connectData.instance.owner,
        },
      })
    }

    return NextResponse.json({
      success: false,
      message: 'Não foi possível obter QR Code. Tente novamente.',
      details: connectData,
    })
  } catch (error) {
    console.error('Erro ao conectar:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
