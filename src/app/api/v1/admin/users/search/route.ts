/**
 * @fileoverview Endpoint para buscar usuários (para seleção em formulários)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import {
  users,
  managerProfiles,
  supervisorProfiles,
  pastorProfiles,
  churchProfiles,
} from '@/db/schema'
import { eq, or, ilike, isNull, and } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    if (query.length < 2) {
      return NextResponse.json({ users: [] })
    }

    // Buscar usuários ativos que correspondem à busca
    const searchPattern = `%${query}%`

    const results = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        managerFirstName: managerProfiles.firstName,
        managerLastName: managerProfiles.lastName,
        supervisorFirstName: supervisorProfiles.firstName,
        supervisorLastName: supervisorProfiles.lastName,
        pastorFirstName: pastorProfiles.firstName,
        pastorLastName: pastorProfiles.lastName,
        churchNomeFantasia: churchProfiles.nomeFantasia,
      })
      .from(users)
      .leftJoin(managerProfiles, eq(users.id, managerProfiles.userId))
      .leftJoin(supervisorProfiles, eq(users.id, supervisorProfiles.userId))
      .leftJoin(pastorProfiles, eq(users.id, pastorProfiles.userId))
      .leftJoin(churchProfiles, eq(users.id, churchProfiles.userId))
      .where(
        and(
          isNull(users.deletedAt),
          or(
            ilike(users.email, searchPattern),
            ilike(managerProfiles.firstName, searchPattern),
            ilike(managerProfiles.lastName, searchPattern),
            ilike(supervisorProfiles.firstName, searchPattern),
            ilike(supervisorProfiles.lastName, searchPattern),
            ilike(pastorProfiles.firstName, searchPattern),
            ilike(pastorProfiles.lastName, searchPattern),
            ilike(churchProfiles.nomeFantasia, searchPattern),
          ),
        ),
      )
      .limit(20)

    // Formatar resultados
    const formattedUsers = results.map((u) => {
      let name = u.email

      if (u.role === 'manager' && u.managerFirstName && u.managerLastName) {
        name = `${u.managerFirstName} ${u.managerLastName}`
      } else if (u.role === 'supervisor' && u.supervisorFirstName && u.supervisorLastName) {
        name = `${u.supervisorFirstName} ${u.supervisorLastName}`
      } else if (u.role === 'pastor' && u.pastorFirstName && u.pastorLastName) {
        name = `${u.pastorFirstName} ${u.pastorLastName}`
      } else if (u.role === 'church_account' && u.churchNomeFantasia) {
        name = u.churchNomeFantasia
      }

      const roleLabels: Record<string, string> = {
        admin: 'Admin',
        manager: 'Gerente',
        supervisor: 'Supervisor',
        pastor: 'Pastor',
        church_account: 'Igreja',
      }

      return {
        id: u.id,
        email: u.email,
        name,
        role: roleLabels[u.role] || u.role,
      }
    })

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error('[USER_SEARCH] Erro:', error)
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
  }
}
