
'use client';

import * as React from 'react';
import {
  Download,
  ListFilter,
  MoreHorizontal,
  Search,
} from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { DateRangePicker } from '@/components/ui/date-range-picker';

type Transaction = {
  id: string;
  contributor: string;
  church: string;
  amount: number;
  method: 'Pix' | 'Cartão de Crédito' | 'Boleto';
  status: 'Aprovada' | 'Pendente' | 'Recusada';
  date: string;
};

const transactions: Transaction[] = [
    { id: 'TRN-001', contributor: 'João Silva', church: 'Assembleia de Deus Madureira', amount: 150.00, method: 'Pix', status: 'Aprovada', date: '28/07/2024' },
    { id: 'TRN-002', contributor: 'Maria Oliveira', church: 'IURD', amount: 75.50, method: 'Cartão de Crédito', status: 'Aprovada', date: '28/07/2024' },
    { id: 'TRN-003', contributor: 'Carlos Andrade', church: 'Igreja Batista', amount: 200.00, method: 'Boleto', status: 'Pendente', date: '27/07/2024' },
    { id: 'TRN-004', contributor: 'Ana Beatriz', church: 'Comunidade da Graça', amount: 50.00, method: 'Pix', status: 'Aprovada', date: '27/07/2024' },
    { id: 'TRN-005', contributor: 'Paulo Ferreira', church: 'Videira', amount: 300.00, method: 'Cartão de Crédito', status: 'Recusada', date: '26/07/2024' },
    { id: 'TRN-006', contributor: 'Jabez Henrique', church: 'Fonte da Vida', amount: 120.00, method: 'Pix', status: 'Aprovada', date: '26/07/2024' },
    { id: 'TRN-007', contributor: 'Lucas Mendes', church: 'Renascer em Cristo', amount: 90.00, method: 'Boleto', status: 'Aprovada', date: '25/07/2024' },
    { id: 'TRN-008', contributor: 'Fernanda Costa', church: 'Bola de Neve', amount: 250.00, method: 'Cartão de Crédito', status: 'Aprovada', date: '25/07/2024' },
    { id: 'TRN-009', contributor: 'José Contas', church: 'Igreja Presbiteriana', amount: 80.00, method: 'Pix', status: 'Pendente', date: '24/07/2024' },
    { id: 'TRN-010', contributor: 'Maria Finanças', church: 'Igreja Metodista', amount: 450.00, method: 'Boleto', status: 'Aprovada', date: '24/07/2024' },
];

export default function TransacoesPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Transações
        </h1>
        <p className="text-sm text-muted-foreground">
          Gerencie todas as transações financeiras.
        </p>
      </div>

      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className='flex-1'>
                    <CardTitle>Histórico de Transações</CardTitle>
                    <CardDescription>
                    Visualize e filtre o histórico completo de transações.
                    </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                        type="search"
                        placeholder="Buscar por contribuinte..."
                        className="pl-8 w-full sm:w-[250px]"
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1">
                            <ListFilter className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only">Filtro</span>
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Filtrar por Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem checked>Aprovada</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem>Pendente</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem>Recusada</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DateRangePicker />
                    <Button size="sm" variant="outline" className="gap-1">
                        <Download className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only">Exportar</span>
                    </Button>
                </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contribuinte</TableHead>
                <TableHead className="hidden lg:table-cell">Igreja</TableHead>
                <TableHead className="hidden md:table-cell text-right">Valor</TableHead>
                <TableHead className="hidden sm:table-cell">Método</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.contributor}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{transaction.church}</TableCell>
                  <TableCell className="hidden md:table-cell text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount)}</TableCell>
                  <TableCell className="hidden sm:table-cell">{transaction.method}</TableCell>
                  <TableCell>
                  <Badge variant={transaction.status === 'Aprovada' ? 'default' : transaction.status === 'Pendente' ? 'secondary' : 'destructive'}
                        className={transaction.status === 'Aprovada' ? 'bg-green-500/20 text-green-700 border-green-400'
                        : transaction.status === 'Pendente' ? 'bg-amber-500/20 text-amber-700 border-amber-400'
                        : 'bg-red-500/20 text-red-700 border-red-400'}>
                        {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{transaction.date}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/transacoes/${transaction.id}`}>Ver Detalhes</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>Reenviar Comprovante</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
