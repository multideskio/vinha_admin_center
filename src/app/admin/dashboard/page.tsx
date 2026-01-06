'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Activity,
  DollarSign,
  Users,
  UserCheck,
  UserCog,
  Building,
  User,
  ExternalLink,
  AlertTriangle,
  Save,
  TrendingUp,
} from 'lucide-react'
import {
  Tooltip,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
  Legend,
  CartesianGrid,
  ComposedChart,
  Line,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { type TransactionStatus } from '@/lib/types'

// Componentes modulares
import { DashboardHeader } from './_components/DashboardHeader'
import { KpiCard } from './_components/KpiCard'
import { InsightsCard } from './_components/InsightsCard'
import { TransactionsTable } from './_components/TransactionsTable'

type KpiData = {
  title: string
  value: string
  change: string
  icon: React.ElementType
}

type KpiBlock = {
  totalRevenue: Omit<KpiData, 'icon' | 'title'>
  totalMembers: Omit<KpiData, 'icon' | 'title'>
  totalTransactions: Omit<KpiData, 'icon' | 'title'>
  totalChurches: Omit<KpiData, 'icon' | 'title'>
  totalPastors: Omit<KpiData, 'icon' | 'title'>
  totalSupervisors: Omit<KpiData, 'icon' | 'title'>
  totalManagers: Omit<KpiData, 'icon' | 'title'>
}

type DashboardData = {
  kpis: KpiBlock
  revenueByMethod: { method: string; value: number; fill: string }[]
  revenueByRegion: { name: string; revenue: number; fill: string }[]
  churchesByRegion: { name: string; count: number; fill: string }[]
  recentTransactions: {
    id: string
    name: string
    amount: number
    date: string
    status: TransactionStatus
    contributorId: string
    contributorRole: string
  }[]
  recentRegistrations: { id: string; name: string; type: string; date: string; avatar: string }[]
  newMembers: { month: string; count: number }[]
  defaulters: {
    id: string
    name: string
    type: 'pastor' | 'church'
    titheDay: number
    lastPayment: string | null
    daysLate: number
  }[]
}

export default function DashboardPage() {
  const [data, setData] = React.useState<DashboardData | null>(null)
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
  const [userName, setUserName] = React.useState<string>('')

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

  const refreshTransactions = React.useCallback(async () => {
    if (!data) return

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

      // Atualizar apenas as transações recentes
      setData((prev) =>
        prev
          ? {
              ...prev,
              recentTransactions: dashboardData.recentTransactions,
            }
          : dashboardData,
      )

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
  }, [toast, dateRange, data])

  // Carregar dados iniciais e quando dateRange mudar
  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  // Buscar dados do usuário apenas uma vez
  React.useEffect(() => {
    fetch('/api/v1/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.firstName) {
          setUserName(data.firstName)
        } else if (data.displayName) {
          setUserName(data.displayName)
        }
      })
      .catch(() => {
        // Silenciar erro, não é crítico
      })
  }, [])

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
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Falha ao enviar lembretes.')
      }
      toast({
        title: 'Lembretes enviados',
        description: `${data.sent} enviados, ${data.skipped} ignorados.`,
        variant: 'success',
      })
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
      const data = await res.json()
      if (!res.ok) {
        console.error('Insights API error:', res.status, data)
        throw new Error(data?.error || 'Falha ao gerar insights')
      }
      setInsightSummary(data.summary || '')
      setInsightCards(data.cards || [])
      toast({
        title: 'Insights gerados',
        description: 'Análise da IA concluída com sucesso.',
        variant: 'success',
      })
    } catch (e: unknown) {
      setInsightSummary('')
      setInsightCards([])
      const errorMessage = e instanceof Error ? e.message : 'Erro desconhecido'
      console.error('Insights generation failed:', e)

      // Mostrar erro mais detalhado
      if (errorMessage.includes('Chave OpenAI não configurada')) {
        toast({
          title: 'Configuração necessária',
          description: 'Configure a chave OpenAI nas configurações do sistema.',
          variant: 'destructive',
          action: (
            <Link href="/admin/configuracoes/openai">
              <Button variant="outline" size="sm">
                Configurar
              </Button>
            </Link>
          ),
        })
      } else {
        toast({
          title: 'Erro ao gerar insights',
          description: errorMessage,
          variant: 'destructive',
        })
      }
    } finally {
      setInsightLoading(false)
    }
  }, [dateRange, toast])

  const exportCsv = (rows: Array<Record<string, unknown>>, filename: string) => {
    try {
      if (!rows || rows.length === 0) return
      const headers = Object.keys(rows[0] as Record<string, unknown>)
      const csv = [
        headers.join(','),
        ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(',')),
      ].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (e) {
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível gerar o CSV.',
        variant: 'destructive',
      })
    }
  }

  const handleExportDefaulters = () => {
    if (!data || !data.defaulters?.length) return
    const rows = data.defaulters.map((d) => ({
      id: d.id,
      nome: d.name,
      tipo: d.type,
      dia_vencimento: d.titheDay,
      dias_atraso: d.daysLate,
      ultimo_pagamento: d.lastPayment || '',
    }))
    exportCsv(rows, `inadimplentes-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  const handleExportTransactions = () => {
    if (!data || !data.recentTransactions?.length) return
    const rows = data.recentTransactions.map((t) => ({
      id: t.id,
      contribuinte: t.name,
      valor: t.amount,
      status: t.status,
      data: t.date,
      role: t.contributorRole,
    }))
    exportCsv(rows, `transacoes-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  const kpiDisplayData = [
    { title: 'Arrecadação no Período', icon: DollarSign, data: data?.kpis.totalRevenue },
    { title: 'Total de Usuários', icon: Users, data: data?.kpis.totalMembers },
    { title: 'Total de Transações', icon: Activity, data: data?.kpis.totalTransactions },
    { title: 'Contas de Igreja (CNPJ)', icon: Building, data: data?.kpis.totalChurches },
  ]

  const secondaryKpis = [
    { title: 'Pastores', icon: User, data: data?.kpis.totalPastors },
    { title: 'Supervisores', icon: UserCog, data: data?.kpis.totalSupervisors },
    { title: 'Gerentes', icon: UserCheck, data: data?.kpis.totalManagers },
  ]

  // Dados para gráfico de halteres (prev vs current por mês)
  const dumbbellData = React.useMemo(() => {
    if (!data?.newMembers) return [] as Array<{ month: string; prev?: number; current: number }>
    if (data.newMembers.length < 2) {
      // fallback: mostra apenas pontos do mês atual
      return data.newMembers.map((m) => ({ month: m.month, current: m.count }))
    }
    const out: Array<{ month: string; prev: number; current: number }> = []
    const nm = data?.newMembers
    if (!nm) return out
    for (let i = 1; i < nm.length; i++) {
      const current = nm[i]
      const prev = nm[i - 1]
      if (current && prev) {
        out.push({ month: current.month, prev: prev.count, current: current.count })
      }
    }
    return out
  }, [data])

  return (
    <div className="flex flex-col gap-4 sm:gap-6 max-w-full overflow-x-hidden">
      {/* Header Moderno com Gradiente */}
      <DashboardHeader
        userName={userName}
        lastUpdatedAt={lastUpdatedAt}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        onRefresh={fetchData}
        onSendReminders={handleSendReminders}
        sending={sending}
      />

      {/* Insights IA no topo */}
      <InsightsCard
        insightSummary={insightSummary}
        insightCards={insightCards}
        insightLoading={insightLoading}
        onGenerateInsights={handleGenerateInsights}
      />

      {/* Container principal com padding responsivo */}
      <div className="space-y-4 sm:space-y-6">
        {/* KPIs principais (4 cards) */}
        <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
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

        {/* KPIs secundários - Tipos de usuários */}
        <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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

        {/* Progresso de Crescimento */}
        <Card className="shadow-lg border-l-4 border-l-videira-blue hover:shadow-xl transition-all">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-videira-blue flex-shrink-0" />
                  <span className="truncate">Progresso de Crescimento</span>
                </CardTitle>
                <CardDescription className="mt-1 text-sm">
                  Comparativo mês a mês (gráfico de pontos/halteres)
                </CardDescription>
              </div>
              {data ? (
                <Badge className="bg-videira-blue text-white shadow-md whitespace-nowrap">
                  {data.newMembers?.reduce((sum, m) => sum + m.count, 0) ?? 0} novos membros
                </Badge>
              ) : (
                <Skeleton className="h-6 w-32 rounded-full" />
              )}
            </div>
          </CardHeader>
          <CardContent className="overflow-hidden">
            {data ? (
              <div className="w-full overflow-x-auto">
                <ChartContainer config={{}} className="h-[280px] sm:h-[320px] min-w-[400px]">
                  <ComposedChart
                    data={dumbbellData}
                    margin={{ top: 5, right: 20, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-xs"
                    />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Line
                      type="linear"
                      dataKey="prev"
                      stroke="transparent"
                      dot={
                        dumbbellData.some((d) => 'prev' in d && d.prev !== undefined)
                          ? { r: 5, fill: '#94a3b8' }
                          : false
                      }
                    />
                    <Line
                      type="linear"
                      dataKey="current"
                      stroke="transparent"
                      dot={{ r: 5, fill: 'hsl(var(--primary))' }}
                    />
                  </ComposedChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="h-[280px] sm:h-[320px] w-full flex items-center justify-center">
                <div className="space-y-4 w-full">
                  <Skeleton className="h-4 w-32 mx-auto" />
                  <Skeleton className="h-48 sm:h-64 w-full" />
                  <Skeleton className="h-4 w-48 mx-auto" />
                </div>
              </div>
            )}
            {data && (!dumbbellData || dumbbellData.length === 0) && (
              <p className="text-xs text-muted-foreground mt-2">
                Sem dados suficientes para exibir o gráfico.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Ações rápidas */}
        <Card className="shadow-lg border-l-4 border-l-videira-cyan hover:shadow-xl transition-all">
          <CardHeader>
            <div>
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-videira-cyan flex-shrink-0" />
                <span className="truncate">Ações Rápidas</span>
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                Operações administrativas frequentes
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button
                onClick={handleSendReminders}
                disabled={sending}
                className="bg-videira-blue hover:bg-videira-blue/90 text-white shadow-md hover:shadow-lg transition-all font-semibold text-sm"
              >
                {sending ? 'Enviando...' : 'Enviar lembretes'}
              </Button>
              <Link href="/admin/configuracoes/mensagens">
                <Button className="bg-white dark:bg-background border-2 border-videira-purple text-videira-purple hover:bg-videira-purple hover:text-white transition-all shadow-sm hover:shadow-md font-semibold text-sm">
                  Configurar mensagens
                </Button>
              </Link>
              {data ? (
                <>
                  <Button
                    onClick={handleExportDefaulters}
                    className="bg-white dark:bg-background border-2 border-videira-cyan text-videira-cyan hover:bg-videira-cyan hover:text-white transition-all shadow-sm hover:shadow-md font-semibold text-sm"
                  >
                    <Save className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Exportar </span>Inadimplentes
                  </Button>
                  <Button
                    onClick={handleExportTransactions}
                    className="bg-white dark:bg-background border-2 border-videira-blue text-videira-blue hover:bg-videira-blue hover:text-white transition-all shadow-sm hover:shadow-md font-semibold text-sm"
                  >
                    <Save className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Exportar </span>Transações
                  </Button>
                </>
              ) : (
                <>
                  <Skeleton className="h-10 w-32 sm:w-44" />
                  <Skeleton className="h-10 w-28 sm:w-40" />
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Layout responsivo para inadimplentes e transações */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
          {/* Inadimplentes - 3 colunas no lg */}
          <div className="lg:col-span-3">
            <Card className="h-full shadow-lg border-t-4 border-t-destructive hover:shadow-xl transition-all bg-gradient-to-br from-destructive/5 to-background">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-destructive/15 ring-2 ring-destructive/30 flex-shrink-0">
                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                      </div>
                      <span className="truncate">Inadimplentes (3 meses)</span>
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm">
                      Pastores e igrejas que não contribuíram nos últimos 3 meses.
                    </CardDescription>
                  </div>
                  {data ? (
                    data.defaulters.length > 6 && (
                      <Link href="/admin/relatorios/inadimplentes">
                        <Button
                          size="sm"
                          className="bg-white dark:bg-background border-2 border-destructive text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm hover:shadow-md font-semibold whitespace-nowrap text-xs sm:text-sm"
                        >
                          Ver todos ({data.defaulters.length})
                          <ExternalLink className="h-3 w-3 ml-1 sm:ml-2" />
                        </Button>
                      </Link>
                    )
                  ) : (
                    <Skeleton className="h-8 w-20 sm:w-24" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!data ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <Skeleton className="h-4 w-32 mb-1" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          <Skeleton className="h-6 w-8 rounded-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : data.defaulters.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum inadimplente nos últimos 3 meses! 🎉
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      {data.defaulters.slice(0, 6).map((defaulter) => {
                        const profilePath = defaulter.type === 'pastor' ? 'pastores' : 'igrejas'
                        return (
                          <div
                            key={defaulter.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/admin/${profilePath}/${defaulter.id}`}
                                className="text-sm font-medium hover:underline text-primary flex items-center gap-1"
                              >
                                <span className="truncate">{defaulter.name}</span>
                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                              </Link>
                              <p className="text-xs text-muted-foreground">
                                {defaulter.type === 'pastor' ? 'Pastor' : 'Igreja'} • Dia{' '}
                                {defaulter.titheDay}
                              </p>
                            </div>
                            <Badge variant="destructive" className="ml-2 flex-shrink-0">
                              {defaulter.daysLate}d
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                    {data.defaulters.length > 6 && (
                      <div className="mt-4 pt-4 border-t">
                        <Link href="/admin/relatorios/inadimplentes">
                          <Button className="w-full bg-white dark:bg-background border-2 border-destructive text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm hover:shadow-md font-semibold text-sm">
                            Ver lista completa ({data.defaulters.length} inadimplentes)
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Últimas Transações - 2 colunas no lg */}
          <div className="lg:col-span-2">
            <TransactionsTable
              transactions={data?.recentTransactions || []}
              transactionsLoading={transactionsLoading}
              onRefresh={refreshTransactions}
              onExport={handleExportTransactions}
              hasData={!!data}
            />
          </div>
        </div>

        {/* Gráficos de arrecadação - Layout responsivo */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6">
          {/* Arrecadação por método - 2 colunas no xl */}
          <div className="xl:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Arrecadação por Método</CardTitle>
              </CardHeader>
              <CardContent className="overflow-hidden">
                {data ? (
                  <div className="w-full overflow-x-auto">
                    <ChartContainer className="h-[280px] sm:h-[300px] min-w-[280px]" config={{}}>
                      <PieChart>
                        <Tooltip content={<ChartTooltipContent nameKey="method" hideLabel />} />
                        <Legend content={<ChartLegendContent nameKey="method" />} />
                        <Pie
                          data={data.revenueByMethod}
                          dataKey="value"
                          nameKey="method"
                          innerRadius={60}
                        >
                          {data.revenueByMethod.map((entry) => (
                            <Cell key={entry.method} fill={entry.fill} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                  </div>
                ) : (
                  <div className="h-[280px] sm:h-[300px] w-full flex items-center justify-center">
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-32 mx-auto" />
                      <Skeleton className="h-40 sm:h-48 w-40 sm:w-48 rounded-full mx-auto" />
                      <div className="flex justify-center gap-4">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Distribuição por região - 3 colunas no xl */}
          <div className="xl:col-span-3">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Distribuição por Região</CardTitle>
                <CardDescription>Arrecadação e quantidade de igrejas por região</CardDescription>
              </CardHeader>
              <CardContent className="overflow-hidden">
                {data ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {data.revenueByRegion && data.revenueByRegion.length > 0 ? (
                      <div className="w-full overflow-x-auto">
                        <ChartContainer
                          config={{}}
                          className="h-[240px] sm:h-[260px] min-w-[240px]"
                        >
                          <PieChart>
                            <Tooltip content={<ChartTooltipContent hideLabel />} />
                            <Legend content={<ChartLegendContent nameKey="name" />} />
                            <Pie
                              data={data.revenueByRegion}
                              dataKey="revenue"
                              nameKey="name"
                              innerRadius={50}
                            >
                              {data.revenueByRegion.map((entry, index) => (
                                <Cell
                                  key={`cell-revenue-${index}`}
                                  fill={entry.fill || '#8884d8'}
                                />
                              ))}
                            </Pie>
                          </PieChart>
                        </ChartContainer>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[240px] sm:h-[260px] w-full border rounded-md text-sm text-muted-foreground">
                        Sem dados de arrecadação por região
                      </div>
                    )}
                    <div className="space-y-3 min-w-0">
                      <h4 className="text-sm font-medium">Regiões (lista)</h4>
                      <div className="divide-y max-h-[200px] sm:max-h-[220px] overflow-y-auto">
                        {(data.revenueByRegion || []).map((r) => (
                          <div
                            key={r.name}
                            className="flex items-center justify-between py-2 gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span
                                className="h-3 w-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: r.fill || '#8884d8' }}
                              />
                              <span className="text-sm truncate">{r.name}</span>
                            </div>
                            <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(r.revenue || 0)}
                            </span>
                          </div>
                        ))}
                        {(!data.revenueByRegion || data.revenueByRegion.length === 0) && (
                          <div className="py-2 text-sm text-muted-foreground">
                            Nenhuma região encontrada
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="h-[240px] sm:h-[260px] w-full flex items-center justify-center">
                      <div className="space-y-4">
                        <Skeleton className="h-4 w-24 mx-auto" />
                        <Skeleton className="h-32 sm:h-40 w-32 sm:w-40 rounded-full mx-auto" />
                        <div className="flex justify-center gap-2">
                          <Skeleton className="h-3 w-12" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-24" />
                      <div className="divide-y space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-3 w-3 rounded-full" />
                              <Skeleton className="h-3 w-20" />
                            </div>
                            <Skeleton className="h-3 w-16" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
