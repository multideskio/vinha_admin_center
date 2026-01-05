/**
 * @fileoverview API route para fornecer dados de layout
 * @version 1.0
 * @date 2025-01-28
 * @author Sistema de Padronização
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import {
  users,
  adminProfiles,
  managerProfiles,
  supervisorProfiles,
  pastorProfiles,
  churchProfiles,
} from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getCompanySettings } from '@/lib/company'
import { validateRequest } from '@/lib/jwt'

export async function GET(request: Request): Promise<NextResponse> {
  try {
    // Validar autenticação
    const { user: sessionUser } = await validateRequest()
    if (!sessionUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const role = url.searchParams.get('role')

    if (!userId || !role) {
      return NextResponse.json({ error: 'Parâmetros obrigatórios: userId e role' }, { status: 400 })
    }

    // Verificar se o usuário pode acessar estes dados
    if (sessionUser.id !== userId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Carregar dados do usuário e da empresa em paralelo
    const [userData, company] = await Promise.all([
      getUserProfileData(userId, role),
      getCompanySettings(),
    ])

    if (!userData) {
      return NextResponse.json({ error: 'Dados do usuário não encontrados' }, { status: 404 })
    }

    // Gerar nome de exibição e fallback
    const displayName = userData.profile.firstName
      ? `${userData.profile.firstName} ${userData.profile.lastName || ''}`.trim()
      : userData.user.email?.split('@')[0] || 'Usuário'

    const userFallback = userData.profile.firstName
      ? `${userData.profile.firstName[0]}${userData.profile.lastName?.[0] || ''}`
      : displayName.substring(0, 2).toUpperCase()

    const layoutData = {
      user: userData.user,
      profile: userData.profile,
      company: {
        name: company?.name,
        logoUrl: company?.logoUrl,
      },
      displayName,
      userFallback,
    }

    return NextResponse.json(layoutData)
  } catch (error) {
    console.error('Erro na API de layout data:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

/**
 * Carrega dados do usuário e perfil específico baseado na role
 */
async function getUserProfileData(userId: string, role: string) {
  try {
    // Query específica para cada role devido às diferenças nos schemas
    if (role === 'igreja' || role === 'church_account') {
      // Igreja usa nomeFantasia como firstName
      const result = await db
        .select({
          userId: users.id,
          email: users.email,
          userRole: users.role,
          avatarUrl: users.avatarUrl,
          firstName: churchProfiles.nomeFantasia,
          lastName: churchProfiles.razaoSocial,
        })
        .from(users)
        .leftJoin(churchProfiles, eq(users.id, churchProfiles.userId))
        .where(eq(users.id, userId))
        .limit(1)

      const userData = result[0]
      if (!userData) return null

      return {
        user: {
          id: userData.userId,
          email: userData.email ?? '',
          role: userData.userRole,
          avatarUrl: userData.avatarUrl || undefined,
        },
        profile: {
          firstName: userData.firstName || undefined,
          lastName: userData.lastName || undefined,
        },
      }
    }

    // Para outras roles (admin, manager, supervisor, pastor)
    const profileTableMap = {
      admin: adminProfiles,
      manager: managerProfiles,
      supervisor: supervisorProfiles,
      pastor: pastorProfiles,
    } as const

    const profileTable = profileTableMap[role as keyof typeof profileTableMap]

    if (!profileTable) {
      throw new Error(`Role não suportada: ${role}`)
    }

    const result = await db
      .select({
        userId: users.id,
        email: users.email,
        userRole: users.role,
        avatarUrl: users.avatarUrl,
        firstName: profileTable.firstName,
        lastName: profileTable.lastName,
      })
      .from(users)
      .leftJoin(profileTable, eq(users.id, profileTable.userId))
      .where(eq(users.id, userId))
      .limit(1)

    const userData = result[0]
    if (!userData) return null

    return {
      user: {
        id: userData.userId,
        email: userData.email ?? '',
        role: userData.userRole,
        avatarUrl: userData.avatarUrl || undefined,
      },
      profile: {
        firstName: userData.firstName || undefined,
        lastName: userData.lastName || undefined,
      },
    }
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error)
    throw error
  }
}
