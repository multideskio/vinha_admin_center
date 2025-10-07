/**
 * @fileoverview Rota da API para gerenciar um administrador específico.
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, adminProfiles } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { z } from 'zod'
import * as bcrypt from 'bcrypt'
import { validateRequest } from '@/lib/jwt'
import type { UserRole } from '@/lib/types'
import { getErrorMessage } from '@/lib/error-types'

const adminUpdateSchema = z
  .object({
    firstName: z.string().min(1, 'O nome é obrigatório.').optional(),
    lastName: z.string().min(1, 'O sobrenome é obrigatório.').optional(),
    email: z.string().email('E-mail inválido.').optional(),
    phone: z.string().optional(),
    cep: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    neighborhood: z.string().optional(),
    address: z.string().optional(),
    role: z.enum(['admin', 'superadmin']).optional(),
    facebook: z.string().url().or(z.literal('')).optional(),
    instagram: z.string().url().or(z.literal('')).optional(),
    website: z.string().url().or(z.literal('')).optional(),
    newPassword: z.string().optional().or(z.literal('')),
  })
  .partial()

export async function GET(request: Request, props: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const params = await props.params;
  const { user: sessionUser } = await validateRequest()
  if (!sessionUser || (sessionUser.role as UserRole) !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { id } = params

  try {
    const result = await db
      .select({
        user: users,
        profile: adminProfiles,
      })
      .from(users)
      .leftJoin(adminProfiles, eq(users.id, adminProfiles.userId))
      .where(and(eq(users.id, id), eq(users.role, 'admin'), isNull(users.deletedAt)))
      .limit(1)

    if (result.length === 0 || !result[0]) {
      return NextResponse.json({ error: 'Administrador não encontrado.' }, { status: 404 })
    }

    const { user, profile } = result[0]

    return NextResponse.json({
      id: user.id,
      firstName: profile?.firstName,
      lastName: profile?.lastName,
      cpf: profile?.cpf,
      email: user.email,
      phone: user.phone,
      cep: profile?.cep,
      state: profile?.state,
      city: profile?.city,
      neighborhood: profile?.neighborhood,
      address: profile?.address,
      permission: profile?.permission,
      facebook: profile?.facebook,
      instagram: profile?.instagram,
      website: profile?.website,
      status: user.status,
    })
  } catch (error) {
    console.error('Erro ao buscar administrador:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar administrador', details: getErrorMessage(error) },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const params = await props.params;
  const { user } = await validateRequest()
  if (!user || (user.role as UserRole) !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { id } = params

  try {
    const body = await request.json()
    const validatedData = adminUpdateSchema.parse(body)

    await db.transaction(async (tx) => {
      const userUpdateData: Partial<typeof users.$inferInsert> = {}
      if (validatedData.email) userUpdateData.email = validatedData.email
      if (validatedData.phone) userUpdateData.phone = validatedData.phone

      if (validatedData.newPassword) {
        userUpdateData.password = await bcrypt.hash(validatedData.newPassword, 10)
      }

      if (Object.keys(userUpdateData).length > 0) {
        userUpdateData.updatedAt = new Date()
        await tx.update(users).set(userUpdateData).where(eq(users.id, id))
      }

      const profileUpdateData: Partial<typeof adminProfiles.$inferInsert> = {}
      if (validatedData.firstName) profileUpdateData.firstName = validatedData.firstName
      if (validatedData.lastName) profileUpdateData.lastName = validatedData.lastName
      if (validatedData.cep) profileUpdateData.cep = validatedData.cep
      if (validatedData.state) profileUpdateData.state = validatedData.state
      if (validatedData.city) profileUpdateData.city = validatedData.city
      if (validatedData.neighborhood) profileUpdateData.neighborhood = validatedData.neighborhood
      if (validatedData.address) profileUpdateData.address = validatedData.address
      if (validatedData.role) profileUpdateData.permission = validatedData.role
      if (validatedData.facebook) profileUpdateData.facebook = validatedData.facebook
      if (validatedData.instagram) profileUpdateData.instagram = validatedData.instagram
      if (validatedData.website) profileUpdateData.website = validatedData.website

      if (Object.keys(profileUpdateData).length > 0) {
        await tx.update(adminProfiles).set(profileUpdateData).where(eq(adminProfiles.userId, id))
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
    console.error('Erro ao atualizar administrador:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar administrador', details: getErrorMessage(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const params = await props.params;
  const { user } = await validateRequest()
  if (!user || (user.role as UserRole) !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { id } = params

  try {
    await db
      .update(users)
      .set({
        deletedAt: new Date(),
        status: 'inactive',
      })
      .where(eq(users.id, id))

    return NextResponse.json({ success: true, message: 'Administrador excluído com sucesso.' })
  } catch (error) {
    console.error('Erro ao excluir administrador:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir administrador', details: getErrorMessage(error) },
      { status: 500 },
    )
  }
}
