
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
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';


type Transaction = {
  id: string;
  amount: number;
  type?: 'Dízimo' | 'Oferta';
  description?: string;
  method: 'Pix' | 'Cartão de Crédito' | 'Boleto';
  status: 'approved' | 'pending' | 'refused' | 'refunded';
  date: string;
};

export default function TransacoesPage() {
    const [transactions, setTransactions] = React.useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const { toast } = useToast();

    const fetchTransactions = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/v1/pastor/transacoes');
            if (!response.ok) throw new Error('Falha ao carregar transações.');
            const data = await response.json();
            setTransactions(data.transactions);
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive'});
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    React.useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const statusMap: { [key: string]: { text: string; variant: "success" | "warning" | "destructive" | "outline" } } = {
        approved: { text: "Aprovada", variant: "success" },
        pending: { text: "Pendente", variant: "warning" },
        refused: { text: "Recusada", variant: "destructive" },
        refunded: { text: "Reembolsada", variant: "outline" },
    };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Minhas Contribuições
        </h1>
        <p className="text-sm text-muted-foreground">
          Visualize seu histórico de dízimos e ofertas.
        </p>
      </div>
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
              {isLoading ? (
                Array.from({length: 5}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                ))
              ) : transactions.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">Nenhuma transação encontrada.</TableCell>
                </TableRow>
              ) : transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.type || 'N/A'}</TableCell>
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
                    <Badge variant={statusMap[transaction.status]?.variant || 'default'}>
                        {statusMap[transaction.status]?.text || transaction.status}
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
