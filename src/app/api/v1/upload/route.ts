/**
 * @fileoverview API para upload de arquivos para S3
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from '@/lib/jwt'
import { createS3Service } from '@/lib/s3-client'
import { db } from '@/db/drizzle'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const uploadSchema = z.object({
  folder: z.string().min(1).default('uploads'),
  filename: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'uploads'
    const filename = formData.get('filename') as string || file.name

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validar dados
    const validatedData = uploadSchema.parse({ folder, filename })

    // Converter arquivo para buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Buscar companyId do usuário
    const [userData] = await db
      .select({ companyId: users.companyId })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Inicializar serviço S3
    const s3Service = await createS3Service(userData.companyId)
    
    // Gerar chave única
    const key = s3Service.generateKey(validatedData.folder, validatedData.filename)
    
    // Upload do arquivo
    const url = await s3Service.uploadFile(buffer, key, file.type)

    return NextResponse.json({
      success: true,
      url,
      key,
      filename: validatedData.filename,
      size: file.size,
      type: file.type,
    })

  } catch (error) {
    console.error('Upload error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      if (error.message.includes('S3 configuration')) {
        return NextResponse.json(
          { error: 'S3 not configured. Please configure S3 settings first.' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json({ error: 'File key is required' }, { status: 400 })
    }

    // Buscar companyId do usuário
    const [userData] = await db
      .select({ companyId: users.companyId })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Inicializar serviço S3
    const s3Service = await createS3Service(userData.companyId)
    
    // Deletar arquivo
    await s3Service.deleteFile(key)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}