/**
 * @lastReview 2026-01-05 15:40 - API de relatório de igrejas implementada
 * @fileoverview API para relatório de performance de igrejas por região
 * Segurança: ✅ Validação admin obrigatória
 * Funcionalidades: ✅ Filtros por período/região, ✅ Agrupamento por região, ✅ Performance individual
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, transactions, churchProfiles, supervisorProfiles } from '@/db/schema'
import { eq, and, isNull, desc, sql } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import type { UserRole } from '@/lib/types'
import { getCache, setCache } from '@/lib/cache'

export async function GET(request: Request) {
  const { user } = await validateRequest()
  if (!user || (user.role as UserRole) !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const supervisorId = searchParams.get('supervisorId')

    // ✅ Cache de 5 minutos para relatório de igrejas
    const cacheKey = `relatorio:igrejas:${user.companyId}:${from}:${to}:${supervisorId}`
    const cached = await getCache(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Definir período padrão (últimos 30 dias)
    const endDate = to ? new Date(to) : new Date()
    const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Buscar todos os supervisores para filtro
    const allSupervisors = await db
      .select({
        id: users.id,
        firstName: supervisorProfiles.firstName,
        lastName: supervisorProfiles.lastName,
      })
      .from(users)
      .innerJoin(supervisorProfiles, eq(users.id, supervisorProfiles.userId))
      .where(
        and(
          eq(users.companyId, user.companyId),
          eq(users.role, 'supervisor'),
          isNull(users.deletedAt),
        ),
      )

    // Condições para igrejas
    const churchConditions = [
      eq(users.companyId, user.companyId),
      eq(users.role, 'church_account'),
      isNull(users.deletedAt),
    ]

    // Filtro por supervisor se especificado
    if (supervisorId && supervisorId !== 'all') {
      churchConditions.push(eq(churchProfiles.supervisorId, supervisorId))
    }

    // Buscar igrejas com dados de arrecadação
    const churchesQuery = db
      .select({
        id: users.id,
        nomeFantasia: churchProfiles.nomeFantasia,
        cnpj: churchProfiles.cnpj,
        city: churchProfiles.city,
        state: churchProfiles.state,
        supervisorId: churchProfiles.supervisorId,
        supervisorName: sql<string>`CONCAT(${supervisorProfiles.firstName}, ' ', ${supervisorProfiles.lastName})`,
        createdAt: users.createdAt,
        totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.status} = 'approved' AND ${transactions.createdAt} BETWEEN ${startDate} AND ${endDate} THEN ${transactions.amount} ELSE 0 END), 0)`,
        transactionCount: sql<number>`COUNT(CASE WHEN ${transactions.status} = 'approved' AND ${transactions.createdAt} BETWEEN ${startDate} AND ${endDate} THEN ${transactions.id} END)`,
        lastTransactionDate: sql<string>`MAX(CASE WHEN ${transactions.status} = 'approved' THEN ${transactions.createdAt} END)`,
        lastTransactionAmount: sql<number>`(
          SELECT ${transactions.amount} 
          FROM ${transactions} 
          WHERE ${transactions.contributorId} = ${users.id} 
            AND ${transactions.status} = 'approved' 
          ORDER BY ${transactions.createdAt} DESC 
          LIMIT 1
        )`,
      })
      .from(users)
      .innerJoin(churchProfiles, eq(users.id, churchProfiles.userId))
      .leftJoin(supervisorProfiles, eq(churchProfiles.supervisorId, supervisorProfiles.userId))
      .leftJoin(transactions, eq(users.id, transactions.contributorId))
      .where(and(...churchConditions))
      .groupBy(
        users.id,
        churchProfiles.nomeFantasia,
        churchProfiles.cnpj,
        churchProfiles.city,
        churchProfiles.state,
        churchProfiles.supervisorId,
        supervisorProfiles.firstName,
        supervisorProfiles.lastName,
        users.createdAt,
      )
      .orderBy(
        desc(
          sql`COALESCE(SUM(CASE WHEN ${transactions.status} = 'approved' AND ${transactions.createdAt} BETWEEN ${startDate} AND ${endDate} THEN ${transactions.amount} ELSE 0 END), 0)`,
        ),
      )

    const churches = await churchesQuery

    // Formatar dados das igrejas
    const formattedChurches = churches.map((c) => ({
      id: c.id,
      nomeFantasia: c.nomeFantasia || 'N/A',
      cnpj: c.cnpj || 'N/A',
      cidade: c.city || 'N/A',
      estado: c.state || 'N/A',
      supervisorName: c.supervisorName || 'Sem Supervisor',
      totalRevenue: Number(c.totalRevenue) || 0,
      transactionCount: Number(c.transactionCount) || 0,
      lastTransaction: c.lastTransactionDate
        ? {
            date: new Date(c.lastTransactionDate).toLocaleDateString('pt-BR'),
            amount: Number(c.lastTransactionAmount) || 0,
          }
        : null,
      createdAt: new Date(c.createdAt).toLocaleDateString('pt-BR'),
    }))

    // Agrupar por supervisor
    const bySupervisor = formattedChurches.reduce(
      (acc, church) => {
        const supervisorName = church.supervisorName
        if (!acc[supervisorName]) {
          acc[supervisorName] = {
            count: 0,
            totalRevenue: 0,
            churches: [],
          }
        }
        acc[supervisorName].count++
        acc[supervisorName].totalRevenue += church.totalRevenue
        acc[supervisorName].churches.push(church)
        return acc
      },
      {} as Record<
        string,
        { count: number; totalRevenue: number; churches: typeof formattedChurches }
      >,
    )

    // Calcular totais gerais
    const totalChurches = formattedChurches.length
    const totalRevenue = formattedChurches.reduce((sum, c) => sum + c.totalRevenue, 0)
    const totalTransactions = formattedChurches.reduce((sum, c) => sum + c.transactionCount, 0)

    const result = {
      churches: formattedChurches,
      bySupervisor,
      supervisors: allSupervisors.map((s) => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
      })),
      summary: {
        totalChurches,
        totalRevenue,
        totalTransactions,
      },
      period: {
        from: startDate.toLocaleDateString('pt-BR'),
        to: endDate.toLocaleDateString('pt-BR'),
      },
    }

    await setCache(cacheKey, result, 300) // 5 minutos
    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro ao gerar relatório de igrejas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
