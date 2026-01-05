/**
 * @lastReview 2026-01-05 15:00 - Página de relatório de igrejas revisada
 * ❌ PROBLEMA CRÍTICO: API /api/v1/relatorios/igrejas NÃO EXISTE
 * Frontend: ✅ Interface completa, filtros por região, paginação, export CSV, Design System Videira
 * Backend: ❌ API não implementada - página não funcional
 */
'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Church,
  ChevronLeft,
  Download,
  RefreshCw,
  Calendar,
  MapPin,
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

type ChurchData = {
  id: string
  nomeFantasia: string
  cnpj: string
  cidade: string
  estado: string
  regionName: string
  totalRevenue: number
  transactionCount: number
  lastTransaction: { date: string; amount: number } | null
  createdAt: string
}

type RegionData = {
  count: number
  totalRevenue: number
  churches: ChurchData[]
}

type Region = {
  id: string
  name: string
}

export default function RelatorioIgrejasPage() {
  const [allChurches, setAllChurches] = React.useState<ChurchData[]>([])
  const [byRegion, setByRegion] = React.useState<Record<string, RegionData>>({})
  const [regions, setRegions] = React.useState<Region[]>([])
  const [summary, setSummary] = React.useState({
    totalChurches: 0,
    totalRevenue: 0,
    totalTransactions: 0,
  })
  const [period, setPeriod] = React.useState({ from: '', to: '' })
  const [isLoading, setIsLoading] = React.useState(true)
  const [dateRange, setDateRange] = React.useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const [regionFilter, setRegionFilter] = React.useState('all')
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 20
  const { toast } = useToast()

  // Calcular igrejas paginadas
  const totalPages = Math.ceil(allChurches.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const churches = allChurches.slice(startIndex, endIndex)

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    setCurrentPage(1) // Reset para página 1 ao filtrar
    try {
      const params = new URLSearchParams()
      if (dateRange.from) params.append('from', dateRange.from.toISOString())
      if (dateRange.to) params.append('to', dateRange.to.toISOString())
      if (regionFilter !== 'all') params.append('regionId', regionFilter)

      const response = await fetch(`/api/v1/relatorios/igrejas?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Falha ao carregar relatório de igrejas.')
      }
      const result = await response.json()
      setAllChurches(result.churches)
      setByRegion(result.byRegion)
      setRegions(result.regions)
      setSummary(result.summary)
      setPeriod(result.period)
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
  }, [dateRange, regionFilter, toast])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDateRangeChange = React.useCallback(
    (range: { from: Date | undefined; to: Date | undefined }) => {
      setDateRange(range)
    },
    [],
  )

  const handleExportCSV = () => {
    if (!allChurches || allChurches.length === 0) {
      toast({
        title: 'Nenhum dado',
        description: 'Não há igrejas para exportar.',
        variant: 'destructive',
      })
      return
    }

    try {
      const headers = [
        'Nome',
        'CNPJ',
        'Cidade',
        'Estado',
        'Região',
        'Arrecadação',
        'Transações',
        'Última Contribuição',
      ]
      const rows = allChurches.map((c) => [
        c.nomeFantasia,
        c.cnpj,
        c.cidade,
        c.estado,
        c.regionName,
        `R$ ${c.totalRevenue.toFixed(2)}`,
        c.transactionCount,
        c.lastTransaction ? c.lastTransaction.date : 'Nunca',
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
        `relatorio-igrejas-${new Date().toISOString().slice(0, 10)}.csv`,
      )
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast({
        title: 'Exportado!',
        description: 'Relatório de igrejas baixado com sucesso.',
        variant: 'success',
      })
    } catch (e) {
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível gerar o CSV.',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
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
                <Church className="h-8 w-8" />
                Relatório de Igrejas
              </h1>
              <p className="text-base text-white/90 mt-2 font-medium">
                Performance e estatísticas por região
              </p>
              <p className="text-sm text-white/70 mt-1">
                Período: {period.from} até {period.to}
              </p>
            </div>
            <Button
              onClick={handleExportCSV}
              className="bg-white text-videira-purple hover:bg-white/90 shadow-lg font-semibold gap-2"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium">Período</label>
              <DateRangePicker onDateRangeChange={handleDateRangeChange} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Região</label>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Regiões</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={fetchData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Igrejas</CardTitle>
            <Church className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalChurches}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Object.keys(byRegion).length} regiões
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arrecadação Total</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                summary.totalRevenue,
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">No período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Transações</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalTransactions}</div>
            <p className="text-xs text-muted-foreground mt-1">Contribuições aprovadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Por Região */}
      {byRegion && Object.keys(byRegion).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo por Região</CardTitle>
            <CardDescription>Igrejas e arrecadação agrupadas por região</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(byRegion).map(([regionName, data]) => (
                <div key={regionName} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">{regionName}</p>
                    <Badge>{data.count} igrejas</Badge>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      data.totalRevenue,
                    )}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Igrejas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista Completa ({allChurches.length})</CardTitle>
          <CardDescription>Todas as igrejas com detalhes de arrecadação</CardDescription>
        </CardHeader>
        <CardContent>
          {allChurches.length === 0 ? (
            <div className="text-center py-12">
              <Church className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Nenhuma igreja encontrada</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-auto max-h-[600px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted z-10">
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cidade/UF</TableHead>
                      <TableHead>Região</TableHead>
                      <TableHead className="text-right">Arrecadação</TableHead>
                      <TableHead className="text-center">Transações</TableHead>
                      <TableHead>Última Contrib.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {churches.map((church) => (
                      <TableRow key={church.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/admin/igrejas/${church.id}`}
                            className="hover:underline text-primary"
                          >
                            {church.nomeFantasia}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {church.cidade}/{church.estado}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{church.regionName}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(church.totalRevenue)}
                        </TableCell>
                        <TableCell className="text-center">{church.transactionCount}</TableCell>
                        <TableCell className="text-sm">
                          {church.lastTransaction ? (
                            <div>
                              <div>{church.lastTransaction.date}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(church.lastTransaction.amount)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Nunca</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1} a {Math.min(endIndex, allChurches.length)} de{' '}
                    {allChurches.length} resultados
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2 px-4">
                      <span className="text-sm font-medium">
                        Página {currentPage} de {totalPages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
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
