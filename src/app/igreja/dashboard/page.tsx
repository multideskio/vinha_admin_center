
'use client';

import { DollarSign, Users, Activity, Handshake } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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
} from '@/components/ui/chart';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const kpiData = [
  {
    title: 'Arrecadação no Mês',
    value: 'R$ 3.500,00',
    change: '+18.2% em relação ao mês passado',
    icon: DollarSign,
  },
  {
    title: 'Membros Ativos',
    value: '120',
    change: '+15 este mês',
    icon: Users,
  },
  {
    title: 'Novas Contribuições',
    value: '+42',
    change: '+5 hoje',
    icon: Activity,
  },
  {
    title: 'Visitantes no Mês',
    value: '88',
    change: '+25 na última semana',
    icon: Handshake,
  },
];

const offeringsData = [
    { month: 'Jan', value: 2800 },
    { month: 'Fev', value: 3100 },
    { month: 'Mar', value: 2900 },
    { month: 'Abr', value: 3400 },
    { month: 'Mai', value: 3600 },
    { month: 'Jun', value: 3500 },
];


const recentTransactions = [
    { id: 'TRN-001', name: 'João Silva', amount: 150.00, date: '28/07/2024', status: 'Aprovada' },
    { id: 'TRN-002', name: 'Maria Oliveira', amount: 75.50, date: '28/07/2024', status: 'Aprovada' },
    { id: 'TRN-003', name: 'Carlos Andrade', amount: 200.00, date: '27/07/2024', status: 'Pendente' },
    { id: 'TRN-004', name: 'Ana Beatriz', amount: 50.00, date: '27/07/2024', status: 'Aprovada' },
    { id: 'TRN-005', name: 'Paulo Ferreira', amount: 300.00, date: '26/07/2024', status: 'Recusada' },
];

const recentMembers = [
    { id: 'USR-001', name: 'Novo Membro 1', date: '28/07/2024', avatar: 'NM' },
    { id: 'USR-005', name: 'Novo Membro 2', date: '26/07/2024', avatar: 'NM' },
    { id: 'USR-008', name: 'Novo Membro 3', date: '25/07/2024', avatar: 'NM' },
    { id: 'USR-010', name: 'Novo Membro 4', date: '24/07/2024', avatar: 'NM' },
];


export default function ChurchDashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Dashboard da Igreja
        </h1>
        <DateRangePicker />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>Últimas Transações</CardTitle>
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
                                     <Badge variant={transaction.status === 'Aprovada' ? 'success' : transaction.status === 'Pendente' ? 'warning' : 'destructive'}>
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
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Membros Recentes</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="space-y-6">
                    {recentMembers.map(user => (
                        <div key={user.id} className="flex items-center">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={`https://placehold.co/36x36.png`} alt="Avatar" data-ai-hint="person symbol" />
                                <AvatarFallback>{user.avatar}</AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">{user.name}</p>
                                <p className="text-sm text-muted-foreground">Novo Membro</p>
                            </div>
                            <div className="ml-auto font-medium text-muted-foreground text-sm">{user.date}</div>
                        </div>
                    ))}
                 </div>
            </CardContent>
        </Card>
      </div>


      <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Recebimentos Mensais</CardTitle>
            <CardDescription>Gráfico de contribuições recebidas nos últimos 6 meses.</CardDescription>
          </CardHeader>
          <CardContent>
          <ChartContainer config={{}} className="h-[300px] w-full">
              <BarChart data={offeringsData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `R$${value/1000}k`} />
                <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

