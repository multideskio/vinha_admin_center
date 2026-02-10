import { z } from 'zod'

// =============================================================================
// CONSTANTES DE VALIDAÇÃO
// =============================================================================

const MAX_PERIOD_DAYS = 365
const MAX_PERIOD_MS = MAX_PERIOD_DAYS * 24 * 60 * 60 * 1000

const PAYMENT_METHODS = ['pix', 'credit_card', 'boleto'] as const
const PAYMENT_STATUSES = ['approved', 'pending', 'refused', 'refunded'] as const
const CONTRIBUTOR_TYPES = ['all', 'pastor', 'church_account'] as const
const MEMBERSHIP_ROLES = [
  'all',
  'admin',
  'manager',
  'supervisor',
  'pastor',
  'church_account',
] as const
const DEFAULTER_TYPES = ['all', 'pastor', 'church'] as const
const SORT_BY_OPTIONS = ['daysLate', 'name'] as const
const SORT_ORDER_OPTIONS = ['asc', 'desc'] as const
const REPORT_TYPES = ['fin-01', 'mem-01', 'ch-01', 'con-01', 'def-01'] as const

// =============================================================================
// SCHEMAS BASE
// =============================================================================

/**
 * Schema base para validação de período (from/to).
 * Refinements:
 *  1. Data inicial deve ser anterior ou igual à data final
 *  2. Período máximo de 365 dias
 */
export const periodSchema = z
  .object({
    from: z
      .string()
      .datetime({ message: 'Data inicial deve estar no formato ISO 8601 válido' })
      .optional(),
    to: z
      .string()
      .datetime({ message: 'Data final deve estar no formato ISO 8601 válido' })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        return new Date(data.from) <= new Date(data.to)
      }
      return true
    },
    { message: 'Data inicial deve ser anterior à data final' },
  )
  .refine(
    (data) => {
      if (data.from && data.to) {
        const diff = new Date(data.to).getTime() - new Date(data.from).getTime()
        return diff <= MAX_PERIOD_MS
      }
      return true
    },
    { message: 'Período máximo permitido é de 365 dias' },
  )

/**
 * Schema base para paginação.
 * - page >= 1 (default: 1)
 * - limit entre 1 e 100 (default: 20)
 * Usa z.coerce.number() pois os valores vêm de query strings.
 */
export const paginationSchema = z.object({
  page: z.coerce
    .number({
      invalid_type_error: 'Página deve ser um número válido',
    })
    .int({ message: 'Página deve ser um número inteiro' })
    .min(1, { message: 'Página deve ser maior ou igual a 1' })
    .default(1),
  limit: z.coerce
    .number({
      invalid_type_error: 'Limite deve ser um número válido',
    })
    .int({ message: 'Limite deve ser um número inteiro' })
    .min(1, { message: 'Limite deve ser maior ou igual a 1' })
    .max(100, { message: 'Limite deve ser menor ou igual a 100' })
    .default(20),
})

// =============================================================================
// SCHEMAS ESPECÍFICOS POR RELATÓRIO
// =============================================================================

/**
 * Schema para relatório financeiro (GET /relatorios/financeiro)
 * Filtros: método de pagamento, status, período, paginação
 */
export const financialReportSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  method: z
    .enum(['all', ...PAYMENT_METHODS], {
      errorMap: () => ({
        message: `Método de pagamento inválido. Valores permitidos: all, ${PAYMENT_METHODS.join(', ')}`,
      }),
    })
    .default('all'),
  status: z
    .enum(['all', ...PAYMENT_STATUSES], {
      errorMap: () => ({
        message: `Status inválido. Valores permitidos: all, ${PAYMENT_STATUSES.join(', ')}`,
      }),
    })
    .default('all'),
  page: z.coerce
    .number({
      invalid_type_error: 'Página deve ser um número válido',
    })
    .int({ message: 'Página deve ser um número inteiro' })
    .min(1, { message: 'Página deve ser maior ou igual a 1' })
    .default(1),
  limit: z.coerce
    .number({
      invalid_type_error: 'Limite deve ser um número válido',
    })
    .int({ message: 'Limite deve ser um número inteiro' })
    .min(1, { message: 'Limite deve ser maior ou igual a 1' })
    .max(100, { message: 'Limite deve ser menor ou igual a 100' })
    .default(50),
})

/**
 * Schema para relatório de contribuições (GET /relatorios/contribuicoes)
 * Filtros: tipo de contribuinte, período, paginação
 */
export const contributionsReportSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  contributorType: z
    .enum(CONTRIBUTOR_TYPES, {
      errorMap: () => ({
        message: `Tipo de contribuinte inválido. Valores permitidos: ${CONTRIBUTOR_TYPES.join(', ')}`,
      }),
    })
    .default('all'),
  page: z.coerce
    .number({
      invalid_type_error: 'Página deve ser um número válido',
    })
    .int({ message: 'Página deve ser um número inteiro' })
    .min(1, { message: 'Página deve ser maior ou igual a 1' })
    .default(1),
  limit: z.coerce
    .number({
      invalid_type_error: 'Limite deve ser um número válido',
    })
    .int({ message: 'Limite deve ser um número inteiro' })
    .min(1, { message: 'Limite deve ser maior ou igual a 1' })
    .max(100, { message: 'Limite deve ser menor ou igual a 100' })
    .default(20),
})

/**
 * Schema para relatório de membresia (GET /relatorios/membresia)
 * Filtros: role, paginação
 */
export const membershipReportSchema = z.object({
  role: z
    .enum(MEMBERSHIP_ROLES, {
      errorMap: () => ({
        message: `Role inválido. Valores permitidos: ${MEMBERSHIP_ROLES.join(', ')}`,
      }),
    })
    .default('all'),
  page: z.coerce
    .number({
      invalid_type_error: 'Página deve ser um número válido',
    })
    .int({ message: 'Página deve ser um número inteiro' })
    .min(1, { message: 'Página deve ser maior ou igual a 1' })
    .default(1),
  limit: z.coerce
    .number({
      invalid_type_error: 'Limite deve ser um número válido',
    })
    .int({ message: 'Limite deve ser um número inteiro' })
    .min(1, { message: 'Limite deve ser maior ou igual a 1' })
    .max(100, { message: 'Limite deve ser menor ou igual a 100' })
    .default(20),
})

/**
 * Schema para relatório de inadimplentes (GET /relatorios/inadimplentes)
 * Filtros: tipo, busca, ordenação, paginação
 */
export const defaultersReportSchema = z.object({
  type: z
    .enum(DEFAULTER_TYPES, {
      errorMap: () => ({
        message: `Tipo de inadimplente inválido. Valores permitidos: ${DEFAULTER_TYPES.join(', ')}`,
      }),
    })
    .default('all'),
  search: z.string().optional(),
  sortBy: z
    .enum(SORT_BY_OPTIONS, {
      errorMap: () => ({
        message: `Campo de ordenação inválido. Valores permitidos: ${SORT_BY_OPTIONS.join(', ')}`,
      }),
    })
    .default('daysLate'),
  sortOrder: z
    .enum(SORT_ORDER_OPTIONS, {
      errorMap: () => ({
        message: `Ordem de classificação inválida. Valores permitidos: ${SORT_ORDER_OPTIONS.join(', ')}`,
      }),
    })
    .default('desc'),
  page: z.coerce
    .number({
      invalid_type_error: 'Página deve ser um número válido',
    })
    .int({ message: 'Página deve ser um número inteiro' })
    .min(1, { message: 'Página deve ser maior ou igual a 1' })
    .default(1),
  limit: z.coerce
    .number({
      invalid_type_error: 'Limite deve ser um número válido',
    })
    .int({ message: 'Limite deve ser um número inteiro' })
    .min(1, { message: 'Limite deve ser maior ou igual a 1' })
    .max(100, { message: 'Limite deve ser menor ou igual a 100' })
    .default(20),
})

/**
 * Schema para relatório de igrejas (GET /relatorios/igrejas)
 * Filtros: período, supervisorId
 */
export const churchesReportSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  supervisorId: z.string().uuid({ message: 'ID do supervisor deve ser um UUID válido' }).optional(),
})

/**
 * Schema para relatório geral (POST /relatorios)
 * Body: tipo de relatório, período, filtros de pagamento
 */
export const generalReportSchema = z.object({
  reportType: z.enum(REPORT_TYPES, {
    errorMap: () => ({
      message: `Tipo de relatório inválido. Valores permitidos: ${REPORT_TYPES.join(', ')}`,
    }),
  }),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  paymentMethod: z
    .enum(PAYMENT_METHODS, {
      errorMap: () => ({
        message: `Método de pagamento inválido. Valores permitidos: ${PAYMENT_METHODS.join(', ')}`,
      }),
    })
    .optional(),
  paymentStatus: z
    .enum(PAYMENT_STATUSES, {
      errorMap: () => ({
        message: `Status de pagamento inválido. Valores permitidos: ${PAYMENT_STATUSES.join(', ')}`,
      }),
    })
    .optional(),
})

// =============================================================================
// TIPOS INFERIDOS
// =============================================================================

export type PeriodInput = z.input<typeof periodSchema>
export type PeriodOutput = z.output<typeof periodSchema>

export type PaginationInput = z.input<typeof paginationSchema>
export type PaginationOutput = z.output<typeof paginationSchema>

export type FinancialReportInput = z.input<typeof financialReportSchema>
export type FinancialReportParams = z.output<typeof financialReportSchema>

export type ContributionsReportInput = z.input<typeof contributionsReportSchema>
export type ContributionsReportParams = z.output<typeof contributionsReportSchema>

export type MembershipReportInput = z.input<typeof membershipReportSchema>
export type MembershipReportParams = z.output<typeof membershipReportSchema>

export type DefaultersReportInput = z.input<typeof defaultersReportSchema>
export type DefaultersReportParams = z.output<typeof defaultersReportSchema>

export type ChurchesReportInput = z.input<typeof churchesReportSchema>
export type ChurchesReportParams = z.output<typeof churchesReportSchema>

export type GeneralReportInput = z.input<typeof generalReportSchema>
export type GeneralReportParams = z.output<typeof generalReportSchema>
