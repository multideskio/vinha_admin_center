/**
 * @fileoverview Serviço de relatório de igrejas
 * @description Encapsula toda a lógica de consulta e agregação de dados de igrejas,
 * sem dependência de NextRequest/NextResponse. Recebe parâmetros tipados e retorna
 * objetos tipados.
 *
 * Funcionalidades:
 * - Listagem de igrejas com dados de arrecadação por período
 * - Agrupamento por supervisor
 * - Filtro por supervisor e período
 * - Cache Redis de 5 minutos
 * - Tipagem completa com interfaces explícitas
 */

import { db } from '@/db/drizzle'
import { users, transactions, churchProfiles, supervisorProfiles } from '@/db/schema'
import { eq, and, isNull, desc, sql } from 'drizzle-orm'
import { getCache, setCache } from '@/lib/cache'
import type { ChurchesReportParams } from '@/lib/schemas/report-schemas'

// =============================================================================
// INTERFACES
// =============================================================================

export interface FormattedChurch {
  id: string
  nomeFantasia: string
  cnpj: string
  cidade: string
  estado: string
  supervisorName: string
  totalRevenue: number
  transactionCount: number
  lastTransaction: {
    date: string
    amount: number
  } | null
  createdAt: string
}

export interface SupervisorOption {
  id: string
  name: string
}

export interface SupervisorGroup {
  count: number
  totalRevenue: number
  churches: FormattedChurch[]
}

export interface ChurchesSummary {
  totalChurches: number
  totalRevenue: number
  totalTransactions: number
}

export interface ChurchesReportResponse {
  churches: FormattedChurch[]
  bySupervisor: Record<string, SupervisorGroup>
  supervisors: SupervisorOption[]
  summary: ChurchesSummary
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
 * Gera o relatório de igrejas com dados de arrecadação e agrupamento por supervisor.
 *
 * @param companyId - ID da empresa (companyId do usuário autenticado)
 * @param params - Parâmetros validados pelo schema Zod (from, to, supervisorId)
 * @returns ChurchesReportResponse com igrejas, agrupamento por supervisor, lista de supervisores, summary e período
 */
export async function generateChurchesReport(
  companyId: string,
  params: ChurchesReportParams,
): Promise<ChurchesReportResponse> {
  // Verificar cache
  const cacheKey = buildCacheKey(companyId, params)
  const cached = await getCache<ChurchesReportResponse>(cacheKey)
  if (cached) {
    return cached
  }

  // Definir período
  const endDate = params.to ? new Date(params.to) : new Date()
  const startDate = params.from
    ? new Date(params.from)
    : new Date(Date.now() - DEFAULT_PERIOD_DAYS * 24 * 60 * 60 * 1000)

  // Executar queries em paralelo: supervisores e igrejas
  const [allSupervisors, churches] = await Promise.all([
    fetchSupervisors(companyId),
    fetchChurchesWithRevenue(companyId, startDate, endDate, params.supervisorId),
  ])

  // Formatar dados das igrejas
  const formattedChurches = churches.map(formatChurch)

  // Agrupar por supervisor
  const bySupervisor = groupBySupervisor(formattedChurches)

  // Calcular totais gerais
  const summary = buildSummary(formattedChurches)

  const result: ChurchesReportResponse = {
    churches: formattedChurches,
    bySupervisor,
    supervisors: allSupervisors.map((s) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
    })),
    summary,
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
function buildCacheKey(companyId: string, params: ChurchesReportParams): string {
  return `relatorio:igrejas:${companyId}:${params.from ?? ''}:${params.to ?? ''}:${params.supervisorId ?? ''}`
}

/** Tipo de linha retornada pela query de supervisores */
interface SupervisorRow {
  id: string
  firstName: string
  lastName: string
}

/**
 * Busca todos os supervisores ativos da empresa para o filtro.
 */
async function fetchSupervisors(companyId: string): Promise<SupervisorRow[]> {
  const rows = await db
    .select({
      id: users.id,
      firstName: supervisorProfiles.firstName,
      lastName: supervisorProfiles.lastName,
    })
    .from(users)
    .innerJoin(supervisorProfiles, eq(users.id, supervisorProfiles.userId))
    .where(
      and(eq(users.companyId, companyId), eq(users.role, 'supervisor'), isNull(users.deletedAt)),
    )

  return rows
}

/** Tipo de linha retornada pela query de igrejas */
interface ChurchRow {
  id: string
  nomeFantasia: string | null
  cnpj: string | null
  city: string | null
  state: string | null
  supervisorId: string | null
  supervisorName: string | null
  createdAt: Date
  totalRevenue: number
  transactionCount: number
  lastTransactionDate: string | null
  lastTransactionAmount: number | null
}

/**
 * Busca igrejas com dados de arrecadação no período, com filtro opcional por supervisor.
 */
async function fetchChurchesWithRevenue(
  companyId: string,
  startDate: Date,
  endDate: Date,
  supervisorId?: string,
): Promise<ChurchRow[]> {
  const churchConditions = [
    eq(users.companyId, companyId),
    eq(users.role, 'church_account'),
    isNull(users.deletedAt),
  ]

  if (supervisorId && supervisorId !== 'all') {
    churchConditions.push(eq(churchProfiles.supervisorId, supervisorId))
  }

  const rows = await db
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

  return rows
}

/**
 * Formata uma linha de igreja do banco para o formato de resposta.
 */
function formatChurch(row: ChurchRow): FormattedChurch {
  return {
    id: row.id,
    nomeFantasia: row.nomeFantasia || 'N/A',
    cnpj: row.cnpj || 'N/A',
    cidade: row.city || 'N/A',
    estado: row.state || 'N/A',
    supervisorName: row.supervisorName || 'Sem Supervisor',
    totalRevenue: Number(row.totalRevenue) || 0,
    transactionCount: Number(row.transactionCount) || 0,
    lastTransaction: row.lastTransactionDate
      ? {
          date: new Date(row.lastTransactionDate).toLocaleDateString('pt-BR'),
          amount: Number(row.lastTransactionAmount) || 0,
        }
      : null,
    createdAt: new Date(row.createdAt).toLocaleDateString('pt-BR'),
  }
}

/**
 * Agrupa igrejas formatadas por nome do supervisor.
 */
function groupBySupervisor(churches: FormattedChurch[]): Record<string, SupervisorGroup> {
  return churches.reduce(
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
    {} as Record<string, SupervisorGroup>,
  )
}

/**
 * Calcula os totais gerais do relatório de igrejas.
 */
function buildSummary(churches: FormattedChurch[]): ChurchesSummary {
  const totalChurches = churches.length
  const totalRevenue = churches.reduce((sum, c) => sum + c.totalRevenue, 0)
  const totalTransactions = churches.reduce((sum, c) => sum + c.transactionCount, 0)

  return {
    totalChurches,
    totalRevenue,
    totalTransactions,
  }
}
