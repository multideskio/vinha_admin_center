/**
 * @fileoverview API para relatório de membresia (crescimento de membros)
 * @version 1.0
 * @date 2025-11-05
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, pastorProfiles, supervisorProfiles, churchProfiles, regions } from '@/db/schema'
import { and, eq, isNull, gte, lt, sql, count as countFn } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import type { UserRole } from '@/lib/types'
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user || (user.role as UserRole) !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    
    // Filtros
    const roleFilter = searchParams.get('role') // 'all', 'pastor', 'church_account', 'supervisor', 'manager'

    const now = new Date()

    // Total de membros por role
    const membersByRole = await db
      .select({
        role: users.role,
        count: countFn(),
      })
      .from(users)
      .where(isNull(users.deletedAt))
      .groupBy(users.role)

    // Novos membros nos últimos 6 meses
    const sixMonthsAgo = subMonths(now, 6)
    const newMembersByMonth = await db
      .select({
        month: sql<string>`TO_CHAR(${users.createdAt}, 'YYYY-MM')`,
        count: countFn(),
      })
      .from(users)
      .where(gte(users.createdAt, sixMonthsAgo))
      .groupBy(sql`TO_CHAR(${users.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${users.createdAt}, 'YYYY-MM')`)

    // Membros criados neste mês
    const startOfCurrentMonth = startOfMonth(now)
    const newThisMonth = await db
      .select({
        role: users.role,
        count: countFn(),
      })
      .from(users)
      .where(gte(users.createdAt, startOfCurrentMonth))
      .groupBy(users.role)

    // Lista de membros recentes (últimos 50)
    let recentMembersQuery = db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        status: users.status,
      })
      .from(users)
      .where(isNull(users.deletedAt))
      .orderBy(sql`${users.createdAt} DESC`)
      .limit(50)

    const recentMembersData = await recentMembersQuery

    // Enriquecer com nomes
    const recentMembers = await Promise.all(
      recentMembersData.map(async (member) => {
        let name = member.email
        let extraInfo = ''

        if (member.role === 'pastor') {
          const [pastor] = await db
            .select({
              firstName: pastorProfiles.firstName,
              lastName: pastorProfiles.lastName,
            })
            .from(pastorProfiles)
            .where(eq(pastorProfiles.userId, member.id))
            .limit(1)
          if (pastor) {
            name = `${pastor.firstName} ${pastor.lastName}`
          }
        } else if (member.role === 'church_account') {
          const [church] = await db
            .select({
              nomeFantasia: churchProfiles.nomeFantasia,
              city: churchProfiles.city,
            })
            .from(churchProfiles)
            .where(eq(churchProfiles.userId, member.id))
            .limit(1)
          if (church) {
            name = church.nomeFantasia
            extraInfo = church.city || ''
          }
        } else if (member.role === 'supervisor') {
          const [supervisor] = await db
            .select({
              firstName: supervisorProfiles.firstName,
              lastName: supervisorProfiles.lastName,
              regionName: regions.name,
            })
            .from(supervisorProfiles)
            .leftJoin(regions, eq(supervisorProfiles.regionId, regions.id))
            .where(eq(supervisorProfiles.userId, member.id))
            .limit(1)
          if (supervisor) {
            name = `${supervisor.firstName} ${supervisor.lastName}`
            extraInfo = supervisor.regionName || ''
          }
        }

        return {
          id: member.id,
          name,
          email: member.email,
          role: member.role,
          extraInfo,
          createdAt: format(new Date(member.createdAt), 'dd/MM/yyyy HH:mm'),
          status: member.status,
        }
      })
    )

    // Filtrar por role se especificado
    const filteredMembers = roleFilter && roleFilter !== 'all'
      ? recentMembers.filter((m) => m.role === roleFilter)
      : recentMembers

    // Formatar dados de crescimento mensal
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const growthData = newMembersByMonth.map((item) => ({
      month: monthNames[parseInt(item.month.substring(5, 7)) - 1],
      count: item.count,
    }))

    // Total de membros
    const totalMembers = membersByRole.reduce((sum, r) => sum + r.count, 0)

    return NextResponse.json({
      members: filteredMembers,
      summary: {
        totalMembers,
        byRole: membersByRole,
        newThisMonth: newThisMonth.reduce((sum, r) => sum + r.count, 0),
        newThisMonthByRole: newThisMonth,
      },
      growthData,
    })
  } catch (error: unknown) {
    console.error('Erro ao buscar relatório de membresia:', error)
    return NextResponse.json(
      {
        error: 'Erro ao buscar relatório de membresia',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

