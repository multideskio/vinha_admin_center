/**
 * @fileoverview Serviço de relatório geral
 * @description Encapsula toda a lógica de consulta e agregação de dados do relatório geral,
 * sem dependência de NextRequest/NextResponse. Recebe parâmetros tipados e retorna
 * objetos tipados.
 *
 * O relatório geral suporta 5 sub-tipos:
 * - fin-01: Relatório Financeiro Completo
 * - mem-01: Relatório de Membresia
 * - ch-01: Relatório de Igrejas
 * - con-01: Relatório de Contribuições por Tipo
 * - def-01: Relatório de Inadimplência
 *
 * Otimizações:
 * - Agregações SQL (SUM, COUNT) em vez de reduce/filter em arrays
 * - Cache Redis de 5 minutos
 * - Tipagem completa com interfaces explícitas
 */

import { db } from '@/db/drizzle'
import { users, transactions, churchProfiles, pastorProfiles } from '@/db/schema'
import { eq, and, between, isNull, desc, sql, inArray } from 'drizzle-orm'
import { getCache, setCache } from '@/lib/cache'
import type { GeneralReportParams } from '@/lib/schemas/report-schemas'

// =============================================================================
// INTERFACES
// =============================================================================

export interface SummaryItem {
  label: string
  value: string | number
}

export interface GeneralReportResponse {
  title: string
  headers: string[]
  rows: (string | number)[][]
  summary: SummaryItem[]
}

// =============================================================================
// CONSTANTES
// =============================================================================

const CACHE_TTL_SECONDS = 300 // 5 minutos

// =============================================================================
// FUNÇÃO PRINCIPAL
// =============================================================================

/**
 * Gera o relatório geral delegando para a função específica do sub-tipo.
 *
 * @param companyId - ID da empresa (companyId do usuário autenticado)
 * @param params - Parâmetros validados pelo schema Zod (reportType, startDate, endDate, paymentMethod, paymentStatus)
 * @returns GeneralReportResponse com título, headers, rows e summary
 */
export async function generateGeneralReport(
  companyId: string,
  params: GeneralReportParams,
): Promise<GeneralReportResponse> {
  // Verificar cache
  const cacheKey = buildCacheKey(companyId, params)
  const cached = await getCache<GeneralReportResponse>(cacheKey)
  if (cached) {
    return cached
  }

  let result: GeneralReportResponse

  switch (params.reportType) {
    case 'fin-01':
      result = await generateFinancialSubReport(companyId, params)
      break
    case 'mem-01':
      result = await generateMembershipSubReport(companyId)
      break
    case 'ch-01':
      result = await generateChurchesSubReport(companyId)
      break
    case 'con-01':
      result = await generateContributionsSubReport(companyId, params)
      break
    case 'def-01':
      result = await generateDefaultersSubReport(companyId, params)
      break
  }

  // Salvar no cache
  await setCache(cacheKey, result, CACHE_TTL_SECONDS)

  return result
}

// =============================================================================
// CACHE
// =============================================================================

/**
 * Constrói a chave de cache baseada nos parâmetros do relatório.
 */
function buildCacheKey(companyId: string, params: GeneralReportParams): string {
  return `relatorio:geral:${companyId}:${params.reportType}:${params.startDate ?? ''}:${params.endDate ?? ''}:${params.paymentMethod ?? ''}:${params.paymentStatus ?? ''}`
}

// =============================================================================
// SUB-TIPO: fin-01 - Relatório Financeiro Completo
// =============================================================================

/**
 * Gera o sub-relatório financeiro com agregações SQL.
 * Otimização: usa COUNT/SUM no SQL em vez de reduce/filter em arrays.
 */
async function generateFinancialSubReport(
  companyId: string,
  params: GeneralReportParams,
): Promise<GeneralReportResponse> {
  const conditions = buildTransactionConditions(companyId, params)

  // Executar queries em paralelo: transações para listagem e agregações
  const [txRows, aggregations] = await Promise.all([
    fetchFinancialTransactions(conditions),
    fetchFinancialAggregations(conditions),
  ])

  const rows: (string | number)[][] = txRows.map((tx) => [
    tx.id.substring(0, 8),
    `R$ ${parseFloat(tx.amount).toFixed(2)}`,
    tx.status,
    tx.paymentMethod,
    new Date(tx.createdAt).toLocaleDateString('pt-BR'),
  ])

  return {
    title: 'Relatório Financeiro Completo',
    headers: ['ID', 'Valor', 'Status', 'Método', 'Data'],
    rows,
    summary: [
      { label: 'Total de Transações', value: aggregations.totalCount },
      { label: 'Aprovadas', value: aggregations.approvedCount },
      { label: 'Pendentes', value: aggregations.pendingCount },
      { label: 'Recusadas', value: aggregations.refusedCount },
      { label: 'Valor Total', value: `R$ ${Number(aggregations.totalAmount).toFixed(2)}` },
    ],
  }
}

/** Tipo de linha retornada pela query de transações financeiras */
interface FinancialTransactionRow {
  id: string
  amount: string
  status: string
  paymentMethod: string
  createdAt: Date
}

/**
 * Busca transações para listagem no relatório financeiro.
 */
async function fetchFinancialTransactions(
  conditions: ReturnType<typeof eq>[],
): Promise<FinancialTransactionRow[]> {
  const rows = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      status: transactions.status,
      paymentMethod: transactions.paymentMethod,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .where(and(...conditions))
    .orderBy(desc(transactions.createdAt))

  return rows
}

/** Tipo de resultado das agregações financeiras */
interface FinancialAggregations {
  totalCount: number
  approvedCount: number
  pendingCount: number
  refusedCount: number
  totalAmount: number
}

/**
 * Busca agregações financeiras via SQL (COUNT/SUM) em vez de reduce/filter.
 * Usa COALESCE para evitar null em somas.
 */
async function fetchFinancialAggregations(
  conditions: ReturnType<typeof eq>[],
): Promise<FinancialAggregations> {
  const [result] = await db
    .select({
      totalCount: sql<number>`COUNT(*)`,
      approvedCount: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.status} = 'approved' THEN 1 ELSE 0 END), 0)`,
      pendingCount: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.status} = 'pending' THEN 1 ELSE 0 END), 0)`,
      refusedCount: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.status} = 'refused' THEN 1 ELSE 0 END), 0)`,
      totalAmount: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .where(and(...conditions))
    .limit(1)

  return {
    totalCount: Number(result?.totalCount ?? 0),
    approvedCount: Number(result?.approvedCount ?? 0),
    pendingCount: Number(result?.pendingCount ?? 0),
    refusedCount: Number(result?.refusedCount ?? 0),
    totalAmount: Number(result?.totalAmount ?? 0),
  }
}

// =============================================================================
// SUB-TIPO: mem-01 - Relatório de Membresia
// =============================================================================

/**
 * Gera o sub-relatório de membresia com agregações SQL.
 * Otimização: usa COUNT + GROUP BY no SQL em vez de reduce em arrays.
 */
async function generateMembershipSubReport(companyId: string): Promise<GeneralReportResponse> {
  const [roleAggregations, statusAggregations] = await Promise.all([
    fetchMembershipByRole(companyId),
    fetchMembershipByStatus(companyId),
  ])

  const rows: (string | number)[][] = roleAggregations.map((r) => [r.role, r.count])

  const totalUsers = roleAggregations.reduce((sum, r) => sum + Number(r.count), 0)
  const activeCount = Number(statusAggregations.find((s) => s.status === 'active')?.count ?? 0)
  const inactiveCount = Number(statusAggregations.find((s) => s.status === 'inactive')?.count ?? 0)

  return {
    title: 'Relatório de Membresia',
    headers: ['Tipo', 'Quantidade'],
    rows,
    summary: [
      { label: 'Total de Usuários', value: totalUsers },
      { label: 'Ativos', value: activeCount },
      { label: 'Inativos', value: inactiveCount },
    ],
  }
}

/** Tipo de linha retornada pela query de membresia por role */
interface MembershipRoleRow {
  role: string
  count: number
}

/**
 * Busca contagem de usuários agrupados por role via SQL.
 */
async function fetchMembershipByRole(companyId: string): Promise<MembershipRoleRow[]> {
  const rows = await db
    .select({
      role: users.role,
      count: sql<number>`COUNT(*)`,
    })
    .from(users)
    .where(and(eq(users.companyId, companyId), isNull(users.deletedAt)))
    .groupBy(users.role)

  return rows
}

/** Tipo de linha retornada pela query de membresia por status */
interface MembershipStatusRow {
  status: string
  count: number
}

/**
 * Busca contagem de usuários agrupados por status via SQL.
 */
async function fetchMembershipByStatus(companyId: string): Promise<MembershipStatusRow[]> {
  const rows = await db
    .select({
      status: users.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(users)
    .where(and(eq(users.companyId, companyId), isNull(users.deletedAt)))
    .groupBy(users.status)

  return rows
}

// =============================================================================
// SUB-TIPO: ch-01 - Relatório de Igrejas
// =============================================================================

/**
 * Gera o sub-relatório de igrejas com contagem de ativos via SQL.
 * Otimização: usa COUNT com CASE WHEN no SQL em vez de filter em arrays.
 */
async function generateChurchesSubReport(companyId: string): Promise<GeneralReportResponse> {
  const [churchRows, churchAggregations] = await Promise.all([
    fetchChurchesList(companyId),
    fetchChurchesAggregations(companyId),
  ])

  const rows: (string | number)[][] = churchRows.map((ch) => [
    ch.nomeFantasia || 'N/A',
    ch.city || 'N/A',
    ch.state || 'N/A',
    ch.status,
  ])

  return {
    title: 'Relatório de Igrejas',
    headers: ['Nome', 'Cidade', 'Estado', 'Status'],
    rows,
    summary: [
      { label: 'Total de Igrejas', value: churchAggregations.totalChurches },
      { label: 'Ativas', value: churchAggregations.activeChurches },
    ],
  }
}

/** Tipo de linha retornada pela query de listagem de igrejas */
interface ChurchListRow {
  id: string
  nomeFantasia: string | null
  city: string | null
  state: string | null
  status: string
}

/**
 * Busca lista de igrejas com dados de perfil.
 */
async function fetchChurchesList(companyId: string): Promise<ChurchListRow[]> {
  const rows = await db
    .select({
      id: users.id,
      nomeFantasia: churchProfiles.nomeFantasia,
      city: churchProfiles.city,
      state: churchProfiles.state,
      status: users.status,
    })
    .from(users)
    .leftJoin(churchProfiles, eq(users.id, churchProfiles.userId))
    .where(
      and(
        eq(users.companyId, companyId),
        eq(users.role, 'church_account'),
        isNull(users.deletedAt),
      ),
    )

  return rows
}

/** Tipo de resultado das agregações de igrejas */
interface ChurchesAggregations {
  totalChurches: number
  activeChurches: number
}

/**
 * Busca agregações de igrejas via SQL (COUNT com CASE WHEN).
 */
async function fetchChurchesAggregations(companyId: string): Promise<ChurchesAggregations> {
  const [result] = await db
    .select({
      totalChurches: sql<number>`COUNT(*)`,
      activeChurches: sql<number>`COALESCE(SUM(CASE WHEN ${users.status} = 'active' THEN 1 ELSE 0 END), 0)`,
    })
    .from(users)
    .where(
      and(
        eq(users.companyId, companyId),
        eq(users.role, 'church_account'),
        isNull(users.deletedAt),
      ),
    )
    .limit(1)

  return {
    totalChurches: Number(result?.totalChurches ?? 0),
    activeChurches: Number(result?.activeChurches ?? 0),
  }
}

// =============================================================================
// SUB-TIPO: con-01 - Relatório de Contribuições por Tipo
// =============================================================================

/**
 * Gera o sub-relatório de contribuições com agregações SQL.
 * Otimização: usa COUNT/SUM + GROUP BY no SQL em vez de reduce em arrays.
 */
async function generateContributionsSubReport(
  companyId: string,
  params: GeneralReportParams,
): Promise<GeneralReportResponse> {
  const conditions = buildContributionConditions(companyId, params)

  const [byMethodRows, totalAggregation] = await Promise.all([
    fetchContributionsByMethod(conditions),
    fetchContributionsTotals(conditions),
  ])

  const rows: (string | number)[][] = byMethodRows.map((r) => [
    r.method,
    r.count,
    `R$ ${Number(r.total).toFixed(2)}`,
  ])

  return {
    title: 'Relatório de Contribuições por Tipo',
    headers: ['Método', 'Quantidade', 'Valor Total'],
    rows,
    summary: [
      { label: 'Total de Contribuições', value: totalAggregation.totalCount },
      {
        label: 'Valor Total Arrecadado',
        value: `R$ ${Number(totalAggregation.totalAmount).toFixed(2)}`,
      },
    ],
  }
}

/** Tipo de linha retornada pela query de contribuições por método */
interface ContributionByMethodRow {
  method: string
  count: number
  total: number
}

/**
 * Busca contribuições agrupadas por método de pagamento via SQL.
 */
async function fetchContributionsByMethod(
  conditions: ReturnType<typeof eq>[],
): Promise<ContributionByMethodRow[]> {
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

/** Tipo de resultado das agregações totais de contribuições */
interface ContributionsTotals {
  totalCount: number
  totalAmount: number
}

/**
 * Busca totais de contribuições via SQL (COUNT/SUM).
 */
async function fetchContributionsTotals(
  conditions: ReturnType<typeof eq>[],
): Promise<ContributionsTotals> {
  const [result] = await db
    .select({
      totalCount: sql<number>`COUNT(*)`,
      totalAmount: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .where(and(...conditions))
    .limit(1)

  return {
    totalCount: Number(result?.totalCount ?? 0),
    totalAmount: Number(result?.totalAmount ?? 0),
  }
}

// =============================================================================
// SUB-TIPO: def-01 - Relatório de Inadimplência
// =============================================================================

/**
 * Gera o sub-relatório de inadimplência.
 * Mantém a lógica de verificação mensal de pagamentos por contribuinte.
 */
async function generateDefaultersSubReport(
  companyId: string,
  params: GeneralReportParams,
): Promise<GeneralReportResponse> {
  // Buscar pastores e igrejas em paralelo
  const [pastors, churches] = await Promise.all([fetchPastors(companyId), fetchChurches(companyId)])

  const now = new Date()
  const startDate = params.startDate
    ? new Date(params.startDate)
    : new Date(now.getFullYear(), 0, 1)
  const endDate = params.endDate ? new Date(params.endDate) : now

  // Gerar lista de meses no período
  const months = generateMonthsList(startDate, endDate)

  // Buscar todos os pagamentos aprovados do período de uma vez
  const allContributorIds = [...pastors.map((p) => p.id), ...churches.map((c) => c.id)]

  const paymentsByContributorMonth =
    allContributorIds.length > 0
      ? await fetchPaymentsByContributorMonth(allContributorIds, startDate, endDate)
      : new Map<string, boolean>()

  // Montar rows para pastores
  const rows: (string | number)[][] = []

  for (const pastor of pastors) {
    const name = `${pastor.firstName} ${pastor.lastName}`
    const monthlyStatus: string[] = months.map((month) =>
      paymentsByContributorMonth.has(`${pastor.id}:${month}`) ? '✓ Pago' : '✗ Não pago',
    )
    rows.push([name, 'Pastor', pastor.titheDay?.toString() || 'N/A', ...monthlyStatus])
  }

  // Montar rows para igrejas
  for (const church of churches) {
    const monthlyStatus: string[] = months.map((month) =>
      paymentsByContributorMonth.has(`${church.id}:${month}`) ? '✓ Pago' : '✗ Não pago',
    )
    rows.push([
      church.nomeFantasia || 'N/A',
      'Igreja',
      church.titheDay?.toString() || 'N/A',
      ...monthlyStatus,
    ])
  }

  const totalPeople = pastors.length + churches.length
  const monthHeaders = formatMonthHeaders(months)

  return {
    title: 'Relatório de Inadimplência',
    headers: ['Nome', 'Tipo', 'Dia do Dízimo', ...monthHeaders],
    rows,
    summary: [
      { label: 'Total de Pessoas', value: totalPeople },
      { label: 'Pastores', value: pastors.length },
      { label: 'Igrejas', value: churches.length },
      {
        label: 'Período',
        value: `${monthHeaders[0] ?? 'N/A'} - ${monthHeaders[monthHeaders.length - 1] ?? 'N/A'}`,
      },
    ],
  }
}

/** Tipo de linha retornada pela query de pastores */
interface PastorRow {
  id: string
  firstName: string
  lastName: string
  titheDay: number | null
}

/**
 * Busca todos os pastores ativos da empresa.
 */
async function fetchPastors(companyId: string): Promise<PastorRow[]> {
  const rows = await db
    .select({
      id: users.id,
      firstName: pastorProfiles.firstName,
      lastName: pastorProfiles.lastName,
      titheDay: users.titheDay,
    })
    .from(users)
    .innerJoin(pastorProfiles, eq(users.id, pastorProfiles.userId))
    .where(and(eq(users.companyId, companyId), eq(users.role, 'pastor'), isNull(users.deletedAt)))

  return rows
}

/** Tipo de linha retornada pela query de igrejas */
interface ChurchRow {
  id: string
  nomeFantasia: string | null
  titheDay: number | null
}

/**
 * Busca todas as igrejas ativas da empresa.
 */
async function fetchChurches(companyId: string): Promise<ChurchRow[]> {
  const rows = await db
    .select({
      id: users.id,
      nomeFantasia: churchProfiles.nomeFantasia,
      titheDay: users.titheDay,
    })
    .from(users)
    .innerJoin(churchProfiles, eq(users.id, churchProfiles.userId))
    .where(
      and(
        eq(users.companyId, companyId),
        eq(users.role, 'church_account'),
        isNull(users.deletedAt),
      ),
    )

  return rows
}

/**
 * Busca pagamentos aprovados no período e retorna um Map de contributorId:month -> true.
 * Otimização: uma única query para todos os contribuintes.
 */
async function fetchPaymentsByContributorMonth(
  contributorIds: string[],
  startDate: Date,
  endDate: Date,
): Promise<Map<string, boolean>> {
  const payments = await db
    .select({
      contributorId: transactions.contributorId,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.status, 'approved'),
        between(transactions.createdAt, startDate, endDate),
        inArray(transactions.contributorId, contributorIds),
      ),
    )

  const paymentMap = new Map<string, boolean>()
  for (const payment of payments) {
    const date = new Date(payment.createdAt)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    paymentMap.set(`${payment.contributorId}:${monthKey}`, true)
  }

  return paymentMap
}

// =============================================================================
// FUNÇÕES UTILITÁRIAS COMPARTILHADAS
// =============================================================================

/**
 * Constrói condições de filtro para queries de transações (fin-01).
 */
function buildTransactionConditions(
  companyId: string,
  params: GeneralReportParams,
): ReturnType<typeof eq>[] {
  const conditions: ReturnType<typeof eq>[] = [eq(transactions.companyId, companyId)]

  if (params.startDate && params.endDate) {
    conditions.push(
      between(transactions.createdAt, new Date(params.startDate), new Date(params.endDate)),
    )
  }
  if (params.paymentMethod) {
    conditions.push(eq(transactions.paymentMethod, params.paymentMethod))
  }
  if (params.paymentStatus) {
    conditions.push(eq(transactions.status, params.paymentStatus))
  }

  return conditions
}

/**
 * Constrói condições de filtro para queries de contribuições (con-01).
 * Diferente do financeiro: usa paymentStatus como filtro direto (default: approved).
 */
function buildContributionConditions(
  companyId: string,
  params: GeneralReportParams,
): ReturnType<typeof eq>[] {
  const conditions: ReturnType<typeof eq>[] = [
    eq(transactions.companyId, companyId),
    eq(transactions.status, params.paymentStatus ?? 'approved'),
  ]

  if (params.startDate && params.endDate) {
    conditions.push(
      between(transactions.createdAt, new Date(params.startDate), new Date(params.endDate)),
    )
  }
  if (params.paymentMethod) {
    conditions.push(eq(transactions.paymentMethod, params.paymentMethod))
  }

  return conditions
}

/**
 * Gera lista de meses (YYYY-MM) entre duas datas.
 */
function generateMonthsList(startDate: Date, endDate: Date): string[] {
  const months: string[] = []
  const current = new Date(startDate)

  while (current <= endDate) {
    months.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`)
    current.setMonth(current.getMonth() + 1)
  }

  return months
}

/**
 * Formata lista de meses (YYYY-MM) para headers legíveis (Mês/Ano).
 */
function formatMonthHeaders(months: string[]): string[] {
  const monthNames = [
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

  return months.map((m) => {
    const parts = m.split('-')
    const year = parts[0]
    const month = parts[1]
    if (!year || !month) return 'N/A'
    return `${monthNames[parseInt(month) - 1]}/${year}`
  })
}
