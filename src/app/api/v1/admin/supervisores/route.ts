/**
 * @fileoverview API para gerenciamento de supervisores (acesso de administrador).
 * @version 1.3
 * @date 2024-08-08
 * @author PH
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, supervisorProfiles, managerProfiles, regions } from '@/db/schema'
import { eq, and, isNull, desc, sql } from 'drizzle-orm'
import { z } from 'zod'
import * as bcrypt from 'bcrypt'
import { validateRequest } from '@/lib/jwt'
import { supervisorProfileSchema } from '@/lib/types'
import type { UserRole } from '@/lib/types'
import { env } from '@/lib/env'
import { getCache, setCache, invalidateCache } from '@/lib/cache'

const COMPANY_ID = env.COMPANY_INIT
const VALIDATED_COMPANY_ID = COMPANY_ID

const DEFAULT_PASSWORD = env.DEFAULT_PASSWORD

/** TTL de 10 minutos — supervisores mudam raramente */
const SUPERVISORS_CACHE_TTL = 600

export async function GET(request: Request): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user || (user.role as UserRole) !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const minimal = url.searchParams.get('minimal') === 'true'

    const cacheKey = `supervisores:${VALIDATED_COMPANY_ID}:minimal:${minimal}`
    const cached = await getCache<{ supervisors: unknown[] }>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    if (minimal) {
      const result = await db
        .select({
          id: users.id,
          firstName: supervisorProfiles.firstName,
          lastName: supervisorProfiles.lastName,
        })
        .from(supervisorProfiles)
        .innerJoin(users, eq(users.id, supervisorProfiles.userId))
        .where(and(eq(users.role, 'supervisor'), isNull(users.deletedAt)))
        .orderBy(desc(users.createdAt))

      const response = { supervisors: result }
      await setCache(cacheKey, response, SUPERVISORS_CACHE_TTL)
      return NextResponse.json(response)
    }

    const result = await db
      .select({
        id: users.id,
        firstName: supervisorProfiles.firstName,
        lastName: supervisorProfiles.lastName,
        email: users.email,
        phone: users.phone,
        status: users.status,
        cpf: supervisorProfiles.cpf,
        avatarUrl: users.avatarUrl,
        managerName: sql<string>`${managerProfiles.firstName} || ' ' || ${managerProfiles.lastName}`,
        regionName: regions.name,
      })
      .from(users)
      .innerJoin(supervisorProfiles, eq(users.id, supervisorProfiles.userId))
      .leftJoin(managerProfiles, eq(supervisorProfiles.managerId, managerProfiles.userId))
      .leftJoin(regions, eq(supervisorProfiles.regionId, regions.id))
      .where(and(eq(users.role, 'supervisor'), isNull(users.deletedAt)))
      .orderBy(desc(users.createdAt))

    const response = { supervisors: result }
    await setCache(cacheKey, response, SUPERVISORS_CACHE_TTL)
    return NextResponse.json(response)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro ao buscar supervisores:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor.', details: errorMessage },
      { status: 500 },
    )
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user || (user.role as UserRole) !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = supervisorProfileSchema.omit({ id: true, userId: true }).parse(body)

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)

    const newSupervisor = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          companyId: VALIDATED_COMPANY_ID,
          email: validatedData.email,
          password: hashedPassword,
          role: 'supervisor',
          status: 'active',
          phone: validatedData.phone,
          titheDay: validatedData.titheDay,
        })
        .returning()

      if (!newUser) {
        tx.rollback()
        throw new Error('Falha ao criar o usuário.')
      }

      const [newProfile] = await tx
        .insert(supervisorProfiles)
        .values({
          userId: newUser.id,
          managerId: validatedData.managerId,
          regionId: validatedData.regionId,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          cpf: validatedData.cpf,
          cep: validatedData.cep,
          state: validatedData.state,
          city: validatedData.city,
          neighborhood: validatedData.neighborhood,
          address: validatedData.address,
        })
        .returning()

      return { ...newUser, ...newProfile }
    })

    // Invalidar caches após criação de supervisor
    await invalidateCache(`supervisores:${VALIDATED_COMPANY_ID}:*`)
    await invalidateCache('relatorio:membresia:*')

    return NextResponse.json({ success: true, supervisor: newSupervisor }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: error.errors },
        { status: 400 },
      )
    }
    console.error('Erro ao criar supervisor:', error)
    if (
      error instanceof Error &&
      'constraint' in error &&
      ((error as Record<string, unknown>).constraint === 'users_email_unique' ||
        (error as Record<string, unknown>).constraint === 'supervisor_profiles_cpf_unique')
    ) {
      return NextResponse.json({ error: 'Email ou CPF já cadastrado.' }, { status: 409 })
    }

    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
