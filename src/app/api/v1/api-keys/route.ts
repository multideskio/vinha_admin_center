/**
 * @fileoverview Rota da API para gerenciamento de chaves de API.
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { apiKeys } from '@/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { validateRequest } from '@/lib/jwt'

const newKeySchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
})

export async function GET(): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  try {
    const allKeys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        key: sql<string>`LEFT(${apiKeys.key}, 8) || '...'`,
        status: apiKeys.status,
        createdAt: apiKeys.createdAt,
        lastUsedAt: apiKeys.lastUsedAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.companyId, user.companyId))
      .orderBy(desc(apiKeys.createdAt))
      .limit(50)

    return NextResponse.json({ keys: allKeys })
  } catch (error) {
    console.error('Erro ao buscar chaves de API:', error)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const validatedData = newKeySchema.parse(body)

    const newRawKey = `vinha_sk_${randomBytes(24).toString('hex')}`

    const [newKeyRecord] = await db
      .insert(apiKeys)
      .values({
        companyId: user.companyId,
        name: validatedData.name,
        key: newRawKey, // Em um cenário real, você faria o hash disso
        status: 'active',
      })
      .returning({ id: apiKeys.id })

    if (!newKeyRecord) {
      throw new Error('Falha ao criar a chave de API.')
    }

    return NextResponse.json(
      { success: true, key: newRawKey, id: newKeyRecord.id },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: error.errors },
        { status: 400 },
      )
    }
    console.error('Erro ao criar chave de API:', error)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
