/**
 * @fileoverview API para relatório de contribuições detalhado
 * @version 1.0
 * @date 2025-11-05
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, transactions, pastorProfiles, churchProfiles, supervisorProfiles, managerProfiles } from '@/db/schema'
import { and, eq, gte, lt, desc, sql, count as countFn } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import type { UserRole } from '@/lib/types'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user || (user.role as UserRole) !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    
    // Filtros
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const contributorType = searchParams.get('contributorType') // 'all', 'pastor', 'church'

    const now = new Date()
    const startDate = from ? new Date(from) : startOfMonth(now)
    const endDate = to ? new Date(to) : endOfMonth(now)

    // Construir condições
    const conditions = [
      eq(transactions.status, 'approved'),
      gte(transactions.createdAt, startDate),
      lt(transactions.createdAt, endDate),
    ]

    // Buscar contribuintes com suas contribuições
    const contributorsData = await db
      .select({
        contributorId: transactions.contributorId,
        contributorRole: users.role,
        total: sql<number>`SUM(${transactions.amount})`.mapWith(Number),
        count: countFn(),
        lastContribution: sql<Date>`MAX(${transactions.createdAt})`.mapWith((val) => new Date(val)),
      })
      .from(transactions)
      .innerJoin(users, eq(transactions.contributorId, users.id))
      .where(and(...conditions))
      .groupBy(transactions.contributorId, users.role)
      .orderBy(sql`SUM(${transactions.amount}) DESC`)
      .limit(100)

    // Filtrar por tipo se especificado
    const filteredContributors = contributorType && contributorType !== 'all'
      ? contributorsData.filter((c) => c.contributorRole === contributorType)
      : contributorsData

    // Enriquecer com nomes
    const contributors = await Promise.all(
      filteredContributors.map(async (c) => {
        let name = 'Desconhecido'
        let extraInfo = ''

        try {
          if (c.contributorRole === 'pastor') {
            const pastorData = await db
              .select({
                firstName: pastorProfiles.firstName,
                lastName: pastorProfiles.lastName,
              })
              .from(pastorProfiles)
              .where(eq(pastorProfiles.userId, c.contributorId))
              .limit(1)
            
            if (pastorData.length > 0 && pastorData[0]) {
              name = `${pastorData[0].firstName} ${pastorData[0].lastName}`
            }
          } else if (c.contributorRole === 'church_account') {
            const churchData = await db
              .select({
                nomeFantasia: churchProfiles.nomeFantasia,
                cidade: churchProfiles.cidade,
              })
              .from(churchProfiles)
              .where(eq(churchProfiles.userId, c.contributorId))
              .limit(1)
            
            if (churchData.length > 0 && churchData[0]) {
              name = churchData[0].nomeFantasia
              extraInfo = churchData[0].cidade || ''
            }
          } else if (c.contributorRole === 'supervisor') {
            // Buscar nome do supervisor
            const supervisorData = await db
              .select({
                firstName: supervisorProfiles.firstName,
                lastName: supervisorProfiles.lastName,
              })
              .from(supervisorProfiles)
              .where(eq(supervisorProfiles.userId, c.contributorId))
              .limit(1)
            
            if (supervisorData.length > 0 && supervisorData[0]) {
              name = `${supervisorData[0].firstName} ${supervisorData[0].lastName}`
            }
          } else if (c.contributorRole === 'manager') {
            // Buscar nome do gerente
            const managerData = await db
              .select({
                firstName: managerProfiles.firstName,
                lastName: managerProfiles.lastName,
              })
              .from(managerProfiles)
              .where(eq(managerProfiles.userId, c.contributorId))
              .limit(1)
            
            if (managerData.length > 0 && managerData[0]) {
              name = `${managerData[0].firstName} ${managerData[0].lastName}`
            }
          } else {
            // Para admin ou outros, usar email como fallback
            const userData = await db
              .select({
                email: users.email,
              })
              .from(users)
              .where(eq(users.id, c.contributorId))
              .limit(1)
            
            if (userData.length > 0 && userData[0]) {
              name = userData[0].email
            }
          }
        } catch (error) {
          console.error(`Erro ao buscar nome do contribuinte ${c.contributorId}:`, error)
        }

        return {
          id: c.contributorId,
          name,
          type: c.contributorRole,
          extraInfo,
          totalAmount: c.total,
          contributionCount: c.count,
          lastContribution: format(new Date(c.lastContribution), 'dd/MM/yyyy'),
        }
      })
    )

    // Ranking dos top 10
    const topContributors = contributors.slice(0, 10)

    // Análise por método de pagamento no período
    const byMethod = await db
      .select({
        method: transactions.paymentMethod,
        total: sql<number>`SUM(${transactions.amount})`.mapWith(Number),
        count: countFn(),
      })
      .from(transactions)
      .where(and(...conditions))
      .groupBy(transactions.paymentMethod)

    // Análise por tipo de contribuinte
    const byContributorType = await db
      .select({
        type: users.role,
        total: sql<number>`SUM(${transactions.amount})`.mapWith(Number),
        count: countFn(),
      })
      .from(transactions)
      .innerJoin(users, eq(transactions.contributorId, users.id))
      .where(and(...conditions))
      .groupBy(users.role)

    // Calcular totais
    const totalAmount = contributors.reduce((sum, c) => sum + c.totalAmount, 0)
    const totalContributions = contributors.reduce((sum, c) => sum + c.contributionCount, 0)

    return NextResponse.json({
      contributors,
      topContributors,
      summary: {
        totalAmount,
        totalContributions,
        totalContributors: contributors.length,
        averagePerContributor: contributors.length > 0 ? totalAmount / contributors.length : 0,
        byMethod,
        byContributorType,
      },
      period: {
        from: format(startDate, 'dd/MM/yyyy'),
        to: format(endDate, 'dd/MM/yyyy'),
      },
    })
  } catch (error: unknown) {
    console.error('Erro ao buscar relatório de contribuições:', error)
    return NextResponse.json(
      {
        error: 'Erro ao buscar relatório de contribuições',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

