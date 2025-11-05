/**
 * @fileoverview API para buscar informações do usuário logado
 * @version 1.0
 * @date 2025-11-05
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, adminProfiles, managerProfiles, supervisorProfiles, pastorProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'

export async function GET(): Promise<NextResponse> {
  const { user } = await validateRequest()
  
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    let firstName = null
    let lastName = null
    let avatarUrl = null

    // Buscar avatar do users
    const [userData] = await db
      .select({ avatarUrl: users.avatarUrl })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
    
    avatarUrl = userData?.avatarUrl

    // Buscar nome baseado no role
    if (user.role === 'admin') {
      const [profile] = await db
        .select({
          firstName: adminProfiles.firstName,
          lastName: adminProfiles.lastName,
        })
        .from(adminProfiles)
        .where(eq(adminProfiles.userId, user.id))
        .limit(1)
      
      if (profile) {
        firstName = profile.firstName
        lastName = profile.lastName
      }
    } else if (user.role === 'manager') {
      const [profile] = await db
        .select({
          firstName: managerProfiles.firstName,
          lastName: managerProfiles.lastName,
        })
        .from(managerProfiles)
        .where(eq(managerProfiles.userId, user.id))
        .limit(1)
      
      if (profile) {
        firstName = profile.firstName
        lastName = profile.lastName
      }
    } else if (user.role === 'supervisor') {
      const [profile] = await db
        .select({
          firstName: supervisorProfiles.firstName,
          lastName: supervisorProfiles.lastName,
        })
        .from(supervisorProfiles)
        .where(eq(supervisorProfiles.userId, user.id))
        .limit(1)
      
      if (profile) {
        firstName = profile.firstName
        lastName = profile.lastName
      }
    } else if (user.role === 'pastor') {
      const [profile] = await db
        .select({
          firstName: pastorProfiles.firstName,
          lastName: pastorProfiles.lastName,
        })
        .from(pastorProfiles)
        .where(eq(pastorProfiles.userId, user.id))
        .limit(1)
      
      if (profile) {
        firstName = profile.firstName
        lastName = profile.lastName
      }
    }

    // Fallback para email se não encontrar nome
    const displayName = firstName
      ? `${firstName} ${lastName || ''}`
      : user.email?.split('@')[0] || 'Usuário'

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName,
      lastName,
      displayName: displayName.trim(),
      avatarUrl,
    })
  } catch (error: unknown) {
    console.error('Erro ao buscar dados do usuário:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados do usuário' },
      { status: 500 }
    )
  }
}

