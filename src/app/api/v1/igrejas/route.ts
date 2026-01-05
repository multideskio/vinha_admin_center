/**
 * @fileoverview Rota da API para gerenciar igrejas.
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, churchProfiles, supervisorProfiles } from '@/db/schema'
import { eq, and, isNull, desc, sql, inArray } from 'drizzle-orm'
import { z } from 'zod'
import * as bcrypt from 'bcrypt'
import { validateRequest } from '@/lib/jwt'

const COMPANY_ID = process.env.COMPANY_INIT
if (!COMPANY_ID) {
  throw new Error('A variável de ambiente COMPANY_INIT não está definida.')
}
const VALIDATED_COMPANY_ID = COMPANY_ID as string

const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || '123456'

const churchSchema = z.object({
  supervisorId: z.string().uuid(),
  cnpj: z.string().min(1),
  razaoSocial: z.string().min(1),
  nomeFantasia: z.string().min(1),
  email: z.string().email(),
  cep: z.string().nullable(),
  state: z.string().nullable(),
  city: z.string().nullable(),
  neighborhood: z.string().nullable(),
  address: z.string().nullable(),
  foundationDate: z.date().nullable(),
  titheDay: z.number().nullable(),
  phone: z.string().nullable(),
  treasurerFirstName: z.string().nullable(),
  treasurerLastName: z.string().nullable(),
  treasurerCpf: z.string().nullable(),
})

export async function GET(request: Request): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const minimal = url.searchParams.get('minimal') === 'true'

    if (minimal) {
      // ✅ Para busca minimal, qualquer usuário logado pode acessar
      const result = await db
        .select({
          id: churchProfiles.userId,
          nomeFantasia: churchProfiles.nomeFantasia,
        })
        .from(churchProfiles)
        .leftJoin(users, eq(users.id, churchProfiles.userId))
        .where(isNull(users.deletedAt))
        .orderBy(desc(users.createdAt))
      return NextResponse.json({ churches: result })
    }

    // ✅ Para listagem completa, aplicar filtros por role
    let result

    if (user.role === 'admin') {
      // Admin pode ver todas as igrejas
      result = await db
        .select({
          id: users.id,
          nomeFantasia: churchProfiles.nomeFantasia,
          email: users.email,
          phone: users.phone,
          status: users.status,
          cnpj: churchProfiles.cnpj,
          avatarUrl: users.avatarUrl,
          supervisorName: sql<string>`${supervisorProfiles.firstName} || ' ' || ${supervisorProfiles.lastName}`,
        })
        .from(users)
        .innerJoin(churchProfiles, eq(users.id, churchProfiles.userId))
        .leftJoin(supervisorProfiles, eq(churchProfiles.supervisorId, supervisorProfiles.userId))
        .where(and(eq(users.role, 'church_account'), isNull(users.deletedAt)))
        .orderBy(desc(users.createdAt))
    } else if (user.role === 'manager') {
      // Manager pode ver igrejas de seus supervisores
      const supervisorIdsResult = await db
        .select({ id: supervisorProfiles.userId })
        .from(supervisorProfiles)
        .where(eq(supervisorProfiles.managerId, user.id))

      if (supervisorIdsResult.length === 0) {
        return NextResponse.json({ churches: [] })
      }

      const supervisorIds = supervisorIdsResult.map((s) => s.id)

      result = await db
        .select({
          id: users.id,
          nomeFantasia: churchProfiles.nomeFantasia,
          email: users.email,
          phone: users.phone,
          status: users.status,
          cnpj: churchProfiles.cnpj,
          avatarUrl: users.avatarUrl,
          supervisorName: sql<string>`${supervisorProfiles.firstName} || ' ' || ${supervisorProfiles.lastName}`,
        })
        .from(users)
        .innerJoin(churchProfiles, eq(users.id, churchProfiles.userId))
        .leftJoin(supervisorProfiles, eq(churchProfiles.supervisorId, supervisorProfiles.userId))
        .where(
          and(
            eq(users.role, 'church_account'),
            isNull(users.deletedAt),
            inArray(churchProfiles.supervisorId, supervisorIds),
          ),
        )
        .orderBy(desc(users.createdAt))
    } else if (user.role === 'supervisor') {
      // Supervisor pode ver apenas suas igrejas
      result = await db
        .select({
          id: users.id,
          nomeFantasia: churchProfiles.nomeFantasia,
          email: users.email,
          phone: users.phone,
          status: users.status,
          cnpj: churchProfiles.cnpj,
          avatarUrl: users.avatarUrl,
          supervisorName: sql<string>`${supervisorProfiles.firstName} || ' ' || ${supervisorProfiles.lastName}`,
        })
        .from(users)
        .innerJoin(churchProfiles, eq(users.id, churchProfiles.userId))
        .leftJoin(supervisorProfiles, eq(churchProfiles.supervisorId, supervisorProfiles.userId))
        .where(
          and(
            eq(users.role, 'church_account'),
            eq(churchProfiles.supervisorId, user.id),
            isNull(users.deletedAt),
          ),
        )
        .orderBy(desc(users.createdAt))
    } else {
      // Outros roles não podem listar igrejas
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    return NextResponse.json({ churches: result })
  } catch (error) {
    console.error('Erro ao buscar igrejas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  // ✅ Admin, Manager e Supervisor podem criar igrejas
  if (!['admin', 'manager', 'supervisor'].includes(user.role)) {
    return NextResponse.json(
      {
        error:
          'Acesso negado. Apenas administradores, gerentes e supervisores podem criar igrejas.',
      },
      { status: 403 },
    )
  }

  try {
    const body = await request.json()
    const validatedData = churchSchema.parse({
      ...body,
      foundationDate: body.foundationDate ? new Date(body.foundationDate) : null,
    })

    // ✅ Validar se o supervisor pertence à hierarquia do usuário
    if (user.role === 'manager') {
      // Manager deve verificar se o supervisor pertence a ele
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
      // Supervisor só pode criar igrejas para si mesmo
      if (validatedData.supervisorId !== user.id) {
        return NextResponse.json(
          { error: 'Supervisor pode criar igrejas apenas para si mesmo.' },
          { status: 403 },
        )
      }
    }
    // Admin pode criar para qualquer supervisor (sem validação adicional)

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)

    const newChurch = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          companyId: VALIDATED_COMPANY_ID,
          email: validatedData.email,
          password: hashedPassword,
          role: 'church_account',
          status: 'active',
          phone: validatedData.phone,
          titheDay: validatedData.titheDay,
        })
        .returning()

      if (!newUser) {
        tx.rollback()
        throw new Error('Falha ao criar o usuário para a igreja.')
      }

      const [newProfile] = await tx
        .insert(churchProfiles)
        .values({
          userId: newUser.id,
          supervisorId: validatedData.supervisorId,
          cnpj: validatedData.cnpj,
          razaoSocial: validatedData.razaoSocial,
          nomeFantasia: validatedData.nomeFantasia,
          foundationDate: validatedData.foundationDate
            ? validatedData.foundationDate.toISOString()
            : null,
          cep: validatedData.cep,
          state: validatedData.state,
          city: validatedData.city,
          neighborhood: validatedData.neighborhood,
          address: validatedData.address,
          treasurerFirstName: validatedData.treasurerFirstName,
          treasurerLastName: validatedData.treasurerLastName,
          treasurerCpf: validatedData.treasurerCpf,
        })
        .returning()

      return { ...newUser, ...newProfile }
    })

    return NextResponse.json({ success: true, church: newChurch }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: error.errors },
        { status: 400 },
      )
    }
    console.error('Erro ao criar igreja:', error)
    if (
      error instanceof Error &&
      'constraint' in error &&
      ((error as Record<string, unknown>).constraint === 'users_email_unique' ||
        (error as Record<string, unknown>).constraint === 'church_profiles_cnpj_unique')
    ) {
      return NextResponse.json({ error: 'Email ou CNPJ já cadastrado.' }, { status: 409 })
    }

    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
