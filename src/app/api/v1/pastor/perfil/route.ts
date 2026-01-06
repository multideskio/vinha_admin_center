import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, pastorProfiles } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import { getErrorMessage } from '@/lib/error-types'
import { rateLimit } from '@/lib/rate-limit'
import * as bcrypt from 'bcrypt'

export async function GET(request: Request): Promise<NextResponse> {
  let sessionUser: any = null

  try {
    // Rate limiting: 60 requests per minute
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('pastor-perfil-get', ip, 60, 60)
    if (!rateLimitResult.allowed) {
      console.error('[PASTOR_PERFIL_GET_RATE_LIMIT]', {
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

    if (!sessionUser || sessionUser.role !== 'pastor') {
      console.error('[PASTOR_PERFIL_GET_AUTH_ERROR]', {
        ip,
        role: sessionUser?.role,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    console.log('[PASTOR_PERFIL_GET_REQUEST]', {
      pastorId: sessionUser.id,
      timestamp: new Date().toISOString(),
    })

    // Buscar dados do usuário e perfil com join
    const [result] = await db
      .select({
        user: users,
        profile: pastorProfiles,
      })
      .from(users)
      .leftJoin(pastorProfiles, eq(users.id, pastorProfiles.userId))
      .where(and(eq(users.id, sessionUser.id), eq(users.role, 'pastor'), isNull(users.deletedAt)))
      .limit(1)

    if (!result || !result.profile) {
      console.error('[PASTOR_PERFIL_GET_NOT_FOUND]', {
        pastorId: sessionUser.id,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 })
    }

    const { user, profile } = result

    // Converter data de yyyy-mm-dd para dd/mm/yyyy
    let birthDate = profile.birthDate
    if (birthDate) {
      const date = new Date(birthDate)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      birthDate = `${day}/${month}/${year}`
    }

    // Retornar todos os dados necessários, mapeando address para street
    return NextResponse.json({
      id: user.id,
      userId: user.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      cpf: profile.cpf,
      email: user.email,
      phone: user.phone,
      landline: profile.landline,
      cep: profile.cep,
      state: profile.state,
      city: profile.city,
      neighborhood: profile.neighborhood,
      street: profile.address || '', // Mapear address para street
      address: profile.address, // Manter address também para compatibilidade
      number: profile.number,
      complement: profile.complement,
      birthDate,
      titheDay: user.titheDay,
      supervisorId: profile.supervisorId,
      facebook: profile.facebook,
      instagram: profile.instagram,
      website: profile.website,
      avatarUrl: user.avatarUrl,
      status: user.status,
    })
  } catch (error) {
    console.error('[PASTOR_PERFIL_GET_ERROR]', {
      pastorId: sessionUser?.id,
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
    const rateLimitResult = await rateLimit('pastor-perfil-put', ip, 30, 60)
    if (!rateLimitResult.allowed) {
      console.error('[PASTOR_PERFIL_PUT_RATE_LIMIT]', {
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

    if (!sessionUser || sessionUser.role !== 'pastor') {
      console.error('[PASTOR_PERFIL_PUT_AUTH_ERROR]', {
        ip,
        role: sessionUser?.role,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    console.log('[PASTOR_PERFIL_PUT_REQUEST]', {
      pastorId: sessionUser.id,
      timestamp: new Date().toISOString(),
    })

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
      street, // Campo street do frontend
      ...profileData
    } = body

    // Atualizar tabela users
    const userUpdate: {
      email?: string
      phone?: string
      titheDay?: number
      avatarUrl?: string
      password?: string
      updatedAt?: Date
    } = {}
    if (email) userUpdate.email = email
    if (phone) userUpdate.phone = phone
    if (titheDay !== undefined) userUpdate.titheDay = titheDay
    if (avatarUrl) userUpdate.avatarUrl = avatarUrl
    if (newPassword && newPassword !== '') {
      userUpdate.password = await bcrypt.hash(newPassword, 10)
    }

    if (Object.keys(userUpdate).length > 0) {
      userUpdate.updatedAt = new Date()
      await db.update(users).set(userUpdate).where(eq(users.id, sessionUser.id))
    }

    // Atualizar tabela pastor_profiles
    const profileUpdate: Record<string, unknown> = {}

    // Mapear street para address (campo do banco)
    if (street !== undefined) {
      profileUpdate.address = street || null
    }

    // Processar outros campos do profileData
    Object.keys(profileData).forEach((key) => {
      // Ignorar campos que não pertencem ao perfil
      if (['id', 'userId', 'avatarUrl', 'status'].includes(key)) return

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

    // Redes sociais - aceitar string vazia como null
    if (facebook !== undefined) profileUpdate.facebook = facebook === '' ? null : facebook
    if (instagram !== undefined) profileUpdate.instagram = instagram === '' ? null : instagram
    if (website !== undefined) profileUpdate.website = website === '' ? null : website

    if (Object.keys(profileUpdate).length > 0) {
      await db
        .update(pastorProfiles)
        .set(profileUpdate)
        .where(eq(pastorProfiles.userId, sessionUser.id))
    }

    console.log('[PASTOR_PERFIL_PUT_SUCCESS]', {
      pastorId: sessionUser.id,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PASTOR_PERFIL_PUT_ERROR]', {
      pastorId: sessionUser?.id,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil', details: getErrorMessage(error) },
      { status: 500 },
    )
  }
}
