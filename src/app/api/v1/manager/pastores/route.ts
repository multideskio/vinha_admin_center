/**
 * @fileoverview API para gerenciamento de pastores (visão do gerente).
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 * @lastReview 2025-01-05 21:50 - Rate limiting and structured logging implemented
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, pastorProfiles, supervisorProfiles } from '@/db/schema'
import { eq, and, isNull, desc, sql, inArray } from 'drizzle-orm'
import { z } from 'zod'
import * as bcrypt from 'bcrypt'
import { validateRequest } from '@/lib/jwt'
import { rateLimit } from '@/lib/rate-limit'
import { pastorProfileSchema } from '@/lib/types'
import type { UserRole } from '@/lib/types'
import { env } from '@/lib/env'
import { invalidateCache } from '@/lib/cache'

const COMPANY_ID = env.COMPANY_INIT
const VALIDATED_COMPANY_ID = COMPANY_ID

const DEFAULT_PASSWORD = env.DEFAULT_PASSWORD

export async function GET(): Promise<NextResponse> {
  // Rate limiting
  const rateLimitResult = await rateLimit('anonymous', 'manager-pastors-get', 60, 60000) // 60 requests per minute
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
      { status: 429 },
    )
  }

  const { user } = await validateRequest()
  if (!user || (user.role as UserRole) !== 'manager') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const supervisorIdsResult = await db
      .select({ id: supervisorProfiles.userId })
      .from(supervisorProfiles)
      .where(eq(supervisorProfiles.managerId, user.id))

    if (supervisorIdsResult.length === 0) {
      return NextResponse.json({ pastors: [] })
    }

    const supervisorIds = supervisorIdsResult.map((s) => s.id)

    const result = await db
      .select({
        id: users.id,
        firstName: pastorProfiles.firstName,
        lastName: pastorProfiles.lastName,
        email: users.email,
        phone: users.phone,
        status: users.status,
        cpf: pastorProfiles.cpf,
        city: pastorProfiles.city,
        state: pastorProfiles.state,
        avatarUrl: users.avatarUrl,
        supervisorName: sql<string>`${supervisorProfiles.firstName} || ' ' || ${supervisorProfiles.lastName}`,
      })
      .from(users)
      .innerJoin(pastorProfiles, eq(users.id, pastorProfiles.userId))
      .leftJoin(supervisorProfiles, eq(pastorProfiles.supervisorId, supervisorProfiles.userId))
      .where(
        and(
          eq(users.role, 'pastor'),
          isNull(users.deletedAt),
          inArray(pastorProfiles.supervisorId, supervisorIds),
        ),
      )
      .orderBy(desc(users.createdAt))

    return NextResponse.json({ pastors: result })
  } catch (error) {
    // Structured logging instead of console.error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[MANAGER_PASTORS_GET_ERROR]', {
      managerId: user.id,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const rateLimitResult = await rateLimit(ip, 'manager-pastors-post', 10, 60000) // 10 requests per minute
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
      { status: 429 },
    )
  }

  const { user } = await validateRequest()
  if (!user || (user.role as UserRole) !== 'manager') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = pastorProfileSchema.parse({
      ...body,
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
    })

    if (!validatedData.supervisorId) {
      return NextResponse.json({ error: 'Supervisor é obrigatório.' }, { status: 400 })
    }

    const [supervisor] = await db
      .select({ id: supervisorProfiles.userId })
      .from(supervisorProfiles)
      .where(
        and(
          eq(supervisorProfiles.userId, validatedData.supervisorId),
          eq(supervisorProfiles.managerId, user.id),
        ),
      )

    if (!supervisor) {
      return NextResponse.json(
        { error: 'Supervisor inválido ou não pertence a este gerente.' },
        { status: 403 },
      )
    }

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

    // ✅ Invalidar cache de relatórios de membresia após criação de usuário
    await invalidateCache('relatorio:membresia:*')

    return NextResponse.json({ success: true, pastor: newPastor }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: error.errors },
        { status: 400 },
      )
    }
    console.error('Erro ao criar pastor:', error)
    // Structured logging instead of console.error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[MANAGER_PASTORS_POST_ERROR]', {
      managerId: user.id,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    })
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
