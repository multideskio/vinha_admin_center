'use client'

import * as React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useParams } from 'next/navigation'
import { TransactionDetailLayout } from '@/components/transaction-detail-layout'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { format, parseISO } from 'date-fns'

type TransactionDetail = {
  id: string
  date: string
  amount: number
  status: 'approved' | 'pending' | 'refused' | 'refunded'
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

type TransactionDetailPageProps = {
  apiEndpoint: string
  backUrl: string
  backLabel: string
  fetchChurchInfo?: (churchId: string) => Promise<{ name: string; address: string } | null>
}

export function TransactionDetailPage({
  apiEndpoint,
  backUrl,
  backLabel,
  fetchChurchInfo,
}: TransactionDetailPageProps) {
  const [transaction, setTransaction] = React.useState<TransactionDetail | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const params = useParams()
  const { id } = params
  const { toast } = useToast()

  const fetchTransaction = React.useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const response = await fetch(`${apiEndpoint}/${id}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 404 || response.status === 403) {
          throw new Error(
            errorData.error || 'Transação não encontrada ou você não tem permissão para visualizá-la.',
          )
        }
        throw new Error(errorData.error || 'Falha ao carregar detalhes da transação')
      }
      const data = await response.json()

      // Se a transação está pendente (sem gatewayTransactionId)
      if (data.pending) {
        toast({
          title: 'Transação Pendente',
          description: data.message || 'Transação ainda não processada pela Cielo.',
          variant: 'default',
        })
        const pendingData: TransactionDetail = {
          id: data.transaction.id,
          date: new Date().toLocaleString('pt-BR'),
          amount: data.transaction.amount,
          status: data.transaction.status || 'pending',
          contributor: {
            name: 'N/A',
            email: data.contributorEmail || 'N/A',
          },
          church: null,
          payment: {
            method: data.transaction.paymentMethod || 'N/A',
            details: 'Aguardando processamento pela Cielo',
          },
        }
        setTransaction(pendingData)
        return
      }

      const cieloData = data.transaction
      if (!cieloData || !cieloData.Payment) {
        throw new Error('Dados da transação inválidos')
      }

      const payment = cieloData.Payment

      // Mapear status da Cielo: 0=Pendente, 1=Autorizado, 2=Pago, 3=Negado, 10=Cancelado, 11=Estornado, 13=Estornado
      let status: 'approved' | 'pending' | 'refused' | 'refunded' = 'pending'
      if (payment.Status === 2) status = 'approved'
      else if (payment.Status === 3) status = 'refused'
      else if (payment.Status === 10 || payment.Status === 11 || payment.Status === 13)
        status = 'refunded'

      // Buscar informações da igreja se originChurchId estiver disponível e fetchChurchInfo for fornecido
      // Nota: Pastor e Igreja são perfis separados (PF vs PJ), então nem todos os perfis precisam buscar igreja
      let churchInfo = null
      if (data.originChurchId && fetchChurchInfo) {
        try {
          churchInfo = await fetchChurchInfo(data.originChurchId)
        } catch (error) {
          console.error('Erro ao buscar informações da igreja:', error)
        }
      }

      // Montar detalhes do pagamento baseado no tipo
      let paymentDetails = 'N/A'
      if (payment.Type === 'CreditCard' && payment.CreditCard) {
        paymentDetails = `${payment.CreditCard.Brand || 'Cartão'} final ${payment.CreditCard.CardNumber?.slice(-4) || 'N/A'}`
      } else if (payment.Type === 'Pix' && payment.Pix) {
        // Para PIX pendente, mostrar instruções
        if (status === 'pending' && payment.Pix.QrCodeBase64) {
          paymentDetails = 'QR Code PIX disponível - Aguardando pagamento'
        } else if (payment.Pix.ProofOfSale) {
          paymentDetails = `Comprovante: ${payment.Pix.ProofOfSale}`
        } else {
          paymentDetails = 'PIX - Aguardando pagamento'
        }
      } else if (payment.Type === 'Boleto' && payment.Boleto) {
        // Para Boleto pendente, mostrar instruções
        if (status === 'pending' && payment.Boleto.BarCode) {
          paymentDetails = `Código de barras: ${payment.Boleto.BarCode} - Aguardando pagamento`
        } else if (payment.Boleto.DigitableLine) {
          paymentDetails = `Linha digitável: ${payment.Boleto.DigitableLine}`
        } else {
          paymentDetails = 'Boleto - Aguardando pagamento'
        }
      } else if (payment.ProofOfSale) {
        paymentDetails = payment.ProofOfSale
      }

      const formattedData: TransactionDetail = {
        id: payment.PaymentId || data.transaction?.id || (id as string),
        date: payment.ReceivedDate
          ? format(parseISO(payment.ReceivedDate), 'dd/MM/yyyy HH:mm:ss')
          : new Date().toLocaleString('pt-BR'),
        amount: payment.Amount ? payment.Amount / 100 : Number(data.transaction?.amount || 0),
        status,
        contributor: {
          name: cieloData.Customer?.Name || 'N/A',
          email: cieloData.Customer?.Email || data.contributorEmail || 'N/A',
        },
        church: churchInfo,
        payment: {
          method:
            payment.Type === 'CreditCard'
              ? 'Cartão de Crédito'
              : payment.Type === 'Pix'
                ? 'Pix'
                : payment.Type === 'Boleto'
                  ? 'Boleto'
                  : 'N/A',
          details: paymentDetails,
        },
        refundRequestReason: payment.VoidReason || data.transaction?.refundRequestReason || null,
      }

      setTransaction(formattedData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [id, apiEndpoint, fetchChurchInfo, toast])

  React.useEffect(() => {
    fetchTransaction()
  }, [fetchTransaction])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {/* Header Skeleton */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-videira-cyan via-videira-blue to-videira-purple opacity-90" />
          <div className="relative z-10 p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/20" />
                <Skeleton className="h-6 sm:h-8 w-48 sm:w-64 bg-white/20" />
              </div>
              <Skeleton className="h-9 sm:h-10 w-32 sm:w-40 bg-white/20" />
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
          <div className="grid auto-rows-max items-start gap-4 sm:gap-6 lg:col-span-2 lg:gap-8">
            <Skeleton className="h-48 sm:h-56 w-full rounded-xl" />
            <Skeleton className="h-40 sm:h-48 w-full rounded-xl" />
          </div>
          <div className="grid auto-rows-max items-start gap-4 sm:gap-6 lg:gap-8">
            <Skeleton className="h-36 sm:h-40 w-full rounded-xl" />
            <Skeleton className="h-36 sm:h-40 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 sm:gap-6 p-4 sm:p-6">
        <div className="text-center space-y-2 sm:space-y-3">
          <p className="text-base sm:text-lg font-semibold text-foreground">
            Transação não encontrada
          </p>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md">
            A transação que você está tentando visualizar não existe ou você não tem permissão para
            acessá-la.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href={backUrl}>{backLabel}</Link>
        </Button>
      </div>
    )
  }

  return (
    <TransactionDetailLayout transaction={transaction} backUrl={backUrl} backLabel={backLabel} />
  )
}

