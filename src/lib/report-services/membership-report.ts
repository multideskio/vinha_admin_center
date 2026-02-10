/**
 * @fileoverview Serviço de relatório de membresia
 * @description Encapsula toda a lógica de consulta e agregação de dados de membresia,
 * sem dependência de NextRequest/NextResponse. Recebe parâmetros tipados e retorna
 * objetos tipados.
 *
 * Funcionalidades:
 * - Paginação server-side com LIMIT/OFFSET na lista de membros
 * - Cálculo de crescimento mensal otimizado com GROUP BY SQL
 * - Summary (distribuição por role, novos membros no mês) sem paginação
 * - Cache Redis de 5 minutos
 * - Tipagem completa com interfaces explícitas
 */

import { db } from '@/db/drizzle'
import {
  users,
  pastorProfiles,
  churchProfiles,
  managerProfiles,
  supervisorProfiles,
} from '@/db/schema'
import { eq, and, isNull, desc, sql } from 'drizzle-orm'
import { getCache, setCache } from '@/lib/cache'
import { buildPaginationMeta, type PaginatedResult } from '@/lib/report-services/types'
import type { MembershipReportParams } from '@/lib/schemas/report-schemas'
import type { UserRole } from '@/lib/types'

// =============================================================================
// INTERFACES
// =============================================================================

export interface FormattedMember {
  id: string
  name: string
  email: string
  role: string
  extraInfo: string
  createdAt: string
  status: string
}

export interface RoleDistribution {
  role: string
  count: number
}

export interface MembershipSummary {
  totalMembers: number
  newThisMonth: number
  byRole: RoleDistribution[]
}

export interface GrowthDataPoint {
  month: string
  count: number
}

export interface MembershipReportResponse {
  members: PaginatedResult<FormattedMember>
  summary: MembershipSummary
  growthData: GrowthDataPoint[]
}

// =============================================================================
// CONSTANTES
// =============================================================================

const CACHE_TTL_SECONDS = 300 // 5 minutos

const MONTH_NAMES = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

// =============================================================================
// FUNÇÃO PRINCIPAL
// =============================================================================

/**
 * Gera o relatório de membresia completo com paginação server-side.
 *
 * @param companyId - ID da empresa (companyId do usuário autenticado)
 * @param params - Parâmetros validados pelo schema Zod (role, page, limit)
 * @returns MembershipReportResponse com membros paginados, summary e dados de crescimento
 */
export async function generateMembershipReport(
  companyId: string,
  params: MembershipReportParams,
): Promise<MembershipReportResponse> {
  // Verificar cache
  const cacheKey = buildCacheKey(companyId, params)
  const cached = await getCache<MembershipReportResponse>(cacheKey)
  if (cached) {
    return cached
  }

  // Executar queries em paralelo: membros paginados, contagem total, summary e crescimento
  const [paginatedMembers, totalCount, roleDistribution, newThisMonth, growthData] =
    await Promise.all([
      fetchPaginatedMembers(companyId, params),
      fetchTotalCount(companyId, params),
      fetchRoleDistribution(companyId),
      fetchNewThisMonth(companyId),
      fetchGrowthData(companyId),
    ])

  // Formatar membros
  const formattedMembers = paginatedMembers.map(formatMember)

  // Formatar dados de crescimento com nomes de meses em pt-BR
  const formattedGrowthData = formatGrowthData(growthData)

  // Montar resultado
  const result: MembershipReportResponse = {
    members: {
      data: formattedMembers,
      pagination: buildPaginationMeta(params.page, params.limit, totalCount),
    },
    summary: {
      totalMembers: totalCount,
      newThisMonth,
      byRole: roleDistribution,
    },
    growthData: formattedGrowthData,
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
function buildCacheKey(companyId: string, params: MembershipReportParams): string {
  return `relatorio:membresia:${companyId}:${params.role}:${params.page}:${params.limit}`
}

/**
 * Constrói as condições base de filtro para membros.
 */
function buildBaseConditions(companyId: string, params: MembershipReportParams) {
  const conditions = [eq(users.companyId, companyId), isNull(users.deletedAt)]

  if (params.role && params.role !== 'all') {
    conditions.push(eq(users.role, params.role as UserRole))
  }

  return conditions
}

/** Tipo de linha retornada pela query de membros */
interface MemberRow {
  id: string
  role: string
  status: string
  email: string
  createdAt: Date
  pastorFirstName: string | null
  pastorLastName: string | null
  churchNomeFantasia: string | null
  managerFirstName: string | null
  managerLastName: string | null
  supervisorFirstName: string | null
  supervisorLastName: string | null
}

/**
 * Busca membros com paginação server-side (LIMIT/OFFSET).
 */
async function fetchPaginatedMembers(
  companyId: string,
  params: MembershipReportParams,
): Promise<MemberRow[]> {
  const offset = (params.page - 1) * params.limit
  const conditions = buildBaseConditions(companyId, params)

  const rows = await db
    .select({
      id: users.id,
      role: users.role,
      status: users.status,
      email: users.email,
      createdAt: users.createdAt,
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
    .limit(params.limit)
    .offset(offset)

  return rows
}

/**
 * Busca a contagem total de membros (para metadados de paginação).
 */
async function fetchTotalCount(companyId: string, params: MembershipReportParams): Promise<number> {
  const conditions = buildBaseConditions(companyId, params)

  const [result] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(and(...conditions))
    .limit(1)

  return Number(result?.count ?? 0)
}

/** Tipo de linha retornada pela query de distribuição por role */
interface RoleDistributionRow {
  role: string
  count: number
}

/**
 * Busca a distribuição de membros por role (sem paginação, sem filtro de role).
 * Sempre retorna a distribuição completa para o summary.
 */
async function fetchRoleDistribution(companyId: string): Promise<RoleDistribution[]> {
  const rows: RoleDistributionRow[] = await db
    .select({
      role: users.role,
      count: sql<number>`COUNT(*)`,
    })
    .from(users)
    .where(and(eq(users.companyId, companyId), isNull(users.deletedAt)))
    .groupBy(users.role)

  return rows.map((r) => ({
    role: r.role,
    count: Number(r.count),
  }))
}

/**
 * Busca a contagem de novos membros criados no mês atual.
 * Usa SQL para calcular o início do mês corrente.
 */
async function fetchNewThisMonth(companyId: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(
      and(
        eq(users.companyId, companyId),
        isNull(users.deletedAt),
        sql`${users.createdAt} >= DATE_TRUNC('month', NOW())`,
      ),
    )
    .limit(1)

  return Number(result?.count ?? 0)
}

/** Tipo de linha retornada pela query de crescimento mensal */
interface GrowthRow {
  month: string
  count: number
}

/**
 * Busca dados de crescimento mensal dos últimos 6 meses usando GROUP BY SQL.
 * Otimização: substitui filtro em memória (allMembers.filter) por agregação SQL.
 */
async function fetchGrowthData(companyId: string): Promise<GrowthRow[]> {
  const rows = await db
    .select({
      month: sql<string>`TO_CHAR(${users.createdAt}, 'YYYY-MM')`,
      count: sql<number>`COALESCE(COUNT(*), 0)`,
    })
    .from(users)
    .where(
      and(
        eq(users.companyId, companyId),
        isNull(users.deletedAt),
        sql`${users.createdAt} >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'`,
      ),
    )
    .groupBy(sql`TO_CHAR(${users.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${users.createdAt}, 'YYYY-MM')`)

  return rows.map((r) => ({
    month: r.month,
    count: Number(r.count),
  }))
}

/**
 * Formata os dados de crescimento SQL (YYYY-MM) para o formato de exibição (Mês/Ano).
 * Preenche meses sem dados com count 0 para garantir 6 meses completos.
 */
function formatGrowthData(growthRows: GrowthRow[]): GrowthDataPoint[] {
  // Criar mapa de meses com dados do SQL
  const dataMap = new Map<string, number>()
  for (const row of growthRows) {
    dataMap.set(row.month, row.count)
  }

  // Gerar os últimos 6 meses e preencher com dados ou 0
  const result: GrowthDataPoint[] = []
  for (let i = 5; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    date.setDate(1)

    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthLabel = `${MONTH_NAMES[date.getMonth()]}/${date.getFullYear()}`

    result.push({
      month: monthLabel,
      count: dataMap.get(yearMonth) ?? 0,
    })
  }

  return result
}

/**
 * Formata uma linha de membro do banco para o formato de resposta.
 */
function formatMember(row: MemberRow): FormattedMember {
  let name = 'N/A'
  let extraInfo = ''

  switch (row.role) {
    case 'pastor':
      name = `${row.pastorFirstName || ''} ${row.pastorLastName || ''}`.trim()
      extraInfo = 'Pastor'
      break
    case 'church_account':
      name = row.churchNomeFantasia || 'N/A'
      extraInfo = 'Igreja'
      break
    case 'manager':
      name = `${row.managerFirstName || ''} ${row.managerLastName || ''}`.trim()
      extraInfo = 'Gerente'
      break
    case 'supervisor':
      name = `${row.supervisorFirstName || ''} ${row.supervisorLastName || ''}`.trim()
      extraInfo = 'Supervisor'
      break
    case 'admin':
      name = 'Administrador'
      extraInfo = 'Admin'
      break
  }

  return {
    id: row.id,
    name: name || 'N/A',
    email: row.email,
    role: row.role,
    extraInfo,
    createdAt: new Date(row.createdAt).toLocaleDateString('pt-BR'),
    status: row.status,
  }
}
