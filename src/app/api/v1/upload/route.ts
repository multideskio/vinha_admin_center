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

// ✅ CORRIGIDO: Schema com validação de pasta permitida
const uploadSchema = z.object({
  folder: z
    .enum(['uploads', 'avatars', 'documents', 'receipts', 'certificates'])
    .default('uploads'),
  filename: z.string().min(1).max(255),
  subfolder: z.string().optional(), // Para organizar melhor os arquivos
})

// ✅ CORRIGIDO: Constantes de segurança
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/x-pkcs12', // .pfx
  'application/x-pem-file', // .pem
]

export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'uploads'
    const filename = (formData.get('filename') as string) || file.name
    const subfolder = formData.get('subfolder') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // ✅ CORRIGIDO: Validar tamanho do arquivo
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 413 },
      )
    }

    // ✅ CORRIGIDO: Validar tipo de arquivo
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Invalid file type',
          allowedTypes: ALLOWED_FILE_TYPES,
          receivedType: file.type,
        },
        { status: 400 },
      )
    }

    // ✅ CORRIGIDO: Sanitizar filename (remover caracteres perigosos)
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')

    // ✅ CORRIGIDO: Validar dados com schema seguro
    const validatedData = uploadSchema.parse({
      folder,
      filename: sanitizedFilename,
      subfolder: subfolder || undefined, // Converter null para undefined
    })

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

    // Gerar chave única com subfolder se fornecida
    const folderPath = validatedData.subfolder
      ? `${validatedData.folder}/${validatedData.subfolder}`
      : validatedData.folder
    const key = s3Service.generateKey(folderPath, validatedData.filename)

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
        { status: 400 },
      )
    }

    if (error instanceof Error) {
      if (error.message.includes('S3 configuration')) {
        return NextResponse.json(
          { error: 'S3 not configured. Please configure S3 settings first.' },
          { status: 400 },
        )
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
