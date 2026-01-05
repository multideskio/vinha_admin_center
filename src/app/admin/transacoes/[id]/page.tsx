/**
 * @lastReview 2026-01-05 14:30 - Página de detalhes de transação revisada
 */
'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import {
  ChevronLeft,
  Copy,
  MessageSquareWarning,
  DollarSign,
  User,
  Church,
  CreditCard,
  Calendar,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

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
    address: string | null
  } | null
  payment: {
    method: string
    details: string
  }
  refundRequestReason: string | null
}

const statusConfig: Record<
  string,
  {
    text: string
    icon: React.ElementType
    color: string
    bgColor: string
    borderColor: string
  }
> = {
  approved: {
    text: 'Aprovada',
    icon: CheckCircle2,
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-500/15',
    borderColor: 'border-green-500/30',
  },
  pending: {
    text: 'Pendente',
    icon: Clock,
    color: 'text-yellow-700 dark:text-yellow-400',
    bgColor: 'bg-yellow-500/15',
    borderColor: 'border-yellow-500/30',
  },
  refused: {
    text: 'Recusada',
    icon: XCircle,
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-500/15',
    borderColor: 'border-red-500/30',
  },
  refunded: {
    text: 'Reembolsada',
    icon: RefreshCw,
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-500/15',
    borderColor: 'border-blue-500/30',
  },
}

const methodConfig: Record<string, { color: string }> = {
  PIX: { color: 'bg-videira-cyan/15 text-videira-cyan border-videira-cyan/30' },
  'Cartão de Crédito': { color: 'bg-videira-blue/15 text-videira-blue border-videira-blue/30' },
  Boleto: { color: 'bg-videira-purple/15 text-videira-purple border-videira-purple/30' },
}

const RefundModal = ({
  amount,
  status,
  transactionId,
  onSuccess,
}: {
  amount: number
  status: string
  transactionId: string
  onSuccess: () => void
}) => {
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
        variant: 'success',
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
        <Button
          size="sm"
          disabled={status !== 'approved'}
          className="bg-white dark:bg-background border-2 border-destructive text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
        >
          Solicitar Reembolso
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Reembolsar Transação</DialogTitle>
          <DialogDescription>
            Você pode reembolsar o valor total ou parcial da transação.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="font-mono text-lg"
            />
            <p className="text-xs text-muted-foreground">
              Valor máximo:{' '}
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                amount,
              )}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reason">Motivo do Reembolso *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo do reembolso..."
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleRefund}
            disabled={isLoading}
            className="bg-destructive hover:bg-destructive/90 text-white"
          >
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

  const fetchTransaction = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/v1/transacoes/${params.id}`)
      if (!response.ok) throw new Error('Falha ao carregar transação')
      const data = await response.json()
      setTransaction(data)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Falha ao carregar detalhes da transação',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [params.id, toast])

  React.useEffect(() => {
    fetchTransaction()
  }, [fetchTransaction])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {/* Header Skeleton */}
        <div className="relative overflow-hidden rounded-2xl p-8 bg-gradient-to-r from-muted via-muted/50 to-muted">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-10 w-32 rounded-full" />
          </div>
        </div>

        {/* Valor em Destaque Skeleton */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-12 w-48" />
              </div>
              <Skeleton className="h-20 w-20 rounded-2xl" />
            </div>
          </CardContent>
        </Card>

        {/* Grid Skeleton */}
        <div className="grid gap-6 md:grid-cols-[1fr_350px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-10 w-40" />
                  <Skeleton className="h-10 w-40" />
                  <Skeleton className="h-10 w-48" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Transação não encontrada</h2>
        <Link href="/admin/transacoes">
          <Button>Voltar para transações</Button>
        </Link>
      </div>
    )
  }

  const statusInfo = statusConfig[transaction.status] ?? statusConfig.pending
  const StatusIcon = statusInfo?.icon ?? AlertCircle

  return (
    <div className="flex flex-col gap-6">
      {/* Header Premium com Gradiente */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 videira-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/admin/transacoes">
                <Button
                  size="icon"
                  className="h-10 w-10 bg-white/20 hover:bg-white/30 text-white border-white/30 shadow-lg"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                    Detalhes da Transação
                  </h1>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => {
                      navigator.clipboard.writeText(transaction.id)
                      toast({
                        title: 'Copiado!',
                        description: 'ID da transação copiado',
                        variant: 'success',
                      })
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-white/80 text-sm mt-1 font-mono">ID: {transaction.id}</p>
                <p className="text-white/70 text-sm mt-1">{transaction.date}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                className={cn(
                  'text-base px-4 py-2 shadow-lg border-2 bg-white dark:bg-background font-bold',
                  statusInfo?.color ?? '',
                  statusInfo?.borderColor ?? '',
                )}
              >
                <StatusIcon className="h-4 w-4 mr-2" />
                {statusInfo?.text ?? transaction.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Valor em Destaque */}
      <Card className="shadow-xl border-t-4 border-t-videira-cyan bg-gradient-to-br from-videira-cyan/5 to-background">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Valor da Transação
              </p>
              <p className="text-5xl font-bold text-videira-cyan">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(transaction.amount)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-videira-cyan/15 ring-2 ring-videira-cyan/30 shadow-lg">
              <DollarSign className="h-12 w-12 text-videira-cyan" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Informações */}
      <div className="grid gap-6 md:grid-cols-[1fr_350px]">
        {/* Coluna Principal */}
        <div className="space-y-6">
          {/* Informações da Transação */}
          <Card className="shadow-lg border-l-4 border-l-videira-blue hover:shadow-xl transition-all">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <div className="p-2 rounded-lg bg-videira-blue/15 ring-2 ring-videira-blue/30">
                  <CreditCard className="h-5 w-5 text-videira-blue" />
                </div>
                Informações do Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Método de Pagamento</p>
                  <Badge
                    className={cn(
                      'text-sm border',
                      methodConfig[transaction.payment.method]?.color,
                    )}
                  >
                    {transaction.payment.method}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Data e Hora</p>
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-videira-blue" />
                    {transaction.date}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  ID da Transação Gateway
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-muted rounded-md text-xs font-mono">
                    {transaction.payment.details}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => {
                      navigator.clipboard.writeText(transaction.payment.details)
                      toast({
                        title: 'Copiado!',
                        description: 'ID copiado para área de transferência',
                        variant: 'success',
                      })
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Motivo de Reembolso (se houver) */}
          {transaction.refundRequestReason && (
            <Card className="shadow-lg border-l-4 border-l-destructive bg-gradient-to-br from-destructive/5 to-background">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-destructive/15 ring-2 ring-destructive/30">
                    <MessageSquareWarning className="h-5 w-5 text-destructive" />
                  </div>
                  Motivo da Solicitação de Reembolso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {transaction.refundRequestReason}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          <Card className="shadow-lg border-l-4 border-l-videira-purple">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <div className="p-2 rounded-lg bg-videira-purple/15 ring-2 ring-videira-purple/30">
                  <AlertCircle className="h-5 w-5 text-videira-purple" />
                </div>
                Ações Disponíveis
              </CardTitle>
              <CardDescription>Operações que podem ser realizadas nesta transação</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <RefundModal
                amount={transaction.amount}
                status={transaction.status}
                transactionId={transaction.id}
                onSuccess={fetchTransaction}
              />

              <Button
                size="sm"
                disabled={transaction.status !== 'approved'}
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/v1/transacoes/${params.id}/resend`, {
                      method: 'POST',
                    })
                    if (!response.ok) throw new Error('Falha ao reenviar comprovante')
                    toast({
                      title: 'Sucesso',
                      description: 'Comprovante reenviado com sucesso',
                      variant: 'success',
                    })
                  } catch (error) {
                    toast({
                      title: 'Erro',
                      description: error instanceof Error ? error.message : 'Erro ao reenviar',
                      variant: 'destructive',
                    })
                  }
                }}
                className="bg-white dark:bg-background border-2 border-videira-blue text-videira-blue hover:bg-videira-blue hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
              >
                Reenviar Comprovante
              </Button>

              <Button
                size="sm"
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/v1/transacoes/${params.id}/sync`, {
                      method: 'POST',
                    })
                    if (!response.ok) throw new Error('Falha ao sincronizar')
                    toast({
                      title: 'Sucesso',
                      description: 'Transação sincronizada com Cielo',
                      variant: 'success',
                    })
                    fetchTransaction()
                  } catch (error) {
                    toast({
                      title: 'Erro',
                      description: error instanceof Error ? error.message : 'Erro ao sincronizar',
                      variant: 'destructive',
                    })
                  }
                }}
                className="bg-white dark:bg-background border-2 border-videira-cyan text-videira-cyan hover:bg-videira-cyan hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Sincronizar com Cielo
              </Button>

              <Button
                size="sm"
                onClick={async () => {
                  if (
                    !confirm(
                      'Tem certeza que deseja marcar esta transação como fraude? Esta ação é irreversível.',
                    )
                  )
                    return

                  try {
                    const response = await fetch(`/api/v1/transacoes/${params.id}/fraud`, {
                      method: 'POST',
                    })
                    if (!response.ok) throw new Error('Falha ao marcar como fraude')
                    toast({
                      title: 'Sucesso',
                      description: 'Transação marcada como fraude',
                      variant: 'success',
                    })
                    fetchTransaction()
                  } catch (error) {
                    toast({
                      title: 'Erro',
                      description:
                        error instanceof Error ? error.message : 'Erro ao marcar como fraude',
                      variant: 'destructive',
                    })
                  }
                }}
                className="bg-white dark:bg-background border-2 border-destructive text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
              >
                Marcar como Fraude
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          {/* Contribuinte */}
          <Card className="shadow-lg border-t-4 border-t-videira-purple hover:shadow-xl transition-all">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-videira-purple/15 ring-2 ring-videira-purple/30">
                  <User className="h-5 w-5 text-videira-purple" />
                </div>
                Contribuinte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="font-bold text-lg">{transaction.contributor.name}</p>
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    {transaction.contributor.role === 'pastor'
                      ? 'Pastor'
                      : transaction.contributor.role === 'church_account'
                        ? 'Igreja'
                        : transaction.contributor.role === 'supervisor'
                          ? 'Supervisor'
                          : transaction.contributor.role === 'manager'
                            ? 'Gerente'
                            : 'Admin'}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">{transaction.contributor.email}</p>
                {transaction.contributor.phone && (
                  <p className="text-sm text-muted-foreground">{transaction.contributor.phone}</p>
                )}
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
              >
                <Button
                  size="sm"
                  className="w-full bg-white dark:bg-background border-2 border-videira-purple text-videira-purple hover:bg-videira-purple hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
                >
                  Ver perfil completo →
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Igreja */}
          <Card className="shadow-lg border-t-4 border-t-videira-cyan hover:shadow-xl transition-all">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-videira-cyan/15 ring-2 ring-videira-cyan/30">
                  <Church className="h-5 w-5 text-videira-cyan" />
                </div>
                Igreja de Origem
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transaction.church ? (
                <div className="space-y-2">
                  <p className="font-bold text-lg">{transaction.church.name}</p>
                  {transaction.church.address && (
                    <p className="text-sm text-muted-foreground">{transaction.church.address}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Não vinculada a uma igreja</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
