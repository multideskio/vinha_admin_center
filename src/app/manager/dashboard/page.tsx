'use client'

import * as React from 'react'
import { DollarSign, Users, Church, UserCog, User, RefreshCw, ArrowRightLeft } from 'lucide-react'
import { sanitizeText } from '@/lib/sanitize'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
  Legend,
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

export default function GerenteDashboardPage() {
  const [data, setData] = React.useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [profileIncomplete, setProfileIncomplete] = React.useState(false)
  const [dateRange, setDateRange] = React.useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const { toast } = useToast()

  const handleDateRangeChange = React.useCallback(
    (range: { from: Date | undefined; to: Date | undefined }) => {
      setDateRange(range)
    },
    [],
  )

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      // Build URL with date parameters if dateRange is set
      let url = '/api/v1/manager/dashboard'
      const params = new URLSearchParams()

      if (dateRange.from) {
        params.append('from', dateRange.from.toISOString())
      }
      if (dateRange.to) {
        params.append('to', dateRange.to.toISOString())
      }

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Falha ao carregar os dados do dashboard.')
      }
      const dashboardData: DashboardData = await response.json()
      setData(dashboardData)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: 'Erro',
        description: sanitizeText(message),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast, dateRange])

  React.useEffect(() => {
    const checkProfile = async () => {
      try {
        const res = await fetch('/api/v1/manager/profile-status')
        if (!res.ok) {
          throw new Error('Failed to check profile status')
        }
        const data = await res.json()
        setProfileIncomplete(!data.complete)
      } catch (error) {
        // Structured logging instead of console.error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('[MANAGER_PROFILE_CHECK_ERROR]', {
          error: errorMessage,
          timestamp: new Date().toISOString(),
        })
      }
    }
    checkProfile()
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const kpiDisplayData = data
    ? [
        { title: 'Arrecadação da Rede', ...data.kpis.totalRevenue, icon: DollarSign },
        { title: 'Membros na Rede', ...data.kpis.totalMembers, icon: Users },
        { title: 'Transações na Rede', ...data.kpis.totalTransactions, icon: ArrowRightLeft },
        { title: 'Igrejas na Rede', ...data.kpis.totalChurches, icon: Church },
        { title: 'Pastores na Rede', ...data.kpis.totalPastors, icon: User },
        { title: 'Supervisores na Rede', ...data.kpis.totalSupervisors, icon: UserCog },
      ]
    : []

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
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
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
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
      {/* Header Moderno com Gradiente Videira */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 videira-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

        <div className="relative z-10 p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-3">
                Dashboard do Gerente
              </h1>
              <p className="text-base text-white/90 mt-2 font-medium">
                Visão geral da sua rede de supervisores e igrejas
              </p>
            </div>
            <DateRangePicker
              value={{ from: dateRange.from, to: dateRange.to }}
              onDateRangeChange={handleDateRangeChange}
            />
          </div>
        </div>
      </div>

      {profileIncomplete && (
        <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-500/10 to-transparent shadow-lg">
          <CardHeader>
            <CardTitle className="text-amber-900 dark:text-amber-100 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/20 ring-2 ring-amber-500/30">
                <UserCog className="h-5 w-5 text-amber-600" />
              </div>
              Perfil Incompleto
            </CardTitle>
            <CardDescription className="text-amber-800 dark:text-amber-200">
              Complete seu perfil para habilitar todas as funcionalidades, incluindo pagamentos via
              boleto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-lg"
            >
              <a href="/manager/perfil">Completar Perfil</a>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
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
            {
              card: 'shadow-lg border-l-4 border-l-purple-500 hover:shadow-xl transition-all bg-gradient-to-br from-purple-500/5 to-transparent',
              icon: 'p-2 rounded-lg bg-purple-500/15 ring-2 ring-purple-500/30',
              iconColor: 'h-4 w-4 text-purple-500',
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="shadow-lg border-t-4 border-t-videira-cyan">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-videira-cyan/15 ring-2 ring-videira-cyan/30">
                  <ArrowRightLeft className="h-5 w-5 text-videira-cyan" />
                </div>
                Últimas Transações na Rede
              </CardTitle>
              <CardDescription>As transações mais recentes da sua rede</CardDescription>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-2 border-videira-cyan/30 hover:bg-videira-cyan/10"
              onClick={fetchData}
            >
              <RefreshCw className="h-4 w-4 text-videira-cyan" />
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
                    <TableHead className="hidden sm:table-cell font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{transaction.name}</TableCell>
                      <TableCell className="text-right font-semibold">
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-t-4 border-t-videira-blue">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-videira-blue/15 ring-2 ring-videira-blue/30">
                <Users className="h-5 w-5 text-videira-blue" />
              </div>
              Cadastros Recentes na Rede
            </CardTitle>
            <CardDescription>Os últimos usuários cadastrados na sua rede</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentRegistrations.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-10 w-10 ring-2 ring-videira-blue/30">
                    <AvatarImage
                      src={`https://placehold.co/40x40.png`}
                      alt="Avatar"
                      data-ai-hint="person symbol"
                    />
                    <AvatarFallback className="bg-videira-blue/10 text-videira-blue font-semibold">
                      {user.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-semibold leading-none">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.type}</p>
                  </div>
                  <div className="ml-auto text-xs text-muted-foreground">{user.date}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="shadow-lg border-t-4 border-t-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-500/15 ring-2 ring-green-500/30">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              Arrecadação por Método de Pagamento
            </CardTitle>
            <CardDescription>Distribuição das formas de pagamento na rede</CardDescription>
          </CardHeader>
          <CardContent>
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
                <Pie data={data.revenueByMethod} dataKey="value" nameKey="method" innerRadius={60}>
                  {data.revenueByMethod.map((entry) => (
                    <Cell key={entry.method} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-t-4 border-t-videira-purple">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-videira-purple/15 ring-2 ring-videira-purple/30">
                <Church className="h-5 w-5 text-videira-purple" />
              </div>
              Arrecadação por Igreja
            </CardTitle>
            <CardDescription>
              Distribuição da arrecadação mensal entre as igrejas da sua rede
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px] w-full">
              <PieChart>
                <Tooltip content={<ChartTooltipContent hideLabel />} />
                <Legend content={<ChartLegendContent nameKey="name" />} />
                <Pie data={data.revenueByChurch} dataKey="revenue" nameKey="name" innerRadius={60}>
                  {data.revenueByChurch.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-t-4 border-t-videira-blue">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-videira-blue/15 ring-2 ring-videira-blue/30">
                <Users className="h-5 w-5 text-videira-blue" />
              </div>
              Contribuições por Igreja
            </CardTitle>
            <CardDescription>Número de contribuições de cada igreja da sua rede</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
        <Card className="shadow-lg border-t-4 border-t-videira-cyan">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-videira-cyan/15 ring-2 ring-videira-cyan/30">
                <Users className="h-5 w-5 text-videira-cyan" />
              </div>
              Novos Membros por Mês (Rede)
            </CardTitle>
            <CardDescription>Crescimento mensal da sua rede nos últimos meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px] w-full">
              <BarChart data={data.newMembers} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
                <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                <Bar dataKey="count" fill="hsl(187 100% 43%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
