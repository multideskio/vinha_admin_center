import { NextResponse } from 'next/server'
import { validateRequest } from '@/lib/jwt'

/**
 * GET /api/v1/auth/me
 * Retorna informações do usuário autenticado
 */
export async function GET() {
  try {
    const { user } = await validateRequest()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
    })
  } catch (error) {
    console.error('[AUTH_ME_ERROR]', error)
    return NextResponse.json({ error: 'Erro ao buscar usuário' }, { status: 500 })
  }
}
