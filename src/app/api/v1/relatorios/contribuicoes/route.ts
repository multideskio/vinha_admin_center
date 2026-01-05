/**
 * @lastReview 2026-01-05 15:30 - API de relatório de contribuições implementada
 * @fileoverview API para relatório detalhado de contribuições por tipo e contribuinte
 * Segurança: ✅ Validação admin obrigatória
 * Funcionalidades: ✅ Filtros avançados, ✅ Top 10 contribuintes, ✅ Resumos por método/tipo
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, transactions, pastorProfiles, churchProfiles } from '@/db/schema'
import { eq, and, between, isNull, desc, sql } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import type { UserRole } from '@/lib/types'

export async function GET(request: Request) {
  const { user } = await validateRequest()
  if (!user || (user.role as UserRole) !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const contributorType = searchParams.get('contributorType')

    // Definir período padrão (últimos 30 dias)
    const endDate = to ? new Date(to) : new Date()
    const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Condições base
    const baseConditions = [
      eq(transactions.companyId, user.companyId),
      eq(transactions.status, 'approved'),
      between(transactions.createdAt, startDate, endDate),
    ]

    // Filtro por tipo de contribuinte
    if (contributorType && contributorType !== 'all') {
      const userConditions = [
        eq(users.companyId, user.companyId),
        eq(users.role, contributorType as 'pastor' | 'church_account'),
        isNull(users.deletedAt),
      ]

      const contributorIds = await db
        .select({ id: users.id })
        .from(users)
        .where(and(...userConditions))

      if (contributorIds.length > 0) {
        baseConditions.push(
          sql`${transactions.contributorId} IN ${sql.raw(`(${contributorIds.map((c) => `'${c.id}'`).join(',')})`)}`,
        )
      }
    }

    // Buscar contribuintes com totais
    const contributorsQuery = db
      .select({
        id: users.id,
        role: users.role,
        firstName: pastorProfiles.firstName,
        lastName: pastorProfiles.lastName,
        nomeFantasia: churchProfiles.nomeFantasia,
        totalAmount: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
        contributionCount: sql<number>`COUNT(${transactions.id})`,
        lastContribution: sql<string>`MAX(${transactions.createdAt})`,
      })
      .from(users)
      .leftJoin(pastorProfiles, eq(users.id, pastorProfiles.userId))
      .leftJoin(churchProfiles, eq(users.id, churchProfiles.userId))
      .leftJoin(
        transactions,
        and(
          eq(users.id, transactions.contributorId),
          eq(transactions.status, 'approved'),
          between(transactions.createdAt, startDate, endDate),
        ),
      )
      .where(
        and(
          eq(users.companyId, user.companyId),
          isNull(users.deletedAt),
          contributorType && contributorType !== 'all'
            ? eq(users.role, contributorType as 'pastor' | 'church_account')
            : sql`${users.role} IN ('pastor', 'church_account')`,
        ),
      )
      .groupBy(
        users.id,
        pastorProfiles.firstName,
        pastorProfiles.lastName,
        churchProfiles.nomeFantasia,
      )
      .orderBy(desc(sql`COALESCE(SUM(${transactions.amount}), 0)`))

    const contributors = await contributorsQuery

    // Formatar dados dos contribuintes
    const formattedContributors = contributors.map((c) => ({
      id: c.id,
      name:
        c.role === 'pastor'
          ? `${c.firstName || ''} ${c.lastName || ''}`.trim()
          : c.nomeFantasia || 'N/A',
      type: c.role,
      extraInfo: c.role === 'pastor' ? 'Pastor' : 'Igreja',
      totalAmount: Number(c.totalAmount) || 0,
      contributionCount: Number(c.contributionCount) || 0,
      lastContribution: c.lastContribution
        ? new Date(c.lastContribution).toLocaleDateString('pt-BR')
        : 'Nunca',
    }))

    // Top 10 contribuintes
    const topContributors = formattedContributors.filter((c) => c.totalAmount > 0).slice(0, 10)

    // Resumo por método de pagamento
    const methodSummary = await db
      .select({
        method: transactions.paymentMethod,
        count: sql<number>`COUNT(*)`,
        total: sql<number>`SUM(${transactions.amount})`,
      })
      .from(transactions)
      .where(and(...baseConditions))
      .groupBy(transactions.paymentMethod)

    // Resumo por tipo de contribuinte
    const typeSummary = await db
      .select({
        type: users.role,
        count: sql<number>`COUNT(${transactions.id})`,
        total: sql<number>`SUM(${transactions.amount})`,
      })
      .from(transactions)
      .innerJoin(users, eq(transactions.contributorId, users.id))
      .where(and(...baseConditions))
      .groupBy(users.role)

    // Calcular totais gerais
    const totalAmount = formattedContributors.reduce((sum, c) => sum + c.totalAmount, 0)
    const totalContributions = formattedContributors.reduce(
      (sum, c) => sum + c.contributionCount,
      0,
    )
    const totalContributors = formattedContributors.filter((c) => c.totalAmount > 0).length
    const averagePerContributor = totalContributors > 0 ? totalAmount / totalContributors : 0

    return NextResponse.json({
      contributors: formattedContributors,
      topContributors,
      summary: {
        totalAmount,
        totalContributions,
        totalContributors,
        averagePerContributor,
        byMethod: methodSummary.map((m) => ({
          method: m.method,
          count: Number(m.count),
          total: Number(m.total),
        })),
        byContributorType: typeSummary.map((t) => ({
          type: t.type,
          count: Number(t.count),
          total: Number(t.total),
        })),
      },
      period: {
        from: startDate.toLocaleDateString('pt-BR'),
        to: endDate.toLocaleDateString('pt-BR'),
      },
    })
  } catch (error) {
    console.error('Erro ao gerar relatório de contribuições:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
