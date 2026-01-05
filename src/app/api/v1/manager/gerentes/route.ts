/**
 * @fileoverview Rota da API para gerenciar gerentes (visão do gerente).
 * @version 1.3
 * @date 2024-08-07
 * @author PH
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, managerProfiles } from '@/db/schema'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import { getErrorMessage } from '@/lib/error-types'

const COMPANY_ID = process.env.COMPANY_INIT
if (!COMPANY_ID) {
  throw new Error('COMPANY_INIT environment variable is required')
}
const VALIDATED_COMPANY_ID = COMPANY_ID as string

export async function GET(_request: Request): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const minimal = url.searchParams.get('minimal') === 'true'

    if (minimal) {
      const result = await db
        .select({
          id: users.id,
          firstName: managerProfiles.firstName,
          lastName: managerProfiles.lastName,
        })
        .from(managerProfiles)
        .innerJoin(users, eq(users.id, managerProfiles.userId))
        .where(and(eq(users.role, 'manager'), isNull(users.deletedAt)))
        .orderBy(desc(users.createdAt))
      return NextResponse.json({ managers: result })
    }

    const result = await db
      .select({
        user: users,
        profile: managerProfiles,
      })
      .from(users)
      .leftJoin(managerProfiles, eq(users.id, managerProfiles.userId))
      .where(
        and(
          eq(users.role, 'manager'),
          eq(users.companyId, VALIDATED_COMPANY_ID),
          isNull(users.deletedAt),
        ),
      )
      .orderBy(desc(users.createdAt))

    const managers = result.map((r) => ({ ...r.user, ...r.profile }))
    return NextResponse.json({ managers })
  } catch (error: unknown) {
    console.error('Erro ao buscar gerentes:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar gerentes', details: getErrorMessage(error) },
      { status: 500 },
    )
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Acesso negado. Apenas administradores podem criar gerentes.' },
      { status: 403 },
    )
  }

  // Esta funcionalidade foi movida para /api/v1/admin/gerentes
  // Mantendo apenas para compatibilidade, mas bloqueando acesso
  return NextResponse.json(
    { error: 'Use /api/v1/admin/gerentes para criar gerentes.' },
    { status: 410 },
  )
}
