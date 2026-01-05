'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import {
  ChevronLeft,
  Download,
  ArrowRightLeft,
  User,
  MessageSquareWarning,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { type TransactionStatus } from '@/lib/types'

type TransactionDetail = {
  id: string
  date: string
  amount: number
  status: TransactionStatus
  contributor: {
    name: string
    email: string
  }
  church: {
    name: string
    address: string
  } | null
  payment: {
    method: string
    details: string
  }
  refundRequestReason?: string | null
}

export default function TransacaoDetalhePage(): JSX.Element {
  const [transaction, setTransaction] = React.useState<TransactionDetail | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const params = useParams()
  const { id } = params
  const { toast } = useToast()

  const fetchTransaction = React.useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/v1/igreja/transacoes/${id}`)
      if (!response.ok) throw new Error('Falha ao carregar transação.')
      const data = await response.json()
      setTransaction(data)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [id, toast])

  React.useEffect(() => {
    fetchTransaction()
  }, [fetchTransaction])

  const statusMap: {
    approved: { text: string; variant: 'success' }
    pending: { text: string; variant: 'warning' }
    refused: { text: string; variant: 'destructive' }
    refunded: { text: string; variant: 'outline' }
  } = {
    approved: { text: 'Aprovada', variant: 'success' },
    pending: { text: 'Pendente', variant: 'warning' },
    refused: { text: 'Recusada', variant: 'destructive' },
    refunded: { text: 'Reembolsada', variant: 'outline' },
  }

  if (isLoading || !transaction) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  const statusInfo = statusMap[transaction.status]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 videira-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />

        <div className="relative z-10 p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/igreja/transacoes">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                  Detalhes da Transação
                </h1>
                <p className="text-white/90 mt-1">ID: {transaction.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={statusInfo.variant} className="text-base px-4 py-1">
                {statusInfo.text}
              </Badge>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <Download className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Transaction Info */}
        <Card className="shadow-lg border-t-4 border-t-videira-cyan">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-videira-cyan" />
              Informações da Transação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Valor</p>
                <p className="text-lg font-bold text-videira-cyan">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    transaction.amount,
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="font-semibold">
                  {new Date(transaction.date).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Método de Pagamento</p>
              <p className="font-semibold">{transaction.payment.method}</p>
              {transaction.payment.details && (
                <p className="text-sm text-muted-foreground mt-1">{transaction.payment.details}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contributor Info */}
        <Card className="shadow-lg border-t-4 border-t-videira-blue">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-videira-blue" />
              Contribuinte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-semibold">{transaction.contributor.name}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">E-mail</p>
              <p className="font-semibold break-all">{transaction.contributor.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Refund Reason if exists */}
        {transaction.refundRequestReason && (
          <Card className="md:col-span-2 shadow-lg border-t-4 border-t-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareWarning className="h-5 w-5 text-destructive" />
                Motivo do Reembolso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{transaction.refundRequestReason}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
