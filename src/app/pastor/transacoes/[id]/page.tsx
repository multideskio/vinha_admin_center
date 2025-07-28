
'use client';

import * as React from 'react';
import {
  ChevronLeft,
  Copy,
  CreditCard,
  File,
  ListFilter,
  MoreVertical,
  Truck,
  MessageSquareWarning,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Separator } from '@/components/ui/separator';
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


const transaction = {
    id: 'TRN-004',
    date: '27 de Julho, 2024',
    amount: 50.00,
    status: 'Aprovada' as 'Aprovada' | 'Pendente' | 'Recusada' | 'Reembolsada',
    church: {
        name: 'Comunidade da Graça',
        address: 'Av. Lins de Vasconcelos, 123, São Paulo, SP'
    },
    payment: {
        method: 'Pix',
        details: 'Chave: ana.beatriz@exemplo.com'
    },
}

export default function TransacaoDetalhePage() {
    return (
        <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="mx-auto grid max-w-3xl flex-1 auto-rows-max gap-4">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/pastor/transacoes">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Voltar</span>
                    </Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                  Detalhes da Transação
                </h1>
                <Badge variant="outline" className="ml-auto sm:ml-0">
                  {transaction.status}
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
                      <CardTitle>Transação {transaction.id}</CardTitle>
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
                      <CardTitle>Igreja</CardTitle>
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
                </div>
              </div>
            </div>
        </div>
    )
}
