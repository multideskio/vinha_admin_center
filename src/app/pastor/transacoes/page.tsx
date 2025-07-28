
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
  church: string;
  amount: number;
  method: 'Pix' | 'Cartão de Crédito' | 'Boleto';
  status: 'Aprovada' | 'Pendente' | 'Recusada' | 'Reembolsada';
  date: string;
};

const transactions: Transaction[] = [
    { id: 'TRN-001', church: 'Assembleia de Deus Madureira', amount: 150.00, method: 'Pix', status: 'Aprovada', date: '28/07/2024' },
    { id: 'TRN-002', church: 'IURD', amount: 75.50, method: 'Cartão de Crédito', status: 'Aprovada', date: '28/07/2024' },
    { id: 'TRN-003', church: 'Igreja Batista', amount: 200.00, method: 'Boleto', status: 'Pendente', date: '27/07/2024' },
    { id: 'TRN-004', church: 'Comunidade da Graça', amount: 50.00, method: 'Pix', status: 'Aprovada', date: '27/07/2024' },
    { id: 'TRN-005', church: 'Videira', amount: 300.00, method: 'Cartão de Crédito', status: 'Recusada', date: '26/07/2024' },
    { id: 'TRN-006', church: 'Fonte da Vida', amount: 120.00, method: 'Pix', status: 'Aprovada', date: '26/07/2024' },
];

export default function TransacoesPage() {
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-end gap-2 pb-4">
                <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                    type="search"
                    placeholder="Buscar por igreja..."
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
                    <DropdownMenuCheckboxItem>Reembolsada</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <DateRangePicker />
                <Button size="sm" variant="outline" className="gap-1">
                    <Download className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only">Exportar</span>
                </Button>
            </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Igreja</TableHead>
                <TableHead className="hidden md:table-cell text-right">Valor</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.church}</TableCell>
                  <TableCell className="hidden md:table-cell text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount)}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                  <Badge variant={transaction.status === 'Aprovada' ? 'default' 
                      : transaction.status === 'Pendente' ? 'secondary' 
                      : transaction.status === 'Reembolsada' ? 'outline'
                      : 'destructive'}
                        className={transaction.status === 'Aprovada' ? 'bg-green-500/20 text-green-700 border-green-400'
                        : transaction.status === 'Pendente' ? 'bg-amber-500/20 text-amber-700 border-amber-400'
                        : transaction.status === 'Reembolsada' ? 'bg-blue-500/20 text-blue-700 border-blue-400'
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
                          <Link href={`/pastor/transacoes/${transaction.id}`}>Ver Detalhes</Link>
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
