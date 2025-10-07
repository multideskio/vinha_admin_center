/**
 * @fileoverview API para gerenciamento de pastores específicos (visão do gerente).
 * @version 1.1
 * @date 2024-08-07
 * @author PH
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, pastorProfiles, supervisorProfiles } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { z } from 'zod'
import * as bcrypt from 'bcrypt'
import { validateRequest } from '@/lib/jwt'
import { pastorProfileSchema } from '@/lib/types'
import { ApiError } from '@/lib/errors'
import type { UserRole } from '@/lib/types'

const pastorUpdateSchema = pastorProfileSchema
  .extend({
    newPassword: z.string().optional().or(z.literal('')),
  })
  .partial()

async function verifyPastor(pastorId: string, managerId: string): Promise<boolean> {
  const supervisorIdsManagedByGerente = await db
    .select({ id: supervisorProfiles.userId })
    .from(supervisorProfiles)
    .where(eq(supervisorProfiles.managerId, managerId))
  if (supervisorIdsManagedByGerente.length === 0) return false

  const [pastor] = await db.select().from(pastorProfiles).where(eq(pastorProfiles.userId, pastorId))
  if (!pastor || !pastor.supervisorId) return false

  return supervisorIdsManagedByGerente.some((s) => s.id === pastor.supervisorId)
}

export async function GET(request: Request, props: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const params = await props.params;
  const { user: sessionUser } = await validateRequest()
  if (!sessionUser || (sessionUser.role as UserRole) !== 'manager') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { id } = params

  try {
    const isAuthorized = await verifyPastor(id, sessionUser.id)
    if (!isAuthorized) {
      throw new ApiError(404, 'Pastor não encontrado ou não pertence a esta rede.')
    }

    const result = await db
      .select({
        user: users,
        profile: pastorProfiles,
      })
      .from(users)
      .leftJoin(pastorProfiles, eq(users.id, pastorProfiles.userId))
      .where(and(eq(users.id, id), eq(users.role, 'pastor'), isNull(users.deletedAt)))
      .limit(1)

    if (result.length === 0 || !result[0]) {
      throw new ApiError(404, 'Pastor não encontrado.')
    }

    const { user, profile } = result[0]
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      ...userWithoutPassword,
      ...profile,
    })
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Erro ao buscar pastor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const params = await props.params;
  const { user: sessionUser } = await validateRequest()
  if (!sessionUser || (sessionUser.role as UserRole) !== 'manager') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { id } = params

  try {
    const isAuthorized = await verifyPastor(id, sessionUser.id)
    if (!isAuthorized) {
      throw new ApiError(403, 'Não autorizado a modificar este pastor.')
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
      if (validatedData.supervisorId) profileUpdateData.supervisorId = validatedData.supervisorId

      if (Object.keys(profileUpdateData).length > 0) {
        await tx.update(pastorProfiles).set(profileUpdateData).where(eq(pastorProfiles.userId, id))
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: error.errors },
        { status: 400 },
      )
    }
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Erro ao atualizar pastor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const params = await props.params;
  const { user: sessionUser } = await validateRequest()
  if (!sessionUser || (sessionUser.role as UserRole) !== 'manager') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { id } = params

  try {
    const isAuthorized = await verifyPastor(id, sessionUser.id)
    if (!isAuthorized) {
      throw new ApiError(403, 'Não autorizado a excluir este pastor.')
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
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Erro ao excluir pastor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
