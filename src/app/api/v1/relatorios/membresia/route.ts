/**
 * @lastReview 2026-01-05 15:45 - API de relatório de membresia implementada
 * @fileoverview API para relatório de dados demográficos e crescimento de membros
 * Segurança: ✅ Validação admin obrigatória
 * Funcionalidades: ✅ Filtros por role, ✅ Dados de crescimento, ✅ Distribuição por tipo
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, pastorProfiles, churchProfiles, managerProfiles, supervisorProfiles } from '@/db/schema'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import type { UserRole } from '@/lib/types'

export async function GET(request: Request) {
  const { user } = await validateRequest()
  if (!user || (user.role as UserRole) !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    // Condições base
    const conditions = [
      eq(users.companyId, user.companyId),
      isNull(users.deletedAt),
    ]

    // Filtro por role se especificado
    if (role && role !== 'all') {
      conditions.push(eq(users.role, role as UserRole))
    }

    // Buscar todos os membros
    const allMembers = await db
      .select({
        id: users.id,
        role: users.role,
        status: users.status,
        email: users.email,
        createdAt: users.createdAt,
        // Dados específicos por tipo
        pastorFirstName: pastorProfiles.firstName,
        pastorLastName: pastorProfiles.lastName,
        churchNomeFantasia: churchProfiles.nomeFantasia,
        managerFirstName: managerProfiles.firstName,
        managerLastName: managerProfiles.lastName,
        supervisorFirstName: supervisorProfiles.firstName,
        supervisorLastName: supervisorProfiles.lastName,
      })
      .from(users)
      .leftJoin(pastorProfiles, eq(users.id, pastorProfiles.userId))
      .leftJoin(churchProfiles, eq(users.id, churchProfiles.userId))
      .leftJoin(managerProfiles, eq(users.id, managerProfiles.userId))
      .leftJoin(supervisorProfiles, eq(users.id, supervisorProfiles.userId))
      .where(and(...conditions))
      .orderBy(desc(users.createdAt))

    // Formatar dados dos membros
    const formattedMembers = allMembers.map(m => {
      let name = 'N/A'
      let extraInfo = ''

      switch (m.role) {
        case 'pastor':
          name = `${m.pastorFirstName || ''} ${m.pastorLastName || ''}`.trim()
          extraInfo = 'Pastor'
          break
        case 'church_account':
          name = m.churchNomeFantasia || 'N/A'
          extraInfo = 'Igreja'
          break
        case 'manager':
          name = `${m.managerFirstName || ''} ${m.managerLastName || ''}`.trim()
          extraInfo = 'Gerente'
          break
        case 'supervisor':
          name = `${m.supervisorFirstName || ''} ${m.supervisorLastName || ''}`.trim()
          extraInfo = 'Supervisor'
          break
        case 'admin':
          name = 'Administrador'
          extraInfo = 'Admin'
          break
      }

      return {
        id: m.id,
        name: name || 'N/A',
        email: m.email,
        role: m.role,
        extraInfo,
        createdAt: new Date(m.createdAt).toLocaleDateString('pt-BR'),
        status: m.status,
      }
    })

    // Calcular distribuição por role
    const byRole = allMembers.reduce((acc, member) => {
      const existing = acc.find(item => item.role === member.role)
      if (existing) {
        existing.count++
      } else {
        acc.push({ role: member.role, count: 1 })
      }
      return acc
    }, [] as { role: string; count: number }[])

    // Calcular novos membros este mês
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const newThisMonth = allMembers.filter(m => 
      new Date(m.createdAt) >= thisMonth
    ).length

    // Dados de crescimento dos últimos 6 meses
    const growthData = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date()
      monthDate.setMonth(monthDate.getMonth() - i)
      monthDate.setDate(1)
      monthDate.setHours(0, 0, 0, 0)
      
      const nextMonth = new Date(monthDate)
      nextMonth.setMonth(nextMonth.getMonth() + 1)

      const monthMembers = allMembers.filter(m => {
        const createdAt = new Date(m.createdAt)
        return createdAt >= monthDate && createdAt < nextMonth
      }).length

      const monthNames = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
      ]

      growthData.push({
        month: `${monthNames[monthDate.getMonth()]}/${monthDate.getFullYear()}`,
        count: monthMembers,
      })
    }

    return NextResponse.json({
      members: formattedMembers,
      summary: {
        totalMembers: allMembers.length,
        newThisMonth,
        byRole,
      },
      growthData,
    })
  } catch (error) {
    console.error('Erro ao gerar relatório de membresia:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}