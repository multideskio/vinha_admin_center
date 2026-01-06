import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, churchProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import { authenticateApiKey } from '@/lib/api-auth'
import { getErrorMessage } from '@/lib/error-types'
import { rateLimit } from '@/lib/rate-limit'
import * as bcrypt from 'bcrypt'

export async function GET(request: Request): Promise<NextResponse> {
  let sessionUser: any = null

  try {
    // Rate limiting: 60 requests per minute
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('igreja-perfil-get', ip, 60, 60)
    if (!rateLimitResult.allowed) {
      console.error('[IGREJA_PERFIL_GET_RATE_LIMIT]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 },
      )
    }

    const { user: authUser } = await validateRequest()
    sessionUser = authUser

    if (!sessionUser) {
      const authResponse = await authenticateApiKey()
      if (authResponse) return authResponse
      console.error('[IGREJA_PERFIL_GET_AUTH_ERROR]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    if (!['igreja', 'church_account'].includes(sessionUser.role)) {
      console.error('[IGREJA_PERFIL_GET_ROLE_ERROR]', {
        userId: sessionUser.id,
        role: sessionUser.role,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Acesso negado. Role igreja necessária.' }, { status: 403 })
    }

    console.log('[IGREJA_PERFIL_GET_REQUEST]', {
      churchId: sessionUser.id,
      timestamp: new Date().toISOString(),
    })

    // Buscar usuário atualizado do banco (não usar apenas sessionUser do JWT)
    const [userData] = await db
      .select({
        id: users.id,
        email: users.email,
        phone: users.phone,
        titheDay: users.titheDay,
        avatarUrl: users.avatarUrl,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, sessionUser.id))
      .limit(1)

    const [profile] = await db
      .select()
      .from(churchProfiles)
      .where(eq(churchProfiles.userId, sessionUser.id))
      .limit(1)

    // Converter data de yyyy-mm-dd para dd/mm/yyyy
    let foundationDate = profile?.foundationDate
    if (foundationDate) {
      const date = new Date(foundationDate)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      foundationDate = `${day}/${month}/${year}`
    }

    console.log('[IGREJA_PERFIL_GET_SUCCESS]', {
      churchId: sessionUser.id,
      phoneFromDB: userData?.phone,
      phoneFromJWT: sessionUser.phone,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      ...sessionUser,
      ...profile,
      ...userData,
      foundationDate,
      userId: sessionUser.id,
      avatarUrl: userData?.avatarUrl || sessionUser.avatarUrl,
      phone: userData?.phone || null, // Usar telefone do banco de dados, não do JWT
    })
  } catch (error) {
    console.error('[IGREJA_PERFIL_GET_ERROR]', {
      churchId: sessionUser?.id,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json(
      { error: 'Erro ao buscar perfil', details: getErrorMessage(error) },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  let sessionUser: any = null

  try {
    // Rate limiting: 30 requests per minute for updates
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('igreja-perfil-put', ip, 30, 60)
    if (!rateLimitResult.allowed) {
      console.error('[IGREJA_PERFIL_PUT_RATE_LIMIT]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 },
      )
    }

    const { user: authUser } = await validateRequest()
    sessionUser = authUser

    if (!sessionUser) {
      const authResponse = await authenticateApiKey()
      if (authResponse) return authResponse
      console.error('[IGREJA_PERFIL_PUT_AUTH_ERROR]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    if (!['igreja', 'church_account'].includes(sessionUser.role)) {
      console.error('[IGREJA_PERFIL_PUT_ROLE_ERROR]', {
        userId: sessionUser.id,
        role: sessionUser.role,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Acesso negado. Role igreja necessária.' }, { status: 403 })
    }

    const body = await request.json()
    console.log('[IGREJA_PERFIL_PUT_REQUEST]', {
      churchId: sessionUser.id,
      phone: body.phone,
      timestamp: new Date().toISOString(),
    })
    const {
      newPassword,
      email,
      phone,
      titheDay,
      avatarUrl,
      facebook,
      instagram,
      website,
      foundationDate,
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
    if (email !== undefined) userUpdate.email = email
    if (phone !== undefined) {
      // Converter para string e salvar telefone (será undefined se vazio)
      const phoneStr = String(phone || '').trim()
      userUpdate.phone = phoneStr !== '' ? phoneStr : undefined
      console.log('[IGREJA_PERFIL_PUT_PHONE_PROCESSING]', {
        phoneOriginal: phone,
        phoneType: typeof phone,
        phoneStr,
        willSave: phoneStr !== '' ? phoneStr : undefined,
      })
    }
    if (titheDay !== undefined) userUpdate.titheDay = titheDay
    if (avatarUrl !== undefined) userUpdate.avatarUrl = avatarUrl
    if (newPassword) {
      userUpdate.password = await bcrypt.hash(newPassword, 10)
    }

    if (Object.keys(userUpdate).length > 0) {
      console.log('[IGREJA_PERFIL_PUT_USER_UPDATE]', {
        churchId: sessionUser.id,
        userUpdate,
        timestamp: new Date().toISOString(),
      })
      await db.update(users).set(userUpdate).where(eq(users.id, sessionUser.id))
    }

    // Atualizar tabela church_profiles
    const profileUpdate: Record<string, unknown> = {}

    Object.keys(profileData).forEach((key) => {
      const value = profileData[key]
      if (value !== undefined && value !== null && value !== '') {
        profileUpdate[key] = value
      }
    })

    // Converter data de dd/mm/yyyy para yyyy-mm-dd
    if (foundationDate && foundationDate.length === 10) {
      const [day, month, year] = foundationDate.split('/')
      if (day && month && year) {
        profileUpdate.foundationDate = `${year}-${month}-${day}`
      }
    }

    // Redes sociais - aceitar string vazia como null
    if (facebook !== undefined) profileUpdate.facebook = facebook === '' ? null : facebook
    if (instagram !== undefined) profileUpdate.instagram = instagram === '' ? null : instagram
    if (website !== undefined) profileUpdate.website = website === '' ? null : website

    if (Object.keys(profileUpdate).length > 0) {
      await db
        .update(churchProfiles)
        .set(profileUpdate)
        .where(eq(churchProfiles.userId, sessionUser.id))
    }

    console.log('[IGREJA_PERFIL_PUT_SUCCESS]', {
      churchId: sessionUser.id,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[IGREJA_PERFIL_PUT_ERROR]', {
      churchId: sessionUser?.id,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil', details: getErrorMessage(error) },
      { status: 500 },
    )
  }
}
