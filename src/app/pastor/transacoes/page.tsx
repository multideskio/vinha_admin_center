
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Transaction = {
  id: string;
  amount: number;
  type: 'Dízimo' | 'Oferta';
  description?: string;
  method: 'Pix' | 'Cartão de Crédito' | 'Boleto';
  status: 'Aprovada' | 'Pendente' | 'Recusada' | 'Reembolsada';
  date: string;
};

const transactions: Transaction[] = [
    { id: 'TRN-001', amount: 150.00, type: 'Dízimo', method: 'Pix', status: 'Aprovada', date: '28/07/2024' },
    { id: 'TRN-002', amount: 75.50, type: 'Oferta', description: 'Oferta para a missionária Joana', method: 'Cartão de Crédito', status: 'Aprovada', date: '28/07/2024' },
    { id: 'TRN-003', amount: 200.00, type: 'Dízimo', method: 'Boleto', status: 'Pendente', date: '27/07/2024' },
    { id: 'TRN-004', amount: 50.00, type: 'Oferta', method: 'Pix', status: 'Aprovada', date: '27/07/2024' },
    { id: 'TRN-005', amount: 300.00, type: 'Dízimo', method: 'Cartão de Crédito', status: 'Recusada', date: '26/07/2024' },
    { id: 'TRN-006', amount: 120.00, type: 'Oferta', method: 'Pix', status: 'Aprovada', date: '26/07/2024' },
];

export default function TransacoesPage() {
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-end gap-2 pb-4">
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
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden md:table-cell">Descrição</TableHead>
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
                  <TableCell className="font-medium">{transaction.type}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {transaction.description ? (
                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <span className='truncate max-w-[150px] inline-block'>{transaction.description}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {transaction.description}
                                </TooltipContent>
                            </Tooltip>
                         </TooltipProvider>
                    ) : (
                      '-'
                    )}
                  </TableCell>
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
