import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Force recompilation
const statusRequestSchema = z.object({
  apiUrl: z.string().url(),
  apiKey: z.string().min(1),
  instanceName: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiUrl, apiKey, instanceName } = statusRequestSchema.parse(body)

    // Remove trailing slash from apiUrl
    const baseUrl = apiUrl.replace(/\/$/, '')

    // Check instance status using Evolution API v2
    const response = await fetch(`${baseUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Erro ao verificar status da instância' },
        { status: response.status },
      )
    }

    const instances = await response.json()
    console.log('Instances response:', JSON.stringify(instances, null, 2))

    // A nova estrutura da Evolution API retorna os dados diretamente no nível raiz
    let instance = null

    if (Array.isArray(instances)) {
      // Procurar pela instância usando os novos campos da API
      instance = instances.find(
        (inst: {
          name?: string
          instanceName?: string
          instance?: {
            instanceName?: string
            name?: string
          }
        }) => {
          return (
            inst.name === instanceName ||
            inst.instanceName === instanceName ||
            inst.instance?.instanceName === instanceName ||
            inst.instance?.name === instanceName
          )
        },
      )
    }

    if (!instance) {
      return NextResponse.json({
        status: 'not_found',
        connected: false,
        message: 'Instância não encontrada',
        debug: { instances, instanceName },
      })
    }

    // A nova API retorna os dados diretamente no objeto da instância
    const connectionState = instance.connectionStatus || 'close'
    const isConnected = connectionState === 'open'

    // Extrair o número do ownerJid (formato: 556281204120@s.whatsapp.net)
    const phoneNumber = instance.ownerJid ? instance.ownerJid.split('@')[0] : null

    return NextResponse.json({
      status: connectionState,
      connected: isConnected,
      instance: {
        name: instanceName,
        state: connectionState,
        profilePictureUrl: instance.profilePicUrl || null,
        profileName: instance.profileName || null,
        number: phoneNumber,
        ownerJid: instance.ownerJid || null,
        businessId: instance.businessId || null,
        integration: instance.integration || null,
        createdAt: instance.createdAt || null,
        updatedAt: instance.updatedAt || null,
      },
    })
  } catch (error) {
    console.error('Erro ao verificar status:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
