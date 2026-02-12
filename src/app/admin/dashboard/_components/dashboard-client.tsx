'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { exportToCsv } from '@/lib/export-csv'
import type { DashboardData, DumbbellPoint } from '@/lib/types/dashboard-types'

// Componentes estáticos
import { DashboardHeader } from './dashboard-header'
import { InsightsCard } from './insights-card'
import { KpiCard } from './kpi-card'
import { QuickActions } from './quick-actions'
import { DefaultersCard } from './defaulters-card'
import { TransactionsTable } from './transactions-table'

// Lazy load dos gráficos pesados (Recharts ~200KB)
const GrowthChart = dynamic(() => import('./growth-chart').then((mod) => mod.GrowthChart), {
  loading: () => <Skeleton className="h-[320px] w-full" />,
  ssr: false,
})

const RevenueCharts = dynamic(() => import('./revenue-charts').then((mod) => mod.RevenueCharts), {
  loading: () => <Skeleton className="h-[300px] w-full" />,
  ssr: false,
})

// Ícones
import { DollarSign, Users, Activity, Building, User, UserCog, UserCheck } from 'lucide-react'

type DashboardClientProps = {
  initialData: DashboardData
  userName: string
}

export function DashboardClient({ initialData, userName }: DashboardClientProps) {
  const [data, setData] = React.useState<DashboardData>(initialData)
  const [transactionsLoading, setTransactionsLoading] = React.useState(false)
  const [dateRange, setDateRange] = React.useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const { toast } = useToast()
  const [sending, setSending] = React.useState(false)
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState<string | null>(null)
  const [insightLoading, setInsightLoading] = React.useState(false)
  const [insightSummary, setInsightSummary] = React.useState('')
  const [insightCards, setInsightCards] = React.useState<
    Array<{
      type: string
      title: string
      description: string
      metric?: string | null
      text?: string
    }>
  >([])

  // Fetch dados do dashboard
  const fetchData = React.useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (dateRange.from) params.append('from', dateRange.from.toISOString())
      if (dateRange.to) params.append('to', dateRange.to.toISOString())

      const response = await fetch(`/api/v1/dashboard/admin?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Falha ao carregar os dados do dashboard.')
      }
      const dashboardData: DashboardData = await response.json()
      setData(dashboardData)
      setLastUpdatedAt(new Date().toLocaleString('pt-BR'))
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      })
    }
  }, [toast, dateRange])

  // Atualizar apenas transações
  const refreshTransactions = React.useCallback(async () => {
    setTransactionsLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateRange.from) params.append('from', dateRange.from.toISOString())
      if (dateRange.to) params.append('to', dateRange.to.toISOString())

      const response = await fetch(`/api/v1/dashboard/admin?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Falha ao carregar as transações.')
      }
      const dashboardData: DashboardData = await response.json()

      setData((prev) => ({
        ...prev,
        recentTransactions: dashboardData.recentTransactions,
      }))

      toast({
        title: 'Atualizado',
        description: 'Lista de transações atualizada com sucesso.',
        variant: 'success',
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setTransactionsLoading(false)
    }
  }, [toast, dateRange])

  // Definir timestamp inicial apenas no cliente
  React.useEffect(() => {
    setLastUpdatedAt(new Date().toLocaleString('pt-BR'))
  }, [])

  // Recarregar quando dateRange mudar (apenas se já foi inicializado)
  React.useEffect(() => {
    // Só busca dados se o dateRange mudou após a inicialização
    if (dateRange.from || dateRange.to) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.from, dateRange.to])

  const handleDateRangeChange = React.useCallback(
    (range: { from: Date | undefined; to: Date | undefined }) => {
      setDateRange(range)
    },
    [],
  )

  const handleSendReminders = React.useCallback(async () => {
    setSending(true)
    try {
      const response = await fetch('/api/v1/admin/send-reminders', { method: 'POST' })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result?.error || 'Falha ao enviar lembretes.')
      }

      if (result.sent === 0 && result.skipped === 0) {
        toast({
          title: 'Nenhum lembrete para enviar',
          description:
            'Não há usuários elegíveis para receber lembretes hoje. Verifique as regras de notificação.',
          variant: 'default',
        })
      } else if (result.sent === 0 && result.skipped > 0) {
        toast({
          title: 'Lembretes já enviados',
          description: `${result.skipped} lembretes foram ignorados porque já foram enviados hoje.`,
          variant: 'default',
        })
      } else {
        toast({
          title: 'Lembretes enviados com sucesso!',
          description: `${result.sent} enviados${result.skipped > 0 ? `, ${result.skipped} ignorados` : ''}.`,
          variant: 'success',
        })
      }
    } catch (e: unknown) {
      toast({
        title: 'Erro',
        description: e instanceof Error ? e.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }, [toast])

  const handleGenerateInsights = React.useCallback(async () => {
    setInsightLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateRange.from) params.append('from', dateRange.from.toISOString())
      if (dateRange.to) params.append('to', dateRange.to.toISOString())
      const res = await fetch(`/api/v1/dashboard/insights?${params.toString()}`)
      const result = await res.json()
      if (!res.ok) {
        throw new Error(result?.error || 'Falha ao gerar insights')
      }
      setInsightSummary(result.summary || '')
      setInsightCards(result.cards || [])
      toast({
        title: 'Insights gerados',
        description: 'Análise da IA concluída com sucesso.',
        variant: 'success',
      })
    } catch (e: unknown) {
      setInsightSummary('')
      setInsightCards([])
      toast({
        title: 'Erro ao gerar insights',
        description: e instanceof Error ? e.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setInsightLoading(false)
    }
  }, [dateRange, toast])

  const handleExportDefaulters = React.useCallback(() => {
    if (!data.defaulters?.length) return
    const rows = data.defaulters.map((d) => ({
      id: d.id,
      nome: d.name,
      tipo: d.type,
      dia_vencimento: d.titheDay,
      dias_atraso: d.daysLate,
      ultimo_pagamento: d.lastPayment || '',
    }))
    exportToCsv(rows, `inadimplentes-${new Date().toISOString().slice(0, 10)}.csv`)
  }, [data])

  const handleExportTransactions = React.useCallback(() => {
    if (!data.recentTransactions?.length) return
    const rows = data.recentTransactions.map((t) => ({
      id: t.id,
      contribuinte: t.name,
      valor: t.amount,
      status: t.status,
      data: t.date,
      role: t.contributorRole,
    }))
    exportToCsv(rows, `transacoes-${new Date().toISOString().slice(0, 10)}.csv`)
  }, [data])

  // KPIs principais
  const kpiDisplayData = [
    { title: 'Arrecadação no Período', icon: DollarSign, data: data.kpis.totalRevenue },
    { title: 'Total de Usuários', icon: Users, data: data.kpis.totalMembers },
    { title: 'Total de Transações', icon: Activity, data: data.kpis.totalTransactions },
    { title: 'Contas de Igreja (CNPJ)', icon: Building, data: data.kpis.totalChurches },
  ]

  // KPIs secundários
  const secondaryKpis = [
    { title: 'Pastores', icon: User, data: data.kpis.totalPastors },
    { title: 'Supervisores', icon: UserCog, data: data.kpis.totalSupervisors },
    { title: 'Gerentes', icon: UserCheck, data: data.kpis.totalManagers },
  ]

  // Dados para gráfico de crescimento (dumbbell chart)
  const dumbbellData = React.useMemo((): DumbbellPoint[] => {
    if (!data.newMembers || data.newMembers.length < 2) {
      return data.newMembers?.map((m) => ({ month: m.month, prev: null, current: m.count })) || []
    }

    const result: DumbbellPoint[] = []
    for (let i = 1; i < data.newMembers.length; i++) {
      const current = data.newMembers[i]
      const prev = data.newMembers[i - 1]
      if (current && prev) {
        result.push({ month: current.month, prev: prev.count, current: current.count })
      }
    }
    return result
  }, [data.newMembers])

  const totalNewMembers = data.newMembers?.reduce((sum, m) => sum + m.count, 0) ?? 0

  return (
    <div className="flex flex-col gap-4 sm:gap-6 max-w-full">
      {/* Header */}
      <DashboardHeader
        userName={userName}
        lastUpdatedAt={lastUpdatedAt}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        onRefresh={fetchData}
        onSendReminders={handleSendReminders}
        sending={sending}
      />

      {/* Insights IA */}
      <InsightsCard
        insightSummary={insightSummary}
        insightCards={insightCards}
        insightLoading={insightLoading}
        onGenerateInsights={handleGenerateInsights}
      />

      {/* Container principal */}
      <div className="space-y-4 sm:space-y-6 overflow-visible">
        {/* KPIs principais */}
        <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 p-2 -m-2">
          {kpiDisplayData.map((kpi, index) => (
            <KpiCard
              key={kpi.title}
              title={kpi.title}
              icon={kpi.icon}
              data={kpi.data}
              variant="primary"
              colorIndex={index}
            />
          ))}
        </div>

        {/* KPIs secundários */}
        <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 p-2 -m-2">
          {secondaryKpis.map((kpi, index) => (
            <KpiCard
              key={kpi.title}
              title={kpi.title}
              icon={kpi.icon}
              data={kpi.data}
              variant="secondary"
              colorIndex={index}
            />
          ))}
        </div>

        {/* Gráfico de Crescimento */}
        <GrowthChart data={dumbbellData} totalNewMembers={totalNewMembers} />

        {/* Ações Rápidas */}
        <QuickActions
          hasData={true}
          onExportDefaulters={handleExportDefaulters}
          onExportTransactions={handleExportTransactions}
        />

        {/* Inadimplentes e Transações */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
          <div className="lg:col-span-3">
            <DefaultersCard defaulters={data.defaulters} isLoading={false} />
          </div>
          <div className="lg:col-span-2">
            <TransactionsTable
              transactions={data.recentTransactions}
              transactionsLoading={transactionsLoading}
              onRefresh={refreshTransactions}
              onExport={handleExportTransactions}
              hasData={true}
            />
          </div>
        </div>

        {/* Gráficos de Receita */}
        <RevenueCharts
          revenueByMethod={data.revenueByMethod}
          revenueByRegion={data.revenueByRegion}
          churchesByRegion={data.churchesByRegion}
        />
      </div>
    </div>
  )
}
