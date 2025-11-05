/**
 * @fileoverview API para relatório de igrejas por região
 * @version 1.0
 * @date 2025-11-05
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import {
  users,
  churchProfiles,
  supervisorProfiles,
  regions,
  transactions,
} from '@/db/schema'
import { and, eq, isNull, gte, lt, sql, count as countFn } from 'drizzle-orm'
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
    const regionId = searchParams.get('regionId')

    const now = new Date()
    const startDate = from ? new Date(from) : startOfMonth(now)
    const endDate = to ? new Date(to) : endOfMonth(now)

    // Buscar todas as igrejas
    let churchQuery = db
      .select({
        id: users.id,
        nomeFantasia: churchProfiles.nomeFantasia,
        cnpj: churchProfiles.cnpj,
        cidade: churchProfiles.cidade,
        estado: churchProfiles.estado,
        regionId: supervisorProfiles.regionId,
        regionName: regions.name,
        supervisorId: churchProfiles.supervisorId,
        createdAt: users.createdAt,
      })
      .from(users)
      .innerJoin(churchProfiles, eq(users.id, churchProfiles.userId))
      .innerJoin(supervisorProfiles, eq(churchProfiles.supervisorId, supervisorProfiles.userId))
      .innerJoin(regions, eq(supervisorProfiles.regionId, regions.id))
      .where(and(eq(users.role, 'church_account'), isNull(users.deletedAt)))

    const churches = await churchQuery

    // Filtrar por região se especificado
    const filteredChurches = regionId
      ? churches.filter((c) => c.regionId === regionId)
      : churches

    // Enriquecer com dados de transações
    const enrichedChurches = await Promise.all(
      filteredChurches.map(async (church) => {
        // Total arrecadado no período
        const [revenueResult] = await db
          .select({
            total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`.mapWith(Number),
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.contributorId, church.id),
              eq(transactions.status, 'approved'),
              gte(transactions.createdAt, startDate),
              lt(transactions.createdAt, endDate)
            )
          )

        // Total de transações no período
        const [transactionCount] = await db
          .select({
            count: countFn(),
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.contributorId, church.id),
              eq(transactions.status, 'approved'),
              gte(transactions.createdAt, startDate),
              lt(transactions.createdAt, endDate)
            )
          )

        // Última transação
        const lastTransactions = await db
          .select({
            date: transactions.createdAt,
            amount: transactions.amount,
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.contributorId, church.id),
              eq(transactions.status, 'approved')
            )
          )
          .orderBy(sql`${transactions.createdAt} DESC`)
          .limit(1)

        return {
          id: church.id,
          nomeFantasia: church.nomeFantasia,
          cnpj: church.cnpj,
          cidade: church.cidade,
          estado: church.estado,
          regionName: church.regionName,
          totalRevenue: revenueResult?.total || 0,
          transactionCount: transactionCount?.count || 0,
          lastTransaction: lastTransactions[0]
            ? {
                date: format(new Date(lastTransactions[0].date), 'dd/MM/yyyy'),
                amount: Number(lastTransactions[0].amount),
              }
            : null,
          createdAt: format(new Date(church.createdAt), 'dd/MM/yyyy'),
        }
      })
    )

    // Agrupar por região
    const byRegion = enrichedChurches.reduce((acc, church) => {
      if (!acc[church.regionName]) {
        acc[church.regionName] = {
          count: 0,
          totalRevenue: 0,
          churches: [],
        }
      }
      acc[church.regionName].count++
      acc[church.regionName].totalRevenue += church.totalRevenue
      acc[church.regionName].churches.push(church)
      return acc
    }, {} as Record<string, { count: number; totalRevenue: number; churches: typeof enrichedChurches }>)

    // Buscar lista de regiões para filtro
    const allRegions = await db
      .select({
        id: regions.id,
        name: regions.name,
      })
      .from(regions)

    return NextResponse.json({
      churches: enrichedChurches,
      byRegion,
      regions: allRegions,
      summary: {
        totalChurches: enrichedChurches.length,
        totalRevenue: enrichedChurches.reduce((sum, c) => sum + c.totalRevenue, 0),
        totalTransactions: enrichedChurches.reduce((sum, c) => sum + c.transactionCount, 0),
      },
      period: {
        from: format(startDate, 'dd/MM/yyyy'),
        to: format(endDate, 'dd/MM/yyyy'),
      },
    })
  } catch (error: unknown) {
    console.error('Erro ao buscar relatório de igrejas:', error)
    return NextResponse.json(
      {
        error: 'Erro ao buscar relatório de igrejas',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

