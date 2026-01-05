/**
 * @lastReview 2026-01-05 15:00 - Página de relatório de membresia revisada
 * ❌ PROBLEMA CRÍTICO: API /api/v1/relatorios/membresia NÃO EXISTE
 * Frontend: ✅ Interface completa, filtros, gráfico de crescimento, export CSV, Design System Videira
 * Backend: ❌ API não implementada - página não funcional
 */
'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Users,
  ChevronLeft,
  Download,
  RefreshCw,
  TrendingUp,
  UserPlus,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'

type Member = {
  id: string
  name: string
  email: string
  role: string
  extraInfo: string
  createdAt: string
  status: string
}

type RoleCount = {
  role: string
  count: number
}

type GrowthDataPoint = {
  month: string
  count: number
}

type MembresiaSummary = {
  totalMembers: number
  newThisMonth: number
  byRole: RoleCount[]
}

export default function RelatorioMembresiaPage() {
  const [allMembers, setAllMembers] = React.useState<Member[]>([])
  const [summary, setSummary] = React.useState<MembresiaSummary | null>(null)
  const [growthData, setGrowthData] = React.useState<GrowthDataPoint[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [roleFilter, setRoleFilter] = React.useState('all')
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 20
  const { toast } = useToast()

  // Calcular membros paginados
  const totalPages = Math.ceil(allMembers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const members = allMembers.slice(startIndex, endIndex)

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    setCurrentPage(1)
    try {
      const params = new URLSearchParams()
      if (roleFilter !== 'all') params.append('role', roleFilter)

      const response = await fetch(`/api/v1/relatorios/membresia?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Falha ao carregar relatório de membresia.')
      }
      const result = await response.json()
      setAllMembers(result.members)
      setSummary(result.summary)
      setGrowthData(result.growthData)
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
  }, [roleFilter, toast])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleExportCSV = () => {
    if (!allMembers || allMembers.length === 0) {
      toast({
        title: 'Nenhum dado',
        description: 'Não há membros para exportar.',
        variant: 'destructive',
      })
      return
    }

    try {
      const headers = ['Nome', 'Email', 'Role', 'Info Adicional', 'Data Cadastro', 'Status']
      const rows = allMembers.map((m) => [
        m.name,
        m.email,
        m.role,
        m.extraInfo,
        m.createdAt,
        m.status,
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
        `relatorio-membresia-${new Date().toISOString().slice(0, 10)}.csv`,
      )
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast({
        title: 'Exportado!',
        description: 'Relatório de membresia baixado com sucesso.',
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

  const roleMap: Record<string, string> = {
    admin: 'Administrador',
    manager: 'Gerente',
    supervisor: 'Supervisor',
    pastor: 'Pastor',
    church_account: 'Igreja',
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
                <Users className="h-8 w-8" />
                Relatório de Membresia
              </h1>
              <p className="text-base text-white/90 mt-2 font-medium">
                Dados demográficos, engajamento e crescimento de membros
              </p>
            </div>
            <Button
              onClick={handleExportCSV}
              className="bg-white text-orange-600 hover:bg-white/90 shadow-lg font-semibold gap-2"
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
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium">Tipo de Membro</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pastor">Pastores</SelectItem>
                  <SelectItem value="church_account">Igrejas</SelectItem>
                  <SelectItem value="supervisor">Supervisores</SelectItem>
                  <SelectItem value="manager">Gerentes</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fetchData} variant="outline" className="mt-7">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalMembers}</div>
              <p className="text-xs text-muted-foreground mt-1">Todos os tipos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Novos este Mês</CardTitle>
              <UserPlus className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {summary.newThisMonth}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Cadastros recentes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {growthData.length > 0 ? growthData[growthData.length - 1]?.count || 0 : 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Último mês</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráfico de Crescimento */}
      {growthData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Crescimento nos Últimos 6 Meses</CardTitle>
            <CardDescription>Novos membros cadastrados por mês</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px] w-full">
              <LineChart data={growthData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
                <Tooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Novos Membros"
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Distribuição por Tipo */}
      {summary && summary.byRole && Array.isArray(summary.byRole) && summary.byRole.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Tipo</CardTitle>
            <CardDescription>Total de membros por role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {summary.byRole.map((item: RoleCount) => (
                <div key={item.role} className="p-4 border rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    {roleMap[item.role] || item.role}
                  </p>
                  <p className="text-3xl font-bold">{item.count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Membros Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Membros Recentes ({allMembers.length})</CardTitle>
          <CardDescription>Cadastros no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {allMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Nenhum membro encontrado</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-auto max-h-[600px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted z-10">
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Info Adicional</TableHead>
                      <TableHead>Data Cadastro</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {member.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{roleMap[member.role] || member.role}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{member.extraInfo || '-'}</TableCell>
                        <TableCell className="text-sm font-mono">{member.createdAt}</TableCell>
                        <TableCell>
                          <Badge variant={member.status === 'active' ? 'success' : 'destructive'}>
                            {member.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
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
                    Mostrando {startIndex + 1} a {Math.min(endIndex, allMembers.length)} de{' '}
                    {allMembers.length} resultados
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
