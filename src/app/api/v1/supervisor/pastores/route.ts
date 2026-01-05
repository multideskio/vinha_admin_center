/**
 * @fileoverview Rota da API para gerenciar pastores (visão do supervisor).
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, pastorProfiles } from '@/db/schema'
import { eq, and, isNull, desc, gte, lte } from 'drizzle-orm'
import { z } from 'zod'
import * as bcrypt from 'bcrypt'
import { authenticateApiKey } from '@/lib/api-auth'
import { validateRequest } from '@/lib/jwt'

import { getCompanyId } from '@/lib/utils'

const COMPANY_ID = getCompanyId()

const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || '123456'

const pastorSchema = z.object({
  firstName: z.string().min(1, { message: 'O nome é obrigatório.' }),
  lastName: z.string().min(1, { message: 'O sobrenome é obrigatório.' }),
  cpf: z.string().min(14, { message: 'O CPF deve ter 11 dígitos.' }),
  email: z.string().email({ message: 'E-mail inválido.' }),
  cep: z.string().nullable(),
  state: z.string().nullable(),
  city: z.string().nullable(),
  neighborhood: z.string().nullable(),
  address: z.string().nullable(),
  birthDate: z.date({ required_error: 'A data de nascimento é obrigatória.' }).nullable(),
  titheDay: z.coerce.number().min(1).max(31).nullable(),
  phone: z.string().min(1, { message: 'O celular é obrigatório.' }),
})

export async function GET(request: Request): Promise<NextResponse> {
  // Primeiro tenta autenticação JWT (usuário logado via web)
  const { user: sessionUser } = await validateRequest()

  if (!sessionUser) {
    // Se não há usuário logado, tenta autenticação por API Key
    const authResponse = await authenticateApiKey()
    if (authResponse) return authResponse

    // Se nem JWT nem API Key funcionaram, retorna 401
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  // Verifica se o usuário tem a role correta
  if (sessionUser.role !== 'supervisor') {
    return NextResponse.json(
      { error: 'Acesso negado. Role supervisor necessária.' },
      { status: 403 },
    )
  }

  try {
    // Extrair parâmetros de data da URL
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Construir condições de filtro
    const conditions = [
      eq(users.role, 'pastor'),
      eq(pastorProfiles.supervisorId, sessionUser.id),
      isNull(users.deletedAt),
    ]

    if (startDate) {
      conditions.push(gte(users.createdAt, new Date(startDate)))
    }

    if (endDate) {
      // Adicionar 1 dia para incluir registros do dia final
      const endDateTime = new Date(endDate)
      endDateTime.setDate(endDateTime.getDate() + 1)
      conditions.push(lte(users.createdAt, endDateTime))
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
        city: pastorProfiles.city,
        state: pastorProfiles.state,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .innerJoin(pastorProfiles, eq(users.id, pastorProfiles.userId))
      .where(and(...conditions))
      .orderBy(desc(users.createdAt))

    return NextResponse.json({ pastors: result })
  } catch (error) {
    console.error('Erro ao buscar pastores:', error)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  // Primeiro tenta autenticação JWT (usuário logado via web)
  const { user: sessionUser } = await validateRequest()

  if (!sessionUser) {
    // Se não há usuário logado, tenta autenticação por API Key
    const authResponse = await authenticateApiKey()
    if (authResponse) return authResponse

    // Se nem JWT nem API Key funcionaram, retorna 401
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  // Verifica se o usuário tem a role correta
  if (sessionUser.role !== 'supervisor') {
    return NextResponse.json(
      { error: 'Acesso negado. Role supervisor necessária.' },
      { status: 403 },
    )
  }

  try {
    const body = await request.json()
    const validatedData = pastorSchema.parse({
      ...body,
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
    })

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)

    const newPastor = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          companyId: COMPANY_ID,
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
          supervisorId: sessionUser.id,
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

    return NextResponse.json({ success: true, pastor: newPastor }, { status: 201 })
  } catch (error) {
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
      ((error as { constraint?: string }).constraint === 'users_email_unique' ||
        (error as { constraint?: string }).constraint === 'pastor_profiles_cpf_unique')
    ) {
      return NextResponse.json({ error: 'Email ou CPF já cadastrado.' }, { status: 409 })
    }

    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
