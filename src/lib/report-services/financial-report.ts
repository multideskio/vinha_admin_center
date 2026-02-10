/**
 * @fileoverview Serviço de relatório financeiro
 * @description Encapsula toda a lógica de consulta e agregação de dados financeiros,
 * sem dependência de NextRequest/NextResponse. Recebe parâmetros tipados e retorna
 * objetos tipados.
 *
 * Funcionalidades:
 * - Paginação server-side com LIMIT/OFFSET nas transações
 * - Summary (agregações por status e método) sem paginação
 * - Cache Redis de 5 minutos
 * - Tipagem completa com interfaces explícitas
 */

import { db } from '@/db/drizzle'
import { transactions, users, pastorProfiles, churchProfiles } from '@/db/schema'
import { eq, and, between, desc, sql } from 'drizzle-orm'
import { getCache, setCache } from '@/lib/cache'
import { buildPaginationMeta, type PaginatedResult } from '@/lib/report-services/types'
import type { FinancialReportParams } from '@/lib/schemas/report-schemas'

// =============================================================================
// INTERFACES
// =============================================================================

export interface FormattedTransaction {
  id: string
  contributorName: string
  contributorRole: string
  amount: number
  method: string
  status: string
  date: string
}

export interface FinancialSummary {
  totalTransactions: number
  totalApproved: number
  totalPending: number
  totalRefused: number
  totalRefunded: number
  byMethod: Record<string, { count: number; total: number }>
}

export interface FinancialReportResponse {
  transactions: PaginatedResult<FormattedTransaction>
  summary: FinancialSummary
  period: { from: string; to: string }
}

// =============================================================================
// CONSTANTES
// =============================================================================

const CACHE_TTL_SECONDS = 300 // 5 minutos
const DEFAULT_PERIOD_DAYS = 30

// =============================================================================
// FUNÇÃO PRINCIPAL
// =============================================================================

/**
 * Gera o relatório financeiro completo com paginação server-side.
 *
 * @param companyId - ID da empresa (companyId do usuário autenticado)
 * @param params - Parâmetros validados pelo schema Zod (from, to, method, status, page, limit)
 * @returns FinancialReportResponse com transações paginadas, summary e período
 */
export async function generateFinancialReport(
  companyId: string,
  params: FinancialReportParams,
): Promise<FinancialReportResponse> {
  // Verificar cache
  const cacheKey = buildCacheKey(companyId, params)
  const cached = await getCache<FinancialReportResponse>(cacheKey)
  if (cached) {
    return cached
  }

  // Definir período
  const endDate = params.to ? new Date(params.to) : new Date()
  const startDate = params.from
    ? new Date(params.from)
    : new Date(Date.now() - DEFAULT_PERIOD_DAYS * 24 * 60 * 60 * 1000)

  // Construir condições de filtro
  const conditions = buildFilterConditions(companyId, startDate, endDate, params)

  // Executar queries em paralelo: transações paginadas, contagem total e summaries
  const [transactionsData, totalCount, statusSummary, methodSummary] = await Promise.all([
    fetchPaginatedTransactions(conditions, params.page, params.limit),
    fetchTotalCount(conditions),
    fetchStatusSummary(conditions),
    fetchMethodSummary(conditions),
  ])

  // Formatar transações
  const formattedTransactions = transactionsData.map(formatTransaction)

  // Montar resultado
  const result: FinancialReportResponse = {
    transactions: {
      data: formattedTransactions,
      pagination: buildPaginationMeta(params.page, params.limit, totalCount),
    },
    summary: buildSummary(totalCount, statusSummary, methodSummary),
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
function buildCacheKey(companyId: string, params: FinancialReportParams): string {
  return `relatorio:financeiro:${companyId}:${params.from ?? ''}:${params.to ?? ''}:${params.method}:${params.status}:${params.page}:${params.limit}`
}

/**
 * Constrói as condições de filtro SQL baseadas nos parâmetros.
 */
function buildFilterConditions(
  companyId: string,
  startDate: Date,
  endDate: Date,
  params: FinancialReportParams,
): ReturnType<typeof and>[] {
  const conditions: ReturnType<typeof eq>[] = [
    eq(transactions.companyId, companyId),
    between(transactions.createdAt, startDate, endDate),
  ]

  if (params.method && params.method !== 'all') {
    conditions.push(
      eq(transactions.paymentMethod, params.method as 'pix' | 'credit_card' | 'boleto'),
    )
  }

  if (params.status && params.status !== 'all') {
    conditions.push(
      eq(transactions.status, params.status as 'approved' | 'pending' | 'refused' | 'refunded'),
    )
  }

  return conditions
}

/** Tipo de linha retornada pela query de transações */
interface TransactionRow {
  id: string
  amount: string
  method: string
  status: string
  date: Date
  contributorId: string
  firstName: string | null
  lastName: string | null
  nomeFantasia: string | null
  contributorRole: string
}

/**
 * Busca transações com paginação server-side (LIMIT/OFFSET).
 */
async function fetchPaginatedTransactions(
  conditions: ReturnType<typeof and>[],
  page: number,
  limit: number,
): Promise<TransactionRow[]> {
  const offset = (page - 1) * limit

  const rows = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      method: transactions.paymentMethod,
      status: transactions.status,
      date: transactions.createdAt,
      contributorId: transactions.contributorId,
      firstName: pastorProfiles.firstName,
      lastName: pastorProfiles.lastName,
      nomeFantasia: churchProfiles.nomeFantasia,
      contributorRole: users.role,
    })
    .from(transactions)
    .innerJoin(users, eq(transactions.contributorId, users.id))
    .leftJoin(pastorProfiles, eq(users.id, pastorProfiles.userId))
    .leftJoin(churchProfiles, eq(users.id, churchProfiles.userId))
    .where(and(...conditions))
    .orderBy(desc(transactions.createdAt))
    .limit(limit)
    .offset(offset)

  return rows
}

/**
 * Busca a contagem total de transações (para metadados de paginação).
 */
async function fetchTotalCount(conditions: ReturnType<typeof and>[]): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(transactions)
    .where(and(...conditions))
    .limit(1)

  return Number(result?.count ?? 0)
}

/** Tipo de linha retornada pela query de summary por status */
interface StatusSummaryRow {
  status: string
  count: number
  total: number
}

/**
 * Busca agregações por status (sem paginação).
 */
async function fetchStatusSummary(
  conditions: ReturnType<typeof and>[],
): Promise<StatusSummaryRow[]> {
  const rows = await db
    .select({
      status: transactions.status,
      count: sql<number>`COUNT(*)`,
      total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .where(and(...conditions))
    .groupBy(transactions.status)

  return rows
}

/** Tipo de linha retornada pela query de summary por método */
interface MethodSummaryRow {
  method: string
  count: number
  total: number
}

/**
 * Busca agregações por método de pagamento (sem paginação).
 */
async function fetchMethodSummary(
  conditions: ReturnType<typeof and>[],
): Promise<MethodSummaryRow[]> {
  const rows = await db
    .select({
      method: transactions.paymentMethod,
      count: sql<number>`COUNT(*)`,
      total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .where(and(...conditions))
    .groupBy(transactions.paymentMethod)

  return rows
}

/**
 * Formata uma linha de transação do banco para o formato de resposta.
 */
function formatTransaction(row: TransactionRow): FormattedTransaction {
  const contributorName =
    row.contributorRole === 'pastor'
      ? `${row.firstName || ''} ${row.lastName || ''}`.trim()
      : row.nomeFantasia || 'N/A'

  return {
    id: row.id,
    contributorName: contributorName || 'N/A',
    contributorRole: row.contributorRole,
    amount: Number(row.amount),
    method: row.method,
    status: row.status,
    date: new Date(row.date).toLocaleDateString('pt-BR'),
  }
}

/**
 * Monta o objeto de summary a partir das agregações por status e método.
 */
function buildSummary(
  totalTransactions: number,
  statusSummary: StatusSummaryRow[],
  methodSummary: MethodSummaryRow[],
): FinancialSummary {
  const statusTotals = statusSummary.reduce(
    (acc, s) => {
      acc[s.status] = Number(s.total)
      return acc
    },
    {} as Record<string, number>,
  )

  const byMethod = methodSummary.reduce(
    (acc, m) => {
      acc[m.method] = {
        count: Number(m.count),
        total: Number(m.total),
      }
      return acc
    },
    {} as Record<string, { count: number; total: number }>,
  )

  return {
    totalTransactions,
    totalApproved: statusTotals.approved || 0,
    totalPending: statusTotals.pending || 0,
    totalRefused: statusTotals.refused || 0,
    totalRefunded: statusTotals.refunded || 0,
    byMethod,
  }
}
