/**
 * @fileoverview Rota da API para gerenciar pastores.
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, pastorProfiles, supervisorProfiles } from '@/db/schema'
import { eq, and, isNull, desc, sql, inArray } from 'drizzle-orm'
import { z } from 'zod'
import * as bcrypt from 'bcrypt'
import { validateRequest } from '@/lib/jwt'
import { pastorProfileSchema } from '@/lib/types'
import { env } from '@/lib/env'
import { invalidateCache } from '@/lib/cache'

const COMPANY_ID = env.COMPANY_INIT
const VALIDATED_COMPANY_ID = COMPANY_ID

const DEFAULT_PASSWORD = env.DEFAULT_PASSWORD

export async function GET(request: Request): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const minimal = url.searchParams.get('minimal') === 'true'

    if (minimal) {
      // ✅ Para busca minimal, aplicar filtros por role
      let result

      if (user.role === 'admin') {
        // Admin pode ver todos os pastores
        result = await db
          .select({
            id: pastorProfiles.userId,
            firstName: pastorProfiles.firstName,
            lastName: pastorProfiles.lastName,
          })
          .from(pastorProfiles)
          .leftJoin(users, eq(users.id, pastorProfiles.userId))
          .where(isNull(users.deletedAt))
          .orderBy(desc(users.createdAt))
          .limit(500)
      } else if (user.role === 'manager') {
        // Manager pode ver pastores de seus supervisores
        const supervisorIdsResult = await db
          .select({ id: supervisorProfiles.userId })
          .from(supervisorProfiles)
          .where(eq(supervisorProfiles.managerId, user.id))

        if (supervisorIdsResult.length === 0) {
          return NextResponse.json({ pastors: [] })
        }

        const supervisorIds = supervisorIdsResult.map((s) => s.id)

        result = await db
          .select({
            id: pastorProfiles.userId,
            firstName: pastorProfiles.firstName,
            lastName: pastorProfiles.lastName,
          })
          .from(pastorProfiles)
          .leftJoin(users, eq(users.id, pastorProfiles.userId))
          .where(and(isNull(users.deletedAt), inArray(pastorProfiles.supervisorId, supervisorIds)))
          .orderBy(desc(users.createdAt))
          .limit(500)
      } else if (user.role === 'supervisor') {
        // Supervisor pode ver apenas seus pastores
        result = await db
          .select({
            id: pastorProfiles.userId,
            firstName: pastorProfiles.firstName,
            lastName: pastorProfiles.lastName,
          })
          .from(pastorProfiles)
          .leftJoin(users, eq(users.id, pastorProfiles.userId))
          .where(and(eq(pastorProfiles.supervisorId, user.id), isNull(users.deletedAt)))
          .orderBy(desc(users.createdAt))
          .limit(200)
      } else {
        // Outros roles não podem listar pastores
        return NextResponse.json({ pastors: [] })
      }

      return NextResponse.json({ pastors: result })
    }

    // ✅ Para listagem completa, aplicar filtros por role
    let result

    if (user.role === 'admin') {
      // Admin pode ver todos os pastores
      result = await db
        .select({
          id: users.id,
          firstName: pastorProfiles.firstName,
          lastName: pastorProfiles.lastName,
          email: users.email,
          phone: users.phone,
          status: users.status,
          cpf: pastorProfiles.cpf,
          supervisorName: sql<string>`${supervisorProfiles.firstName} || ' ' || ${supervisorProfiles.lastName}`,
        })
        .from(users)
        .innerJoin(pastorProfiles, eq(users.id, pastorProfiles.userId))
        .leftJoin(supervisorProfiles, eq(pastorProfiles.supervisorId, supervisorProfiles.userId))
        .where(and(eq(users.role, 'pastor'), isNull(users.deletedAt)))
        .orderBy(desc(users.createdAt))
        .limit(500)
    } else if (user.role === 'manager') {
      // Manager pode ver pastores de seus supervisores
      const supervisorIdsResult = await db
        .select({ id: supervisorProfiles.userId })
        .from(supervisorProfiles)
        .where(eq(supervisorProfiles.managerId, user.id))

      if (supervisorIdsResult.length === 0) {
        return NextResponse.json({ pastors: [] })
      }

      const supervisorIds = supervisorIdsResult.map((s) => s.id)

      result = await db
        .select({
          id: users.id,
          firstName: pastorProfiles.firstName,
          lastName: pastorProfiles.lastName,
          email: users.email,
          phone: users.phone,
          status: users.status,
          cpf: pastorProfiles.cpf,
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
        .limit(500)
    } else if (user.role === 'supervisor') {
      // Supervisor pode ver apenas seus pastores
      result = await db
        .select({
          id: users.id,
          firstName: pastorProfiles.firstName,
          lastName: pastorProfiles.lastName,
          email: users.email,
          phone: users.phone,
          status: users.status,
          cpf: pastorProfiles.cpf,
          supervisorName: sql<string>`${supervisorProfiles.firstName} || ' ' || ${supervisorProfiles.lastName}`,
        })
        .from(users)
        .innerJoin(pastorProfiles, eq(users.id, pastorProfiles.userId))
        .leftJoin(supervisorProfiles, eq(pastorProfiles.supervisorId, supervisorProfiles.userId))
        .where(
          and(
            eq(users.role, 'pastor'),
            eq(pastorProfiles.supervisorId, user.id),
            isNull(users.deletedAt),
          ),
        )
        .orderBy(desc(users.createdAt))
        .limit(200)
    } else {
      // Outros roles não podem listar pastores
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    return NextResponse.json({ pastors: result })
  } catch (error) {
    console.error('Erro ao buscar pastores:', error)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  // ✅ Admin, Manager e Supervisor podem criar pastores
  if (!['admin', 'manager', 'supervisor'].includes(user.role)) {
    return NextResponse.json(
      {
        error:
          'Acesso negado. Apenas administradores, gerentes e supervisores podem criar pastores.',
      },
      { status: 403 },
    )
  }

  try {
    const body = await request.json()
    const validatedData = pastorProfileSchema.parse({
      ...body,
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
    })

    // ✅ Validar se o supervisor pertence à hierarquia do usuário
    if (user.role === 'manager') {
      // Manager deve verificar se o supervisor pertence a ele
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
    } else if (user.role === 'supervisor') {
      // Supervisor só pode criar pastores para si mesmo
      if (!validatedData.supervisorId || validatedData.supervisorId !== user.id) {
        return NextResponse.json(
          { error: 'Supervisor pode criar pastores apenas para si mesmo.' },
          { status: 403 },
        )
      }
    }
    // Admin pode criar para qualquer supervisor (sem validação adicional)

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
  } catch (error: unknown) {
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
      ((error as Record<string, unknown>).constraint === 'users_email_unique' ||
        (error as Record<string, unknown>).constraint === 'pastor_profiles_cpf_unique')
    ) {
      return NextResponse.json({ error: 'Email ou CPF já cadastrado.' }, { status: 409 })
    }

    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
