'use client'

import * as React from 'react'
import {
  Building2,
  Mail,
  Phone,
  User,
  MapPin,
  CalendarIcon,
  Clock,
  Pencil,
  DollarSign,
  ArrowRightLeft,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DateRange } from 'react-day-picker'
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

type InfoItemProps = {
  icon: React.ElementType
  label: string
  value: string | undefined | null
}

type KpiBlock = {
  totalContributed: { value: string; change: string }
  monthlyContribution: { value: string; change: string }
  totalTransactions: { value: string; change: string }
}

type ChurchProfileData = {
  nomeFantasia: string
  razaoSocial: string
  cnpj: string
  email: string
  phone: string
  address: string
  neighborhood: string
  city: string
  state: string
  foundationDate: string
  titheDay: number
  treasurerFirstName: string
  treasurerLastName: string
  treasurerCpf: string
}

type DashboardData = {
  profile: ChurchProfileData
  kpis: KpiBlock
  monthlyContributions: { month: string; total: number }[]
  paymentMethods: { method: string; value: number; fill: string }[]
}

const InfoItem = ({ icon: Icon, label, value }: InfoItemProps) => (
  <div className="flex items-start gap-4">
    <Icon className="h-5 w-5 text-muted-foreground mt-1" />
    <div>
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-muted-foreground">{value || 'Não informado'}</p>
    </div>
  </div>
)

export default function ChurchDashboardPage() {
  const [data, setData] = React.useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>()
  const { toast } = useToast()

  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const fetchData = React.useCallback(async (startDate?: string, endDate?: string, refresh = false) => {
    if (refresh) setIsRefreshing(true)
    else setIsLoading(true)
    
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      
      const response = await fetch(`/api/v1/igreja/dashboard?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Falha ao carregar os dados do dashboard.')
      }
      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [toast])

  const handleDateRangeChange = React.useCallback((range: DateRange | undefined) => {
    setDateRange(range)
    const startDate = range?.from ? format(range.from, 'yyyy-MM-dd') : undefined
    const endDate = range?.to ? format(range.to, 'yyyy-MM-dd') : undefined
    fetchData(startDate, endDate)
  }, [fetchData])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const kpiDisplayData = data
    ? [
        { title: 'Total Arrecadado', ...data.kpis.totalContributed, icon: DollarSign },
        { title: 'Arrecadação no Mês', ...data.kpis.monthlyContribution, icon: DollarSign },
        { title: 'Total de Transações', ...data.kpis.totalTransactions, icon: ArrowRightLeft },
      ]
    : []

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
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
        <div className="grid gap-8 lg:grid-cols-2">
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
          <Card className="lg:col-span-2">
            <CardContent className="pt-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const { profile } = data

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard da Igreja</h1>
          <p className="text-sm text-muted-foreground">
            Bem-vindo ao seu painel, {profile.nomeFantasia}.
            {dateRange?.from && (
              <span className="ml-2 text-primary">
                • Período: {format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })}
                {dateRange?.to && ` até ${format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}`}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchData(
              dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
              dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
              true
            )}
            disabled={isRefreshing}
          >
            <ArrowRightLeft className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <DateRangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
          />
          <Button asChild>
            <Link href="/igreja/perfil">
              <Pencil className="mr-2 h-4 w-4" />
              Editar Perfil
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {kpiDisplayData.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">{kpi.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Arrecadação Mensal</CardTitle>
            <CardDescription>Contribuições recebidas nos últimos 6 meses.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px] w-full">
              <BarChart
                data={data.monthlyContributions}
                margin={{ top: 5, right: 20, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `R$${value / 1000}k`}
                />
                <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recebimentos por Método</CardTitle>
            <CardDescription>
              Distribuição dos recebimentos por método de pagamento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px] w-full">
              <PieChart>
                <Tooltip content={<ChartTooltipContent hideLabel />} />
                <Legend content={<ChartLegendContent nameKey="method" />} />
                <Pie data={data.paymentMethods} dataKey="value" nameKey="method" innerRadius={60}>
                  {data.paymentMethods.map((entry) => (
                    <Cell key={entry.method} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src="https://placehold.co/80x80.png"
                alt={profile.nomeFantasia}
                data-ai-hint="church building"
              />
              <AvatarFallback>IDM</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{profile.nomeFantasia}</CardTitle>
              <CardDescription>{profile.razaoSocial}</CardDescription>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem icon={Building2} label="CNPJ" value={profile.cnpj} />
            <InfoItem icon={Mail} label="E-mail" value={profile.email} />
            <InfoItem icon={Phone} label="Telefone" value={profile.phone} />
            <InfoItem
              icon={MapPin}
              label="Endereço"
              value={`${profile.address}, ${profile.neighborhood}, ${profile.city} - ${profile.state}`}
            />
            <InfoItem
              icon={CalendarIcon}
              label="Data de Fundação"
              value={
                profile.foundationDate
                  ? format(new Date(profile.foundationDate), 'dd/MM/yyyy')
                  : 'N/A'
              }
            />
            <InfoItem icon={Clock} label="Dia para dízimo" value={String(profile.titheDay)} />

            <div className="col-span-1 md:col-span-2">
              <Separator className="my-4" />
              <h3 className="text-lg font-semibold mb-4">Informações do Tesoureiro</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoItem
                  icon={User}
                  label="Nome do Tesoureiro"
                  value={`${profile.treasurerFirstName} ${profile.treasurerLastName}`}
                />
                <InfoItem icon={User} label="CPF do Tesoureiro" value={profile.treasurerCpf} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
