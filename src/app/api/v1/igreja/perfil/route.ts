import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, churchProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import { getErrorMessage } from '@/lib/error-types'
import * as bcrypt from 'bcrypt'

export async function GET(): Promise<NextResponse> {
  const { user: sessionUser } = await validateRequest()
  if (!sessionUser || !['igreja', 'church_account'].includes(sessionUser.role)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const [profile] = await db
      .select()
      .from(churchProfiles)
      .where(eq(churchProfiles.userId, sessionUser.id))

    return NextResponse.json({ 
      ...sessionUser, 
      ...profile,
      userId: sessionUser.id // Garantir que o userId correto está disponível
    })
  } catch (error) {
    console.error('Erro ao buscar perfil da igreja:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar perfil', details: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  const { user: sessionUser } = await validateRequest()
  if (!sessionUser || !['igreja', 'church_account'].includes(sessionUser.role)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { newPassword, email, phone, titheDay, facebook, instagram, website, ...profileData } = body

    const userUpdate: any = { email, phone, titheDay }
    if (newPassword) {
      userUpdate.password = await bcrypt.hash(newPassword, 10)
    }
    await db.update(users).set(userUpdate).where(eq(users.id, sessionUser.id))

    await db
      .update(churchProfiles)
      .set({ ...profileData, facebook, instagram, website })
      .where(eq(churchProfiles.userId, sessionUser.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar perfil da igreja:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil', details: getErrorMessage(error) },
      { status: 500 }
    )
  }
}