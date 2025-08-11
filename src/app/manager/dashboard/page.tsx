
'use client';

import * as React from 'react';
import { DollarSign, Users, Church, UserCog, User, CreditCard, Banknote, QrCode, RefreshCw, ArrowRightLeft } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

type KpiData = {
    title: string;
    value: string;
    change: string;
    icon: React.ElementType;
};

type KpiBlock = {
    totalRevenue: Omit<KpiData, 'icon' | 'title'>,
    totalMembers: Omit<KpiData, 'icon' | 'title'>,
    totalTransactions: Omit<KpiData, 'icon' | 'title'>,
    totalChurches: Omit<KpiData, 'icon' | 'title'>,
    totalPastors: Omit<KpiData, 'icon' | 'title'>,
    totalSupervisors: Omit<KpiData, 'icon' | 'title'>,
}

type DashboardData = {
    kpis: KpiBlock;
    revenueByMethod: { method: string; value: number; fill: string; }[];
    revenueByChurch: { name: string; revenue: number; fill: string; }[];
    membersByChurch: { name: string; count: number; fill: string; }[];
    recentTransactions: { id: string; name: string; amount: number; date: string; status: string; }[];
    recentRegistrations: { id: string; name: string; type: string; date: string; avatar: string; }[];
    newMembers: { month: string; count: number; }[];
}

export default function GerenteDashboardPage() {
    const [data, setData] = React.useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const { toast } = useToast();

    const fetchData = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/v1/manager/dashboard');
            if (!response.ok) {
                throw new Error('Falha ao carregar os dados do dashboard.');
            }
            const dashboardData: DashboardData = await response.json();
            setData(dashboardData);

        } catch (error: any) {
            toast({
                title: "Erro",
                description: error.message,
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    const kpiDisplayData = data ? [
        { title: 'Arrecadação da Rede', ...data.kpis.totalRevenue, icon: DollarSign },
        { title: 'Membros na Rede', ...data.kpis.totalMembers, icon: Users },
        { title: 'Transações na Rede', ...data.kpis.totalTransactions, icon: ArrowRightLeft },
        { title: 'Igrejas na Rede', ...data.kpis.totalChurches, icon: Church },
        { title: 'Pastores na Rede', ...data.kpis.totalPastors, icon: User },
        { title: 'Supervisores na Rede', ...data.kpis.totalSupervisors, icon: UserCog },
    ] : [];


  if (isLoading || !data) {
    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-64" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
                <Card><CardContent className="pt-6"><Skeleton className="h-80 w-full" /></CardContent></Card>
                <Card><CardContent className="pt-6"><Skeleton className="h-80 w-full" /></CardContent></Card>
                <Card><CardContent className="pt-6"><Skeleton className="h-80 w-full" /></CardContent></Card>
                <Card><CardContent className="pt-6"><Skeleton className="h-80 w-full" /></CardContent></Card>
            </div>
        </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Dashboard do Gerente
        </h1>
        <DateRangePicker />
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Últimas Transações na Rede</CardTitle>
                    <CardDescription>As transações mais recentes da sua rede.</CardDescription>
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
                            <TableHead className='text-right'>Valor</TableHead>
                            <TableHead className='hidden sm:table-cell'>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.recentTransactions.map(transaction => (
                            <TableRow key={transaction.id}>
                                <TableCell className='font-medium'>{transaction.name}</TableCell>
                                <TableCell className='text-right'>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount)}</TableCell>
                                <TableCell className='hidden sm:table-cell'>
                                     <Badge variant={transaction.status === 'approved' ? 'success' : transaction.status === 'pending' ? 'warning' : 'destructive'}>
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
                    {data.recentRegistrations.map(user => (
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
                        <Pie data={data.revenueByMethod} dataKey="value" nameKey="method" innerRadius={60}>
                             {data.revenueByMethod.map((entry) => (
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
                        <Pie data={data.revenueByChurch} dataKey="revenue" nameKey="name" innerRadius={60}>
                             {data.revenueByChurch.map((entry, index) => (
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
                        <Pie data={data.membersByChurch} dataKey="count" nameKey="name" innerRadius={60}>
                            {data.membersByChurch.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>Novos Membros por Mês (Rede)</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={{}} className="h-[300px] w-full">
                    <BarChart data={data.newMembers} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
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
