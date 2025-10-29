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
} from 'lucide-react'
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
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {kpiDisplayData.slice(0, 4).map((kpi, index) => (
          <Card key={kpi.title} className="hover:shadow-md transition-shadow">
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

      <Card className="col-span-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Progresso de Crescimento</CardTitle>
              <CardDescription>Evolução mensal de novos membros nos últimos 6 meses</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {data.newMembers.reduce((sum, m) => sum + m.count, 0)} novos membros
            </Badge>
          </div>
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
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8}
                className="text-xs"
              />
              <Tooltip content={<ChartTooltipContent indicator="dot" />} />
              <Bar 
                dataKey="count" 
                fill="hsl(var(--primary))" 
                radius={[8, 8, 0, 0]}
                className="fill-primary"
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {kpiDisplayData.slice(4).map((kpi, index) => (
          <Card key={kpi.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
              <div className={cn(
                "p-2 rounded-lg",
                index === 0 && "bg-cyan-100 dark:bg-cyan-900/20",
                index === 1 && "bg-pink-100 dark:bg-pink-900/20",
                index === 2 && "bg-amber-100 dark:bg-amber-900/20"
              )}>
                <kpi.icon className={cn(
                  "h-4 w-4",
                  index === 0 && "text-cyan-600 dark:text-cyan-400",
                  index === 1 && "text-pink-600 dark:text-pink-400",
                  index === 2 && "text-amber-600 dark:text-amber-400"
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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Inadimplentes do Mês
            </CardTitle>
            <CardDescription>
              Pastores e igrejas que não dizimaram após o dia definido.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.defaulters.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum inadimplente este mês! 🎉
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.defaulters.slice(0, 10).map((defaulter) => {
                  const profilePath = defaulter.type === 'pastor' ? 'pastores' : 'igrejas'
                  return (
                    <div key={defaulter.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <Link 
                          href={`/admin/${profilePath}/${defaulter.id}`}
                          className="text-sm font-medium hover:underline text-primary flex items-center gap-1"
                        >
                          {defaulter.name}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {defaulter.type === 'pastor' ? 'Pastor' : 'Igreja'} • Dia {defaulter.titheDay}
                        </p>
                      </div>
                      <Badge variant="destructive" className="ml-2">
                        {defaulter.daysLate}d
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Últimas Transações</CardTitle>
              <CardDescription>As 10 transações mais recentes.</CardDescription>
            </div>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
              <span className="sr-only">Atualizar</span>
            </Button>
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
        <Card>
          <CardHeader>
            <CardTitle>Cadastros Recentes</CardTitle>
            <CardDescription>Os 10 últimos usuários cadastrados.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {data.recentRegistrations.map((user) => (
                <div key={user.id} className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={`https://placehold.co/36x36.png`}
                      alt="Avatar"
                      data-ai-hint="person symbol"
                    />
                    <AvatarFallback>{user.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.type}</p>
                  </div>
                  <div className="ml-auto font-medium text-muted-foreground text-sm">
                    {user.date}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Arrecadação por Método de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: { label: 'Valor' },
                pix: { label: 'Pix', color: '#10b981' },
                credito: { label: 'Crédito', color: '#3b82f6' },
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
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Distribuição por Região</CardTitle>
            <CardDescription>Arrecadação e quantidade de igrejas por região</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-sm font-medium mb-4">Arrecadação</h4>
                <ChartContainer config={{}} className="h-[250px] w-full">
                  <PieChart>
                    <Tooltip content={<ChartTooltipContent hideLabel />} />
                    <Legend content={<ChartLegendContent nameKey="name" />} />
                    <Pie data={data.revenueByRegion} dataKey="revenue" nameKey="name" innerRadius={50}>
                      {data.revenueByRegion.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-4">Igrejas</h4>
                <ChartContainer config={{}} className="h-[250px] w-full">
                  <PieChart>
                    <Tooltip content={<ChartTooltipContent hideLabel />} />
                    <Legend content={<ChartLegendContent nameKey="name" />} />
                    <Pie data={data.churchesByRegion} dataKey="count" nameKey="name" innerRadius={50}>
                      {data.churchesByRegion.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
