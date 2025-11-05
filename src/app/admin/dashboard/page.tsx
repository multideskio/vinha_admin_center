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
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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
  defaulters: { id: string; name: string; type: 'pastor' | 'church'; titheDay: number; lastPayment: string | null; daysLate: number }[]
}

export default function DashboardPage() {
  const [data, setData] = React.useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [dateRange, setDateRange] = React.useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const { toast } = useToast()
  const [sending, setSending] = React.useState(false)
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState<string | null>(null)
  const [insightLoading, setInsightLoading] = React.useState(false)
  const [insightText, setInsightText] = React.useState('')

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

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDateRangeChange = React.useCallback((range: { from: Date | undefined; to: Date | undefined }) => {
    setDateRange(range)
  }, [])

  const handleSendReminders = React.useCallback(async () => {
    setSending(true)
    try {
      const response = await fetch('/api/v1/admin/send-reminders', { method: 'POST' })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Falha ao enviar lembretes.')
      }
      toast({ title: 'Lembretes enviados', description: `${data.sent} enviados, ${data.skipped} ignorados.`, variant: 'success' })
    } catch (e: unknown) {
      toast({ title: 'Erro', description: e instanceof Error ? e.message : 'Erro desconhecido', variant: 'destructive' })
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
      setInsightText(data.insight || '')
    } catch (e: unknown) {
      setInsightText('')
      toast({ title: 'Erro', description: e instanceof Error ? e.message : 'Erro desconhecido', variant: 'destructive' })
    } finally {
      setInsightLoading(false)
    }
  }, [dateRange, toast])

  const exportCsv = (rows: Array<Record<string, any>>, filename: string) => {
    try {
      if (!rows || rows.length === 0) return
      const headers = Object.keys(rows[0] as Record<string, any>)
      const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n')
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
      toast({ title: 'Erro ao exportar', description: 'Não foi possível gerar o CSV.', variant: 'destructive' })
    }
  }

  const handleExportDefaulters = () => {
    if (!data || !data.defaulters?.length) return
    const rows = data.defaulters.map(d => ({
      id: d.id,
      nome: d.name,
      tipo: d.type,
      dia_vencimento: d.titheDay,
      dias_atraso: d.daysLate,
      ultimo_pagamento: d.lastPayment || '',
    }))
    exportCsv(rows, `inadimplentes-${new Date().toISOString().slice(0,10)}.csv`)
  }

  const handleExportTransactions = () => {
    if (!data || !data.recentTransactions?.length) return
    const rows = data.recentTransactions.map(t => ({
      id: t.id,
      contribuinte: t.name,
      valor: t.amount,
      status: t.status,
      data: t.date,
      role: t.contributorRole,
    }))
    exportCsv(rows, `transacoes-${new Date().toISOString().slice(0,10)}.csv`)
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
      return data.newMembers.map(m => ({ month: m.month, current: m.count }))
    }
    const out: Array<{ month: string; prev: number; current: number }> = []
    const nm = data!.newMembers
    for (let i = 1; i < nm.length; i++) {
      out.push({ month: nm[i]!.month, prev: nm[i - 1]!.count, current: nm[i]!.count })
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
      {/* Header e ações */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão geral do sistema e estatísticas em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker onDateRangeChange={handleDateRangeChange} />
          <Button variant="outline" size="icon" onClick={fetchData} title="Atualizar">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleSendReminders} disabled={sending} title="Enviar lembretes por e-mail">
            {sending ? 'Enviando...' : 'Enviar lembretes'}
          </Button>
        </div>
      </div>

      {/* Insights IA no topo */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Insights IA</CardTitle>
            <CardDescription>Resumo do momento atual e recomendações automáticas.</CardDescription>
          </div>
          <Button onClick={handleGenerateInsights} disabled={insightLoading}>
            {insightLoading ? 'Gerando...' : 'Gerar insights'}
          </Button>
        </CardHeader>
        <CardContent>
          {insightText ? (
            <div className="prose prose-sm dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{insightText}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Clique em “Gerar insights” para ver o resumo da IA.</p>
          )}
        </CardContent>
      </Card>

      {/* Grid principal em 12 colunas para melhor alinhamento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* KPIs principais (4 cards) */}
        <div className="lg:col-span-12">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            {kpiDisplayData.slice(0, 4).map((kpi, index) => (
              <Card key={kpi.title} className="hover:shadow-md transition-shadow h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
                  <div className={cn(
                    "p-2 rounded-lg",
                    index === 0 && "bg-green-100 dark:bg-green-900/20",
                    index === 1 && "bg-blue-100 dark:bg-blue-900/20",
                    index === 2 && "bg-purple-100 dark:bg-purple-900/20",
                    index === 3 && "bg-orange-100 dark:bg-orange-900/20"
                  )}>
                    <kpi.icon className={cn(
                      "h-4 w-4",
                      index === 0 && "text-green-600 dark:text-green-400",
                      index === 1 && "text-blue-600 dark:text-blue-400",
                      index === 2 && "text-purple-600 dark:text-purple-400",
                      index === 3 && "text-orange-600 dark:text-orange-400"
                    )} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{kpi.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Progresso de Crescimento (full width) */}
        <div className="lg:col-span-12">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Progresso de Crescimento</CardTitle>
                  <CardDescription>Comparativo mês a mês (gráfico de pontos/halteres)</CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  {(data?.newMembers?.reduce((sum, m) => sum + m.count, 0) ?? 0)} novos membros
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[320px] w-full">
                <ComposedChart data={dumbbellData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
                  <Tooltip content={<ChartTooltipContent />} />
                  {/* Fallback: quando só existe current */}
                  <Line type="linear" dataKey="prev" stroke="transparent" dot={dumbbellData.some(d => (d as any).prev !== undefined) ? { r: 5, fill: '#94a3b8' } : false} />
                  <Line type="linear" dataKey="current" stroke="transparent" dot={{ r: 5, fill: 'hsl(var(--primary))' }} />
                </ComposedChart>
              </ChartContainer>
              {(!dumbbellData || dumbbellData.length === 0) && (
                <p className="text-xs text-muted-foreground mt-2">Sem dados suficientes para exibir o gráfico.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Ações rápidas */}
        <div className="lg:col-span-12">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Ações rápidas</CardTitle>
                <CardDescription>Operações administrativas frequentes</CardDescription>
              </div>
              {lastUpdatedAt && (
                <span className="text-xs text-muted-foreground">Atualizado: {lastUpdatedAt}</span>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSendReminders} disabled={sending}>
                  {sending ? 'Enviando...' : 'Enviar lembretes (e-mail)'}
                </Button>
                <Link href="/admin/configuracoes/mensagens">
                  <Button variant="outline">Configurar mensagens</Button>
                </Link>
                <Button variant="outline" onClick={handleExportDefaulters}>
                  <Save className="h-4 w-4 mr-2" /> Exportar inadimplentes (CSV)
                </Button>
                <Button variant="outline" onClick={handleExportTransactions}>
                  <Save className="h-4 w-4 mr-2" /> Exportar transações (CSV)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inadimplentes (8 col) + Últimas transações (4 col) */}
        <div className="lg:col-span-8">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Inadimplentes do Mês
              </CardTitle>
              <CardDescription>Pastores e igrejas que não dizimaram após o dia definido.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.defaulters.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum inadimplente este mês! 🎉</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.defaulters.slice(0, 10).map((defaulter) => {
                    const profilePath = defaulter.type === 'pastor' ? 'pastores' : 'igrejas'
                    return (
                      <div key={defaulter.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <Link href={`/admin/${profilePath}/${defaulter.id}`} className="text-sm font-medium hover:underline text-primary flex items-center gap-1">
                            {defaulter.name}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {defaulter.type === 'pastor' ? 'Pastor' : 'Igreja'} • Dia {defaulter.titheDay}
                          </p>
                        </div>
                        <Badge variant="destructive" className="ml-2">{defaulter.daysLate}d</Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Últimas Transações</CardTitle>
                <CardDescription>As 10 transações mais recentes.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={fetchData}>
                  <RefreshCw className="h-4 w-4" />
                  <span className="sr-only">Atualizar</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportTransactions}>
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
                            <Link href={`/admin/${profilePath}/${transaction.contributorId}`} className="flex items-center gap-1 hover:underline text-primary">
                              {transaction.name}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : (
                            transaction.name
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant={statusMap[transaction.status]?.variant || 'default'}>
                            {statusMap[transaction.status]?.text || transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{transaction.date}</TableCell>
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
                  <Pie data={data.revenueByMethod} dataKey="value" nameKey="method" innerRadius={60}>
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
                      <Pie data={data.revenueByRegion} dataKey="revenue" nameKey="name" innerRadius={50}>
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
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: r.fill || '#8884d8' }} />
                          <span className="text-sm">{r.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.revenue || 0)}
                        </span>
                      </div>
                    ))}
                    {(!data.revenueByRegion || data.revenueByRegion.length === 0) && (
                      <div className="py-2 text-sm text-muted-foreground">Nenhuma região encontrada</div>
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
