import { z } from 'zod'

/**
 * Schema de validação para parâmetros da API do dashboard
 */
export const dashboardParamsSchema = z.object({
  from: z.string().datetime().optional().nullable(),
  to: z.string().datetime().optional().nullable(),
})

export type DashboardParams = z.infer<typeof dashboardParamsSchema>

/**
 * Schema de validação para dados do dashboard
 */
export const dashboardDataSchema = z.object({
  kpis: z.object({
    totalRevenue: z.object({
      value: z.string(),
      change: z.string(),
    }),
    totalMembers: z.object({
      value: z.string(),
      change: z.string(),
    }),
    totalTransactions: z.object({
      value: z.string(),
      change: z.string(),
    }),
    totalChurches: z.object({
      value: z.string(),
      change: z.string(),
    }),
    totalPastors: z.object({
      value: z.string(),
      change: z.string(),
    }),
    totalSupervisors: z.object({
      value: z.string(),
      change: z.string(),
    }),
    totalManagers: z.object({
      value: z.string(),
      change: z.string(),
    }),
  }),
  revenueByMethod: z.array(
    z.object({
      method: z.string(),
      value: z.number(),
      fill: z.string(),
    }),
  ),
  revenueByRegion: z.array(
    z.object({
      name: z.string(),
      revenue: z.number(),
      fill: z.string(),
    }),
  ),
  churchesByRegion: z.array(
    z.object({
      name: z.string(),
      count: z.number(),
      fill: z.string(),
    }),
  ),
  recentTransactions: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      amount: z.number(),
      date: z.string(),
      status: z.enum(['approved', 'pending', 'refused', 'refunded']),
      contributorId: z.string(),
      contributorRole: z.string(),
    }),
  ),
  recentRegistrations: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      date: z.string(),
      avatar: z.string(),
    }),
  ),
  newMembers: z.array(
    z.object({
      month: z.string(),
      count: z.number(),
    }),
  ),
  defaulters: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['pastor', 'church']),
      titheDay: z.number(),
      lastPayment: z.string().nullable(),
      daysLate: z.number(),
    }),
  ),
})

export type DashboardData = z.infer<typeof dashboardDataSchema>

/**
 * Tipo para ponto do gráfico de crescimento (dumbbell chart)
 */
export type DumbbellPoint = {
  month: string
  prev: number | null
  current: number
}
