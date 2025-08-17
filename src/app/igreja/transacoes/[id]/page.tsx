/**
* @fileoverview Página de detalhes da transação (visão da igreja).
* @version 1.2
* @date 2024-08-07
* @author PH
*/

'use client';

import * as React from 'react';
import {
  ChevronLeft,
  Copy,
  MessageSquareWarning,
  MoreVertical,
} from 'lucide-react';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
  } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { type TransactionStatus } from '@/lib/types';

type TransactionDetail = {
    id: string;
    date: string;
    amount: number;
    status: TransactionStatus;
    contributor: {
        name: string;
        email: string;
    };
    church: {
        name: string;
        address: string;
    } | null;
    payment: {
        method: string;
        details: string;
    };
    refundRequestReason?: string | null;
};

const RefundModal = ({ amount, transactionId, onRefundSuccess }: { amount: number, transactionId: string, onRefundSuccess: () => void }) => {
    const [refundAmount, setRefundAmount] = React.useState(amount.toFixed(2));
    const [reason, setReason] = React.useState('');
    const { toast } = useToast();

    const handleRefund = async () => {
        toast({ title: 'Processando', description: 'Enviando solicitação de reembolso...'});
        // Simulação de chamada de API
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(`Reembolsando: ${refundAmount} para a transação ${transactionId}. Motivo: ${reason}`);
        toast({ title: 'Sucesso!', description: `Reembolso de R$ ${refundAmount} solicitado com sucesso.`, variant: 'success' });
        onRefundSuccess();
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={transaction.status !== 'approved'}>
                    Reembolso
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Reembolsar Transação</DialogTitle>
                    <DialogDescription>
                        Você pode reembolsar o valor total ou parcial da transação.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">
                            Valor (R$)
                        </Label>
                        <Input
                            id="amount"
                            type="number"
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="reason" className="text-right pt-2">
                            Motivo
                        </Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="col-span-3"
                            placeholder="Digite o motivo do reembolso..."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button onClick={handleRefund}>Confirmar Reembolso</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function TransacaoDetalhePage(): JSX.Element {
    const [transaction, setTransaction] = React.useState<TransactionDetail | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const params = useParams();
    const { id } = params;
    const { toast } = useToast();
    
    const fetchTransaction = React.useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const response = await fetch(`/api/v1/igreja/transacoes/${id}`);
            if (!response.ok) throw new Error('Falha ao carregar detalhes da transação');
            const data = await response.json();
            setTransaction(data.transaction);
        } catch (error: any) {
            toast({ title: "Erro", description: error.message, variant: 'destructive'});
        } finally {
            setIsLoading(false);
        }
    }, [id, toast]);

    React.useEffect(() => {
        fetchTransaction();
    }, [fetchTransaction]);

    if (isLoading) {
        return (
             <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                <div className="mx-auto grid max-w-5xl flex-1 auto-rows-max gap-4">
                    <Skeleton className="h-8 w-1/2" />
                     <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-2 lg:gap-8">
                        <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                            <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
                            <Card><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
                        </div>
                        <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                            <Card><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
                        </div>
                     </div>
                </div>
            </div>
        )
    }

    if (!transaction) {
        return <p>Transação não encontrada.</p>
    }

    const statusMap: { [key in TransactionStatus]: { text: string; variant: "success" | "warning" | "destructive" | "outline" } } = {
        approved: { text: "Aprovada", variant: "success" },
        pending: { text: "Pendente", variant: "warning" },
        refused: { text: "Recusada", variant: "destructive" },
        refunded: { text: "Reembolsada", variant: "outline" },
    };

    return (
        <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="mx-auto grid max-w-3xl flex-1 auto-rows-max gap-4">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/igreja/transacoes">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Voltar</span>
                    </Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                  Detalhes da Transação
                </h1>
                <Badge variant="outline" className="ml-auto sm:ml-0">
                  {statusMap[transaction.status].text}
                </Badge>
                <div className="hidden items-center gap-2 md:ml-auto md:flex">
                  <Button variant="outline" size="sm">
                    Reenviar Comprovante
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-2 lg:gap-8">
                <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Transação #{transaction.id.substring(0, 8)}...</CardTitle>
                       <Button
                            aria-label="Copiar ID da Transação"
                            size="icon"
                            variant="ghost"
                            className='h-7 w-7'
                        >
                            <Copy className="h-3.5 w-3.5" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        <div className='flex items-center justify-between'>
                            <div className="font-medium text-muted-foreground">Valor</div>
                            <div className='font-semibold'>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount)}</div>
                        </div>
                        <div className='flex items-center justify-between'>
                            <div className="font-medium text-muted-foreground">Data</div>
                            <div>{transaction.date}</div>
                        </div>
                        <div className='flex items-center justify-between'>
                            <div className="font-medium text-muted-foreground">Status</div>
                            <div>
                                <Badge variant={statusMap[transaction.status].variant}>
                                    {statusMap[transaction.status].text}
                                </Badge>
                            </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                   <Card>
                    <CardHeader>
                      <CardTitle>Detalhes do Pagamento</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Método</dt>
                        <dd>{transaction.payment.method}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Detalhes</dt>
                        <dd className="text-right">{transaction.payment.details}</dd>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                 <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Contribuinte</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <div className="flex items-start gap-4">
                        <div className="grid gap-1">
                            <p className="font-semibold">{transaction.contributor.name}</p>
                            <p className="text-sm text-muted-foreground">{transaction.contributor.email}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {transaction.church &&
                    <Card>
                        <CardHeader>
                        <CardTitle>Igreja de Origem</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                        <div className="flex items-start gap-4">
                          <div className="grid gap-1">
                              <p className="font-semibold">{transaction.church.name}</p>
                              <p className="text-sm text-muted-foreground">{transaction.church.address}</p>
                          </div>
                        </div>
                        </CardContent>
                    </Card>
                  }
                </div>
              </div>
            </div>
        </div>
    )
}
