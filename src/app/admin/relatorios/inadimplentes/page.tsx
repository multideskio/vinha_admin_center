'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  Search,
  Filter,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'

type Defaulter = {
  id: string
  name: string
  type: 'pastor' | 'church'
  titheDay: number | null
  lastPayment: string | null
  daysLate: number
}

type PaginationData = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export default function InadimplentesPage() {
  const [defaulters, setDefaulters] = React.useState<Defaulter[]>([])
  const [pagination, setPagination] = React.useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [typeFilter, setTypeFilter] = React.useState<'all' | 'pastor' | 'church'>('all')
  const [sortBy, setSortBy] = React.useState<'daysLate' | 'name'>('daysLate')
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')
  const { toast } = useToast()

  const fetchDefaulters = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        type: typeFilter,
        sortBy,
        sortOrder,
      })
      if (search) params.append('search', search)

      const response = await fetch(`/api/v1/relatorios/inadimplentes?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Falha ao carregar inadimplentes.')
      }
      const result = await response.json()
      setDefaulters(result.data)
      setPagination(result.pagination)
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
  }, [pagination.page, pagination.limit, typeFilter, sortBy, sortOrder, search, toast])

  React.useEffect(() => {
    fetchDefaulters()
  }, [fetchDefaulters])

  const handleSearch = React.useCallback((value: string) => {
    setSearch(value)
    setPagination((prev) => ({ ...prev, page: 1 })) // Reset para página 1
  }, [])

  const handleExportCSV = () => {
    if (!defaulters || defaulters.length === 0) {
      toast({
        title: 'Nenhum dado',
        description: 'Não há inadimplentes para exportar.',
        variant: 'destructive',
      })
      return
    }

    try {
      const headers = ['ID', 'Nome', 'Tipo', 'Dia Vencimento', 'Último Pagamento', 'Dias Atraso']
      const rows = defaulters.map((d) => [
        d.id,
        d.name,
        d.type === 'pastor' ? 'Pastor' : 'Igreja',
        d.titheDay || '-',
        d.lastPayment || 'Nunca',
        d.daysLate,
      ])
      const csv = [
        headers.join(','),
        ...rows.map((r) => r.map((c) => JSON.stringify(c)).join(',')),
      ].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `inadimplentes-${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast({
        title: 'Exportado!',
        description: 'CSV baixado com sucesso.',
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

  const goToPage = (page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
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
                <AlertTriangle className="h-8 w-8" />
                Relatório de Inadimplentes
              </h1>
              <p className="text-base text-white/90 mt-2 font-medium">
                Pastores e igrejas que não contribuíram nos últimos 3 meses
              </p>
            </div>
            <Button
              onClick={handleExportCSV}
              className="bg-white text-destructive hover:bg-white/90 shadow-lg font-semibold gap-2"
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
            <Filter className="h-5 w-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pastor">Pastores</SelectItem>
                  <SelectItem value="church">Igrejas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ordenar por</label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daysLate">Dias de Atraso</SelectItem>
                  <SelectItem value="name">Nome</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ordem</label>
              <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Decrescente</SelectItem>
                  <SelectItem value="asc">Crescente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista Completa</CardTitle>
              <CardDescription>{pagination.total} inadimplentes encontrados</CardDescription>
            </div>
            <Badge variant="destructive" className="text-lg px-4 py-2">
              {pagination.total}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {defaulters.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                Nenhum inadimplente encontrado! 🎉
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-center">Dia Venc.</TableHead>
                      <TableHead>Último Pagamento</TableHead>
                      <TableHead className="text-right">Dias Atraso</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {defaulters.map((defaulter) => {
                      const profilePath = defaulter.type === 'pastor' ? 'pastores' : 'igrejas'
                      return (
                        <TableRow key={defaulter.id}>
                          <TableCell className="font-medium">{defaulter.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {defaulter.type === 'pastor' ? 'Pastor' : 'Igreja'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {defaulter.titheDay ? `Dia ${defaulter.titheDay}` : '-'}
                          </TableCell>
                          <TableCell>
                            {defaulter.lastPayment ? (
                              <span className="text-sm">{defaulter.lastPayment}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">Nunca</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="destructive">{defaulter.daysLate}d</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/admin/${profilePath}/${defaulter.id}`}>
                              <Button variant="ghost" size="sm">
                                Ver Perfil
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
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
                    onClick={() => goToPage(1)}
                    disabled={!pagination.hasPrev}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToPage(pagination.page - 1)}
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
                    onClick={() => goToPage(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToPage(pagination.totalPages)}
                    disabled={!pagination.hasNext}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
