/**
 * @fileoverview Rota da API para gerenciar o perfil do gerente logado (legado).
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
import { getErrorMessage } from '@/lib/error-types'

const GERENTE_INIT_ID = process.env.GERENTE_INIT
if (!GERENTE_INIT_ID) {
  throw new Error('GERENTE_INIT environment variable is required')
}
const VALIDATED_GERENTE_ID = GERENTE_INIT_ID as string

const managerUpdateSchema = z
  .object({
    firstName: z.string().min(1, 'O nome é obrigatório.').optional(),
    lastName: z.string().min(1, 'O sobrenome é obrigatório.').optional(),
    email: z.string().email('E-mail inválido.').optional(),
    phone: z.string().nullable().optional(),
    landline: z.string().nullable().optional(),
    cep: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    neighborhood: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    titheDay: z.coerce.number().nullable().optional(),
    facebook: z.string().url().or(z.literal('')).nullable().optional(),
    instagram: z.string().url().or(z.literal('')).nullable().optional(),
    website: z.string().url().or(z.literal('')).nullable().optional(),
    newPassword: z.string().optional().or(z.literal('')),
  })
  .partial()

export async function GET(): Promise<NextResponse> {
  if (!GERENTE_INIT_ID) {
    return NextResponse.json({ error: 'Usuário gerente não configurado.' }, { status: 500 })
  }

  try {
    const result = await db
      .select({
        user: users,
        profile: managerProfiles,
      })
      .from(users)
      .leftJoin(managerProfiles, eq(users.id, managerProfiles.userId))
      .where(eq(users.id, VALIDATED_GERENTE_ID))
      .limit(1)

    if (result.length === 0) {
      return NextResponse.json({ error: 'Perfil do gerente não encontrado.' }, { status: 404 })
    }

    const firstResult = result[0]
    if (!firstResult) {
      return NextResponse.json({ error: 'Dados do perfil não encontrados.' }, { status: 404 })
    }

    const { user, profile } = firstResult

    const managerData = {
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
      titheDay: user.titheDay,
      facebook: profile?.facebook,
      instagram: profile?.instagram,
      website: profile?.website,
      status: user.status,
    }

    return NextResponse.json({ manager: managerData })
  } catch (error: unknown) {
    console.error('Erro ao buscar perfil do gerente:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar perfil do gerente', details: getErrorMessage(error) },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  if (!GERENTE_INIT_ID) {
    return NextResponse.json({ error: 'Usuário gerente não configurado.' }, { status: 500 })
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
        await tx.update(users).set(userUpdateData).where(eq(users.id, VALIDATED_GERENTE_ID))
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
      if (validatedData.facebook !== undefined) profileUpdateData.facebook = validatedData.facebook
      if (validatedData.instagram !== undefined)
        profileUpdateData.instagram = validatedData.instagram
      if (validatedData.website !== undefined) profileUpdateData.website = validatedData.website

      if (Object.keys(profileUpdateData).length > 0) {
        await tx
          .update(managerProfiles)
          .set(profileUpdateData)
          .where(eq(managerProfiles.userId, GERENTE_INIT_ID))
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
    console.error('Erro ao atualizar perfil do gerente:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil do gerente', details: getErrorMessage(error) },
      { status: 500 },
    )
  }
}
