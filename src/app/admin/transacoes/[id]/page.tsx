'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { ChevronLeft, Copy, MoreVertical, MessageSquareWarning } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Textarea } from '@/components/ui/textarea'

type Transaction = {
  id: string
  date: string
  amount: number
  status: 'approved' | 'pending' | 'refused' | 'refunded'
  contributor: {
    id: string
    name: string
    email: string
    phone: string | null
    role: string
  }
  church: {
    name: string
    address: string
  } | null
  payment: {
    method: string
    details: string
  }
  refundRequestReason: string | null
}

const RefundModal = ({ amount, status, transactionId, onSuccess }: { amount: number; status: string; transactionId: string; onSuccess: () => void }) => {
  const [refundAmount, setRefundAmount] = React.useState(amount.toFixed(2))
  const [reason, setReason] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const { toast } = useToast()

  const handleRefund = async () => {
    if (!reason.trim()) {
      toast({
        title: 'Erro',
        description: 'Motivo do reembolso é obrigatório',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/v1/transacoes/${transactionId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(refundAmount),
          reason,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Falha ao processar reembolso')
      }

      toast({
        title: 'Sucesso',
        description: 'Reembolso processado com sucesso',
      })
      setOpen(false)
      onSuccess()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao processar reembolso',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={status !== 'approved'}>
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
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleRefund} disabled={isLoading}>
            {isLoading ? 'Processando...' : 'Confirmar Reembolso'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function TransacaoDetalhePage() {
  const params = useParams()
  const { toast } = useToast()
  const [transaction, setTransaction] = React.useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const response = await fetch(`/api/v1/transacoes/${params.id}`)
        if (!response.ok) throw new Error('Falha ao carregar transação')
        const data = await response.json()
        setTransaction(data)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchTransaction()
  }, [params.id])

  if (isLoading || !transaction) {
    return <div className="p-8">Carregando...</div>
  }

  const statusMap: Record<string, string> = {
    approved: 'Aprovada',
    pending: 'Pendente',
    refused: 'Recusada',
    refunded: 'Reembolsada',
  }

  return (
    <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="mx-auto grid max-w-5xl flex-1 auto-rows-max gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-7 w-7" asChild>
            <Link href="/admin/transacoes">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Voltar</span>
            </Link>
          </Button>
          <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
            Detalhes da Transação
          </h1>
          <Badge variant="outline" className="ml-auto sm:ml-0">
            {statusMap[transaction.status] || transaction.status}
          </Badge>
          <div className="hidden items-center gap-2 md:ml-auto md:flex">
            <RefundModal 
            amount={transaction.amount} 
            status={transaction.status} 
            transactionId={transaction.id}
            onSuccess={() => window.location.reload()}
          />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-3.5 w-3.5" />
                  <span className="sr-only">Mais</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/v1/transacoes/${params.id}/resend`, {
                        method: 'POST',
                      })
                      if (!response.ok) throw new Error('Falha ao reenviar comprovante')
                      toast({
                        title: 'Sucesso',
                        description: 'Comprovante reenviado com sucesso',
                      })
                    } catch (error) {
                      toast({
                        title: 'Erro',
                        description: error instanceof Error ? error.message : 'Erro ao reenviar',
                        variant: 'destructive',
                      })
                    }
                  }}
                  disabled={transaction.status !== 'approved'}
                >
                  Reenviar Comprovante
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={async () => {
                    if (!confirm('Tem certeza que deseja marcar esta transação como fraude? Esta ação é irreversível.')) return
                    
                    try {
                      const response = await fetch(`/api/v1/transacoes/${params.id}/fraud`, {
                        method: 'POST',
                      })
                      if (!response.ok) throw new Error('Falha ao marcar como fraude')
                      toast({
                        title: 'Sucesso',
                        description: 'Transação marcada como fraude',
                      })
                      window.location.reload()
                    } catch (error) {
                      toast({
                        title: 'Erro',
                        description: error instanceof Error ? error.message : 'Erro ao marcar como fraude',
                        variant: 'destructive',
                      })
                    }
                  }}
                >
                  Marcar como Fraude
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
          <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Transação {transaction.id}</CardTitle>
                <Button
                  aria-label="Copiar ID da Transação"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => {
                    navigator.clipboard.writeText(transaction.id)
                    toast({
                      title: 'Copiado!',
                      description: 'ID da transação copiado para área de transferência',
                    })
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-muted-foreground">Valor</div>
                    <div className="font-semibold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(transaction.amount)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-muted-foreground">Data</div>
                    <div>{transaction.date}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-muted-foreground">Status</div>
                    <div>
                      <Badge
                        variant={
                          transaction.status === 'approved'
                            ? 'default'
                            : transaction.status === 'pending'
                              ? 'secondary'
                              : transaction.status === 'refunded'
                                ? 'outline'
                                : 'destructive'
                        }
                        className={
                          transaction.status === 'approved'
                            ? 'bg-green-500/20 text-green-700 border-green-400'
                            : transaction.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-700 border-amber-400'
                              : transaction.status === 'refunded'
                                ? 'bg-blue-500/20 text-blue-700 border-blue-400'
                                : 'bg-red-500/20 text-red-700 border-red-400'
                        }
                      >
                        {statusMap[transaction.status] || transaction.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {transaction.refundRequestReason && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageSquareWarning className="h-5 w-5" />
                    Motivo da Solicitação de Reembolso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{transaction.refundRequestReason}</p>
                </CardContent>
              </Card>
            )}
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
                  <div className="grid gap-1 flex-1">
                    <p className="font-semibold">{transaction.contributor.name}</p>
                    <p className="text-sm text-muted-foreground">{transaction.contributor.email}</p>
                    {transaction.contributor.phone && (
                      <p className="text-sm text-muted-foreground">{transaction.contributor.phone}</p>
                    )}
                  </div>
                </div>
                <Link
                  href={`/admin/${
                    transaction.contributor.role === 'manager'
                      ? 'gerentes'
                      : transaction.contributor.role === 'supervisor'
                        ? 'supervisores'
                        : transaction.contributor.role === 'pastor'
                          ? 'pastores'
                          : transaction.contributor.role === 'church_account'
                            ? 'igrejas'
                            : '#'
                  }/${transaction.contributor.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  Ver perfil completo →
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Igreja</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex items-start gap-4">
                  <div className="grid gap-1">
                    <p className="font-semibold">{transaction.church?.name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{transaction.church?.address || '-'}</p>
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
