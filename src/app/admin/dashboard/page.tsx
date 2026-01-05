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
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Save,
  Sparkles,
  TrendingUp,
  LayoutDashboard,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { type TransactionStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

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
  const [isLoading, setIsLoading] = React.useState(true)
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
    setIsLoading(true)
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
    } finally {
      setIsLoading(false)
    }
  }, [toast, dateRange])

  // Carregar dados iniciais apenas uma vez
  React.useEffect(() => {
    fetchData()

    // Buscar dados do usuário
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
  }, []) // Removido fetchData da dependência

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
      if (!res.ok) throw new Error(data?.error || 'Falha ao gerar insights')
      setInsightSummary(data.summary || '')
      setInsightCards(data.cards || [])
    } catch (e: unknown) {
      setInsightSummary('')
      setInsightCards([])
      toast({
        title: 'Erro',
        description: e instanceof Error ? e.message : 'Erro desconhecido',
        variant: 'destructive',
      })
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

  const kpiDisplayData = data
    ? [
        { title: 'Arrecadação no Mês', ...data.kpis.totalRevenue, icon: DollarSign },
        { title: 'Total de Membros', ...data.kpis.totalMembers, icon: Users },
        { title: 'Total de Transações', ...data.kpis.totalTransactions, icon: Activity },
        { title: 'Total de Igrejas', ...data.kpis.totalChurches, icon: Building },
        { title: 'Total de Pastores', ...data.kpis.totalPastors, icon: User },
        { title: 'Total de Supervisores', ...data.kpis.totalSupervisors, icon: UserCog },
        { title: 'Total de Gerentes', ...data.kpis.totalManagers, icon: UserCheck },
      ]
    : []

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

  const statusMap: {
    [key in TransactionStatus]: {
      text: string
      variant: 'success' | 'warning' | 'destructive' | 'outline'
    }
  } = {
    approved: { text: 'Aprovada', variant: 'success' },
    pending: { text: 'Pendente', variant: 'warning' },
    refused: { text: 'Recusada', variant: 'destructive' },
    refunded: { text: 'Reembolsada', variant: 'outline' },
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-64" />
        </div>

        {/* KPIs principais */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-28 mb-2" />
                <Skeleton className="h-3 w-36" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Gráfico de progresso */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>

        {/* KPIs secundários */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Inadimplentes e Cadastros */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transações e Gráficos */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[400px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-56 mb-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>

        {/* Regiões */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-80" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Skeleton className="h-[300px] w-full" />
              <Skeleton className="h-[300px] w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Moderno com Gradiente */}
      <div className="relative overflow-hidden rounded-2xl p-8 mb-2">
        {/* Fundo com gradiente */}
        <div className="absolute inset-0 videira-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />

        {/* Efeitos decorativos */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            {userName && (
              <p className="text-lg text-white/80 mb-2 font-medium">
                Olá, <span className="text-white font-bold">{userName}</span> 👋
              </p>
            )}
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-3">
              <LayoutDashboard className="h-8 w-8" />
              Dashboard
            </h1>
            <p className="text-base text-white/90 mt-2 font-medium">
              Visão geral do sistema e estatísticas em tempo real
            </p>
            {lastUpdatedAt && (
              <p className="text-sm text-white/70 mt-1">Atualizado em {lastUpdatedAt}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <DateRangePicker 
              value={{ from: dateRange.from, to: dateRange.to }}
              onDateRangeChange={handleDateRangeChange} 
            />
            <Button
              variant="secondary"
              size="icon"
              onClick={fetchData}
              title="Atualizar"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 shadow-lg"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleSendReminders}
              disabled={sending}
              className="bg-white text-videira-blue hover:bg-white/90 shadow-lg font-semibold"
            >
              {sending ? 'Enviando...' : 'Enviar lembretes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Insights IA no topo - Estilo Premium */}
      <Card className="relative overflow-hidden border-2 border-videira-purple/20 shadow-lg hover:shadow-2xl transition-all duration-300">
        {/* Fundo decorativo com gradiente */}
        <div className="absolute inset-0 bg-gradient-to-br from-videira-purple/5 via-videira-blue/5 to-videira-cyan/5 pointer-events-none" />
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-videira-purple/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-videira-cyan/10 blur-3xl pointer-events-none" />

        <CardHeader className="flex flex-row items-center justify-between relative z-10">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-lg bg-videira-purple/15 ring-2 ring-videira-purple/30">
                <Sparkles className="h-5 w-5 text-videira-purple" />
              </div>
              <span className="videira-gradient-text">Insights IA</span>
            </CardTitle>
            <CardDescription className="mt-1">
              Resumo do momento atual e recomendações automáticas.
            </CardDescription>
          </div>
          <Button
            onClick={handleGenerateInsights}
            disabled={insightLoading}
            className="videira-gradient hover:opacity-90 text-white shadow-lg"
          >
            {insightLoading ? 'Gerando...' : 'Gerar insights'}
          </Button>
        </CardHeader>
        <CardContent className="relative z-10">
          {insightSummary || insightCards.length > 0 ? (
            <div className="space-y-4">
              {insightSummary && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-sm leading-relaxed">{insightSummary}</p>
                </div>
              )}
              {insightCards.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {insightCards.map((card, idx) => {
                    const typeColors = {
                      success: {
                        bg: 'bg-green-500/10',
                        border: 'border-green-500/30',
                        text: 'text-green-700 dark:text-green-400',
                        icon: 'bg-green-500/20',
                      },
                      warning: {
                        bg: 'bg-yellow-500/10',
                        border: 'border-yellow-500/30',
                        text: 'text-yellow-700 dark:text-yellow-400',
                        icon: 'bg-yellow-500/20',
                      },
                      danger: {
                        bg: 'bg-red-500/10',
                        border: 'border-red-500/30',
                        text: 'text-red-700 dark:text-red-400',
                        icon: 'bg-red-500/20',
                      },
                      info: {
                        bg: 'bg-blue-500/10',
                        border: 'border-blue-500/30',
                        text: 'text-blue-700 dark:text-blue-400',
                        icon: 'bg-blue-500/20',
                      },
                    }
                    const colors =
                      typeColors[card.type as keyof typeof typeColors] || typeColors.info
                    return (
                      <div
                        key={idx}
                        className={cn(
                          'p-4 rounded-lg border-2 transition-all hover:shadow-lg',
                          colors.bg,
                          colors.border,
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn('p-2 rounded-lg', colors.icon)}>
                            <Sparkles className={cn('h-4 w-4', colors.text)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={cn('font-semibold text-sm mb-1', colors.text)}>
                              {card.title}
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {card.description}
                            </p>
                            {card.metric && (
                              <p className={cn('text-lg font-bold mt-2', colors.text)}>
                                {card.metric}
                              </p>
                            )}
                            {card.text && (
                              <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                                {card.text}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Clique em &ldquo;Gerar insights&rdquo; para ver o resumo da IA.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Grid principal em 12 colunas para melhor alinhamento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* KPIs principais (4 cards) - Estilo Videira */}
        <div className="lg:col-span-12">
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            {kpiDisplayData.slice(0, 4).map((kpi, index) => (
              <Card
                key={kpi.title}
                className={cn(
                  'hover:shadow-2xl transition-all duration-300 h-full hover:scale-[1.05] relative overflow-hidden group',
                  'border-t-4',
                  index === 0 &&
                    'border-t-videira-cyan bg-gradient-to-br from-videira-cyan/5 via-background to-background',
                  index === 1 &&
                    'border-t-videira-blue bg-gradient-to-br from-videira-blue/5 via-background to-background',
                  index === 2 &&
                    'border-t-videira-purple bg-gradient-to-br from-videira-purple/5 via-background to-background',
                  index === 3 &&
                    'border-t-orange-500 bg-gradient-to-br from-orange-500/5 via-background to-background',
                )}
              >
                {/* Efeito de brilho no hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {kpi.title}
                  </CardTitle>
                  <div
                    className={cn(
                      'p-3 rounded-xl shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6',
                      index === 0 && 'bg-videira-cyan/15 ring-2 ring-videira-cyan/30',
                      index === 1 && 'bg-videira-blue/15 ring-2 ring-videira-blue/30',
                      index === 2 && 'bg-videira-purple/15 ring-2 ring-videira-purple/30',
                      index === 3 && 'bg-orange-500/15 ring-2 ring-orange-500/30',
                    )}
                  >
                    <kpi.icon
                      className={cn(
                        'h-5 w-5',
                        index === 0 && 'text-videira-cyan',
                        index === 1 && 'text-videira-blue',
                        index === 2 && 'text-videira-purple',
                        index === 3 && 'text-orange-600 dark:text-orange-400',
                      )}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className={cn(
                      'text-3xl font-bold mb-2 tracking-tight',
                      index === 0 && 'text-videira-cyan',
                      index === 1 && 'text-videira-blue',
                      index === 2 && 'text-videira-purple',
                      index === 3 && 'text-orange-600 dark:text-orange-400',
                    )}
                  >
                    {kpi.value}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">{kpi.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Progresso de Crescimento (full width) */}
        <div className="lg:col-span-12">
          <Card className="h-full shadow-lg border-l-4 border-l-videira-blue hover:shadow-xl transition-all">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-videira-blue" />
                    Progresso de Crescimento
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Comparativo mês a mês (gráfico de pontos/halteres)
                  </CardDescription>
                </div>
                <Badge className="bg-videira-blue text-white shadow-md">
                  {data?.newMembers?.reduce((sum, m) => sum + m.count, 0) ?? 0} novos membros
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[320px] w-full">
                <ComposedChart
                  data={dumbbellData}
                  margin={{ top: 5, right: 20, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-xs"
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
                  <Tooltip content={<ChartTooltipContent />} />
                  {/* Fallback: quando só existe current */}
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
              {(!dumbbellData || dumbbellData.length === 0) && (
                <p className="text-xs text-muted-foreground mt-2">
                  Sem dados suficientes para exibir o gráfico.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Ações rápidas - Estilo Moderno */}
        <div className="lg:col-span-12">
          <Card className="shadow-lg border-l-4 border-l-videira-cyan hover:shadow-xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-videira-cyan" />
                  Ações Rápidas
                </CardTitle>
                <CardDescription className="mt-1">
                  Operações administrativas frequentes
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleSendReminders}
                  disabled={sending}
                  className="bg-videira-blue hover:bg-videira-blue/90 text-white shadow-md hover:shadow-lg transition-all font-semibold"
                >
                  {sending ? 'Enviando...' : 'Enviar lembretes (e-mail)'}
                </Button>
                <Link href="/admin/configuracoes/mensagens">
                  <Button className="bg-white dark:bg-background border-2 border-videira-purple text-videira-purple hover:bg-videira-purple hover:text-white transition-all shadow-sm hover:shadow-md font-semibold">
                    Configurar mensagens
                  </Button>
                </Link>
                <Button
                  onClick={handleExportDefaulters}
                  className="bg-white dark:bg-background border-2 border-videira-cyan text-videira-cyan hover:bg-videira-cyan hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
                >
                  <Save className="h-4 w-4 mr-2" /> Exportar inadimplentes
                </Button>
                <Button
                  onClick={handleExportTransactions}
                  className="bg-white dark:bg-background border-2 border-videira-blue text-videira-blue hover:bg-videira-blue hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
                >
                  <Save className="h-4 w-4 mr-2" /> Exportar transações
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inadimplentes (8 col) + Últimas transações (4 col) */}
        <div className="lg:col-span-8">
          <Card className="h-full shadow-lg border-t-4 border-t-destructive hover:shadow-xl transition-all bg-gradient-to-br from-destructive/5 to-background">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-2 rounded-lg bg-destructive/15 ring-2 ring-destructive/30">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    Inadimplentes (3 meses)
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Pastores e igrejas que não contribuíram nos últimos 3 meses.
                  </CardDescription>
                </div>
                {data.defaulters.length > 6 && (
                  <Link href="/admin/relatorios/inadimplentes">
                    <Button
                      size="sm"
                      className="bg-white dark:bg-background border-2 border-destructive text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
                    >
                      Ver todos ({data.defaulters.length})
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {data.defaulters.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum inadimplente nos últimos 3 meses! 🎉
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.defaulters.slice(0, 6).map((defaulter) => {
                      const profilePath = defaulter.type === 'pastor' ? 'pastores' : 'igrejas'
                      return (
                        <div
                          key={defaulter.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <Link
                              href={`/admin/${profilePath}/${defaulter.id}`}
                              className="text-sm font-medium hover:underline text-primary flex items-center gap-1"
                            >
                              {defaulter.name}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {defaulter.type === 'pastor' ? 'Pastor' : 'Igreja'} • Dia{' '}
                              {defaulter.titheDay}
                            </p>
                          </div>
                          <Badge variant="destructive" className="ml-2">
                            {defaulter.daysLate}d
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                  {data.defaulters.length > 6 && (
                    <div className="mt-4 pt-4 border-t">
                      <Link href="/admin/relatorios/inadimplentes">
                        <Button className="w-full bg-white dark:bg-background border-2 border-destructive text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm hover:shadow-md font-semibold">
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

        <div className="lg:col-span-4">
          <Card className="h-full shadow-lg border-t-4 border-t-videira-purple hover:shadow-xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Activity className="h-5 w-5 text-videira-purple" />
                  Últimas Transações
                </CardTitle>
                <CardDescription className="mt-1">As 10 transações mais recentes.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  className="h-8 w-8 bg-white dark:bg-background border-2 border-videira-purple text-videira-purple hover:bg-videira-purple hover:text-white transition-all shadow-sm hover:shadow-md"
                  onClick={fetchData}
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="sr-only">Atualizar</span>
                </Button>
                <Button
                  size="sm"
                  onClick={handleExportTransactions}
                  className="bg-white dark:bg-background border-2 border-videira-purple text-videira-purple hover:bg-videira-purple hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
                >
                  <Save className="h-4 w-4 mr-1" /> CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contribuinte</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentTransactions.map((transaction) => {
                    const roleMap: Record<string, string> = {
                      manager: 'gerentes',
                      supervisor: 'supervisores',
                      pastor: 'pastores',
                      church_account: 'igrejas',
                    }
                    const profilePath = roleMap[transaction.contributorRole]
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {profilePath ? (
                            <Link
                              href={`/admin/${profilePath}/${transaction.contributorId}`}
                              className="flex items-center gap-1 hover:underline text-primary"
                            >
                              {transaction.name}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : (
                            transaction.name
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(transaction.amount)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant={statusMap[transaction.status]?.variant || 'default'}>
                            {statusMap[transaction.status]?.text || transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {transaction.date}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Arrecadação por método (4 col) + Regiões (8 col) */}
        <div className="lg:col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Arrecadação por Método de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-[300px] w-full" config={{}}>
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
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Distribuição por Região</CardTitle>
              <CardDescription>Arrecadação e quantidade de igrejas por região</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {data.revenueByRegion && data.revenueByRegion.length > 0 ? (
                  <ChartContainer config={{}} className="h-[260px] w-full">
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
                          <Cell key={`cell-revenue-${index}`} fill={entry.fill || '#8884d8'} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center h-[260px] w-full border rounded-md text-sm text-muted-foreground">
                    Sem dados de arrecadação por região
                  </div>
                )}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Regiões (lista)</h4>
                  <div className="divide-y">
                    {(data.revenueByRegion || []).map((r) => (
                      <div key={r.name} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: r.fill || '#8884d8' }}
                          />
                          <span className="text-sm">{r.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
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
            </CardContent>
          </Card>
        </div>

        {/* Insights IA removido daqui e movido para o topo */}
      </div>
    </div>
  )
}
