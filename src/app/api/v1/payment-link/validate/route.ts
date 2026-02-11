/**
 * API para validar token de pagamento e criar sessão temporária
 * POST /api/v1/payment-link/validate
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validatePaymentToken } from '@/lib/payment-token'
import { db } from '@/db/drizzle'
import {
  users,
  pastorProfiles,
  churchProfiles,
  supervisorProfiles,
  managerProfiles,
} from '@/db/schema'
import { eq } from 'drizzle-orm'
import { createJWT, setJWTCookie } from '@/lib/jwt'
import { rateLimit } from '@/lib/rate-limit'
import type { UserRole } from '@/lib/types'

const validateSchema = z.object({
  token: z.string().min(10, 'Token inválido'),
})

export async function POST(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ip = forwardedFor?.split(',')[0]?.trim() || 'anonymous'
    const rl = await rateLimit('payment-link:validate', ip, 10, 60)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Muitas tentativas. Aguarde um minuto.' }, { status: 429 })
    }

    const body = await request.json()
    const { token } = validateSchema.parse(body)

    const result = await validatePaymentToken(token)

    if (!result.valid || !result.userId) {
      return NextResponse.json(
        { error: result.error || 'Token inválido ou expirado' },
        { status: 401 },
      )
    }

    // Buscar dados do usuário
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        companyId: users.companyId,
      })
      .from(users)
      .where(eq(users.id, result.userId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Buscar nome do perfil
    let userName = user.email.split('@')[0] || 'Membro'
    try {
      if (user.role === 'pastor') {
        const [profile] = await db
          .select({ firstName: pastorProfiles.firstName, lastName: pastorProfiles.lastName })
          .from(pastorProfiles)
          .where(eq(pastorProfiles.userId, user.id))
          .limit(1)
        if (profile) userName = `${profile.firstName} ${profile.lastName}`
      } else if (user.role === 'church_account') {
        const [profile] = await db
          .select({ nomeFantasia: churchProfiles.nomeFantasia })
          .from(churchProfiles)
          .where(eq(churchProfiles.userId, user.id))
          .limit(1)
        if (profile) userName = profile.nomeFantasia
      } else if (user.role === 'supervisor') {
        const [profile] = await db
          .select({
            firstName: supervisorProfiles.firstName,
            lastName: supervisorProfiles.lastName,
          })
          .from(supervisorProfiles)
          .where(eq(supervisorProfiles.userId, user.id))
          .limit(1)
        if (profile) userName = `${profile.firstName} ${profile.lastName}`
      } else if (user.role === 'manager') {
        const [profile] = await db
          .select({ firstName: managerProfiles.firstName, lastName: managerProfiles.lastName })
          .from(managerProfiles)
          .where(eq(managerProfiles.userId, user.id))
          .limit(1)
        if (profile) userName = `${profile.firstName} ${profile.lastName}`
      }
    } catch (error) {
      console.warn('[PAYMENT_LINK] Erro ao buscar perfil do usuário:', error)
    }

    // Criar JWT e setar cookie para autenticar o usuário
    const jwt = await createJWT({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
    })
    await setJWTCookie(jwt)

    // Determinar a rota de contribuição baseada no role
    const roleRoutes: Record<string, string> = {
      pastor: '/pastor/contribuir',
      church_account: '/igreja/contribuir',
      supervisor: '/supervisor/contribuicoes',
      manager: '/manager/contribuicoes',
    }
    const redirectUrl = roleRoutes[user.role] || '/auth/login'

    return NextResponse.json({
      success: true,
      user: {
        name: userName,
        role: user.role,
      },
      redirectUrl,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    console.error('[PAYMENT_LINK_VALIDATE] Erro:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
