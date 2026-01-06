'use client'

import * as React from 'react'
import {
  User,
  Mail,
  Phone,
  Home,
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

type PastorProfileData = {
  firstName: string
  lastName: string
  cpf: string
  birthDate: string
  phone: string
  landline: string
  email: string
  cep: string
  state: string
  city: string
  neighborhood: string
  address: string
  complement: string
  number: string
  titheDay: number
}

type DashboardData = {
  profile: PastorProfileData
  kpis: KpiBlock
  monthlyContributions: { month: string; total: number }[]
  paymentMethods: { method: string; value: number; fill: string }[]
}

const InfoItem = ({ icon: Icon, label, value }: InfoItemProps) => (
  <div className="flex items-start gap-3 sm:gap-4">
    <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 sm:mt-1 flex-shrink-0" />
    <div className="min-w-0 flex-1">
      <p className="font-semibold text-foreground text-sm sm:text-base">{label}</p>
      <p className="text-muted-foreground text-xs sm:text-sm break-words">{value || 'Não informado'}</p>
    </div>
  </div>
)

export default function PastorDashboardPage() {
  const [data, setData] = React.useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>()
  const { toast } = useToast()

  const fetchData = React.useCallback(
    async (startDate?: string, endDate?: string) => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)

        const response = await fetch(`/api/v1/pastor/dashboard?${params.toString()}`)
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
      }
    },
    [toast],
  )

  const handleDateRangeChange = React.useCallback(
    (range: DateRange | undefined) => {
      setDateRange(range)
      const startDate = range?.from ? format(range.from, 'yyyy-MM-dd') : undefined
      const endDate = range?.to ? format(range.to, 'yyyy-MM-dd') : undefined
      fetchData(startDate, endDate)
    },
    [fetchData],
  )

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const kpiDisplayData = data
    ? [
        { title: 'Total Contribuído', ...data.kpis.totalContributed, icon: DollarSign },
        { title: 'Contribuição no Mês', ...data.kpis.monthlyContribution, icon: DollarSign },
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
    <div className="flex flex-col gap-6">
      {/* Header com gradiente Videira */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 videira-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

        <div className="relative z-10 p-4 sm:p-6 md:p-8">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow-lg break-words">
                  Dashboard do Pastor
                </h1>
                <p className="text-sm sm:text-base text-white/90 mt-2 font-medium break-words">
                  Bem-vindo ao seu painel, Pastor {profile.firstName}
                  {dateRange?.from && (
                    <span className="block sm:inline sm:ml-2 mt-1 sm:mt-0">
                      • Período: {format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })}
                      {dateRange.to && ` até ${format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}`}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 w-full sm:w-auto">
                <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
                <Button
                  asChild
                  className="bg-white text-videira-blue hover:bg-white/90 shadow-lg font-semibold w-full sm:w-auto"
                >
                  <Link href="/pastor/perfil">
                    <Pencil className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Editar Perfil</span>
                    <span className="sm:hidden">Perfil</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
          ] as const
          const classes = colorClasses[index % colorClasses.length] ?? colorClasses[0]
          return (
            <Card key={kpi.title} className={classes.card}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-semibold truncate pr-2">{kpi.title}</CardTitle>
                <div className={`${classes.icon} flex-shrink-0`}>
                  <kpi.icon className={classes.iconColor} />
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="text-xl sm:text-2xl font-bold break-words">{kpi.value}</div>
                <p className="text-xs text-muted-foreground mt-1 break-words">{kpi.change}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-lg border-t-4 border-t-videira-cyan">
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-videira-cyan flex-shrink-0" />
              <span className="break-words">Suas Contribuições Mensais</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Seus dízimos e ofertas dos últimos 6 meses.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <ChartContainer config={{}} className="h-[250px] sm:h-[300px] w-full">
              <BarChart
                data={data.monthlyContributions}
                margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-t-4 border-t-videira-blue">
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <ArrowRightLeft className="h-4 w-4 sm:h-5 sm:w-5 text-videira-blue flex-shrink-0" />
              <span className="break-words">Contribuições por Método</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Distribuição das suas contribuições por método de pagamento.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <ChartContainer config={{}} className="h-[250px] sm:h-[300px] w-full">
              <PieChart>
                <Tooltip content={<ChartTooltipContent hideLabel />} />
                <Legend
                  content={<ChartLegendContent nameKey="method" />}
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Pie
                  data={data.paymentMethods}
                  dataKey="value"
                  nameKey="method"
                  innerRadius={40}
                  outerRadius={80}
                >
                  {data.paymentMethods.map((entry) => (
                    <Cell key={entry.method} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 shadow-lg border-t-4 border-t-videira-purple">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-4 sm:px-6 pt-4 sm:pt-6">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-4 ring-videira-purple/30 flex-shrink-0">
              <AvatarImage
                src="https://placehold.co/80x80.png"
                alt={profile.firstName}
                data-ai-hint="male pastor"
              />
              <AvatarFallback className="bg-videira-purple/10 text-videira-purple font-bold text-xl sm:text-2xl">
                {profile.firstName?.charAt(0)}
                {profile.lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-xl sm:text-2xl flex items-center gap-2 break-words">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-videira-purple flex-shrink-0" />
                <span>
                  {profile.firstName} {profile.lastName}
                </span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Pastor</CardDescription>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 sm:pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 px-4 sm:px-6 pb-4 sm:pb-6">
            <InfoItem icon={User} label="CPF" value={profile.cpf} />
            <InfoItem
              icon={CalendarIcon}
              label="Data de Nascimento"
              value={profile.birthDate ? format(new Date(profile.birthDate), 'dd/MM/yyyy') : 'N/A'}
            />
            <InfoItem icon={Mail} label="E-mail" value={profile.email} />
            <InfoItem icon={Phone} label="Celular" value={profile.phone} />
            <InfoItem icon={Phone} label="Telefone Fixo" value={profile.landline} />
            <InfoItem icon={Clock} label="Dia para dízimo" value={String(profile.titheDay)} />
            <div className="sm:col-span-2">
              <InfoItem
                icon={Home}
                label="Endereço"
                value={`${profile.address}, ${profile.number || 'S/N'}, ${profile.neighborhood}, ${profile.city} - ${profile.state}`}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
