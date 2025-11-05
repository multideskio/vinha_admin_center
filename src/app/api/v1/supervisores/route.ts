/**
 * @fileoverview API para gerenciamento de supervisores (acesso de administrador).
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, supervisorProfiles, managerProfiles, regions } from '@/db/schema'
import { eq, and, isNull, desc, sql } from 'drizzle-orm'
import { z } from 'zod'
import * as bcrypt from 'bcrypt'
import { validateRequest } from '@/lib/jwt'

import { getCompanyId } from '@/lib/utils'

const COMPANY_ID = getCompanyId()

const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || '123456'

const supervisorSchema = z.object({
  managerId: z.string().uuid(),
  regionId: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  cpf: z.string().min(1),
  email: z.string().email(),
  cep: z.string().nullable(),
  state: z.string().nullable(),
  city: z.string().nullable(),
  neighborhood: z.string().nullable(),
  address: z.string().nullable(),
  titheDay: z.number().nullable(),
  phone: z.string().nullable(),
})

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url)
  const minimal = url.searchParams.get('minimal') === 'true'

  if (minimal) {
    // ✅ Paginação e busca para evitar retornar milhares de registros
    const search = url.searchParams.get('search') || ''
    const limit = parseInt(url.searchParams.get('limit') || '50', 10)
    const offset = parseInt(url.searchParams.get('offset') || '0', 10)

    let query = db
      .select({
        id: users.id,
        firstName: supervisorProfiles.firstName,
        lastName: supervisorProfiles.lastName,
      })
      .from(supervisorProfiles)
      .innerJoin(users, eq(users.id, supervisorProfiles.userId))
      .where(and(eq(users.role, 'supervisor'), isNull(users.deletedAt)))
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset)

    // ✅ Busca por nome (case-insensitive)
    if (search) {
      const searchPattern = `%${search.toLowerCase()}%`
      query = db
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
            isNull(users.deletedAt),
            sql`(LOWER(${supervisorProfiles.firstName}) LIKE ${searchPattern} OR LOWER(${supervisorProfiles.lastName}) LIKE ${searchPattern})`
          )
        )
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset)
    }

    const result = await query
    return NextResponse.json({ supervisors: result })
  }

  const { user } = await validateRequest()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const result = await db
      .select({
        id: users.id,
        firstName: supervisorProfiles.firstName,
        lastName: supervisorProfiles.lastName,
        email: users.email,
        phone: users.phone,
        status: users.status,
        cpf: supervisorProfiles.cpf,
        managerName: sql<string>`${managerProfiles.firstName} || ' ' || ${managerProfiles.lastName}`,
        regionName: regions.name,
      })
      .from(users)
      .innerJoin(supervisorProfiles, eq(users.id, supervisorProfiles.userId))
      .leftJoin(managerProfiles, eq(supervisorProfiles.managerId, managerProfiles.userId))
      .leftJoin(regions, eq(supervisorProfiles.regionId, regions.id))
      .where(and(eq(users.role, 'supervisor'), isNull(users.deletedAt)))
      .orderBy(desc(users.createdAt))

    return NextResponse.json({ supervisors: result })
  } catch (error: unknown) {
    console.error('Erro ao buscar supervisores:', error)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = supervisorSchema.parse(body)

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)

    const newSupervisor = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          companyId: COMPANY_ID,
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
        throw new Error('Falha ao criar usuário para supervisor.')
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

    return NextResponse.json({ success: true, supervisor: newSupervisor }, { status: 201 })
  } catch (error: unknown) {
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
