/**
 * @fileoverview Página do dashboard do supervisor.
 * @version 1.3
 * @date 2025-01-06
 * @author Sistema de Padronização
 * @lastReview 2025-01-06 16:50
 */

'use client'

import * as React from 'react'
import { DollarSign, Users, Church, User, RefreshCw, ArrowRightLeft, Search } from 'lucide-react'
import {
  Bar,
  BarChart,
  Tooltip,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
  Legend,
  CartesianGrid,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { type TransactionStatus } from '@/lib/types'
import { DateRange } from 'react-day-picker'

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
}

type DashboardData = {
  kpis: KpiBlock
  revenueByMethod: { method: string; value: number; fill: string }[]
  revenueByChurch: { name: string; revenue: number; fill: string }[]
  membersByChurch: { name: string; count: number; fill: string }[]
  recentTransactions: {
    id: string
    name: string
    amount: number
    date: string
    status: TransactionStatus
  }[]
  recentRegistrations: { id: string; name: string; type: string; date: string; avatar: string }[]
  newMembers: { month: string; count: number }[]
}

export default function SupervisorDashboardPage(): JSX.Element {
  const [data, setData] = React.useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>()
  const { toast } = useToast()

  const fetchData = React.useCallback(
    async (startDate?: Date, endDate?: Date) => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (startDate) params.append('startDate', startDate.toISOString())
        if (endDate) params.append('endDate', endDate.toISOString())

        const url = `/api/v1/supervisor/dashboard${params.toString() ? `?${params.toString()}` : ''}`
        const response = await fetch(url)

        if (response.status === 401) {
          // Usuário não autenticado, redirecionar para login
          window.location.href = '/auth/login'
          return
        }
        if (!response.ok) {
          throw new Error('Falha ao carregar os dados do dashboard.')
        }
        const dashboardData: DashboardData = await response.json()
        setData(dashboardData)
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
    },
    [toast],
  )

  const handleSearch = React.useCallback(() => {
    if (dateRange?.from && dateRange?.to) {
      fetchData(dateRange.from, dateRange.to)
    } else if (dateRange?.from) {
      // Se só tem data inicial, usa ela como início e hoje como fim
      fetchData(dateRange.from, new Date())
    } else {
      fetchData() // Busca sem filtro se não há range
    }
  }, [dateRange, fetchData])

  // Carregar dados iniciais apenas uma vez
  React.useEffect(() => {
    fetchData()
  }, []) // Removido fetchData da dependência

  const kpiDisplayData = data
    ? [
        { title: 'Arrecadação da Supervisão', ...data.kpis.totalRevenue, icon: DollarSign },
        { title: 'Membros na Supervisão', ...data.kpis.totalMembers, icon: Users },
        { title: 'Transações na Supervisão', ...data.kpis.totalTransactions, icon: ArrowRightLeft },
        { title: 'Igrejas na Supervisão', ...data.kpis.totalChurches, icon: Church },
        { title: 'Pastores na Supervisão', ...data.kpis.totalPastors, icon: User },
      ]
    : []

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          {/* Melhorado para xl:grid-cols-2 */}
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

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

  return (
    <div className="flex flex-col gap-6">
      {/* Header com gradiente Videira */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 videira-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

        <div className="relative z-10 p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-lg">
                Dashboard do Supervisor
              </h1>
              <p className="text-base text-white/90 mt-2 font-medium">
                {dateRange?.from
                  ? `${dateRange.from.toLocaleDateString('pt-BR')} ${dateRange.to ? `- ${dateRange.to.toLocaleDateString('pt-BR')}` : ''}`
                  : 'Visão geral da sua supervisão'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              <Button
                onClick={handleSearch}
                className="bg-white text-videira-blue hover:bg-white/90 shadow-lg font-semibold"
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-5">
        {/* Melhorado para melhor responsividade */}
        {kpiDisplayData.map((kpi, index) => {
          const colorClasses = [
            {
              card: 'shadow-lg border-l-4 border-l-videira-cyan hover:shadow-xl transition-all bg-gradient-to-br from-videira-cyan/5 to-transparent',
              icon: 'p-2 rounded-lg bg-videira-cyan/15 ring-2 ring-videira-cyan/30',
              iconColor: 'h-4 w-4 text-videira-cyan',
            },
            {
              card: 'shadow-lg border-l-4 border-l-videira-blue hover:shadow-xl transition-all bg-gradient-to-br from-videira-blue/5 to-transparent',
              icon: 'p-2 rounded-lg bg-videira-blue/15 ring-2 ring-videira-blue/30',
              iconColor: 'h-4 w-4 text-videira-blue',
            },
            {
              card: 'shadow-lg border-l-4 border-l-videira-purple hover:shadow-xl transition-all bg-gradient-to-br from-videira-purple/5 to-transparent',
              icon: 'p-2 rounded-lg bg-videira-purple/15 ring-2 ring-videira-purple/30',
              iconColor: 'h-4 w-4 text-videira-purple',
            },
            {
              card: 'shadow-lg border-l-4 border-l-green-500 hover:shadow-xl transition-all bg-gradient-to-br from-green-500/5 to-transparent',
              icon: 'p-2 rounded-lg bg-green-500/15 ring-2 ring-green-500/30',
              iconColor: 'h-4 w-4 text-green-500',
            },
            {
              card: 'shadow-lg border-l-4 border-l-blue-500 hover:shadow-xl transition-all bg-gradient-to-br from-blue-500/5 to-transparent',
              icon: 'p-2 rounded-lg bg-blue-500/15 ring-2 ring-blue-500/30',
              iconColor: 'h-4 w-4 text-blue-500',
            },
          ] as const
          const classes = colorClasses[index % colorClasses.length] ?? colorClasses[0]
          return (
            <Card key={kpi.title} className={classes.card}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold">{kpi.title}</CardTitle>
                <div className={classes.icon}>
                  <kpi.icon className={classes.iconColor} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{kpi.change}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="shadow-lg border-t-4 border-t-videira-cyan">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-videira-cyan" />
                Últimas Transações
              </CardTitle>
              <CardDescription>As transações mais recentes da sua supervisão</CardDescription>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-2 hover:border-videira-cyan"
              onClick={() => fetchData(dateRange?.from, dateRange?.to)}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="sr-only">Atualizar</span>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border-2">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-videira-cyan/10 via-videira-blue/10 to-videira-purple/10">
                    <TableHead className="font-semibold">Contribuinte</TableHead>
                    <TableHead className="text-right font-semibold">Valor</TableHead>
                    <TableHead className="hidden sm:table-cell font-semibold">Data</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentTransactions.length > 0 ? (
                    data.recentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.name}</TableCell>
                        <TableCell className="text-right font-medium">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(transaction.amount)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {transaction.date}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={statusMap[transaction.status]?.variant || 'default'}>
                            {statusMap[transaction.status]?.text || transaction.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhuma transação encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-t-4 border-t-videira-blue">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-videira-blue" />
              Cadastros Recentes
            </CardTitle>
            <CardDescription>Os últimos usuários cadastrados na sua supervisão</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {data.recentRegistrations.length > 0 ? (
                data.recentRegistrations.map((user) => (
                  <div key={user.id} className="flex items-center">
                    <Avatar className="h-10 w-10 ring-2 ring-videira-blue/30">
                      <AvatarImage
                        src={`https://placehold.co/40x40.png`}
                        alt="Avatar"
                        data-ai-hint="person symbol"
                      />
                      <AvatarFallback className="bg-videira-blue/10 text-videira-blue font-bold">
                        {user.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-semibold leading-none">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.type}</p>
                    </div>
                    <div className="ml-auto font-medium text-muted-foreground text-xs">
                      {user.date}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum cadastro recente encontrado
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Melhorado para xl:grid-cols-2 */}
        <Card className="shadow-lg border-t-4 border-t-videira-purple">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-videira-purple" />
              Arrecadação por Método de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.revenueByMethod.length > 0 ? (
              <ChartContainer
                config={{
                  value: { label: 'Valor' },
                  pix: { label: 'Pix', color: '#10b981' },
                  credit_card: { label: 'Crédito', color: '#3b82f6' },
                  boleto: { label: 'Boleto', color: '#f59e0b' },
                }}
                className="h-[300px] w-full"
              >
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
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado de arrecadação disponível
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-lg border-t-4 border-t-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Church className="h-5 w-5 text-green-500" />
              Arrecadação por Igreja
            </CardTitle>
            <CardDescription>
              Distribuição da arrecadação mensal entre as igrejas da sua supervisão
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.revenueByChurch.length > 0 ? (
              <ChartContainer config={{}} className="h-[300px] w-full">
                <PieChart>
                  <Tooltip content={<ChartTooltipContent hideLabel />} />
                  <Legend content={<ChartLegendContent nameKey="name" />} />
                  <Pie
                    data={data.revenueByChurch}
                    dataKey="revenue"
                    nameKey="name"
                    innerRadius={60}
                  >
                    {data.revenueByChurch.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhuma igreja com arrecadação
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-lg border-t-4 border-t-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Membros por Igreja
            </CardTitle>
            <CardDescription>
              Distribuição de membros entre as igrejas da sua supervisão
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.membersByChurch.length > 0 ? (
              <ChartContainer config={{}} className="h-[300px] w-full">
                <PieChart>
                  <Tooltip content={<ChartTooltipContent hideLabel />} />
                  <Legend content={<ChartLegendContent nameKey="name" />} />
                  <Pie data={data.membersByChurch} dataKey="count" nameKey="name" innerRadius={60}>
                    {data.membersByChurch.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhuma igreja cadastrada
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-lg border-t-4 border-t-videira-cyan">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-videira-cyan" />
              Novos Membros por Mês (Supervisão)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.newMembers.length > 0 ? (
              <ChartContainer config={{}} className="h-[300px] w-full">
                <BarChart
                  data={data.newMembers}
                  margin={{ top: 5, right: 20, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado de novos membros
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
