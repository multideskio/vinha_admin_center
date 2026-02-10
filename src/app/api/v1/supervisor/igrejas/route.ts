/**
 * @fileoverview Rota da API para gerenciar igrejas (visão do supervisor).
 * @version 1.3
 * @date 2025-01-06
 * @author Sistema de Padronização
 * @lastReview 2025-01-06 17:45
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, churchProfiles } from '@/db/schema'
import { eq, and, isNull, desc, gte, lte } from 'drizzle-orm'
import { z } from 'zod'
import * as bcrypt from 'bcrypt'
import { authenticateApiKey } from '@/lib/api-auth'
import { validateRequest } from '@/lib/jwt'
import { rateLimit } from '@/lib/rate-limit'
import { SessionUser } from '@/lib/types'
import { env } from '@/lib/env'

import { getCompanyId } from '@/lib/utils'

const COMPANY_ID = getCompanyId()

const DEFAULT_PASSWORD = env.DEFAULT_PASSWORD

const churchSchema = z.object({
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
  let sessionUser: SessionUser | null = null

  try {
    // Rate limiting: 60 requests per minute
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('supervisor-igrejas', ip, 60, 60) // 60 requests per minute
    if (!rateLimitResult.allowed) {
      console.error('[SUPERVISOR_IGREJAS_RATE_LIMIT]', { ip, timestamp: new Date().toISOString() })
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 },
      )
    }

    // Primeiro tenta autenticação JWT (usuário logado via web)
    const { user: authUser } = await validateRequest()
    sessionUser = authUser

    if (!sessionUser) {
      // Se não há usuário logado, tenta autenticação por API Key
      const authResponse = await authenticateApiKey()
      if (authResponse) return authResponse

      // Se nem JWT nem API Key funcionaram, retorna 401
      console.error('[SUPERVISOR_IGREJAS_AUTH_ERROR]', { ip, timestamp: new Date().toISOString() })
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    // Verifica se o usuário tem a role correta
    if (sessionUser.role !== 'supervisor') {
      console.error('[SUPERVISOR_IGREJAS_ROLE_ERROR]', {
        userId: sessionUser.id,
        role: sessionUser.role,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Acesso negado. Role supervisor necessária.' },
        { status: 403 },
      )
    }

    // Extrair parâmetros de data da URL
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Construir condições de filtro
    const conditions = [
      eq(users.role, 'church_account'),
      eq(churchProfiles.supervisorId, sessionUser.id),
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
        nomeFantasia: churchProfiles.nomeFantasia,
        razaoSocial: churchProfiles.razaoSocial,
        email: users.email,
        phone: users.phone,
        status: users.status,
        cnpj: churchProfiles.cnpj,
        city: churchProfiles.city,
        state: churchProfiles.state,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .innerJoin(churchProfiles, eq(users.id, churchProfiles.userId))
      .where(and(...conditions))
      .orderBy(desc(users.createdAt))

    return NextResponse.json({ churches: result })
  } catch (error) {
    console.error('[SUPERVISOR_IGREJAS_GET_ERROR]', {
      supervisorId: sessionUser?.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })

    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro interno do servidor.', details: errorMessage },
      { status: 500 },
    )
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  let sessionUser: SessionUser | null = null

  try {
    // Rate limiting: 10 requests per minute
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('supervisor-igrejas-post', ip, 10, 60) // 10 requests per minute
    if (!rateLimitResult.allowed) {
      console.error('[SUPERVISOR_IGREJAS_POST_RATE_LIMIT]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 },
      )
    }

    // Primeiro tenta autenticação JWT (usuário logado via web)
    const { user: authUser } = await validateRequest()
    sessionUser = authUser

    if (!sessionUser) {
      // Se não há usuário logado, tenta autenticação por API Key
      const authResponse = await authenticateApiKey()
      if (authResponse) return authResponse

      // Se nem JWT nem API Key funcionaram, retorna 401
      console.error('[SUPERVISOR_IGREJAS_POST_AUTH_ERROR]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    // Verifica se o usuário tem a role correta
    if (sessionUser.role !== 'supervisor') {
      console.error('[SUPERVISOR_IGREJAS_POST_ROLE_ERROR]', {
        userId: sessionUser.id,
        role: sessionUser.role,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Acesso negado. Role supervisor necessária.' },
        { status: 403 },
      )
    }

    const body = await request.json()
    const validatedData = churchSchema.parse({
      ...body,
      foundationDate: body.foundationDate ? new Date(body.foundationDate) : null,
    })

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)

    // Garantir que sessionUser não é null para uso na transação
    const supervisorId = sessionUser.id

    const newChurch = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          companyId: COMPANY_ID,
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
          supervisorId: supervisorId,
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
    console.error('[SUPERVISOR_IGREJAS_POST_ERROR]', {
      supervisorId: sessionUser?.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: error.errors },
        { status: 400 },
      )
    }

    if (
      error instanceof Error &&
      'constraint' in error &&
      ((error as { constraint?: string }).constraint === 'users_email_unique' ||
        (error as { constraint?: string }).constraint === 'church_profiles_cnpj_unique')
    ) {
      return NextResponse.json({ error: 'Email ou CNPJ já cadastrado.' }, { status: 409 })
    }

    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
