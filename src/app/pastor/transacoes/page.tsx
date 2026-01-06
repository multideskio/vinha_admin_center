'use client'

import * as React from 'react'
import { Download, ListFilter, MoreHorizontal, Search } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

type Transaction = {
  id: string
  amount: number
  description?: string
  method: 'Pix' | 'Cartão de Crédito' | 'Boleto'
  status: 'approved' | 'pending' | 'refused' | 'refunded'
  date: string
}

export default function TransacoesPage() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>()
  const [statusFilters, setStatusFilters] = React.useState<string[]>([
    'approved',
    'pending',
    'refused',
    'refunded',
  ])
  const { toast } = useToast()

  const fetchTransactions = React.useCallback(
    async (search?: string, startDate?: string, endDate?: string) => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (search) params.append('search', search)
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)

        const response = await fetch(`/api/v1/pastor/transacoes?${params.toString()}`)
        if (!response.ok) throw new Error('Falha ao carregar transações.')
        const data = await response.json()
        setTransactions(data.transactions)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  const filteredTransactions = React.useMemo(() => {
    return transactions.filter((t) => statusFilters.includes(t.status))
  }, [transactions, statusFilters])

  const toggleStatusFilter = (status: string) => {
    setStatusFilters((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    )
  }

  const exportToCSV = () => {
    const headers = ['ID', 'Descrição', 'Valor', 'Status', 'Data']
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.description || '-',
      t.amount.toFixed(2),
      statusMap[t.status]?.text || t.status,
      t.date,
    ])

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transacoes-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({ title: 'Sucesso', description: 'Transações exportadas!', variant: 'success' })
  }

  React.useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Handlers para busca e filtros
  const handleSearch = React.useCallback(
    (term: string) => {
      setSearchTerm(term)
      if (term.length >= 3 || term.length === 0) {
        const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined
        const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
        fetchTransactions(term || undefined, startDate, endDate)
      }
    },
    [dateRange, fetchTransactions],
  )

  const handleDateRangeChange = React.useCallback(
    (range: DateRange | undefined) => {
      setDateRange(range)
      const startDate = range?.from ? format(range.from, 'yyyy-MM-dd') : undefined
      const endDate = range?.to ? format(range.to, 'yyyy-MM-dd') : undefined
      fetchTransactions(searchTerm || undefined, startDate, endDate)
    },
    [searchTerm, fetchTransactions],
  )

  const statusMap: {
    [key: string]: { text: string; variant: 'success' | 'warning' | 'destructive' | 'outline' }
  } = {
    approved: { text: 'Aprovada', variant: 'success' },
    pending: { text: 'Pendente', variant: 'warning' },
    refused: { text: 'Recusada', variant: 'destructive' },
    refunded: { text: 'Reembolsada', variant: 'outline' },
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header com gradiente Videira */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 videira-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

        <div className="relative z-10 p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow-lg break-words">
                Minhas Contribuições
              </h1>
              <p className="text-sm sm:text-base text-white/90 mt-2 font-medium break-words">
                Visualize seu histórico de dízimos e ofertas
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative w-full sm:w-auto min-w-[200px] sm:min-w-0">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/60" />
                      <Input
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-8 bg-white/20 border-white/30 text-white placeholder:text-white/60 backdrop-blur-sm text-sm h-9 sm:h-10"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs sm:text-sm">Busque por ID da transação, valor ou status</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 sm:h-10 bg-white/20 hover:bg-white/30 text-white border-white/30 text-xs sm:text-sm"
                  >
                    <ListFilter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline">Filtro</span>
                    <span className="sm:hidden">Filtros</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs sm:text-sm">Filtrar por Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={statusFilters.includes('approved')}
                    onCheckedChange={() => toggleStatusFilter('approved')}
                    className="text-xs sm:text-sm"
                  >
                    Aprovada
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilters.includes('pending')}
                    onCheckedChange={() => toggleStatusFilter('pending')}
                    className="text-xs sm:text-sm"
                  >
                    Pendente
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilters.includes('refused')}
                    onCheckedChange={() => toggleStatusFilter('refused')}
                    className="text-xs sm:text-sm"
                  >
                    Recusada
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilters.includes('refunded')}
                    onCheckedChange={() => toggleStatusFilter('refunded')}
                    className="text-xs sm:text-sm"
                  >
                    Reembolsada
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="sm"
                variant="outline"
                onClick={exportToCSV}
                className="h-9 sm:h-10 bg-white text-videira-blue hover:bg-white/90 shadow-lg font-semibold text-xs sm:text-sm"
              >
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Exportar</span>
                <span className="sm:hidden">Export</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Card className="shadow-lg border-t-4 border-t-videira-cyan">
        <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="rounded-md border-2 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-videira-cyan/10 via-videira-blue/10 to-videira-purple/10">
                  <TableHead className="font-semibold text-xs sm:text-sm">ID</TableHead>
                  <TableHead className="hidden md:table-cell font-semibold text-xs sm:text-sm">
                    Descrição
                  </TableHead>
                  <TableHead className="text-right font-semibold text-xs sm:text-sm">
                    Valor
                  </TableHead>
                  <TableHead className="hidden sm:table-cell font-semibold text-xs sm:text-sm">
                    Status
                  </TableHead>
                  <TableHead className="hidden md:table-cell font-semibold text-xs sm:text-sm">
                    Data
                  </TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-24 sm:w-32" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-4 w-32 sm:w-40" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-16 sm:w-20 ml-auto" />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-5 sm:h-6 w-20 sm:w-24 rounded-full" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-4 w-20 sm:w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 sm:h-32 text-center text-sm sm:text-base">
                      Nenhuma transação encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium font-mono text-xs sm:text-sm">
                        <div className="flex flex-col sm:flex-row gap-1">
                          <span className="truncate max-w-[120px] sm:max-w-none">
                            {transaction.id.substring(0, 8)}...
                          </span>
                          <span className="md:hidden text-muted-foreground text-[10px] sm:text-xs">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(transaction.amount)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-xs sm:text-sm">
                        {transaction.description ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="truncate max-w-[150px] inline-block">
                                  {transaction.description}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">{transaction.description}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm font-medium md:table-cell">
                        <span className="hidden md:inline">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(transaction.amount)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          variant={statusMap[transaction.status]?.variant || 'default'}
                          className="text-[10px] sm:text-xs"
                        >
                          {statusMap[transaction.status]?.text || transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-xs sm:text-sm">
                        {transaction.date}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 sm:h-9 sm:w-9"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 sm:w-48">
                            <DropdownMenuLabel className="text-xs sm:text-sm">Ações</DropdownMenuLabel>
                            <DropdownMenuItem asChild className="text-xs sm:text-sm">
                              <Link href={`/pastor/transacoes/${transaction.id}`}>
                                Ver Detalhes
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs sm:text-sm">
                              Reenviar Comprovante
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
