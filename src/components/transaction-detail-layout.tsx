'use client'

import * as React from 'react'
import {
  ChevronLeft,
  Copy,
  Download,
  ArrowRightLeft,
  User,
  MessageSquareWarning,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

type TransactionDetailLayoutProps = {
  transaction: {
    id: string
    date: string
    amount: number
    status: 'approved' | 'pending' | 'refused' | 'refunded'
    contributor: {
      name: string
      email: string
    }
    church?: {
      name: string
      address: string
    } | null
    payment: {
      method: string
      details?: string
    }
    refundRequestReason?: string | null
  }
  backUrl: string
  backLabel: string
}

export function TransactionDetailLayout({
  transaction,
  backUrl,
  backLabel,
}: TransactionDetailLayoutProps) {
  const { toast } = useToast()

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
    CreditCard: 'Cartão de Crédito',
    Pix: 'PIX',
    Boleto: 'Boleto',
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copiado!',
      description: 'ID da transação copiado para a área de transferência.',
    })
  }

  const downloadReceipt = () => {
    // Não permitir download para transações pendentes
    if (transaction.status === 'pending') {
      toast({
        title: 'Download não disponível',
        description: 'Recibo só está disponível para transações aprovadas.',
        variant: 'destructive',
      })
      return
    }

    // Gerar PDF usando jsPDF
    import('jspdf')
      .then((jsPDFModule) => {
        const jsPDF = jsPDFModule.default || jsPDFModule
        const doc = new jsPDF()

        // Header
        doc.setFontSize(20)
        doc.setFont('helvetica', 'bold')
        doc.text('RECIBO DE TRANSAÇÃO', 20, 30)

        // Linha separadora
        doc.setLineWidth(0.5)
        doc.line(20, 35, 190, 35)

        // Informações da transação
        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')

        let yPos = 50
        const lineHeight = 8

        doc.text(`ID da Transação: ${transaction.id}`, 20, yPos)
        yPos += lineHeight

        doc.text(
          `Data: ${new Date(transaction.date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}`,
          20,
          yPos,
        )
        yPos += lineHeight

        doc.text(
          `Valor: ${new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(transaction.amount)}`,
          20,
          yPos,
        )
        yPos += lineHeight

        doc.text(`Status: ${statusMap[transaction.status]?.text}`, 20, yPos)
        yPos += lineHeight * 2

        // Seção Contribuinte
        doc.setFont('helvetica', 'bold')
        doc.text('CONTRIBUINTE', 20, yPos)
        yPos += lineHeight

        doc.setFont('helvetica', 'normal')
        doc.text(`Nome: ${transaction.contributor.name}`, 20, yPos)
        yPos += lineHeight

        doc.text(`Email: ${transaction.contributor.email}`, 20, yPos)
        yPos += lineHeight * 2

        // Seção Pagamento
        doc.setFont('helvetica', 'bold')
        doc.text('PAGAMENTO', 20, yPos)
        yPos += lineHeight

        doc.setFont('helvetica', 'normal')
        doc.text(
          `Método: ${methodMap[transaction.payment.method] || transaction.payment.method}`,
          20,
          yPos,
        )

        if (transaction.payment.details) {
          yPos += lineHeight
          doc.text(`Detalhes: ${transaction.payment.details}`, 20, yPos)
        }

        // Footer
        yPos += lineHeight * 3
        doc.setFontSize(10)
        doc.setFont('helvetica', 'italic')
        doc.text('Este documento foi gerado automaticamente pelo sistema.', 20, yPos)
        yPos += lineHeight
        doc.text(
          `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
          20,
          yPos,
        )

        // Salvar PDF
        const fileName = `recibo-transacao-${transaction.id.slice(0, 8)}.pdf`
        doc.save(fileName)

        toast({
          title: 'Download concluído',
          description: 'Recibo baixado com sucesso.',
        })
      })
      .catch(() => {
        toast({
          title: 'Erro no download',
          description: 'Não foi possível gerar o recibo. Tente novamente.',
          variant: 'destructive',
        })
      })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header com gradiente Videira */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg">
        <div className="absolute inset-0 videira-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

        <div className="relative z-10 p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <Link href={backUrl}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/90 hover:text-white hover:bg-white/20 mb-3 -ml-2 text-xs sm:text-sm"
                >
                  <ChevronLeft className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {backLabel}
                </Button>
              </Link>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-2 sm:gap-3 break-words">
                <ArrowRightLeft className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" />
                <span>Detalhes da Transação</span>
              </h1>
              <p className="text-sm sm:text-base text-white/90 mt-2 font-medium break-words">
                ID: {transaction.id}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 sm:gap-3 w-full sm:w-auto">
              <Badge
                variant={statusMap[transaction.status]?.variant || 'outline'}
                className={cn(
                  'text-xs sm:text-sm px-4 sm:px-6 py-1.5 sm:py-2 font-bold shadow-xl border-2 transition-all w-full sm:w-auto text-center',
                  transaction.status === 'approved' &&
                    'bg-green-500 text-white border-green-400 hover:bg-green-600',
                  transaction.status === 'pending' &&
                    'bg-yellow-500 text-white border-yellow-400 hover:bg-yellow-600',
                  transaction.status === 'refused' &&
                    'bg-red-500 text-white border-red-400 hover:bg-red-600',
                  transaction.status === 'refunded' &&
                    'bg-gray-500 text-white border-gray-400 hover:bg-gray-600',
                )}
              >
                {statusMap[transaction.status]?.text || transaction.status}
              </Badge>
              <Button
                onClick={downloadReceipt}
                disabled={transaction.status === 'pending'}
                className={cn(
                  'shadow-lg font-semibold text-xs sm:text-sm w-full sm:w-auto',
                  transaction.status === 'pending'
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed hover:bg-gray-400'
                    : 'bg-white text-videira-blue hover:bg-white/90',
                )}
              >
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">
                  {transaction.status === 'pending' ? 'Recibo Indisponível' : 'Baixar Recibo'}
                </span>
                <span className="sm:hidden">
                  {transaction.status === 'pending' ? 'Indisponível' : 'Recibo'}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
        <div className="grid auto-rows-max items-start gap-4 sm:gap-6 lg:col-span-2 lg:gap-8">
          <Card className="shadow-lg border-t-4 border-t-videira-cyan">
            <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <ArrowRightLeft className="h-4 w-4 sm:h-5 sm:w-5 text-videira-cyan flex-shrink-0" />
                  <span className="break-words">Informações da Transação</span>
                </CardTitle>
                <Button
                  aria-label="Copiar ID da Transação"
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(transaction.id)}
                  className="border-2 hover:border-videira-cyan text-xs sm:text-sm w-full sm:w-auto"
                >
                  <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Copiar ID
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="grid gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 py-2">
                  <span className="text-xs sm:text-sm text-muted-foreground">ID da Transação</span>
                  <span className="text-xs sm:text-sm font-mono break-all sm:break-normal">
                    {transaction.id}
                  </span>
                </div>
                <Separator />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 py-2">
                  <span className="text-xs sm:text-sm text-muted-foreground">Valor</span>
                  <span className="text-base sm:text-lg font-bold text-green-600">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(transaction.amount)}
                  </span>
                </div>
                <Separator />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 py-2">
                  <span className="text-xs sm:text-sm text-muted-foreground">Data</span>
                  <span className="text-xs sm:text-sm font-medium break-words">
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 py-2">
                  <span className="text-xs sm:text-sm text-muted-foreground">Status</span>
                  <Badge
                    variant={statusMap[transaction.status]?.variant || 'outline'}
                    className="text-[10px] sm:text-xs w-fit"
                  >
                    {statusMap[transaction.status]?.text || transaction.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {transaction.refundRequestReason && (
            <Card className="shadow-lg border-t-4 border-t-destructive bg-gradient-to-br from-red-50/50 to-white">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <MessageSquareWarning className="h-4 w-4" />
                  Motivo da Solicitação de Reembolso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{transaction.refundRequestReason}</p>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-lg border-t-4 border-t-videira-blue">
            <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Download className="h-4 w-4 sm:h-5 sm:w-5 text-videira-blue flex-shrink-0" />
                <span className="break-words">Detalhes do Pagamento</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 py-2">
                <span className="text-xs sm:text-sm text-muted-foreground">Método</span>
                <span className="text-xs sm:text-sm font-medium break-words">
                  {methodMap[transaction.payment.method] || transaction.payment.method}
                </span>
              </div>
              {transaction.payment.details && (
                <>
                  <Separator />
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 py-2">
                    <span className="text-xs sm:text-sm text-muted-foreground">Detalhes</span>
                    <span className="text-xs sm:text-sm font-medium break-words text-right sm:text-left">
                      {transaction.payment.details}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid auto-rows-max items-start gap-4 sm:gap-6 lg:gap-8">
          <Card className="shadow-lg border-t-4 border-t-videira-purple">
            <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-videira-purple flex-shrink-0" />
                <span className="break-words">Contribuinte</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="grid gap-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Nome</p>
                <p className="text-sm sm:text-base font-semibold break-words">
                  {transaction.contributor.name}
                </p>
              </div>
              <Separator className="my-2" />
              <div className="grid gap-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Email</p>
                <p className="text-xs sm:text-sm break-words">{transaction.contributor.email}</p>
              </div>
            </CardContent>
          </Card>

          {transaction.church && (
            <Card className="shadow-lg border-t-4 border-t-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">Igreja</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <div className="grid gap-1">
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-semibold">{transaction.church.name}</p>
                </div>
                <Separator className="my-2" />
                <div className="grid gap-1">
                  <p className="text-sm text-muted-foreground">Endereço</p>
                  <p className="text-sm">{transaction.church.address}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
