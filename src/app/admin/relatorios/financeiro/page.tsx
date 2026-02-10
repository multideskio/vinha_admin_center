/**
 * @lastReview 2026-02-10 - Página de relatório financeiro integrada com API
 * ✅ API /api/v1/relatorios/financeiro implementada com paginação server-side
 * ✅ Frontend consome PaginatedResult<T> com controles de paginação server-side
 * ✅ Filtros, export CSV, Design System Videira
 */
'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  DollarSign,
  ChevronLeft,
  Download,
  TrendingUp,
  TrendingDown,
  Clock,
  RefreshCw,
  Calendar,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Transaction = {
  id: string
  contributorName: string
  contributorRole: string
  amount: number
  method: string
  status: string
  date: string
}

type Summary = {
  totalTransactions: number
  totalApproved: number
  totalPending: number
  totalRefused: number
  totalRefunded: number
  byMethod: Record<string, { count: number; total: number }>
}

type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export default function RelatorioFinanceiroPage() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [pagination, setPagination] = React.useState<PaginationMeta>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [summary, setSummary] = React.useState<Summary | null>(null)
  const [period, setPeriod] = React.useState({ from: '', to: '' })
  const [isLoading, setIsLoading] = React.useState(true)
  const [dateRange, setDateRange] = React.useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const [methodFilter, setMethodFilter] = React.useState('all')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 50
  const { toast } = useToast()

  const fetchData = React.useCallback(
    async (page = 1) => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (dateRange.from) params.append('from', dateRange.from.toISOString())
        if (dateRange.to) params.append('to', dateRange.to.toISOString())
        if (methodFilter !== 'all') params.append('method', methodFilter)
        if (statusFilter !== 'all') params.append('status', statusFilter)
        params.append('page', String(page))
        params.append('limit', String(itemsPerPage))

        const response = await fetch(`/api/v1/relatorios/financeiro?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Falha ao carregar relatório financeiro.')
        }
        const result = await response.json()
        setTransactions(result.transactions.data)
        setPagination(result.transactions.pagination)
        setSummary(result.summary)
        setPeriod(result.period)
        setCurrentPage(page)
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido'
        toast({
          title: 'Erro',
          description: message,
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    },
    [dateRange, methodFilter, statusFilter, toast, itemsPerPage],
  )

  // Carregar dados iniciais apenas uma vez
  React.useEffect(() => {
    fetchData(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Só recarregar quando os filtros mudarem (não quando dateRange mudar)
  React.useEffect(() => {
    if (methodFilter !== 'all' || statusFilter !== 'all') {
      fetchData(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [methodFilter, statusFilter])

  const handleDateRangeChange = React.useCallback(
    (range: { from: Date | undefined; to: Date | undefined }) => {
      setDateRange(range)
    },
    [],
  )

  const handleExportCSV = () => {
    if (!transactions || transactions.length === 0) {
      toast({
        title: 'Nenhum dado',
        description: 'Não há transações para exportar.',
        variant: 'destructive',
      })
      return
    }

    try {
      const headers = ['Data', 'Contribuinte', 'Valor', 'Método', 'Status']
      const rows = transactions.map((t) => [
        t.date,
        t.contributorName,
        `R$ ${t.amount.toFixed(2)}`,
        t.method,
        t.status,
      ])
      const csv = [
        headers.join(','),
        ...rows.map((r) => r.map((c) => JSON.stringify(c)).join(',')),
      ].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute(
        'download',
        `relatorio-financeiro-${new Date().toISOString().slice(0, 10)}.csv`,
      )
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast({
        title: 'Exportado!',
        description: 'Relatório financeiro baixado com sucesso.',
        variant: 'success',
      })
    } catch (error) {
      console.error('[CSV_EXPORT_ERROR] Erro ao exportar relatório financeiro:', error)
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível gerar o CSV.',
        variant: 'destructive',
      })
    }
  }

  const statusMap: Record<
    string,
    { text: string; variant: 'success' | 'warning' | 'destructive' | 'outline' }
  > = {
    approved: { text: 'Aprovada', variant: 'success' },
    pending: { text: 'Pendente', variant: 'warning' },
    refused: { text: 'Recusada', variant: 'destructive' },
    refunded: { text: 'Reembolsada', variant: 'outline' },
  }

  const methodMap: Record<string, string> = {
    pix: 'PIX',
    credit_card: 'Cartão de Crédito',
    boleto: 'Boleto',
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Moderno com Gradiente Videira */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 videira-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

        <div className="relative z-10 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/admin/relatorios">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/90 hover:text-white hover:bg-white/20"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-3">
                <DollarSign className="h-8 w-8" />
                Relatório Financeiro
              </h1>
              <p className="text-base text-white/90 mt-2 font-medium">
                Análise completa de transações e arrecadações
              </p>
              <p className="text-sm text-white/70 mt-1">
                Período: {period.from} até {period.to}
              </p>
            </div>
            <Button
              onClick={handleExportCSV}
              className="bg-white text-green-600 hover:bg-white/90 shadow-lg font-semibold gap-2"
            >
              <Download className="h-5 w-5" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium">Período</label>
              <DateRangePicker
                value={{ from: dateRange.from, to: dateRange.to }}
                onDateRangeChange={handleDateRangeChange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Método de Pagamento</label>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="approved">Aprovadas</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="refused">Recusadas</SelectItem>
                  <SelectItem value="refunded">Reembolsadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={() => fetchData(1)} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Aprovado</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  summary.totalApproved,
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.totalTransactions} transações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  summary.totalPending,
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recusadas</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  summary.totalRefused,
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reembolsadas</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  summary.totalRefunded,
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Por Método */}
      {summary && Object.keys(summary.byMethod).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Por Método de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Object.entries(summary.byMethod).map(([method, data]) => (
                <div key={method} className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">{methodMap[method] || method}</p>
                  <p className="text-2xl font-bold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      data.total,
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{data.count} transações</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Transações */}
      <Card>
        <CardHeader>
          <CardTitle>Transações ({pagination.total})</CardTitle>
          <CardDescription>Lista completa de todas as transações do período</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                Nenhuma transação encontrada no período selecionado
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-auto max-h-[600px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted z-10">
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Contribuinte</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono text-xs">{transaction.date}</TableCell>
                        <TableCell className="font-medium">{transaction.contributorName}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(transaction.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {methodMap[transaction.method] || transaction.method}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusMap[transaction.status]?.variant || 'default'}>
                            {statusMap[transaction.status]?.text || transaction.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação Server-Side */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {(pagination.page - 1) * pagination.limit + 1} a{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                    {pagination.total} resultados
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fetchData(1)}
                      disabled={!pagination.hasPrev}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fetchData(currentPage - 1)}
                      disabled={!pagination.hasPrev}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2 px-4">
                      <span className="text-sm font-medium">
                        Página {pagination.page} de {pagination.totalPages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fetchData(currentPage + 1)}
                      disabled={!pagination.hasNext}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fetchData(pagination.totalPages)}
                      disabled={!pagination.hasNext}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
