import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, supervisorProfiles, regions } from '@/db/schema'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { z } from 'zod'
import * as bcrypt from 'bcrypt'
import { validateRequest } from '@/lib/jwt'
import { supervisorProfileSchema } from '@/lib/types'
import { getErrorMessage } from '@/lib/error-types'
import { rateLimit } from '@/lib/rate-limit'
import type { UserRole } from '@/lib/types'

const COMPANY_ID = process.env.COMPANY_INIT
if (!COMPANY_ID) {
  throw new Error('COMPANY_INIT environment variable is required')
}
const VALIDATED_COMPANY_ID = COMPANY_ID as string

const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || '123456'

export async function GET(request: Request): Promise<NextResponse> {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const rateLimitResult = await rateLimit(ip, 'manager-supervisores-get', 60, 60000) // 60 requests per minute
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
    const url = new URL(request.url)
    const minimal = url.searchParams.get('minimal') === 'true'

    if (minimal) {
      const result = await db
        .select({
          id: users.id,
          firstName: supervisorProfiles.firstName,
          lastName: supervisorProfiles.lastName,
        })
        .from(supervisorProfiles)
        .innerJoin(users, eq(users.id, supervisorProfiles.userId))
        .where(
          and(
            eq(users.role, 'supervisor'),
            eq(supervisorProfiles.managerId, user.id),
            isNull(users.deletedAt),
          ),
        )
        .orderBy(desc(users.createdAt))

      const supervisorsWithName = result.map((s) => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
      }))

      return NextResponse.json({ supervisors: supervisorsWithName })
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
        regionId: supervisorProfiles.regionId,
        regionName: regions.name,
        regionColor: regions.color,
        createdAt: users.createdAt,
      })
      .from(users)
      .innerJoin(supervisorProfiles, eq(users.id, supervisorProfiles.userId))
      .leftJoin(regions, eq(supervisorProfiles.regionId, regions.id))
      .where(
        and(
          eq(users.role, 'supervisor'),
          eq(supervisorProfiles.managerId, user.id),
          isNull(users.deletedAt),
        ),
      )
      .orderBy(desc(users.createdAt))

    return NextResponse.json({ supervisors: result })
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error)
    // Structured logging instead of console.error
    console.error('[MANAGER_SUPERVISORES_GET_ERROR]', {
      managerId: user.id,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: errorMessage },
      { status: 500 },
    )
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const rateLimitResult = await rateLimit(ip, 'manager-supervisores-post', 10, 60000) // 10 requests per minute
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
    const validatedData = supervisorProfileSchema
      .omit({ id: true, userId: true, managerId: true })
      .parse(body)

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
        throw new Error('Falha ao criar usuário')
      }

      const [newProfile] = await tx
        .insert(supervisorProfiles)
        .values({
          userId: newUser.id,
          managerId: user.id,
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

    return NextResponse.json({ success: true, supervisor: newSupervisor }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: error.errors },
        { status: 400 },
      )
    }
    // Structured logging instead of console.error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[MANAGER_SUPERVISORES_POST_ERROR]', {
      managerId: user.id,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    })
    if (
      error instanceof Error &&
      'constraint' in error &&
      ((error as Record<string, unknown>).constraint === 'users_email_unique' ||
        (error as Record<string, unknown>).constraint === 'supervisor_profiles_cpf_unique')
    ) {
      return NextResponse.json({ error: 'Email ou CPF já cadastrado.' }, { status: 409 })
    }

    return NextResponse.json(
      { error: 'Erro ao criar supervisor', details: (error as Error).message },
      { status: 500 },
    )
  }
}
