

'use client';

import { DollarSign, Users, Church, UserCog, Building, User, CreditCard, Banknote, QrCode } from 'lucide-react';
import {
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
  ChartLegendContent,
} from '@/components/ui/chart';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// KPIs for Manager's network
const kpiData = [
  {
    title: 'Arrecadação da Rede',
    value: 'R$ 12.850,40',
    change: '+15.2% em relação ao mês passado',
    icon: DollarSign,
  },
  {
    title: 'Membros Ativos na Rede',
    value: '480',
    change: '+75 este mês',
    icon: Users,
  },
  {
    title: 'Igrejas na Rede',
    value: '12',
    change: '+1 este mês',
    icon: Church,
  },
  {
    title: 'Pastores na Rede',
    value: '15',
    change: '+2 este mês',
    icon: User,
  },
  {
    title: 'Supervisores na Rede',
    value: '4',
    change: 'Nenhuma alteração',
    icon: UserCog,
  },
];

const churchesData = [
  { id: 'chu-01', name: 'Assembleia de Deus Madureira', monthlyRevenue: 3500.00, members: 120, fill: '#16a34a' },
  { id: 'chu-02', name: 'Comunidade da Graça', monthlyRevenue: 2800.50, members: 95, fill: '#3b82f6' },
  { id: 'chu-03', name: 'Videira', monthlyRevenue: 4100.00, members: 150, fill: '#f97316' },
  { id: 'chu-04', name: 'Fonte da Vida', monthlyRevenue: 2450.00, members: 115, fill: '#ef4444' },
];

const revenueByChurch = churchesData.map(church => ({
    name: church.name,
    revenue: church.monthlyRevenue,
    fill: church.fill
}));

const membersByChurch = churchesData.map(church => ({
    name: church.name,
    count: church.members,
    fill: church.fill
}));

const paymentMethodsData = [
    { method: 'Pix', value: 7850.40, fill: '#10b981', icon: QrCode },
    { method: 'Crédito', value: 3500.00, fill: '#3b82f6', icon: CreditCard },
    { method: 'Boleto', value: 1500.00, fill: '#f59e0b', icon: Banknote },
];


const recentTransactions = [
    { id: 'TRN-006', name: 'Jabez Henrique', amount: 120.00, date: '26/07/2024', status: 'Aprovada' },
    { id: 'TRN-007', name: 'Lucas Mendes', amount: 90.00, date: '25/07/2024', status: 'Aprovada' },
    { id: 'TRN-008', name: 'Fernanda Costa', amount: 250.00, date: '25/07/2024', status: 'Aprovada' },
    { id: 'TRN-009', name: 'José Contas', amount: 80.00, date: '24/07/2024', status: 'Pendente' },
    { id: 'TRN-010', name: 'Maria Finanças', amount: 450.00, date: '24/07/2024', status: 'Aprovada' },
];

const recentRegistrations = [
    { id: 'USR-002', name: 'Pastor Silva', type: 'Pastor', date: '28/07/2024', avatar: 'PS' },
    { id: 'USR-003', name: 'Supervisora Ana', type: 'Supervisor', date: '27/07/2024', avatar: 'SA' },
    { id: 'USR-006', name: 'Igreja Central', type: 'Igreja', date: '26/07/2024', avatar: 'IC' },
    { id: 'USR-009', name: 'Pastor João', type: 'Pastor', date: '24/07/2024', avatar: 'PJ' },
];


export default function GerenteDashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Dashboard do Gerente
        </h1>
        <DateRangePicker />
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
                <CardTitle>Últimas Transações na Rede</CardTitle>
                <CardDescription>As transações mais recentes da sua rede.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Contribuinte</TableHead>
                            <TableHead className='text-right'>Valor</TableHead>
                            <TableHead className='hidden sm:table-cell'>Status</TableHead>
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
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Cadastros Recentes na Rede</CardTitle>
                <CardDescription>Os últimos usuários cadastrados na sua rede.</CardDescription>
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
                <CardTitle>Arrecadação por Método de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={{
                     value: { label: "Valor" },
                     pix: { label: "Pix", color: "#10b981"},
                     credito: { label: "Crédito", color: "#3b82f6"},
                     boleto: { label: "Boleto", color: "#f59e0b"},
                }} className="h-[300px] w-full">
                    <PieChart>
                        <Tooltip content={<ChartTooltipContent nameKey="method" hideLabel />} />
                        <Legend content={<ChartLegendContent nameKey="method" />} />
                        <Pie data={paymentMethodsData} dataKey="value" nameKey="method" innerRadius={60}>
                             {paymentMethodsData.map((entry) => (
                                <Cell key={entry.method} fill={entry.fill} />
                            ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Arrecadação por Igreja</CardTitle>
                 <CardDescription>Distribuição da arrecadação mensal entre as igrejas da sua rede.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={{}} className="h-[300px] w-full">
                    <PieChart>
                        <Tooltip content={<ChartTooltipContent hideLabel />} />
                        <Legend content={<ChartLegendContent nameKey="name" />} />
                        <Pie data={revenueByChurch} dataKey="revenue" nameKey="name" innerRadius={60}>
                             {revenueByChurch.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Membros por Igreja</CardTitle>
                <CardDescription>Distribuição de membros entre as igrejas da sua rede.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={{}} className="h-[300px] w-full">
                     <PieChart>
                        <Tooltip content={<ChartTooltipContent hideLabel />} />
                        <Legend content={<ChartLegendContent nameKey="name" />} />
                        <Pie data={membersByChurch} dataKey="count" nameKey="name" innerRadius={60}>
                            {membersByChurch.map((entry, index) => (
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
    
