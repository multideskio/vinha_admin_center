/**
 * @fileoverview Serviço de relatório de contribuições
 * @description Encapsula toda a lógica de consulta e agregação de dados de contribuições,
 * sem dependência de NextRequest/NextResponse. Recebe parâmetros tipados e retorna
 * objetos tipados.
 *
 * Funcionalidades:
 * - Paginação server-side com LIMIT/OFFSET na lista de contribuintes
 * - Top 10 contribuintes sem paginação
 * - Summaries (por método e tipo de contribuinte) sem paginação
 * - Cache Redis de 5 minutos
 * - Tipagem completa com interfaces explícitas
 */

import { db } from '@/db/drizzle'
import { transactions, users, pastorProfiles, churchProfiles } from '@/db/schema'
import { eq, and, between, isNull, desc, sql } from 'drizzle-orm'
import { getCache, setCache } from '@/lib/cache'
import { buildPaginationMeta, type PaginatedResult } from '@/lib/report-services/types'
import type { ContributionsReportParams } from '@/lib/schemas/report-schemas'

// =============================================================================
// INTERFACES
// =============================================================================

export interface FormattedContributor {
  id: string
  name: string
  type: string
  extraInfo: string
  totalAmount: number
  contributionCount: number
  lastContribution: string
}

export interface ContributionsSummary {
  totalAmount: number
  totalContributions: number
  totalContributors: number
  averagePerContributor: number
  byMethod: MethodSummaryItem[]
  byContributorType: TypeSummaryItem[]
}

interface MethodSummaryItem {
  method: string
  count: number
  total: number
}

interface TypeSummaryItem {
  type: string
  count: number
  total: number
}

export interface ContributionsReportResponse {
  contributors: PaginatedResult<FormattedContributor>
  topContributors: FormattedContributor[]
  summary: ContributionsSummary
  period: { from: string; to: string }
}

// =============================================================================
// CONSTANTES
// =============================================================================

const CACHE_TTL_SECONDS = 300 // 5 minutos
const DEFAULT_PERIOD_DAYS = 30
const TOP_CONTRIBUTORS_LIMIT = 10

// =============================================================================
// FUNÇÃO PRINCIPAL
// =============================================================================

/**
 * Gera o relatório de contribuições completo com paginação server-side.
 *
 * @param companyId - ID da empresa (companyId do usuário autenticado)
 * @param params - Parâmetros validados pelo schema Zod (from, to, contributorType, page, limit)
 * @returns ContributionsReportResponse com contribuintes paginados, top 10, summary e período
 */
export async function generateContributionsReport(
  companyId: string,
  params: ContributionsReportParams,
): Promise<ContributionsReportResponse> {
  // Verificar cache
  const cacheKey = buildCacheKey(companyId, params)
  const cached = await getCache<ContributionsReportResponse>(cacheKey)
  if (cached) {
    return cached
  }

  // Definir período
  const endDate = params.to ? new Date(params.to) : new Date()
  const startDate = params.from
    ? new Date(params.from)
    : new Date(Date.now() - DEFAULT_PERIOD_DAYS * 24 * 60 * 60 * 1000)

  // Executar queries em paralelo
  const [
    paginatedContributors,
    totalContributorsCount,
    topContributors,
    methodSummary,
    typeSummary,
    globalTotals,
  ] = await Promise.all([
    fetchPaginatedContributors(companyId, startDate, endDate, params),
    fetchContributorsTotalCount(companyId, startDate, endDate, params),
    fetchTopContributors(companyId, startDate, endDate, params),
    fetchMethodSummary(companyId, startDate, endDate),
    fetchTypeSummary(companyId, startDate, endDate),
    fetchGlobalTotals(companyId, startDate, endDate, params),
  ])

  // Formatar contribuintes paginados
  const formattedContributors = paginatedContributors.map(formatContributor)

  // Formatar top 10
  const formattedTopContributors = topContributors.map(formatContributor)

  // Montar resultado
  const result: ContributionsReportResponse = {
    contributors: {
      data: formattedContributors,
      pagination: buildPaginationMeta(params.page, params.limit, totalContributorsCount),
    },
    topContributors: formattedTopContributors,
    summary: buildSummary(globalTotals, methodSummary, typeSummary),
    period: {
      from: startDate.toLocaleDateString('pt-BR'),
      to: endDate.toLocaleDateString('pt-BR'),
    },
  }

  // Salvar no cache
  await setCache(cacheKey, result, CACHE_TTL_SECONDS)

  return result
}

// =============================================================================
// FUNÇÕES AUXILIARES
// =============================================================================

/**
 * Constrói a chave de cache baseada nos parâmetros do relatório.
 */
function buildCacheKey(companyId: string, params: ContributionsReportParams): string {
  return `relatorio:contribuicoes:${companyId}:${params.from ?? ''}:${params.to ?? ''}:${params.contributorType}:${params.page}:${params.limit}`
}

/** Tipo de linha retornada pela query de contribuintes */
interface ContributorRow {
  id: string
  role: string
  firstName: string | null
  lastName: string | null
  nomeFantasia: string | null
  totalAmount: number
  contributionCount: number
  lastContribution: string | null
}

/**
 * Constrói a condição de filtro por tipo de contribuinte.
 */
function buildContributorTypeCondition(contributorType: string) {
  if (contributorType && contributorType !== 'all') {
    return eq(users.role, contributorType as 'pastor' | 'church_account')
  }
  return sql`${users.role} IN ('pastor', 'church_account')`
}

/**
 * Busca contribuintes com paginação server-side (LIMIT/OFFSET).
 * Ordena por totalAmount DESC.
 */
async function fetchPaginatedContributors(
  companyId: string,
  startDate: Date,
  endDate: Date,
  params: ContributionsReportParams,
): Promise<ContributorRow[]> {
  const offset = (params.page - 1) * params.limit

  const rows = await db
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
        eq(users.companyId, companyId),
        isNull(users.deletedAt),
        buildContributorTypeCondition(params.contributorType),
      ),
    )
    .groupBy(
      users.id,
      users.role,
      pastorProfiles.firstName,
      pastorProfiles.lastName,
      churchProfiles.nomeFantasia,
    )
    .orderBy(desc(sql`COALESCE(SUM(${transactions.amount}), 0)`))
    .limit(params.limit)
    .offset(offset)

  return rows
}

/**
 * Busca a contagem total de contribuintes (para metadados de paginação).
 */
async function fetchContributorsTotalCount(
  companyId: string,
  startDate: Date,
  endDate: Date,
  params: ContributionsReportParams,
): Promise<number> {
  // Contamos todos os usuários que se encaixam no filtro (pastor/church_account),
  // independente de terem contribuições no período
  const [result] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(
      and(
        eq(users.companyId, companyId),
        isNull(users.deletedAt),
        buildContributorTypeCondition(params.contributorType),
      ),
    )
    .limit(1)

  return Number(result?.count ?? 0)
}

/**
 * Busca os top 10 contribuintes por valor total (sem paginação).
 * Apenas contribuintes com totalAmount > 0.
 */
async function fetchTopContributors(
  companyId: string,
  startDate: Date,
  endDate: Date,
  params: ContributionsReportParams,
): Promise<ContributorRow[]> {
  const rows = await db
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
    .innerJoin(
      transactions,
      and(
        eq(users.id, transactions.contributorId),
        eq(transactions.status, 'approved'),
        between(transactions.createdAt, startDate, endDate),
      ),
    )
    .where(
      and(
        eq(users.companyId, companyId),
        isNull(users.deletedAt),
        buildContributorTypeCondition(params.contributorType),
      ),
    )
    .groupBy(
      users.id,
      users.role,
      pastorProfiles.firstName,
      pastorProfiles.lastName,
      churchProfiles.nomeFantasia,
    )
    .orderBy(desc(sql`COALESCE(SUM(${transactions.amount}), 0)`))
    .limit(TOP_CONTRIBUTORS_LIMIT)

  return rows
}

/**
 * Busca resumo por método de pagamento (sem paginação).
 */
async function fetchMethodSummary(
  companyId: string,
  startDate: Date,
  endDate: Date,
): Promise<MethodSummaryItem[]> {
  const rows = await db
    .select({
      method: transactions.paymentMethod,
      count: sql<number>`COUNT(*)`,
      total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.companyId, companyId),
        eq(transactions.status, 'approved'),
        between(transactions.createdAt, startDate, endDate),
      ),
    )
    .groupBy(transactions.paymentMethod)

  return rows.map((m) => ({
    method: m.method,
    count: Number(m.count),
    total: Number(m.total),
  }))
}

/**
 * Busca resumo por tipo de contribuinte (sem paginação).
 */
async function fetchTypeSummary(
  companyId: string,
  startDate: Date,
  endDate: Date,
): Promise<TypeSummaryItem[]> {
  const rows = await db
    .select({
      type: users.role,
      count: sql<number>`COUNT(${transactions.id})`,
      total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .innerJoin(users, eq(transactions.contributorId, users.id))
    .where(
      and(
        eq(transactions.companyId, companyId),
        eq(transactions.status, 'approved'),
        between(transactions.createdAt, startDate, endDate),
      ),
    )
    .groupBy(users.role)

  return rows.map((t) => ({
    type: t.type,
    count: Number(t.count),
    total: Number(t.total),
  }))
}

/** Interface para os totais globais retornados pela query de agregação */
interface GlobalTotals {
  totalAmount: number
  totalContributions: number
  totalContributors: number
}

/**
 * Busca totais globais de contribuições no período (sem paginação).
 * Usa agregações SQL para evitar cálculos em memória.
 */
async function fetchGlobalTotals(
  companyId: string,
  startDate: Date,
  endDate: Date,
  params: ContributionsReportParams,
): Promise<GlobalTotals> {
  const contributorTypeCondition =
    params.contributorType && params.contributorType !== 'all'
      ? eq(users.role, params.contributorType as 'pastor' | 'church_account')
      : sql`${users.role} IN ('pastor', 'church_account')`

  const [result] = await db
    .select({
      totalAmount: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      totalContributions: sql<number>`COUNT(${transactions.id})`,
      totalContributors: sql<number>`COUNT(DISTINCT ${transactions.contributorId})`,
    })
    .from(transactions)
    .innerJoin(users, eq(transactions.contributorId, users.id))
    .where(
      and(
        eq(transactions.companyId, companyId),
        eq(transactions.status, 'approved'),
        between(transactions.createdAt, startDate, endDate),
        contributorTypeCondition,
      ),
    )
    .limit(1)

  return {
    totalAmount: Number(result?.totalAmount ?? 0),
    totalContributions: Number(result?.totalContributions ?? 0),
    totalContributors: Number(result?.totalContributors ?? 0),
  }
}

/**
 * Formata uma linha de contribuinte do banco para o formato de resposta.
 */
function formatContributor(row: ContributorRow): FormattedContributor {
  const name =
    row.role === 'pastor'
      ? `${row.firstName || ''} ${row.lastName || ''}`.trim()
      : row.nomeFantasia || 'N/A'

  return {
    id: row.id,
    name: name || 'N/A',
    type: row.role,
    extraInfo: row.role === 'pastor' ? 'Pastor' : 'Igreja',
    totalAmount: Number(row.totalAmount) || 0,
    contributionCount: Number(row.contributionCount) || 0,
    lastContribution: row.lastContribution
      ? new Date(row.lastContribution).toLocaleDateString('pt-BR')
      : 'Nunca',
  }
}

/**
 * Monta o objeto de summary a partir dos totais globais e agregações.
 */
function buildSummary(
  globalTotals: GlobalTotals,
  methodSummary: MethodSummaryItem[],
  typeSummary: TypeSummaryItem[],
): ContributionsSummary {
  const averagePerContributor =
    globalTotals.totalContributors > 0
      ? globalTotals.totalAmount / globalTotals.totalContributors
      : 0

  return {
    totalAmount: globalTotals.totalAmount,
    totalContributions: globalTotals.totalContributions,
    totalContributors: globalTotals.totalContributors,
    averagePerContributor,
    byMethod: methodSummary,
    byContributorType: typeSummary,
  }
}
