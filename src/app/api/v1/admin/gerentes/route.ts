/**
 * @fileoverview API para gerenciamento de gerentes (visão do admin).
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, managerProfiles } from '@/db/schema'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { z } from 'zod'
import * as bcrypt from 'bcrypt'
import { validateRequest } from '@/lib/jwt'
import { managerProfileSchema } from '@/lib/types'
import { env } from '@/lib/env'
import { getCache, setCache, invalidateCache } from '@/lib/cache'

const COMPANY_ID = env.COMPANY_INIT
const VALIDATED_COMPANY_ID = COMPANY_ID

const DEFAULT_PASSWORD = env.DEFAULT_PASSWORD

/** TTL de 10 minutos — gerentes mudam raramente */
const MANAGERS_CACHE_TTL = 600

export async function GET(request: Request): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const minimal = url.searchParams.get('minimal') === 'true'

    const cacheKey = `gerentes:${VALIDATED_COMPANY_ID}:minimal:${minimal}`
    const cached = await getCache<{ managers: unknown[] }>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    if (minimal) {
      const result = await db
        .select({
          id: users.id,
          firstName: managerProfiles.firstName,
          lastName: managerProfiles.lastName,
        })
        .from(managerProfiles)
        .innerJoin(users, eq(users.id, managerProfiles.userId))
        .where(and(eq(users.role, 'manager'), isNull(users.deletedAt)))
        .orderBy(desc(users.createdAt))

      const response = { managers: result }
      await setCache(cacheKey, response, MANAGERS_CACHE_TTL)
      return NextResponse.json(response)
    }

    const result = await db
      .select({
        user: users,
        profile: managerProfiles,
      })
      .from(users)
      .leftJoin(managerProfiles, eq(users.id, managerProfiles.userId))
      .where(and(eq(users.role, 'manager'), isNull(users.deletedAt)))
      .orderBy(desc(users.createdAt))

    const managers = result.map((r) => ({
      ...r.user,
      ...r.profile,
      id: r.user.id,
    }))

    const response = { managers }
    await setCache(cacheKey, response, MANAGERS_CACHE_TTL)
    return NextResponse.json(response)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro ao buscar gerentes:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar gerentes', details: errorMessage },
      { status: 500 },
    )
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = managerProfileSchema.omit({ id: true, userId: true }).parse(body)

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)

    if (!validatedData.email) {
      return NextResponse.json({ error: 'E-mail é obrigatório.' }, { status: 400 })
    }

    const newManager = await db.transaction(async (tx) => {
      const userInsertData = {
        companyId: VALIDATED_COMPANY_ID,
        email: validatedData.email,
        password: hashedPassword,
        role: 'manager' as const,
        status: 'active' as const,
        phone: validatedData.phone,
        titheDay: validatedData.titheDay,
      }
      const [newUser] = await tx.insert(users).values([userInsertData]).returning()

      if (!newUser) {
        tx.rollback()
        throw new Error('Falha ao criar o usuário.')
      }

      const [newProfile] = await tx
        .insert(managerProfiles)
        .values({
          userId: newUser.id,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          cpf: validatedData.cpf,
          landline: validatedData.landline,
          cep: validatedData.cep,
          state: validatedData.state,
          city: validatedData.city,
          neighborhood: validatedData.neighborhood,
          address: validatedData.address,
          facebook: validatedData.facebook,
          instagram: validatedData.instagram,
          website: validatedData.website,
        })
        .returning()

      return { ...newUser, ...newProfile }
    })

    // Invalidar caches após criação de gerente
    await invalidateCache(`gerentes:${VALIDATED_COMPANY_ID}:*`)
    await invalidateCache('relatorio:membresia:*')

    return NextResponse.json({ success: true, manager: newManager }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: error.errors },
        { status: 400 },
      )
    }
    console.error('Erro ao criar gerente:', error)
    if (
      error instanceof Error &&
      'constraint' in error &&
      (error as Record<string, unknown>).constraint === 'users_email_unique'
    ) {
      return NextResponse.json({ error: 'Este e-mail já está em uso.' }, { status: 409 })
    }

    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro ao criar gerente', details: errorMessage },
      { status: 500 },
    )
  }
}
