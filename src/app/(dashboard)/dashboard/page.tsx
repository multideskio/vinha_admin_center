
'use client';

import { Activity, DollarSign, Percent, Users, Church, UserCheck, UserCog, Building, User } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { DateRangePicker } from '@/components/ui/date-range-picker';

const kpiData = [
  {
    title: 'Arrecadação no Mês',
    value: 'R$ 45.231,89',
    change: '+20.1% em relação ao mês passado',
    icon: DollarSign,
  },
  {
    title: 'Membros Ativos',
    value: '+1.230',
    change: '+180 este mês',
    icon: Users,
  },
  {
    title: 'Novas Contribuições',
    value: '+573',
    change: '+34 hoje',
    icon: Activity,
  },
  {
    title: 'Taxa de Engajamento',
    value: '76%',
    change: '-1.2% em relação à semana passada',
    icon: Percent,
  },
  {
    title: 'Total de Igrejas',
    value: '89',
    change: '+2 este mês',
    icon: Building,
  },
  {
    title: 'Total de Pastores',
    value: '112',
    change: '+5 este mês',
    icon: User,
  },
  {
    title: 'Supervisores Ativos',
    value: '23',
    change: 'Nenhuma alteração',
    icon: UserCog,
  },
  {
    title: 'Gerentes na Plataforma',
    value: '7',
    change: '+1 este ano',
    icon: UserCheck,
  },
];

const monthlyRevenue = [
  { month: 'Jan', revenue: 4000 },
  { month: 'Fev', revenue: 3000 },
  { month: 'Mar', revenue: 5000 },
  { month: 'Abr', revenue: 4500 },
  { month: 'Mai', revenue: 6000 },
  { month: 'Jun', revenue: 7000 },
];

const newMembers = [
    { month: 'Jan', count: 120 },
    { month: 'Fev', count: 150 },
    { month: 'Mar', count: 170 },
    { month: 'Abr', count: 200 },
    { month: 'Mai', count: 230 },
    { month: 'Jun', count: 180 },
]

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <DateRangePicker />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Arrecadação Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px] w-full">
              <AreaChart data={monthlyRevenue} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `R$${value/1000}k`} />
                <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                <Area type="monotone" dataKey="revenue" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Novos Membros por Mês</CardTitle>
          </CardHeader>
          <CardContent>
          <ChartContainer config={{}} className="h-[300px] w-full">
              <BarChart data={newMembers} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
