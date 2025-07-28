
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

const recentTransactions = [
    { id: 'TRN-001', name: 'João Silva', amount: 150.00, date: '28/07/2024', status: 'Aprovada' },
    { id: 'TRN-002', name: 'Maria Oliveira', amount: 75.50, date: '28/07/2024', status: 'Aprovada' },
    { id: 'TRN-003', name: 'Carlos Andrade', amount: 200.00, date: '27/07/2024', status: 'Pendente' },
    { id: 'TRN-004', name: 'Ana Beatriz', amount: 50.00, date: '27/07/2024', status: 'Aprovada' },
    { id: 'TRN-005', name: 'Paulo Ferreira', amount: 300.00, date: '26/07/2024', status: 'Recusada' },
    { id: 'TRN-006', name: 'Jabez Henrique', amount: 120.00, date: '26/07/2024', status: 'Aprovada' },
    { id: 'TRN-007', name: 'Lucas Mendes', amount: 90.00, date: '25/07/2024', status: 'Aprovada' },
    { id: 'TRN-008', name: 'Fernanda Costa', amount: 250.00, date: '25/07/2024', status: 'Aprovada' },
    { id: 'TRN-009', name: 'José Contas', amount: 80.00, date: '24/07/2024', status: 'Pendente' },
    { id: 'TRN-010', name: 'Maria Finanças', amount: 450.00, date: '24/07/2024', status: 'Aprovada' },
];

const recentRegistrations = [
    { id: 'USR-001', name: 'Novo Membro 1', type: 'Membro', date: '28/07/2024', avatar: 'NM' },
    { id: 'USR-002', name: 'Pastor Silva', type: 'Pastor', date: '28/07/2024', avatar: 'PS' },
    { id: 'USR-003', name: 'Supervisora Ana', type: 'Supervisor', date: '27/07/2024', avatar: 'SA' },
    { id: 'USR-004', name: 'Gerente Carlos', type: 'Gerente', date: '27/07/2024', avatar: 'GC' },
    { id: 'USR-005', name: 'Novo Membro 2', type: 'Membro', date: '26/07/2024', avatar: 'NM' },
    { id: 'USR-006', name: 'Igreja Central', type: 'Igreja', date: '26/07/2024', avatar: 'IC' },
    { id: 'USR-007', name: 'Admin User', type: 'Administrador', date: '25/07/2024', avatar: 'AU' },
    { id: 'USR-008', name: 'Novo Membro 3', type: 'Membro', date: '25/07/2024', avatar: 'NM' },
    { id: 'USR-009', name: 'Pastor João', type: 'Pastor', date: '24/07/2024', avatar: 'PJ' },
    { id: 'USR-010', name: 'Novo Membro 4', type: 'Membro', date: '24/07/2024', avatar: 'NM' },
];


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
                <CardTitle>Últimas Transações</CardTitle>
                <CardDescription>As 10 transações mais recentes.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Contribuinte</TableHead>
                            <TableHead className='text-right'>Valor</TableHead>
                            <TableHead className='hidden sm:table-cell'>Status</TableHead>
                            <TableHead className='hidden md:table-cell'>Data</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentTransactions.map(transaction => (
                            <TableRow key={transaction.id}>
                                <TableCell className='font-medium'>{transaction.name}</TableCell>
                                <TableCell className='text-right'>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount)}</TableCell>
                                <TableCell className='hidden sm:table-cell'>
                                     <Badge variant={transaction.status === 'Aprovada' ? 'default' : transaction.status === 'Pendente' ? 'secondary' : 'destructive'}
                                        className={transaction.status === 'Aprovada' ? 'bg-green-500/20 text-green-700 border-green-400'
                                        : transaction.status === 'Pendente' ? 'bg-amber-500/20 text-amber-700 border-amber-400'
                                        : 'bg-red-500/20 text-red-700 border-red-400'}>
                                        {transaction.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className='hidden md:table-cell text-muted-foreground'>{transaction.date}</TableCell>
                            </TableRow>
                        ))}
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
                    {recentRegistrations.map(user => (
                        <div key={user.id} className="flex items-center">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={`https://placehold.co/36x36.png`} alt="Avatar" data-ai-hint="person symbol" />
                                <AvatarFallback>{user.avatar}</AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">{user.name}</p>
                                <p className="text-sm text-muted-foreground">{user.type}</p>
                            </div>
                            <div className="ml-auto font-medium text-muted-foreground text-sm">{user.date}</div>
                        </div>
                    ))}
                 </div>
            </CardContent>
        </Card>
      </div>


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
