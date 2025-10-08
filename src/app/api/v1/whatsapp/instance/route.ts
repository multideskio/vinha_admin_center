/**
 * @fileoverview API para gerenciar instâncias do WhatsApp Evolution API v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const instanceSchema = z.object({
  instanceName: z.string().min(1),
  serverUrl: z.string().url(),
  apiKey: z.string().min(1),
})

// GET - Verificar se instância existe
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instanceName = searchParams.get('instanceName')
    const serverUrl = searchParams.get('serverUrl')
    const apiKey = searchParams.get('apiKey')

    if (!instanceName || !serverUrl || !apiKey) {
      return NextResponse.json(
        { error: 'instanceName, serverUrl and apiKey are required' },
        { status: 400 }
      )
    }

    // Buscar todas as instâncias
    const url = `${serverUrl}/instance/fetchInstances`
    const options = {
      method: 'GET',
      headers: { apikey: apiKey }
    }

    const response = await fetch(url, options)
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch instances from Evolution API' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const instances = Array.isArray(data) ? data : []
    
    // Verificar se a instância existe
    const instanceExists = instances.some((instance: {
      name?: string
      instanceName?: string
      instance?: {
        instanceName?: string
        name?: string
      }
    }) => 
      instance.name === instanceName || 
      instance.instanceName === instanceName || 
      instance.instance?.instanceName === instanceName ||
      instance.instance?.name === instanceName
    )

    return NextResponse.json({ 
      exists: instanceExists,
      instances: instances.length,
      instanceName 
    })
  } catch (error) {
    console.error('Error checking instance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Criar instância se não existir
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { instanceName, serverUrl, apiKey } = instanceSchema.parse(body)

    // Primeiro verificar se já existe
    const checkUrl = `${serverUrl}/instance/fetchInstances`
    const checkOptions = {
      method: 'GET',
      headers: { apikey: apiKey }
    }

    const checkResponse = await fetch(checkUrl, checkOptions)
    
    if (checkResponse.ok) {
      const data = await checkResponse.json()
      const instances = Array.isArray(data) ? data : []
      
      const instanceExists = instances.some((instance: {
        name?: string
        instanceName?: string
        instance?: {
          instanceName?: string
          name?: string
        }
      }) => 
        instance.name === instanceName || 
        instance.instanceName === instanceName || 
        instance.instance?.instanceName === instanceName ||
        instance.instance?.name === instanceName
      )

      if (instanceExists) {
        return NextResponse.json({ 
          message: 'Instance already exists',
          instanceName,
          created: false
        })
      }
    }

    // Criar nova instância
    const createUrl = `${serverUrl}/instance/create`
    const createOptions = {
      method: 'POST',
      headers: { 
        apikey: apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instanceName,
        integration: 'WHATSAPP-BAILEYS'
      })
    }

    const createResponse = await fetch(createUrl, createOptions)
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      return NextResponse.json(
        { error: 'Failed to create instance', details: errorText },
        { status: createResponse.status }
      )
    }

    const createData = await createResponse.json()

    return NextResponse.json({ 
      message: 'Instance created successfully',
      instanceName,
      created: true,
      data: createData
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating instance:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}