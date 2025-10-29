import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, churchProfiles, supervisorProfiles } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { z } from 'zod'
import * as bcrypt from 'bcrypt'
import { validateRequest } from '@/lib/jwt'
import { churchProfileSchema, type UserRole } from '@/lib/types'

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

  const [church] = await db.select().from(churchProfiles).where(eq(churchProfiles.userId, churchId))
  if (!church || !church.supervisorId) return false

  return supervisorIdsManagedByGerente.some((s) => s.id === church.supervisorId)
}

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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
    console.error('Erro ao buscar igreja:', error)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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

    await db
      .update(users)
      .set({
        deletedAt: new Date(),
        deletedBy: sessionUser.id,
        deletionReason,
        status: 'inactive',
      })
      .where(eq(users.id, id))

    return NextResponse.json({ success: true, message: 'Igreja excluída com sucesso.' })
  } catch (error) {
    console.error('Erro ao excluir igreja:', error)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
