/**
 * @fileoverview API para gerenciamento de igrejas específicas (visão do gerente).
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 * @lastReview 2025-01-05 21:45
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, churchProfiles, supervisorProfiles } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { z } from 'zod'
import * as bcrypt from 'bcrypt'
import { validateRequest } from '@/lib/jwt'
import { churchProfileSchema, type UserRole } from '@/lib/types'
import { rateLimit } from '@/lib/rate-limit'

const churchUpdateSchema = churchProfileSchema
  .extend({
    newPassword: z.string().optional().or(z.literal('')),
  })
  .partial()

async function verifyChurch(churchId: string, managerId: string): Promise<boolean> {
  const supervisorIdsManagedByGerente = await db
    .select({ id: supervisorProfiles.userId })
    .from(supervisorProfiles)
    .where(eq(supervisorProfiles.managerId, managerId))
  if (supervisorIdsManagedByGerente.length === 0) return false

  const [church] = await db
    .select()
    .from(churchProfiles)
    .where(eq(churchProfiles.userId, churchId))
    .limit(1)
  if (!church || !church.supervisorId) return false

  return supervisorIdsManagedByGerente.some((s) => s.id === church.supervisorId)
}

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params

  // Rate limiting
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const rateLimitResult = await rateLimit('manager-church-get', ip, 30, 60) // 30 requests per minute
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
      { status: 429 },
    )
  }

  const { user: sessionUser } = await validateRequest()
  if (!sessionUser || (sessionUser.role as UserRole) !== 'manager') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { id } = params

  try {
    const isAuthorized = await verifyChurch(id, sessionUser.id)
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Igreja não encontrada ou não pertence a esta rede.' },
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

    const { user, profile } = result[0]
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({ ...userWithoutPassword, ...profile })
  } catch (error) {
    // Structured logging instead of console.error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[MANAGER_CHURCH_GET_ERROR]', {
      churchId: id,
      managerId: sessionUser.id,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params

  // Rate limiting
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const rateLimitResult = await rateLimit('manager-church-put', ip, 10, 60) // 10 requests per minute
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
      { status: 429 },
    )
  }

  const { user: sessionUser } = await validateRequest()
  if (!sessionUser || (sessionUser.role as UserRole) !== 'manager') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { id } = params

  try {
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
      if (body.avatarUrl !== undefined) userUpdateData.avatarUrl = body.avatarUrl

      if (validatedData.newPassword) {
        userUpdateData.password = await bcrypt.hash(validatedData.newPassword, 10)
      }

      if (Object.keys(userUpdateData).length > 0) {
        userUpdateData.updatedAt = new Date()
        await tx.update(users).set(userUpdateData).where(eq(users.id, id))
      }

      const profileUpdateData: Partial<typeof churchProfiles.$inferInsert> = {}
      if (validatedData.supervisorId) profileUpdateData.supervisorId = validatedData.supervisorId
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
      if (body.facebook !== undefined) profileUpdateData.facebook = body.facebook
      if (body.instagram !== undefined) profileUpdateData.instagram = body.instagram
      if (body.website !== undefined) profileUpdateData.website = body.website

      if (Object.keys(profileUpdateData).length > 0) {
        await tx.update(churchProfiles).set(profileUpdateData).where(eq(churchProfiles.userId, id))
      }
    })

    // Structured logging for successful update
    console.log('[MANAGER_CHURCH_UPDATE_SUCCESS]', {
      churchId: id,
      managerId: sessionUser.id,
      updatedFields: Object.keys(validatedData),
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: error.errors },
        { status: 400 },
      )
    }
    // Structured logging instead of console.error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[MANAGER_CHURCH_UPDATE_ERROR]', {
      churchId: id,
      managerId: sessionUser.id,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params

  // Rate limiting
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const rateLimitResult = await rateLimit('manager-church-delete', ip, 5, 60) // 5 requests per minute
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
      { status: 429 },
    )
  }

  const { user: sessionUser } = await validateRequest()
  if (!sessionUser || (sessionUser.role as UserRole) !== 'manager') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { id } = params

  try {
    const isAuthorized = await verifyChurch(id, sessionUser.id)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Não autorizado a excluir esta igreja.' }, { status: 403 })
    }

    const body = await request.json()
    const deletionReason = body.deletionReason || 'Sem motivo informado'

    // Get church data for audit logging before deletion
    const churchData = await db
      .select({
        nomeFantasia: churchProfiles.nomeFantasia,
        razaoSocial: churchProfiles.razaoSocial,
        email: users.email,
      })
      .from(users)
      .leftJoin(churchProfiles, eq(users.id, churchProfiles.userId))
      .where(eq(users.id, id))
      .limit(1)

    await db
      .update(users)
      .set({
        deletedAt: new Date(),
        deletedBy: sessionUser.id,
        deletionReason,
        status: 'inactive',
      })
      .where(eq(users.id, id))

    // Audit logging for deletion
    console.log('[MANAGER_CHURCH_DELETE_SUCCESS]', {
      churchId: id,
      churchName: churchData[0]?.nomeFantasia || churchData[0]?.razaoSocial || 'Unknown',
      churchEmail: churchData[0]?.email || 'Unknown',
      managerId: sessionUser.id,
      deletionReason,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, message: 'Igreja excluída com sucesso.' })
  } catch (error) {
    // Structured logging instead of console.error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[MANAGER_CHURCH_DELETE_ERROR]', {
      churchId: id,
      managerId: sessionUser.id,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
