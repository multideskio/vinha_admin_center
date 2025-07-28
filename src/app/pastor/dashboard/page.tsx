
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

const kpiData = [
  {
    title: 'Minhas Contribuições',
    value: 'R$ 1.250,00',
    change: '+10% em relação ao mês passado',
    icon: DollarSign,
  },
  {
    title: 'Igrejas Contribuintes',
    value: '5',
    change: '+1 este mês',
    icon: Handshake,
  },
  {
    title: 'Última Contribuição',
    value: 'R$ 250,00',
    change: 'Hoje',
    icon: Activity,
  },
];

const offeringsData = [
    { month: 'Jan', value: 1100 },
    { month: 'Fev', value: 1300 },
    { month: 'Mar', value: 1200 },
    { month: 'Abr', value: 1400 },
    { month: 'Mai', value: 1500 },
    { month: 'Jun', value: 1250 },
];

const recentTransactions = [
    { id: 'TRN-001', church: 'Igreja Madureira', amount: 250.00, date: '28/07/2024', status: 'Aprovada' },
    { id: 'TRN-002', church: 'Igreja Videira', amount: 200.00, date: '28/07/2024', status: 'Aprovada' },
    { id: 'TRN-003', church: 'Igreja Fonte da Vida', amount: 300.00, date: '27/07/2024', status: 'Aprovada' },
    { id: 'TRN-004', church: 'Comunidade da Graça', amount: 150.00, date: '27/07/2024', status: 'Aprovada' },
    { id: 'TRN-005', church: 'IURD', amount: 350.00, date: '26/07/2024', status: 'Aprovada' },
];

export default function PastorDashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Dashboard do Pastor
        </h1>
        <DateRangePicker />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      
      <div className="grid grid-cols-1 gap-8">
        <Card>
            <CardHeader>
                <CardTitle>Últimas Contribuições</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Igreja</TableHead>
                            <TableHead className='text-right'>Valor</TableHead>
                            <TableHead className='hidden sm:table-cell'>Status</TableHead>
                            <TableHead className='hidden md:table-cell'>Data</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentTransactions.map(transaction => (
                            <TableRow key={transaction.id}>
                                <TableCell className='font-medium'>{transaction.church}</TableCell>
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
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Contribuições Mensais</CardTitle>
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
