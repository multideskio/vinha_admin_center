/**
 * @fileoverview Rota da API para gerenciar uma igreja específica.
 * @version 1.3
 * @date 2024-08-08
 * @author PH
 */

import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/db/drizzle'
import { users, churchProfiles } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { z } from 'zod'
import * as bcrypt from 'bcrypt'
import { validateRequest } from '@/lib/jwt'
import { churchProfileSchema, type UserRole } from '@/lib/types'
import { getErrorMessage } from '@/lib/error-types'
import { onUserDeleted } from '@/lib/notification-hooks'
import { invalidateCache } from '@/lib/cache'

const churchUpdateSchema = churchProfileSchema
  .extend({
    newPassword: z.string().optional().or(z.literal('')),
  })
  .partial()

const deleteSchema = z.object({
  deletionReason: z.string().min(1, 'O motivo da exclusão é obrigatório.'),
})

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const params = await props.params
  const { user: sessionUser } = await validateRequest()
  if (!sessionUser || (sessionUser.role as UserRole) !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { id } = params

  try {
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

    return NextResponse.json({
      id: user.id,
      cnpj: profile?.cnpj,
      razaoSocial: profile?.razaoSocial,
      nomeFantasia: profile?.nomeFantasia,
      email: user.email,
      phone: user.phone,
      cep: profile?.cep,
      state: profile?.state,
      city: profile?.city,
      neighborhood: profile?.neighborhood,
      address: profile?.address,
      foundationDate: profile?.foundationDate,
      titheDay: user.titheDay,
      supervisorId: profile?.supervisorId,
      treasurerFirstName: profile?.treasurerFirstName,
      treasurerLastName: profile?.treasurerLastName,
      treasurerCpf: profile?.treasurerCpf,
      facebook: profile?.facebook,
      instagram: profile?.instagram,
      website: profile?.website,
      avatarUrl: user.avatarUrl,
      status: user.status,
    })
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error)
    console.error('Erro ao buscar igreja:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar igreja', details: errorMessage },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const params = await props.params
  const { user } = await validateRequest()
  if (!user || (user.role as UserRole) !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { id } = params

  try {
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
      if ('avatarUrl' in body) userUpdateData.avatarUrl = body.avatarUrl

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
      if (validatedData.facebook !== undefined) profileUpdateData.facebook = validatedData.facebook
      if (validatedData.instagram !== undefined)
        profileUpdateData.instagram = validatedData.instagram
      if (validatedData.website !== undefined) profileUpdateData.website = validatedData.website

      if (Object.keys(profileUpdateData).length > 0) {
        await tx.update(churchProfiles).set(profileUpdateData).where(eq(churchProfiles.userId, id))
      }
    })

    // Revalidar páginas do Next.js
    revalidatePath('/admin/igrejas')
    revalidatePath(`/admin/igrejas/${id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: error.errors },
        { status: 400 },
      )
    }
    console.error('Erro ao atualizar igreja:', error)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const params = await props.params
  const { user } = await validateRequest()
  if (!user || (user.role as UserRole) !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { id } = params

  try {
    const body = await request.json()
    const { deletionReason } = deleteSchema.parse(body)

    await db
      .update(users)
      .set({
        deletedAt: new Date(),
        status: 'inactive',
        deletedBy: user.id,
        deletionReason: deletionReason,
      })
      .where(eq(users.id, id))

    // Enviar notificação de exclusão
    await onUserDeleted(id, deletionReason, user.id)

    // ✅ Invalidar cache de relatórios de membresia após exclusão de usuário
    await invalidateCache('relatorio:membresia:*')

    // Revalidar páginas do Next.js
    revalidatePath('/admin/igrejas')
    revalidatePath(`/admin/igrejas/${id}`)

    return NextResponse.json({ success: true, message: 'Igreja excluída com sucesso.' })
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados de exclusão inválidos.', details: error.errors },
        { status: 400 },
      )
    }
    console.error('Erro ao excluir igreja:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir igreja', details: errorMessage },
      { status: 500 },
    )
  }
}
