/**
 * @fileoverview Rota da API para gerenciar pastor individual (visão do supervisor).
 * @version 1.3
 * @date 2025-01-06
 * @author Sistema de Padronização
 * @lastReview 2025-01-06 17:20
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, pastorProfiles } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { z } from 'zod'
import * as bcrypt from 'bcrypt'
import { authenticateApiKey } from '@/lib/api-auth'
import { validateRequest } from '@/lib/jwt'
import { pastorProfileSchema } from '@/lib/types'
import { rateLimit } from '@/lib/rate-limit'
import { getErrorMessage } from '@/lib/error-types'

const pastorUpdateSchema = pastorProfileSchema
  .extend({
    newPassword: z.string().optional().or(z.literal('')),
    avatarUrl: z.string().optional(),
  })
  .partial()

async function verifyPastor(pastorId: string, supervisorId: string): Promise<boolean> {
  const [pastor] = await db.select().from(pastorProfiles).where(eq(pastorProfiles.userId, pastorId))
  if (!pastor || pastor.supervisorId !== supervisorId) return false
  return true
}

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    // Rate limiting: 60 requests per minute
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('supervisor-pastor-detail', ip, 60, 60) // 60 requests per minute
    if (!rateLimitResult.allowed) {
      console.error('[SUPERVISOR_PASTOR_DETAIL_RATE_LIMIT]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 },
      )
    }

    const params = await props.params

    // Primeiro tenta autenticação JWT (usuário logado via web)
    const { user: sessionUser } = await validateRequest()

    if (!sessionUser) {
      // Se não há usuário logado, tenta autenticação por API Key
      const authResponse = await authenticateApiKey()
      if (authResponse) return authResponse

      // Se nem JWT nem API Key funcionaram, retorna 401
      console.error('[SUPERVISOR_PASTOR_DETAIL_AUTH_ERROR]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    // Verifica se o usuário tem a role correta
    if (sessionUser.role !== 'supervisor') {
      console.error('[SUPERVISOR_PASTOR_DETAIL_ROLE_ERROR]', {
        userId: sessionUser.id,
        role: sessionUser.role,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Acesso negado. Role supervisor necessária.' },
        { status: 403 },
      )
    }

    const { id } = params

    console.log('[SUPERVISOR_PASTOR_DETAIL_REQUEST]', {
      supervisorId: sessionUser.id,
      pastorId: id,
      timestamp: new Date().toISOString(),
    })
    const isAuthorized = await verifyPastor(id, sessionUser.id)
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Pastor não encontrado ou não pertence a esta supervisão.' },
        { status: 404 },
      )
    }

    const result = await db
      .select({
        user: users,
        profile: pastorProfiles,
      })
      .from(users)
      .leftJoin(pastorProfiles, eq(users.id, pastorProfiles.userId))
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1)

    if (result.length === 0 || !result[0]) {
      return NextResponse.json({ error: 'Pastor não encontrado.' }, { status: 404 })
    }

    const { user, profile } = result[0]

    return NextResponse.json({
      id: user.id,
      firstName: profile?.firstName,
      lastName: profile?.lastName,
      cpf: profile?.cpf,
      email: user.email,
      phone: user.phone,
      landline: profile?.landline,
      cep: profile?.cep,
      state: profile?.state,
      city: profile?.city,
      neighborhood: profile?.neighborhood,
      address: profile?.address,
      number: profile?.number,
      complement: profile?.complement,
      birthDate: profile?.birthDate,
      titheDay: user.titheDay,
      supervisorId: profile?.supervisorId,
      status: user.status,
      // Campos de avatar e redes sociais
      avatarUrl: user.avatarUrl,
      facebook: profile?.facebook,
      instagram: profile?.instagram,
      website: profile?.website,
    })
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error)
    console.error('[SUPERVISOR_PASTOR_DETAIL_ERROR]', {
      error: errorMessage,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    // Rate limiting: 30 requests per minute for updates
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('supervisor-pastor-update', ip, 30, 60) // 30 requests per minute
    if (!rateLimitResult.allowed) {
      console.error('[SUPERVISOR_PASTOR_UPDATE_RATE_LIMIT]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 },
      )
    }

    const params = await props.params

    // Primeiro tenta autenticação JWT (usuário logado via web)
    const { user: sessionUser } = await validateRequest()

    if (!sessionUser) {
      // Se não há usuário logado, tenta autenticação por API Key
      const authResponse = await authenticateApiKey()
      if (authResponse) return authResponse

      // Se nem JWT nem API Key funcionaram, retorna 401
      console.error('[SUPERVISOR_PASTOR_UPDATE_AUTH_ERROR]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    // Verifica se o usuário tem a role correta
    if (sessionUser.role !== 'supervisor') {
      console.error('[SUPERVISOR_PASTOR_UPDATE_ROLE_ERROR]', {
        userId: sessionUser.id,
        role: sessionUser.role,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Acesso negado. Role supervisor necessária.' },
        { status: 403 },
      )
    }

    const { id } = params

    console.log('[SUPERVISOR_PASTOR_UPDATE_REQUEST]', {
      supervisorId: sessionUser.id,
      pastorId: id,
      timestamp: new Date().toISOString(),
    })
    const isAuthorized = await verifyPastor(id, sessionUser.id)
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Não autorizado a modificar este pastor.' },
        { status: 403 },
      )
    }

    const body = await request.json()
    const validatedData = pastorUpdateSchema.parse({
      ...body,
      birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
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

      const profileUpdateData: Partial<typeof pastorProfiles.$inferInsert> = {}
      if (validatedData.firstName) profileUpdateData.firstName = validatedData.firstName
      if (validatedData.lastName) profileUpdateData.lastName = validatedData.lastName
      if (validatedData.landline !== undefined) profileUpdateData.landline = validatedData.landline
      if (validatedData.cep !== undefined) profileUpdateData.cep = validatedData.cep
      if (validatedData.state !== undefined) profileUpdateData.state = validatedData.state
      if (validatedData.city !== undefined) profileUpdateData.city = validatedData.city
      if (validatedData.neighborhood !== undefined)
        profileUpdateData.neighborhood = validatedData.neighborhood
      if (validatedData.address !== undefined) profileUpdateData.address = validatedData.address
      if (validatedData.number !== undefined) profileUpdateData.number = validatedData.number
      if (validatedData.complement !== undefined)
        profileUpdateData.complement = validatedData.complement
      if (validatedData.birthDate)
        profileUpdateData.birthDate = validatedData.birthDate.toISOString()
      // Campos de redes sociais
      if (validatedData.facebook !== undefined) profileUpdateData.facebook = validatedData.facebook
      if (validatedData.instagram !== undefined)
        profileUpdateData.instagram = validatedData.instagram
      if (validatedData.website !== undefined) profileUpdateData.website = validatedData.website

      if (Object.keys(profileUpdateData).length > 0) {
        await tx.update(pastorProfiles).set(profileUpdateData).where(eq(pastorProfiles.userId, id))
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      console.error('[SUPERVISOR_PASTOR_UPDATE_VALIDATION_ERROR]', {
        errors: error.errors,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Dados inválidos.', details: error.errors },
        { status: 400 },
      )
    }

    const errorMessage = getErrorMessage(error)
    console.error('[SUPERVISOR_PASTOR_UPDATE_ERROR]', {
      error: errorMessage,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    // Rate limiting: 20 requests per minute for deletions
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('supervisor-pastor-delete', ip, 20, 60) // 20 requests per minute
    if (!rateLimitResult.allowed) {
      console.error('[SUPERVISOR_PASTOR_DELETE_RATE_LIMIT]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 },
      )
    }

    const params = await props.params

    // Primeiro tenta autenticação JWT (usuário logado via web)
    const { user: sessionUser } = await validateRequest()

    if (!sessionUser) {
      // Se não há usuário logado, tenta autenticação por API Key
      const authResponse = await authenticateApiKey()
      if (authResponse) return authResponse

      // Se nem JWT nem API Key funcionaram, retorna 401
      console.error('[SUPERVISOR_PASTOR_DELETE_AUTH_ERROR]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    // Verifica se o usuário tem a role correta
    if (sessionUser.role !== 'supervisor') {
      console.error('[SUPERVISOR_PASTOR_DELETE_ROLE_ERROR]', {
        userId: sessionUser.id,
        role: sessionUser.role,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Acesso negado. Role supervisor necessária.' },
        { status: 403 },
      )
    }

    const { id } = params

    console.log('[SUPERVISOR_PASTOR_DELETE_REQUEST]', {
      supervisorId: sessionUser.id,
      pastorId: id,
      timestamp: new Date().toISOString(),
    })

    const isAuthorized = await verifyPastor(id, sessionUser.id)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Não autorizado a excluir este pastor.' }, { status: 403 })
    }

    await db
      .update(users)
      .set({
        deletedAt: new Date(),
        status: 'inactive',
      })
      .where(eq(users.id, id))

    return NextResponse.json({ success: true, message: 'Pastor excluído com sucesso.' })
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error)
    console.error('[SUPERVISOR_PASTOR_DELETE_ERROR]', {
      error: errorMessage,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
