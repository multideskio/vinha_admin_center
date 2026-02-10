/**
 * @fileoverview API para listar inadimplentes com paginação, filtros e busca
 * @version 1.0
 * @date 2025-11-05
 * @lastReview 2026-01-05 14:30 - Segurança e funcionalidades verificadas
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, transactions, pastorProfiles, churchProfiles } from '@/db/schema'
import { and, eq, isNull, sql, inArray } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import type { UserRole } from '@/lib/types'
import {
  getBrazilDate,
  getBrazilStartOfMonth,
  subtractMonthsBrazil,
  getDaysSince,
  formatBrazilDate,
} from '@/lib/date-utils'
import { getCache, setCache } from '@/lib/cache'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user || (user.role as UserRole) !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)

    // Parâmetros de paginação
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Filtros
    const type = searchParams.get('type') // 'pastor', 'church', 'all'
    const search = searchParams.get('search') // busca por nome
    const sortBy = searchParams.get('sortBy') || 'daysLate' // 'daysLate', 'name'
    const sortOrder = searchParams.get('sortOrder') || 'desc' // 'asc', 'desc'

    const now = getBrazilDate()
    const threeMonthsAgo = getBrazilStartOfMonth(subtractMonthsBrazil(now, 3))

    // ✅ Cache de 5 minutos para relatório de inadimplentes
    const cacheKey = `relatorio:inadimplentes:${type}:${search}:${sortBy}:${sortOrder}:${page}:${limit}`
    const cached = await getCache(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Buscar pastores inadimplentes
    const pastorsData: Array<{
      id: string
      name: string
      type: 'pastor'
      titheDay: number | null
      lastPayment: string | null
      daysLate: number
    }> = []

    if (type === 'pastor' || type === 'all' || !type) {
      const pastorsWithTitheDay = await db
        .select({
          id: users.id,
          firstName: pastorProfiles.firstName,
          lastName: pastorProfiles.lastName,
          titheDay: users.titheDay,
        })
        .from(users)
        .innerJoin(pastorProfiles, eq(users.id, pastorProfiles.userId))
        .where(and(eq(users.role, 'pastor'), isNull(users.deletedAt)))

      // ✅ OTIMIZADO: Buscar últimos pagamentos apenas dos pastores (filtrado por inArray + GROUP BY)
      const pastorIds = pastorsWithTitheDay.map((p) => p.id)
      const lastPaymentsData =
        pastorIds.length > 0
          ? await db
              .select({
                contributorId: transactions.contributorId,
                lastPayment: sql<Date>`MAX(${transactions.createdAt})`.mapWith(
                  (val) => new Date(val),
                ),
              })
              .from(transactions)
              .where(
                and(
                  eq(transactions.status, 'approved'),
                  inArray(transactions.contributorId, pastorIds),
                ),
              )
              .groupBy(transactions.contributorId)
          : []

      // Criar mapa de último pagamento por pastor
      const lastPaymentMap = new Map<string, Date>()
      for (const payment of lastPaymentsData) {
        lastPaymentMap.set(payment.contributorId, payment.lastPayment)
      }

      for (const pastor of pastorsWithTitheDay) {
        // Filtro de busca
        const fullName = `${pastor.firstName} ${pastor.lastName}`.toLowerCase()
        if (search && !fullName.includes(search.toLowerCase())) {
          continue
        }

        const lastPaymentDate = lastPaymentMap.get(pastor.id)

        if (!lastPaymentDate) {
          const daysSinceThreeMonths = getDaysSince(threeMonthsAgo)

          pastorsData.push({
            id: pastor.id,
            name: `${pastor.firstName} ${pastor.lastName}`,
            type: 'pastor' as const,
            titheDay: pastor.titheDay,
            lastPayment: null,
            daysLate: daysSinceThreeMonths,
          })
        } else if (lastPaymentDate < threeMonthsAgo) {
          const daysSinceLastPayment = getDaysSince(lastPaymentDate)

          pastorsData.push({
            id: pastor.id,
            name: `${pastor.firstName} ${pastor.lastName}`,
            type: 'pastor' as const,
            titheDay: pastor.titheDay,
            lastPayment: formatBrazilDate(lastPaymentDate),
            daysLate: daysSinceLastPayment,
          })
        }
      }
    }

    // Buscar igrejas inadimplentes
    const churchesData: Array<{
      id: string
      name: string
      type: 'church'
      titheDay: number | null
      lastPayment: string | null
      daysLate: number
    }> = []

    if (type === 'church' || type === 'all' || !type) {
      const churchesWithTitheDay = await db
        .select({
          id: users.id,
          nomeFantasia: churchProfiles.nomeFantasia,
          titheDay: users.titheDay,
        })
        .from(users)
        .innerJoin(churchProfiles, eq(users.id, churchProfiles.userId))
        .where(and(eq(users.role, 'church_account'), isNull(users.deletedAt)))

      // ✅ OTIMIZADO: Buscar últimos pagamentos apenas das igrejas (filtrado por inArray + GROUP BY)
      const churchIds = churchesWithTitheDay.map((c) => c.id)
      const lastChurchPaymentsData =
        churchIds.length > 0
          ? await db
              .select({
                contributorId: transactions.contributorId,
                lastPayment: sql<Date>`MAX(${transactions.createdAt})`.mapWith(
                  (val) => new Date(val),
                ),
              })
              .from(transactions)
              .where(
                and(
                  eq(transactions.status, 'approved'),
                  inArray(transactions.contributorId, churchIds),
                ),
              )
              .groupBy(transactions.contributorId)
          : []

      // Criar mapa de último pagamento por igreja
      const lastPaymentMap = new Map<string, Date>()
      for (const payment of lastChurchPaymentsData) {
        lastPaymentMap.set(payment.contributorId, payment.lastPayment)
      }

      for (const church of churchesWithTitheDay) {
        // Filtro de busca
        if (search && !church.nomeFantasia.toLowerCase().includes(search.toLowerCase())) {
          continue
        }

        const lastPaymentDate = lastPaymentMap.get(church.id)

        if (!lastPaymentDate) {
          const daysSinceThreeMonths = getDaysSince(threeMonthsAgo)

          churchesData.push({
            id: church.id,
            name: church.nomeFantasia,
            type: 'church' as const,
            titheDay: church.titheDay,
            lastPayment: null,
            daysLate: daysSinceThreeMonths,
          })
        } else if (lastPaymentDate < threeMonthsAgo) {
          const daysSinceLastPayment = getDaysSince(lastPaymentDate)

          churchesData.push({
            id: church.id,
            name: church.nomeFantasia,
            type: 'church' as const,
            titheDay: church.titheDay,
            lastPayment: formatBrazilDate(lastPaymentDate),
            daysLate: daysSinceLastPayment,
          })
        }
      }
    }

    // Combinar dados
    const allDefaulters = [...pastorsData, ...churchesData]

    // Ordenar
    allDefaulters.sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      } else {
        // sortBy === 'daysLate'
        return sortOrder === 'asc' ? a.daysLate - b.daysLate : b.daysLate - a.daysLate
      }
    })

    // Paginação
    const total = allDefaulters.length
    const paginatedData = allDefaulters.slice(offset, offset + limit)
    const totalPages = Math.ceil(total / limit)

    const result = {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }

    await setCache(cacheKey, result, 300) // 5 minutos
    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error('Erro ao buscar inadimplentes:', error)
    return NextResponse.json(
      {
        error: 'Erro ao buscar inadimplentes',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    )
  }
}
