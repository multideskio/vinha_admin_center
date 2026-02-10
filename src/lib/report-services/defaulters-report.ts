/**
 * @fileoverview Serviço de relatório de inadimplentes
 * @description Encapsula toda a lógica de consulta e agregação de dados de inadimplentes,
 * sem dependência de NextRequest/NextResponse. Recebe parâmetros tipados e retorna
 * objetos tipados.
 *
 * Funcionalidades:
 * - Cálculo de dias de atraso via SQL (EXTRACT DAY FROM) em vez de getDaysSince() em loop
 * - Paginação server-side (in-memory após merge de pastores + igrejas)
 * - Filtro por tipo (pastor/church/all), busca por nome, ordenação
 * - Cache Redis de 5 minutos
 * - Tipagem completa com interfaces explícitas
 */

import { db } from '@/db/drizzle'
import { users, transactions, pastorProfiles, churchProfiles } from '@/db/schema'
import { and, eq, isNull, sql, inArray } from 'drizzle-orm'
import { getCache, setCache } from '@/lib/cache'
import { buildPaginationMeta, type PaginatedResult } from '@/lib/report-services/types'
import type { DefaultersReportParams } from '@/lib/schemas/report-schemas'
import {
  getBrazilDate,
  getBrazilStartOfMonth,
  subtractMonthsBrazil,
  formatBrazilDate,
} from '@/lib/date-utils'

// =============================================================================
// INTERFACES
// =============================================================================

export interface DefaulterItem {
  id: string
  name: string
  type: 'pastor' | 'church'
  titheDay: number | null
  lastPayment: string | null
  daysLate: number
}

export interface DefaultersReportResponse {
  data: DefaulterItem[]
  pagination: PaginatedResult<DefaulterItem>['pagination']
}

// =============================================================================
// CONSTANTES
// =============================================================================

const CACHE_TTL_SECONDS = 300 // 5 minutos
const MONTHS_THRESHOLD = 3

// =============================================================================
// FUNÇÃO PRINCIPAL
// =============================================================================

/**
 * Gera o relatório de inadimplentes com cálculo de dias de atraso via SQL.
 *
 * @param companyId - ID da empresa (companyId do usuário autenticado)
 * @param params - Parâmetros validados pelo schema Zod (type, search, sortBy, sortOrder, page, limit)
 * @returns DefaultersReportResponse com inadimplentes paginados e metadados
 */
export async function generateDefaultersReport(
  companyId: string,
  params: DefaultersReportParams,
): Promise<DefaultersReportResponse> {
  // Verificar cache
  const cacheKey = buildCacheKey(companyId, params)
  const cached = await getCache<DefaultersReportResponse>(cacheKey)
  if (cached) {
    return cached
  }

  const now = getBrazilDate()
  const threeMonthsAgo = getBrazilStartOfMonth(subtractMonthsBrazil(now, MONTHS_THRESHOLD))

  // Buscar inadimplentes por tipo
  const [pastorsData, churchesData] = await Promise.all([
    shouldIncludePastors(params.type)
      ? fetchPastorDefaulters(companyId, threeMonthsAgo, params.search)
      : Promise.resolve([]),
    shouldIncludeChurches(params.type)
      ? fetchChurchDefaulters(companyId, threeMonthsAgo, params.search)
      : Promise.resolve([]),
  ])

  // Combinar e ordenar
  const allDefaulters = [...pastorsData, ...churchesData]
  sortDefaulters(allDefaulters, params.sortBy, params.sortOrder)

  // Paginação (in-memory após merge de pastores + igrejas)
  const total = allDefaulters.length
  const offset = (params.page - 1) * params.limit
  const paginatedData = allDefaulters.slice(offset, offset + params.limit)

  const result: DefaultersReportResponse = {
    data: paginatedData,
    pagination: buildPaginationMeta(params.page, params.limit, total),
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
function buildCacheKey(companyId: string, params: DefaultersReportParams): string {
  return `relatorio:inadimplentes:${companyId}:${params.type}:${params.search ?? ''}:${params.sortBy}:${params.sortOrder}:${params.page}:${params.limit}`
}

/**
 * Verifica se deve incluir pastores no relatório.
 */
function shouldIncludePastors(type: string): boolean {
  return type === 'pastor' || type === 'all'
}

/**
 * Verifica se deve incluir igrejas no relatório.
 */
function shouldIncludeChurches(type: string): boolean {
  return type === 'church' || type === 'all'
}

/** Tipo de linha retornada pela query de pastores inadimplentes */
interface PastorDefaulterRow {
  id: string
  firstName: string
  lastName: string
  titheDay: number | null
  lastPayment: Date | null
  daysLate: number | null
}

/**
 * Busca pastores inadimplentes com cálculo de dias de atraso via SQL.
 * Usa EXTRACT(DAY FROM NOW() - MAX(transactions.createdAt)) em vez de getDaysSince() em loop.
 */
async function fetchPastorDefaulters(
  companyId: string,
  threeMonthsAgo: Date,
  search?: string,
): Promise<DefaulterItem[]> {
  // Buscar pastores com último pagamento via SQL
  const pastorIds = await fetchPastorIds(companyId, search)

  if (pastorIds.length === 0) {
    return []
  }

  // Query otimizada: calcula dias de atraso diretamente no SQL
  const rows = await db
    .select({
      id: users.id,
      firstName: pastorProfiles.firstName,
      lastName: pastorProfiles.lastName,
      titheDay: users.titheDay,
      lastPayment: sql<Date | null>`MAX(${transactions.createdAt})`,
      daysLate: sql<number | null>`EXTRACT(DAY FROM NOW() - MAX(${transactions.createdAt}))`,
    })
    .from(users)
    .innerJoin(pastorProfiles, eq(users.id, pastorProfiles.userId))
    .leftJoin(
      transactions,
      and(eq(users.id, transactions.contributorId), eq(transactions.status, 'approved')),
    )
    .where(
      and(
        eq(users.companyId, companyId),
        eq(users.role, 'pastor'),
        isNull(users.deletedAt),
        inArray(users.id, pastorIds),
      ),
    )
    .groupBy(users.id, pastorProfiles.firstName, pastorProfiles.lastName, users.titheDay)
    .having(
      sql`MAX(${transactions.createdAt}) < ${threeMonthsAgo} OR MAX(${transactions.createdAt}) IS NULL`,
    )

  return rows.map((row) => formatPastorDefaulter(row, threeMonthsAgo))
}

/**
 * Busca IDs de pastores ativos, opcionalmente filtrados por busca de nome.
 */
async function fetchPastorIds(companyId: string, search?: string): Promise<string[]> {
  const conditions = [
    eq(users.companyId, companyId),
    eq(users.role, 'pastor'),
    isNull(users.deletedAt),
  ]

  if (search) {
    conditions.push(
      sql`LOWER(CONCAT(${pastorProfiles.firstName}, ' ', ${pastorProfiles.lastName})) LIKE ${`%${search.toLowerCase()}%`}`,
    )
  }

  const rows = await db
    .select({ id: users.id })
    .from(users)
    .innerJoin(pastorProfiles, eq(users.id, pastorProfiles.userId))
    .where(and(...conditions))

  return rows.map((r) => r.id)
}

/**
 * Formata uma linha de pastor inadimplente para o formato de resposta.
 * Se não há último pagamento, calcula dias desde threeMonthsAgo.
 */
function formatPastorDefaulter(row: PastorDefaulterRow, threeMonthsAgo: Date): DefaulterItem {
  const daysLate = row.lastPayment
    ? Math.max(0, Math.floor(Number(row.daysLate) || 0))
    : calculateDaysSince(threeMonthsAgo)

  return {
    id: row.id,
    name: `${row.firstName} ${row.lastName}`,
    type: 'pastor',
    titheDay: row.titheDay,
    lastPayment: row.lastPayment ? formatBrazilDate(row.lastPayment) : null,
    daysLate,
  }
}

/** Tipo de linha retornada pela query de igrejas inadimplentes */
interface ChurchDefaulterRow {
  id: string
  nomeFantasia: string
  titheDay: number | null
  lastPayment: Date | null
  daysLate: number | null
}

/**
 * Busca igrejas inadimplentes com cálculo de dias de atraso via SQL.
 * Usa EXTRACT(DAY FROM NOW() - MAX(transactions.createdAt)) em vez de getDaysSince() em loop.
 */
async function fetchChurchDefaulters(
  companyId: string,
  threeMonthsAgo: Date,
  search?: string,
): Promise<DefaulterItem[]> {
  // Buscar igrejas com último pagamento via SQL
  const churchIds = await fetchChurchIds(companyId, search)

  if (churchIds.length === 0) {
    return []
  }

  // Query otimizada: calcula dias de atraso diretamente no SQL
  const rows = await db
    .select({
      id: users.id,
      nomeFantasia: churchProfiles.nomeFantasia,
      titheDay: users.titheDay,
      lastPayment: sql<Date | null>`MAX(${transactions.createdAt})`,
      daysLate: sql<number | null>`EXTRACT(DAY FROM NOW() - MAX(${transactions.createdAt}))`,
    })
    .from(users)
    .innerJoin(churchProfiles, eq(users.id, churchProfiles.userId))
    .leftJoin(
      transactions,
      and(eq(users.id, transactions.contributorId), eq(transactions.status, 'approved')),
    )
    .where(
      and(
        eq(users.companyId, companyId),
        eq(users.role, 'church_account'),
        isNull(users.deletedAt),
        inArray(users.id, churchIds),
      ),
    )
    .groupBy(users.id, churchProfiles.nomeFantasia, users.titheDay)
    .having(
      sql`MAX(${transactions.createdAt}) < ${threeMonthsAgo} OR MAX(${transactions.createdAt}) IS NULL`,
    )

  return rows.map((row) => formatChurchDefaulter(row, threeMonthsAgo))
}

/**
 * Busca IDs de igrejas ativas, opcionalmente filtradas por busca de nome.
 */
async function fetchChurchIds(companyId: string, search?: string): Promise<string[]> {
  const conditions = [
    eq(users.companyId, companyId),
    eq(users.role, 'church_account'),
    isNull(users.deletedAt),
  ]

  if (search) {
    conditions.push(sql`LOWER(${churchProfiles.nomeFantasia}) LIKE ${`%${search.toLowerCase()}%`}`)
  }

  const rows = await db
    .select({ id: users.id })
    .from(users)
    .innerJoin(churchProfiles, eq(users.id, churchProfiles.userId))
    .where(and(...conditions))

  return rows.map((r) => r.id)
}

/**
 * Formata uma linha de igreja inadimplente para o formato de resposta.
 * Se não há último pagamento, calcula dias desde threeMonthsAgo.
 */
function formatChurchDefaulter(row: ChurchDefaulterRow, threeMonthsAgo: Date): DefaulterItem {
  const daysLate = row.lastPayment
    ? Math.max(0, Math.floor(Number(row.daysLate) || 0))
    : calculateDaysSince(threeMonthsAgo)

  return {
    id: row.id,
    name: row.nomeFantasia,
    type: 'church',
    titheDay: row.titheDay,
    lastPayment: row.lastPayment ? formatBrazilDate(row.lastPayment) : null,
    daysLate,
  }
}

/**
 * Calcula dias desde uma data até agora (para casos sem último pagamento).
 * Usa getBrazilDate() para consistência com timezone do Brasil.
 */
function calculateDaysSince(date: Date): number {
  const now = getBrazilDate()
  const diffMs = now.getTime() - date.getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

/**
 * Ordena a lista de inadimplentes por campo e direção especificados.
 * Mutação in-place para performance.
 */
function sortDefaulters(defaulters: DefaulterItem[], sortBy: string, sortOrder: string): void {
  defaulters.sort((a, b) => {
    if (sortBy === 'name') {
      return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    }
    // sortBy === 'daysLate'
    return sortOrder === 'asc' ? a.daysLate - b.daysLate : b.daysLate - a.daysLate
  })
}
