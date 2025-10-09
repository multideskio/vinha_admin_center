/**
 * @fileoverview Rota da API para gerenciar o perfil do gerente logado.
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, managerProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import * as bcrypt from 'bcrypt'
import { validateRequest } from '@/lib/jwt'
import { managerProfileSchema } from '@/lib/types'
import type { UserRole } from '@/lib/types'
import { getErrorMessage } from '@/lib/error-types'

const managerUpdateSchema = managerProfileSchema
  .extend({
    newPassword: z.string().optional().or(z.literal('')),
  })
  .partial()

export async function GET(): Promise<NextResponse> {
  const { user: sessionUser } = await validateRequest()
  if (!sessionUser || (sessionUser.role as UserRole) !== 'manager') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const result = await db
      .select({
        user: users,
        profile: managerProfiles,
      })
      .from(users)
      .leftJoin(managerProfiles, eq(users.id, managerProfiles.userId))
      .where(eq(users.id, sessionUser.id))
      .limit(1)

    if (result.length === 0 || !result[0]) {
      return NextResponse.json({ error: 'Perfil do gerente não encontrado.' }, { status: 404 })
    }

    const { user, profile } = result[0]
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user

    const managerData = {
      ...userWithoutPassword,
      ...profile,
    }

    return NextResponse.json({ manager: managerData })
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error)
    console.error('Erro ao buscar perfil do gerente:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar perfil do gerente', details: errorMessage },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  const { user: sessionUser } = await validateRequest()
  if (!sessionUser || (sessionUser.role as UserRole) !== 'manager') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = managerUpdateSchema.parse(body)

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
        await tx.update(users).set(userUpdateData).where(eq(users.id, sessionUser.id))
      }

      const profileUpdateData: Partial<typeof managerProfiles.$inferInsert> = {}
      if (validatedData.firstName) profileUpdateData.firstName = validatedData.firstName
      if (validatedData.lastName) profileUpdateData.lastName = validatedData.lastName
      if (validatedData.landline !== undefined) profileUpdateData.landline = validatedData.landline
      if (validatedData.cep !== undefined) profileUpdateData.cep = validatedData.cep
      if (validatedData.state !== undefined) profileUpdateData.state = validatedData.state
      if (validatedData.city !== undefined) profileUpdateData.city = validatedData.city
      if (validatedData.neighborhood !== undefined)
        profileUpdateData.neighborhood = validatedData.neighborhood
      if (validatedData.address !== undefined) profileUpdateData.address = validatedData.address
      if (validatedData.avatarUrl !== undefined) profileUpdateData.avatarUrl = validatedData.avatarUrl
      if (validatedData.facebook !== undefined) profileUpdateData.facebook = validatedData.facebook
      if (validatedData.instagram !== undefined) profileUpdateData.instagram = validatedData.instagram
      if (validatedData.website !== undefined) profileUpdateData.website = validatedData.website

      if (Object.keys(profileUpdateData).length > 0) {
        await tx
          .update(managerProfiles)
          .set(profileUpdateData)
          .where(eq(managerProfiles.userId, sessionUser.id))
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
    const errorMessage = getErrorMessage(error)
    console.error('Erro ao atualizar perfil do gerente:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil do gerente', details: errorMessage },
      { status: 500 },
    )
  }
}
