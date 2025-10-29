/**
 * @fileoverview Rota da API para gerenciar o perfil do supervisor logado.
 * @version 1.3
 * @date 2024-08-08
 * @author PH
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, supervisorProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import * as bcrypt from 'bcrypt'
import { validateRequest } from '@/lib/jwt'
import { supervisorProfileSchema } from '@/lib/types'
import { type UserRole } from '@/lib/types'

const supervisorUpdateSchema = supervisorProfileSchema
  .extend({
    newPassword: z.string().optional().or(z.literal('')),
  })
  .partial()

export async function GET(): Promise<NextResponse> {
  const { user: sessionUser } = await validateRequest()
  if (!sessionUser || (sessionUser.role as UserRole) !== 'supervisor') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const result = await db
      .select({
        user: users,
        profile: supervisorProfiles,
      })
      .from(users)
      .leftJoin(supervisorProfiles, eq(users.id, supervisorProfiles.userId))
      .where(eq(users.id, sessionUser.id))
      .limit(1)

    if (result.length === 0) {
      return NextResponse.json({ error: 'Perfil do supervisor não encontrado.' }, { status: 404 })
    }

    const resultData = result[0]
    if (!resultData) {
      return NextResponse.json({ error: 'Perfil do supervisor não encontrado.' }, { status: 404 })
    }

    const { user, profile } = resultData
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user

    const supervisorData = {
      ...userWithoutPassword,
      ...profile,
    }

    return NextResponse.json({ supervisor: supervisorData })
  } catch (error) {
    console.error('Erro ao buscar perfil do supervisor:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro ao buscar perfil do supervisor', details: errorMessage },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  const { user: sessionUser } = await validateRequest()
  if (!sessionUser || (sessionUser.role as UserRole) !== 'supervisor') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = supervisorUpdateSchema.parse(body)

    await db.transaction(async (tx) => {
      const userUpdateData: Partial<typeof users.$inferInsert> = {}
      if (validatedData.email) userUpdateData.email = validatedData.email
      if (validatedData.phone) userUpdateData.phone = validatedData.phone
      if (validatedData.titheDay !== undefined) userUpdateData.titheDay = validatedData.titheDay
      if (validatedData.avatarUrl !== undefined) userUpdateData.avatarUrl = validatedData.avatarUrl

      if (validatedData.newPassword) {
        userUpdateData.password = await bcrypt.hash(validatedData.newPassword, 10)
      }

      if (Object.keys(userUpdateData).length > 0) {
        userUpdateData.updatedAt = new Date()
        await tx.update(users).set(userUpdateData).where(eq(users.id, sessionUser.id))
      }

      const profileUpdateData: Partial<typeof supervisorProfiles.$inferInsert> = {}
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
      if (validatedData.facebook !== undefined) profileUpdateData.facebook = validatedData.facebook
      if (validatedData.instagram !== undefined)
        profileUpdateData.instagram = validatedData.instagram
      if (validatedData.website !== undefined) profileUpdateData.website = validatedData.website

      if (Object.keys(profileUpdateData).length > 0) {
        await tx
          .update(supervisorProfiles)
          .set(profileUpdateData)
          .where(eq(supervisorProfiles.userId, sessionUser.id))
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: error.errors },
        { status: 400 },
      )
    }
    console.error('Erro ao atualizar perfil do supervisor:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil do supervisor', details: errorMessage },
      { status: 500 },
    )
  }
}
