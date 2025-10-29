'use client'

import * as React from 'react'
import { Download, ListFilter, MoreHorizontal, Search, Calendar } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DateRange } from 'react-day-picker'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  const [statusFilters, setStatusFilters] = React.useState<string[]>(['approved', 'pending', 'refused', 'refunded'])
  const { toast } = useToast()

  const fetchTransactions = React.useCallback(async (search?: string, startDate?: string, endDate?: string) => {
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
  }, [toast])

  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(t => statusFilters.includes(t.status))
  }, [transactions, statusFilters])

  const toggleStatusFilter = (status: string) => {
    setStatusFilters(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    )
  }

  const exportToCSV = () => {
    const headers = ['ID', 'Descrição', 'Valor', 'Status', 'Data']
    const rows = filteredTransactions.map(t => [
      t.id,
      t.description || '-',
      t.amount.toFixed(2),
      statusMap[t.status]?.text || t.status,
      t.date
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
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
  const handleSearch = React.useCallback((term: string) => {
    setSearchTerm(term)
    if (term.length >= 3 || term.length === 0) {
      const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined
      const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
      fetchTransactions(term || undefined, startDate, endDate)
    }
  }, [dateRange, fetchTransactions])

  const handleDateRangeChange = React.useCallback((range: DateRange | undefined) => {
    setDateRange(range)
    const startDate = range?.from ? format(range.from, 'yyyy-MM-dd') : undefined
    const endDate = range?.to ? format(range.to, 'yyyy-MM-dd') : undefined
    fetchTransactions(searchTerm || undefined, startDate, endDate)
  }, [searchTerm, fetchTransactions])

  const statusMap: {
    [key: string]: { text: string; variant: 'success' | 'warning' | 'destructive' | 'outline' }
  } = {
    approved: { text: 'Aprovada', variant: 'success' },
    pending: { text: 'Pendente', variant: 'warning' },
    refused: { text: 'Recusada', variant: 'destructive' },
    refunded: { text: 'Reembolsada', variant: 'outline' },
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Minhas Contribuições</h1>
        <p className="text-sm text-muted-foreground">
          Visualize seu histórico de dízimos e ofertas.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Contribuições</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Campo de Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, valor ou status..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">?</span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Busque por ID da transação, valor ou status</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Filtro por Data */}
            <DateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-end gap-2 pb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <ListFilter className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only">Filtro</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filtrar por Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem 
                  checked={statusFilters.includes('approved')}
                  onCheckedChange={() => toggleStatusFilter('approved')}
                >
                  Aprovada
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={statusFilters.includes('pending')}
                  onCheckedChange={() => toggleStatusFilter('pending')}
                >
                  Pendente
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={statusFilters.includes('refused')}
                  onCheckedChange={() => toggleStatusFilter('refused')}
                >
                  Recusada
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={statusFilters.includes('refunded')}
                  onCheckedChange={() => toggleStatusFilter('refunded')}
                >
                  Reembolsada
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button size="sm" variant="outline" className="gap-1" onClick={exportToCSV}>
              <Download className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only">Exportar</span>
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead className="hidden md:table-cell">Descrição</TableHead>
                <TableHead className="hidden md:table-cell text-right">Valor</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhuma transação encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium font-mono text-xs">
                      {transaction.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {transaction.description ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="truncate max-w-[150px] inline-block">
                                {transaction.description}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{transaction.description}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(transaction.amount)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={statusMap[transaction.status]?.variant || 'default'}>
                        {statusMap[transaction.status]?.text || transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {transaction.date}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/pastor/transacoes/${transaction.id}`}>Ver Detalhes</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Reenviar Comprovante</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
