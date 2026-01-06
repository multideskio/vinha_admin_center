/**
 * @fileoverview API para gerenciar igreja individual (visão do supervisor).
 * @version 1.3
 * @date 2025-01-06
 * @author Sistema de Padronização
 * @lastReview 2025-01-06 18:00
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, churchProfiles } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { z } from 'zod'
import * as bcrypt from 'bcrypt'
import { authenticateApiKey } from '@/lib/api-auth'
import { validateRequest } from '@/lib/jwt'
import { rateLimit } from '@/lib/rate-limit'
import { churchProfileSchema } from '@/lib/types'

const churchUpdateSchema = churchProfileSchema
  .extend({
    newPassword: z.string().optional().or(z.literal('')),
    avatarUrl: z.string().optional(),
  })
  .partial()

async function verifyChurch(churchId: string, supervisorId: string): Promise<boolean> {
  const [church] = await db.select().from(churchProfiles).where(eq(churchProfiles.userId, churchId))
  if (!church || church.supervisorId !== supervisorId) return false
  return true
}

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const params = await props.params
  const { id } = params
  let sessionUser: any = null

  try {
    // Rate limiting: 60 requests per minute
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('supervisor-igrejas-get-individual', ip, 60, 60)
    if (!rateLimitResult.allowed) {
      console.error('[SUPERVISOR_IGREJAS_GET_INDIVIDUAL_RATE_LIMIT]', {
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
      console.error('[SUPERVISOR_IGREJAS_GET_INDIVIDUAL_AUTH_ERROR]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    // Verifica se o usuário tem a role correta
    if (sessionUser.role !== 'supervisor') {
      console.error('[SUPERVISOR_IGREJAS_GET_INDIVIDUAL_ROLE_ERROR]', {
        userId: sessionUser.id,
        role: sessionUser.role,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Acesso negado. Role supervisor necessária.' },
        { status: 403 },
      )
    }

    console.log('[SUPERVISOR_IGREJAS_GET_INDIVIDUAL_REQUEST]', {
      supervisorId: sessionUser.id,
      churchId: id,
      timestamp: new Date().toISOString(),
    })

    const isAuthorized = await verifyChurch(id, sessionUser.id)
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Igreja não encontrada ou não pertence a esta supervisão.' },
        { status: 404 },
      )
    }

    const result = await db
      .select({
        user: users,
        profile: churchProfiles,
      })
      .from(users)
      .leftJoin(churchProfiles, eq(users.id, churchProfiles.userId))
      .where(and(eq(users.id, id), eq(users.role, 'church_account'), isNull(users.deletedAt)))
      .limit(1)

    if (result.length === 0 || !result[0]) {
      return NextResponse.json({ error: 'Igreja não encontrada.' }, { status: 404 })
    }

    const { user: churchUser, profile } = result[0]

    return NextResponse.json({
      id: churchUser.id,
      cnpj: profile?.cnpj,
      razaoSocial: profile?.razaoSocial,
      nomeFantasia: profile?.nomeFantasia,
      email: churchUser.email,
      phone: churchUser.phone,
      cep: profile?.cep,
      state: profile?.state,
      city: profile?.city,
      neighborhood: profile?.neighborhood,
      address: profile?.address,
      foundationDate: profile?.foundationDate,
      titheDay: churchUser.titheDay,
      supervisorId: profile?.supervisorId,
      treasurerFirstName: profile?.treasurerFirstName,
      treasurerLastName: profile?.treasurerLastName,
      treasurerCpf: profile?.treasurerCpf,
      status: churchUser.status,
      // Campos de redes sociais e avatar
      avatarUrl: churchUser.avatarUrl,
      facebook: profile?.facebook,
      instagram: profile?.instagram,
      website: profile?.website,
    })
  } catch (error) {
    console.error('[SUPERVISOR_IGREJAS_GET_INDIVIDUAL_ERROR]', {
      supervisorId: sessionUser?.id,
      churchId: id,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const params = await props.params
  const { id } = params
  let sessionUser: any = null

  try {
    // Rate limiting: 30 requests per minute
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('supervisor-igrejas-put-individual', ip, 30, 60)
    if (!rateLimitResult.allowed) {
      console.error('[SUPERVISOR_IGREJAS_PUT_INDIVIDUAL_RATE_LIMIT]', {
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
      console.error('[SUPERVISOR_IGREJAS_PUT_INDIVIDUAL_AUTH_ERROR]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    // Verifica se o usuário tem a role correta
    if (sessionUser.role !== 'supervisor') {
      console.error('[SUPERVISOR_IGREJAS_PUT_INDIVIDUAL_ROLE_ERROR]', {
        userId: sessionUser.id,
        role: sessionUser.role,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Acesso negado. Role supervisor necessária.' },
        { status: 403 },
      )
    }

    console.log('[SUPERVISOR_IGREJAS_PUT_INDIVIDUAL_REQUEST]', {
      supervisorId: sessionUser.id,
      churchId: id,
      timestamp: new Date().toISOString(),
    })

    const isAuthorized = await verifyChurch(id, sessionUser.id)
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Não autorizado a modificar esta igreja.' },
        { status: 403 },
      )
    }

    const body = await request.json()
    const validatedData = churchUpdateSchema.parse({
      ...body,
      foundationDate: body.foundationDate ? new Date(body.foundationDate) : undefined,
    })

    await db.transaction(async (tx) => {
      const userUpdateData: Partial<typeof users.$inferInsert> = {}
      if (validatedData.email) userUpdateData.email = validatedData.email
      if (validatedData.phone) userUpdateData.phone = validatedData.phone
      if (validatedData.titheDay !== undefined) userUpdateData.titheDay = validatedData.titheDay
      if (validatedData.avatarUrl) userUpdateData.avatarUrl = validatedData.avatarUrl

      if (validatedData.newPassword) {
        userUpdateData.password = await bcrypt.hash(validatedData.newPassword, 10)
      }

      if (Object.keys(userUpdateData).length > 0) {
        userUpdateData.updatedAt = new Date()
        await tx.update(users).set(userUpdateData).where(eq(users.id, id))
      }

      const profileUpdateData: Partial<typeof churchProfiles.$inferInsert> = {}
      if (validatedData.razaoSocial) profileUpdateData.razaoSocial = validatedData.razaoSocial
      if (validatedData.nomeFantasia) profileUpdateData.nomeFantasia = validatedData.nomeFantasia
      if (validatedData.cep) profileUpdateData.cep = validatedData.cep
      if (validatedData.state) profileUpdateData.state = validatedData.state
      if (validatedData.city) profileUpdateData.city = validatedData.city
      if (validatedData.neighborhood) profileUpdateData.neighborhood = validatedData.neighborhood
      if (validatedData.address) profileUpdateData.address = validatedData.address
      if (validatedData.foundationDate)
        profileUpdateData.foundationDate = validatedData.foundationDate.toISOString()
      if (validatedData.treasurerFirstName)
        profileUpdateData.treasurerFirstName = validatedData.treasurerFirstName
      if (validatedData.treasurerLastName)
        profileUpdateData.treasurerLastName = validatedData.treasurerLastName
      if (validatedData.treasurerCpf) profileUpdateData.treasurerCpf = validatedData.treasurerCpf
      // Campos de redes sociais
      if (validatedData.facebook !== undefined) profileUpdateData.facebook = validatedData.facebook
      if (validatedData.instagram !== undefined)
        profileUpdateData.instagram = validatedData.instagram
      if (validatedData.website !== undefined) profileUpdateData.website = validatedData.website

      if (Object.keys(profileUpdateData).length > 0) {
        await tx.update(churchProfiles).set(profileUpdateData).where(eq(churchProfiles.userId, id))
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[SUPERVISOR_IGREJAS_PUT_INDIVIDUAL_ERROR]', {
      supervisorId: sessionUser?.id,
      churchId: id,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: error.errors },
        { status: 400 },
      )
    }
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const params = await props.params
  const { id } = params
  let sessionUser: any = null

  try {
    // Rate limiting: 20 requests per minute
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('supervisor-igrejas-delete-individual', ip, 20, 60)
    if (!rateLimitResult.allowed) {
      console.error('[SUPERVISOR_IGREJAS_DELETE_INDIVIDUAL_RATE_LIMIT]', {
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
      console.error('[SUPERVISOR_IGREJAS_DELETE_INDIVIDUAL_AUTH_ERROR]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    // Verifica se o usuário tem a role correta
    if (sessionUser.role !== 'supervisor') {
      console.error('[SUPERVISOR_IGREJAS_DELETE_INDIVIDUAL_ROLE_ERROR]', {
        userId: sessionUser.id,
        role: sessionUser.role,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Acesso negado. Role supervisor necessária.' },
        { status: 403 },
      )
    }

    console.log('[SUPERVISOR_IGREJAS_DELETE_INDIVIDUAL_REQUEST]', {
      supervisorId: sessionUser.id,
      churchId: id,
      timestamp: new Date().toISOString(),
    })

    const isAuthorized = await verifyChurch(id, sessionUser.id)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Não autorizado a excluir esta igreja.' }, { status: 403 })
    }

    await db
      .update(users)
      .set({
        deletedAt: new Date(),
        status: 'inactive',
      })
      .where(eq(users.id, id))

    return NextResponse.json({ success: true, message: 'Igreja excluída com sucesso.' })
  } catch (error) {
    console.error('[SUPERVISOR_IGREJAS_DELETE_INDIVIDUAL_ERROR]', {
      supervisorId: sessionUser?.id,
      churchId: id,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
