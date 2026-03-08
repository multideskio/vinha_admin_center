import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validateRequest } from '@/lib/jwt'

// Force recompilation
const statusRequestSchema = z.object({
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
    const { apiUrl, apiKey, instanceName } = statusRequestSchema.parse(body)

    // Remove trailing slash from apiUrl
    const baseUrl = apiUrl.replace(/\/$/, '')

    // Check instance status using Evolution API v2
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10_000)
    let response: Response
    try {
      response = await fetch(`${baseUrl}/instance/fetchInstances`, {
        method: 'GET',
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
        console.error('[WHATSAPP_TIMEOUT] Timeout ao verificar status da instância')
        return NextResponse.json(
          { error: 'Timeout ao comunicar com Evolution API' },
          { status: 504 },
        )
      }
      throw fetchError
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Erro ao verificar status da instância' },
        { status: response.status },
      )
    }

    const instances = await response.json()

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

    type EvolutionInstance = {
      connectionStatus?: string
      ownerJid?: string
      profilePicUrl?: string
      profileName?: string
      businessId?: string
      integration?: string
      createdAt?: string
      updatedAt?: string
    }
    const inst = instance as EvolutionInstance
    // A nova API retorna os dados diretamente no objeto da instância
    const connectionState = inst.connectionStatus || 'close'
    const isConnected = connectionState === 'open'

    // Extrair o número do ownerJid (formato: 556281204120@s.whatsapp.net)
    const phoneNumber = inst.ownerJid ? inst.ownerJid.split('@')[0] : null

    return NextResponse.json({
      status: connectionState,
      connected: isConnected,
      instance: {
        name: instanceName,
        state: connectionState,
        profilePictureUrl: inst.profilePicUrl || null,
        profileName: inst.profileName || null,
        number: phoneNumber,
        ownerJid: inst.ownerJid || null,
        businessId: inst.businessId || null,
        integration: inst.integration || null,
        createdAt: inst.createdAt || null,
        updatedAt: inst.updatedAt || null,
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
