/**
 * @fileoverview Rota da API para gerenciar um gerente específico (visão do gerente).
 * @version 1.3
 * @date 2024-08-07
 * @author PH
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, managerProfiles } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import { getErrorMessage } from '@/lib/error-types'

export async function GET(
  _: Request,
  props: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const params = await props.params
  const { user } = await validateRequest()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = params

  // Usuário pode ver apenas seu próprio perfil OU admin pode ver qualquer um
  if (user.id !== id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  try {
    const result = await db
      .select({
        user: users,
        profile: managerProfiles,
      })
      .from(users)
      .leftJoin(managerProfiles, eq(users.id, managerProfiles.userId))
      .where(and(eq(users.id, id), eq(users.role, 'manager'), isNull(users.deletedAt)))
      .limit(1)

    if (result.length === 0 || !result[0]) {
      return NextResponse.json({ error: 'Gerente não encontrado.' }, { status: 404 })
    }

    const { user: userData, profile } = result[0]
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = userData

    return NextResponse.json({ ...userWithoutPassword, ...profile })
  } catch (error: unknown) {
    console.error('Erro ao buscar gerente:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar gerente', details: getErrorMessage(error) },
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
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = params

  // Apenas admin pode alterar qualquer gerente OU gerente pode alterar seus próprios dados
  if (user.role !== 'admin' && user.id !== id) {
    return NextResponse.json(
      { error: 'Acesso negado. Você só pode alterar seus próprios dados.' },
      { status: 403 },
    )
  }

  // Se não é admin, redireciona para API de perfil próprio
  if (user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Use /api/v1/manager/perfil para alterar seu próprio perfil.' },
      { status: 410 },
    )
  }

  // Admin deve usar a API correta
  return NextResponse.json(
    { error: 'Use /api/v1/admin/gerentes/[id] para alterar gerentes.' },
    { status: 410 },
  )
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const params = await props.params
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Acesso negado. Apenas administradores podem excluir gerentes.' },
      { status: 403 },
    )
  }

  // Esta funcionalidade foi movida para /api/v1/admin/gerentes/[id]
  // Mantendo apenas para compatibilidade, mas bloqueando acesso
  return NextResponse.json(
    { error: 'Use /api/v1/admin/gerentes/[id] para excluir gerentes.' },
    { status: 410 },
  )
}
