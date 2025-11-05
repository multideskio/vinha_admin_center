'use client'

import * as React from 'react'
import Link from 'next/link'
import { TrendingUp, ChevronLeft, Download, RefreshCw, Calendar, Award, DollarSign } from 'lucide-react'
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

type Contributor = {
  id: string
  name: string
  type: string
  extraInfo: string
  totalAmount: number
  contributionCount: number
  lastContribution: string
}

export default function RelatorioContribuicoesPage() {
  const [contributors, setContributors] = React.useState<Contributor[]>([])
  const [topContributors, setTopContributors] = React.useState<Contributor[]>([])
  const [summary, setSummary] = React.useState<any>(null)
  const [period, setPeriod] = React.useState({ from: '', to: '' })
  const [isLoading, setIsLoading] = React.useState(true)
  const [dateRange, setDateRange] = React.useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [typeFilter, setTypeFilter] = React.useState('all')
  const { toast } = useToast()

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateRange.from) params.append('from', dateRange.from.toISOString())
      if (dateRange.to) params.append('to', dateRange.to.toISOString())
      if (typeFilter !== 'all') params.append('contributorType', typeFilter)

      const response = await fetch(`/api/v1/relatorios/contribuicoes?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Falha ao carregar relatório de contribuições.')
      }
      const result = await response.json()
      setContributors(result.contributors)
      setTopContributors(result.topContributors)
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
  }, [dateRange, typeFilter, toast])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDateRangeChange = React.useCallback(
    (range: { from: Date | undefined; to: Date | undefined }) => {
      setDateRange(range)
    },
    []
  )

  const handleExportCSV = () => {
    if (!contributors || contributors.length === 0) {
      toast({
        title: 'Nenhum dado',
        description: 'Não há contribuições para exportar.',
        variant: 'destructive',
      })
      return
    }

    try {
      const headers = ['Nome', 'Tipo', 'Info', 'Total Contribuído', 'Nº Contribuições', 'Última Contribuição']
      const rows = contributors.map((c) => [
        c.name,
        c.type,
        c.extraInfo,
        `R$ ${c.totalAmount.toFixed(2)}`,
        c.contributionCount,
        c.lastContribution,
      ])
      const csv = [headers.join(','), ...rows.map((r) => r.map((c) => JSON.stringify(c)).join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `relatorio-contribuicoes-${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast({
        title: 'Exportado!',
        description: 'Relatório de contribuições baixado com sucesso.',
        variant: 'success',
      })
    } catch (e) {
      toast({ title: 'Erro ao exportar', description: 'Não foi possível gerar o CSV.', variant: 'destructive' })
    }
  }

  const roleMap: Record<string, string> = {
    pastor: 'Pastor',
    church_account: 'Igreja',
    supervisor: 'Supervisor',
    manager: 'Gerente',
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
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin/relatorios">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <TrendingUp className="h-7 w-7 text-cyan-600 dark:text-cyan-400" />
              Relatório de Contribuições
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 ml-12">
            Análise detalhada de dízimos e ofertas • {period.from} até {period.to}
          </p>
        </div>
        <Button onClick={handleExportCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
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
              <label className="text-sm font-medium">Tipo de Contribuinte</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pastor">Pastores</SelectItem>
                  <SelectItem value="church_account">Igrejas</SelectItem>
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
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Arrecadado</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  summary.totalAmount
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">No período</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Contribuições</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalContributions}</div>
              <p className="text-xs text-muted-foreground mt-1">Transações aprovadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contribuintes Ativos</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalContributors}</div>
              <p className="text-xs text-muted-foreground mt-1">No período</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média por Contribuinte</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  summary.averagePerContributor
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top 10 Contribuintes */}
      {topContributors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              Top 10 Contribuintes
            </CardTitle>
            <CardDescription>Maiores contribuintes do período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topContributors.map((contributor, index) => (
                <div key={contributor.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{contributor.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {roleMap[contributor.type]} {contributor.extraInfo && `• ${contributor.extraInfo}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        contributor.totalAmount
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{contributor.contributionCount} contrib.</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Por Método e Por Tipo */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Por Método */}
          <Card>
            <CardHeader>
              <CardTitle>Por Método de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.byMethod.map((item: any) => (
                  <div key={item.method} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{methodMap[item.method] || item.method}</p>
                      <p className="text-xs text-muted-foreground">{item.count} transações</p>
                    </div>
                    <p className="text-lg font-bold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        item.total
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Por Tipo de Contribuinte */}
          <Card>
            <CardHeader>
              <CardTitle>Por Tipo de Contribuinte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.byContributorType.map((item: any) => (
                  <div key={item.type} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{roleMap[item.type] || item.type}</p>
                      <p className="text-xs text-muted-foreground">{item.count} transações</p>
                    </div>
                    <p className="text-lg font-bold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        item.total
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela Completa */}
      <Card>
        <CardHeader>
          <CardTitle>Lista Completa ({contributors.length})</CardTitle>
          <CardDescription>Todos os contribuintes do período</CardDescription>
        </CardHeader>
        <CardContent>
          {contributors.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Nenhuma contribuição encontrada</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-auto max-h-[600px]">
              <Table>
                <TableHeader className="sticky top-0 bg-muted z-10">
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Total Contribuído</TableHead>
                    <TableHead className="text-center">Nº Contrib.</TableHead>
                    <TableHead>Última Contrib.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contributors.map((contributor) => (
                    <TableRow key={contributor.id}>
                      <TableCell className="font-medium">
                        <div>
                          <p>{contributor.name}</p>
                          {contributor.extraInfo && (
                            <p className="text-xs text-muted-foreground">{contributor.extraInfo}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{roleMap[contributor.type] || contributor.type}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600 dark:text-green-400">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                          contributor.totalAmount
                        )}
                      </TableCell>
                      <TableCell className="text-center">{contributor.contributionCount}</TableCell>
                      <TableCell className="text-sm">{contributor.lastContribution}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

