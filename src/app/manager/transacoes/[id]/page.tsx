'use client'

import * as React from 'react'
import { ChevronLeft, Copy, Download } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

type Transaction = {
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
  }
  payment: {
    method: string
    details: string
  }
  refundRequestReason?: string | null
}

export default function TransacaoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const [transaction, setTransaction] = React.useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const { toast } = useToast()

  React.useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const response = await fetch(`/api/v1/manager/transacoes/${id}`)
        if (!response.ok) {
          throw new Error('Falha ao carregar a transação.')
        }
        const data = await response.json()
        setTransaction(data.transaction)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        toast({
          title: 'Erro',
          description: errorMessage,
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransaction()
  }, [id, toast])

  const statusMap: {
    [key: string]: { text: string; variant: 'success' | 'warning' | 'destructive' | 'outline' }
  } = {
    approved: { text: 'Aprovada', variant: 'success' },
    pending: { text: 'Pendente', variant: 'warning' },
    refused: { text: 'Recusada', variant: 'destructive' },
    refunded: { text: 'Reembolsada', variant: 'outline' },
  }

  const methodMap: { [key: string]: string } = {
    pix: 'PIX',
    credit_card: 'Cartão de Crédito',
    boleto: 'Boleto',
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copiado!',
      description: 'ID da transação copiado para a área de transferência.',
    })
  }

  const downloadPDF = () => {
    if (!transaction) return
    
    const content = `
      COMPROVANTE DE TRANSAÇÃO
      
      ID: ${transaction.id}
      Data: ${new Date(transaction.date).toLocaleDateString('pt-BR')}
      Valor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount)}
      Status: ${statusMap[transaction.status]?.text}
      
      CONTRIBUINTE
      Nome: ${transaction.contributor.name}
      Email: ${transaction.contributor.email}
      
      PAGAMENTO
      Método: ${methodMap[transaction.payment.method] || transaction.payment.method}
    `
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transacao-${transaction.id}.txt`
    a.click()
    URL.revokeObjectURL(url)
    
    toast({ title: 'Download iniciado', description: 'Comprovante baixado com sucesso.' })
  }

  if (isLoading) {
    return (
      <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="mx-auto grid max-w-5xl flex-1 auto-rows-max gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-7 w-7" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-6 w-24 ml-auto" />
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
            <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
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
          <Link href="/manager/transacoes">Voltar para Transações</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="mx-auto grid max-w-5xl flex-1 auto-rows-max gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-7 w-7" asChild>
            <Link href="/manager/transacoes">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Voltar</span>
            </Link>
          </Button>
          <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
            Detalhes da Transação
          </h1>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={downloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
            <Badge variant={statusMap[transaction.status]?.variant || 'outline'}>
              {statusMap[transaction.status]?.text || transaction.status}
            </Badge>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
          <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Informações da Transação</CardTitle>
                  <Button
                    aria-label="Copiar ID da Transação"
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(transaction.id)}
                  >
                    <Copy className="h-3.5 w-3.5 mr-2" />
                    Copiar ID
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">ID da Transação</span>
                    <span className="text-sm font-mono">{transaction.id}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Valor</span>
                    <span className="text-lg font-bold text-green-600">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(transaction.amount)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Data</span>
                    <span className="text-sm font-medium">
                      {new Date(transaction.date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={statusMap[transaction.status]?.variant || 'outline'}>
                      {statusMap[transaction.status]?.text || transaction.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            {transaction.refundRequestReason && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Motivo da Solicitação de Reembolso</CardTitle>
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
              <CardContent className="grid gap-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Método</span>
                  <span className="text-sm font-medium">{methodMap[transaction.payment.method] || transaction.payment.method}</span>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Contribuinte</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <div className="grid gap-1">
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-semibold">{transaction.contributor.name}</p>
                </div>
                <Separator className="my-2" />
                <div className="grid gap-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-sm">{transaction.contributor.email}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
