
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
  Pie,
  PieChart,
  Cell,
  Legend,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
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

const monthlyRevenueComparison = [
    { day: '01', currentMonth: 1200, lastMonth: 1100 },
    { day: '03', currentMonth: 1500, lastMonth: 1300 },
    { day: '05', currentMonth: 1800, lastMonth: 1600 },
    { day: '07', currentMonth: 2200, lastMonth: 1900 },
    { day: '09', currentMonth: 2500, lastMonth: 2200 },
    { day: '11', currentMonth: 2300, lastMonth: 2100 },
    { day: '13', currentMonth: 3000, lastMonth: 2700 },
    { day: '15', currentMonth: 3400, lastMonth: 3100 },
    { day: '17', currentMonth: 3700, lastMonth: 3300 },
    { day: '19', currentMonth: 4000, lastMonth: 3600 },
    { day: '21', currentMonth: 4200, lastMonth: 3800 },
    { day: '23', currentMonth: 4500, lastMonth: 4100 },
    { day: '25', currentMonth: 4800, lastMonth: 4300 },
    { day: '27', currentMonth: 5100, lastMonth: 4600 },
    { day: '29', currentMonth: 5500, lastMonth: 4900 },
    { day: '31', currentMonth: 6000, lastMonth: 5300 },
];

const newMembers = [
    { month: 'Jan', count: 120 },
    { month: 'Fev', count: 150 },
    { month: 'Mar', count: 170 },
    { month: 'Abr', count: 200 },
    { month: 'Mai', count: 230 },
    { month: 'Jun', count: 180 },
]

const revenueByRegion = [
    { region: 'Sul', revenue: 12500, fill: 'var(--color-chart-1)' },
    { region: 'Sudeste', revenue: 25000, fill: 'var(--color-chart-2)' },
    { region: 'Centro-Oeste', revenue: 8900.50, fill: 'var(--color-chart-3)' },
    { region: 'Norte', revenue: 5500, fill: 'var(--color-chart-4)' },
    { region: 'Nordeste', revenue: 18750.75, fill: 'var(--color-chart-5)' },
]

const churchesByRegion = [
    { region: 'Sul', count: 15, fill: 'var(--color-chart-1)' },
    { region: 'Sudeste', count: 35, fill: 'var(--color-chart-2)' },
    { region: 'Centro-Oeste', count: 10, fill: 'var(--color-chart-3)' },
    { region: 'Norte', count: 8, fill: 'var(--color-chart-4)' },
    { region: 'Nordeste', count: 21, fill: 'var(--color-chart-5)' },
]

const chartConfig = {
    revenue: {
      label: "Receita",
    },
    currentMonth: {
      label: "Mês Atual",
      color: "hsl(var(--chart-2))",
    },
    lastMonth: {
      label: "Mês Passado",
      color: "hsl(var(--chart-1))",
    },
  }


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
      
       <Card>
        <CardHeader>
          <CardTitle>Arrecadação Comparativa</CardTitle>
          <CardDescription>Mês atual vs. Mês passado</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <AreaChart
              data={monthlyRevenueComparison}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `Dia ${value}`}
              />
              <Tooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Area
                dataKey="lastMonth"
                type="natural"
                fill="var(--color-lastMonth)"
                fillOpacity={0.4}
                stroke="var(--color-lastMonth)"
                stackId="a"
              />
              <Area
                dataKey="currentMonth"
                type="natural"
                fill="var(--color-currentMonth)"
                fillOpacity={0.4}
                stroke="var(--color-currentMonth)"
                stackId="a"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
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
        <Card>
            <CardHeader>
                <CardTitle>Arrecadação por Região</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={{}} className="h-[300px] w-full">
                    <PieChart>
                        <Tooltip content={<ChartTooltipContent hideLabel />} />
                        <Pie data={revenueByRegion} dataKey="revenue" nameKey="region" innerRadius={60}>
                             {revenueByRegion.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Igrejas por Região</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={{}} className="h-[300px] w-full">
                     <PieChart>
                        <Tooltip content={<ChartTooltipContent hideLabel />} />
                        <Pie data={churchesByRegion} dataKey="count" nameKey="region" innerRadius={60}>
                            {churchesByRegion.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
