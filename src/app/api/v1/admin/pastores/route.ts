/**
 * @fileoverview Rota da API para gerenciar pastores (visão do admin).
 * @version 1.0
 * @date 2024-08-08
 * @author PH
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, pastorProfiles, supervisorProfiles } from '@/db/schema'
import { eq, and, isNull, desc, sql } from 'drizzle-orm'
import { z } from 'zod'
import * as bcrypt from 'bcrypt'
import { validateRequest } from '@/lib/jwt'
import { pastorProfileSchema } from '@/lib/types'
import { env } from '@/lib/env'
import { getCache, setCache, invalidateCache } from '@/lib/cache'

const COMPANY_ID = env.COMPANY_INIT
const VALIDATED_COMPANY_ID = COMPANY_ID

const DEFAULT_PASSWORD = env.DEFAULT_PASSWORD

/** TTL de 10 minutos — pastores mudam raramente */
const PASTORS_CACHE_TTL = 600

export async function GET(request: Request): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const minimal = url.searchParams.get('minimal') === 'true'

    const cacheKey = `pastores:${VALIDATED_COMPANY_ID}:minimal:${minimal}`
    const cached = await getCache<{ pastors: unknown[] }>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    if (minimal) {
      const result = await db
        .select({
          id: pastorProfiles.userId,
          firstName: pastorProfiles.firstName,
          lastName: pastorProfiles.lastName,
        })
        .from(pastorProfiles)
        .leftJoin(users, eq(users.id, pastorProfiles.userId))
        .where(isNull(users.deletedAt))
        .orderBy(desc(users.createdAt))

      const response = { pastors: result }
      await setCache(cacheKey, response, PASTORS_CACHE_TTL)
      return NextResponse.json(response)
    }

    const result = await db
      .select({
        id: users.id,
        firstName: pastorProfiles.firstName,
        lastName: pastorProfiles.lastName,
        email: users.email,
        phone: users.phone,
        status: users.status,
        cpf: pastorProfiles.cpf,
        avatarUrl: users.avatarUrl,
        supervisorName: sql<string>`${supervisorProfiles.firstName} || ' ' || ${supervisorProfiles.lastName}`,
      })
      .from(users)
      .innerJoin(pastorProfiles, eq(users.id, pastorProfiles.userId))
      .leftJoin(supervisorProfiles, eq(pastorProfiles.supervisorId, supervisorProfiles.userId))
      .where(and(eq(users.role, 'pastor'), isNull(users.deletedAt)))
      .orderBy(desc(users.createdAt))

    const response = { pastors: result }
    await setCache(cacheKey, response, PASTORS_CACHE_TTL)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Erro ao buscar pastores:', error)
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
    const validatedData = pastorProfileSchema.parse({
      ...body,
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
    })

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)

    const newPastor = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          companyId: VALIDATED_COMPANY_ID,
          email: validatedData.email,
          password: hashedPassword,
          role: 'pastor',
          status: 'active',
          phone: validatedData.phone,
          titheDay: validatedData.titheDay,
        })
        .returning()

      if (!newUser) {
        tx.rollback()
        throw new Error('Falha ao criar o usuário para o pastor.')
      }

      const [newProfile] = await tx
        .insert(pastorProfiles)
        .values({
          userId: newUser.id,
          supervisorId: validatedData.supervisorId,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          cpf: validatedData.cpf,
          birthDate: validatedData.birthDate ? validatedData.birthDate.toISOString() : null,
          cep: validatedData.cep,
          state: validatedData.state,
          city: validatedData.city,
          neighborhood: validatedData.neighborhood,
          address: validatedData.address,
        })
        .returning()

      return { ...newUser, ...newProfile }
    })

    // Invalidar caches após criação de pastor
    await invalidateCache(`pastores:${VALIDATED_COMPANY_ID}:*`)
    await invalidateCache('relatorio:membresia:*')

    return NextResponse.json({ success: true, pastor: newPastor }, { status: 201 })
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const message = error instanceof Error ? error.message : 'Erro interno do servidor'
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: error.errors },
        { status: 400 },
      )
    }
    console.error('Erro ao criar pastor:', error)
    if (
      error instanceof Error &&
      'constraint' in error &&
      ((error as Error & { constraint: string }).constraint === 'users_email_unique' ||
        (error as Error & { constraint: string }).constraint === 'pastor_profiles_cpf_unique')
    ) {
      return NextResponse.json({ error: 'Email ou CPF já cadastrado.' }, { status: 409 })
    }

    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
