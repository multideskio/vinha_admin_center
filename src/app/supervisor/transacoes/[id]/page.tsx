/**
 * @fileoverview Página de detalhes de transação individual (visão do supervisor).
 * @version 1.3
 * @date 2025-01-06
 * @author Sistema de Padronização
 * @lastReview 2025-01-06 18:30
 */

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

export default function TransacaoDetalhePage() {
  const [transaction, setTransaction] = React.useState<TransactionDetail | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const params = useParams()
  const { id } = params
  const { toast } = useToast()

  const fetchTransaction = React.useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/v1/supervisor/transacoes/${id}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Falha ao carregar detalhes da transação')
      }
      const data = await response.json()

      // Verificar se a transação está pendente
      if (data.pending) {
        toast({
          title: 'Transação Pendente',
          description: data.message || 'Transação ainda não processada pela Cielo.',
          variant: 'default',
        })
        // Criar dados básicos da transação pendente
        const pendingData: TransactionDetail = {
          id: data.transaction.id,
          date: new Date().toLocaleString('pt-BR'),
          amount: data.transaction.amount,
          status: 'pending',
          contributor: {
            name: 'N/A',
            email: 'N/A',
          },
          church: null,
          payment: {
            method: 'N/A',
            details: 'Aguardando processamento',
          },
        }
        setTransaction(pendingData)
        return
      }

      const cieloData = data.transaction
      if (!cieloData || !cieloData.Payment) {
        throw new Error('Dados da transação inválidos')
      }

      // Mapear status da Cielo: 0=Pendente, 1=Autorizado, 2=Pago, 3=Negado, 10=Cancelado, 13=Estornado
      const mapCieloStatus = (status: number): 'approved' | 'pending' | 'refused' | 'refunded' => {
        if (status === 2) return 'approved'
        if (status === 3) return 'refused'
        if (status === 10 || status === 13) return 'refunded'
        return 'pending'
      }

      // Buscar informações da igreja se originChurchId estiver disponível
      let churchInfo = null
      if (data.originChurchId) {
        try {
          const churchResponse = await fetch(`/api/v1/supervisor/igrejas/${data.originChurchId}`)
          if (churchResponse.ok) {
            const churchData = await churchResponse.json()
            churchInfo = {
              name: churchData.nomeFantasia || churchData.razaoSocial || 'Igreja',
              address: churchData.address
                ? `${churchData.address}, ${churchData.neighborhood || ''}, ${churchData.city || ''} - ${churchData.state || ''}`
                : 'Endereço não disponível',
            }
          }
        } catch (error) {
          console.error('Erro ao buscar informações da igreja:', error)
        }
      }

      const formattedData: TransactionDetail = {
        id: cieloData.Payment?.PaymentId || data.transaction?.id || (id as string),
        date: cieloData.Payment?.ReceivedDate
          ? format(parseISO(cieloData.Payment.ReceivedDate), 'dd/MM/yyyy HH:mm:ss')
          : new Date().toLocaleString('pt-BR'),
        amount: cieloData.Payment?.Amount ? cieloData.Payment.Amount / 100 : 0,
        status: cieloData.Payment?.Status ? mapCieloStatus(cieloData.Payment.Status) : 'pending',
        contributor: {
          name: cieloData.Customer?.Name || 'N/A',
          email: cieloData.Customer?.Email || data.contributorEmail || 'email@naodisponivel.com',
        },
        church: churchInfo,
        payment: {
          method: cieloData.Payment?.Type || 'N/A',
          details:
            cieloData.Payment?.Type === 'CreditCard' && cieloData.Payment.CreditCard
              ? `${cieloData.Payment.CreditCard.Brand || 'Cartão'} final ${cieloData.Payment.CreditCard.CardNumber?.slice(-4) || 'N/A'}`
              : cieloData.Payment?.ProofOfSale || 'N/A',
        },
        refundRequestReason: cieloData.Payment?.VoidReason || null,
      }

      setTransaction(formattedData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      console.error('Erro ao buscar transação:', error)
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [id, toast])

  React.useEffect(() => {
    fetchTransaction()
  }, [fetchTransaction])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {/* Header Skeleton */}
        <div className="relative overflow-hidden rounded-2xl shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-videira-cyan via-videira-blue to-videira-purple opacity-90" />
          <div className="relative z-10 p-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Skeleton className="h-10 w-32 mb-3 bg-white/20" />
                <Skeleton className="h-10 w-64 mb-2 bg-white/20" />
                <Skeleton className="h-5 w-48 bg-white/20" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <Skeleton className="h-8 w-32 bg-white/20" />
                <Skeleton className="h-10 w-40 bg-white/20" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
          <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
            {/* Transaction Info Card */}
            <div className="rounded-lg border border-border bg-card shadow-lg">
              <div className="border-b border-border p-6">
                <Skeleton className="h-6 w-48" />
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-px w-full" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-px w-full" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-px w-full" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            </div>

            {/* Payment Details Card */}
            <div className="rounded-lg border border-border bg-card shadow-lg">
              <div className="border-b border-border p-6">
                <Skeleton className="h-6 w-40" />
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-px w-full" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
            {/* Contributor Card */}
            <div className="rounded-lg border border-border bg-card shadow-lg">
              <div className="border-b border-border p-6">
                <Skeleton className="h-6 w-32" />
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <Skeleton className="h-3 w-16 mb-2" />
                  <Skeleton className="h-5 w-full" />
                </div>
                <Skeleton className="h-px w-full" />
                <div>
                  <Skeleton className="h-3 w-20 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </div>

            {/* Church Card (optional) */}
            <div className="rounded-lg border border-border bg-card shadow-lg">
              <div className="border-b border-border p-6">
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <Skeleton className="h-3 w-16 mb-2" />
                  <Skeleton className="h-5 w-full" />
                </div>
                <Skeleton className="h-px w-full" />
                <div>
                  <Skeleton className="h-3 w-20 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <p className="text-muted-foreground">Transação não encontrada.</p>
        <Button asChild>
          <Link href="/supervisor/transacoes">Voltar para Transações</Link>
        </Button>
      </div>
    )
  }

  return (
    <TransactionDetailLayout
      transaction={transaction}
      backUrl="/supervisor/transacoes"
      backLabel="Voltar para Transações"
    />
  )
}
