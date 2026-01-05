import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, pastorProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import { getErrorMessage } from '@/lib/error-types'
import * as bcrypt from 'bcrypt'

export async function GET(): Promise<NextResponse> {
  const { user: sessionUser } = await validateRequest()
  if (!sessionUser || sessionUser.role !== 'pastor') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const [profile] = await db
      .select()
      .from(pastorProfiles)
      .where(eq(pastorProfiles.userId, sessionUser.id))

    // Converter data de yyyy-mm-dd para dd/mm/yyyy
    let birthDate = profile?.birthDate
    if (birthDate) {
      const date = new Date(birthDate)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      birthDate = `${day}/${month}/${year}`
    }

    return NextResponse.json({
      ...sessionUser,
      ...profile,
      birthDate,
      userId: sessionUser.id,
      avatarUrl: sessionUser.avatarUrl,
    })
  } catch (error) {
    console.error('Erro ao buscar perfil do pastor:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar perfil', details: getErrorMessage(error) },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  const { user: sessionUser } = await validateRequest()
  if (!sessionUser || sessionUser.role !== 'pastor') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      newPassword,
      email,
      phone,
      titheDay,
      avatarUrl,
      facebook,
      instagram,
      website,
      birthDate,
      ...profileData
    } = body

    // Atualizar tabela users
    const userUpdate: {
      email?: string
      phone?: string
      titheDay?: number
      avatarUrl?: string
      password?: string
    } = {}
    if (email) userUpdate.email = email
    if (phone) userUpdate.phone = phone
    if (titheDay) userUpdate.titheDay = titheDay
    if (avatarUrl) userUpdate.avatarUrl = avatarUrl
    if (newPassword) {
      userUpdate.password = await bcrypt.hash(newPassword, 10)
    }

    if (Object.keys(userUpdate).length > 0) {
      await db.update(users).set(userUpdate).where(eq(users.id, sessionUser.id))
    }

    // Atualizar tabela pastor_profiles
    const profileUpdate: Record<string, unknown> = {}

    Object.keys(profileData).forEach((key) => {
      const value = profileData[key]
      if (value !== undefined && value !== null && value !== '') {
        profileUpdate[key] = value
      }
    })

    // Converter data de dd/mm/yyyy para yyyy-mm-dd
    if (birthDate && birthDate.length === 10) {
      const [day, month, year] = birthDate.split('/')
      if (day && month && year) {
        profileUpdate.birthDate = `${year}-${month}-${day}`
      }
    }

    if (facebook) profileUpdate.facebook = facebook
    if (instagram) profileUpdate.instagram = instagram
    if (website) profileUpdate.website = website

    if (Object.keys(profileUpdate).length > 0) {
      await db
        .update(pastorProfiles)
        .set(profileUpdate)
        .where(eq(pastorProfiles.userId, sessionUser.id))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar perfil do pastor:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil', details: getErrorMessage(error) },
      { status: 500 },
    )
  }
}
