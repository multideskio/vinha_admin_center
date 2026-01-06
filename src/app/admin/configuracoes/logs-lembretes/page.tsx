'use client'

import * as React from 'react'
import {
  History,
  Mail,
  Smartphone,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Send,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

type NotificationLog = {
  id: string
  userId: string
  userEmail: string
  userName: string
  notificationType: string
  channel: 'email' | 'whatsapp'
  status: 'sent' | 'failed' | 'pending'
  recipient: string
  subject?: string
  messageContent: string
  errorMessage?: string
  createdAt: string
}

const statusMap = {
  sent: { text: 'Enviado', variant: 'success' as const, icon: CheckCircle },
  failed: { text: 'Falhou', variant: 'destructive' as const, icon: XCircle },
  pending: { text: 'Pendente', variant: 'warning' as const, icon: Clock },
}

const channelMap = {
  email: { text: 'Email', icon: Mail, color: 'text-blue-600' },
  whatsapp: { text: 'WhatsApp', icon: Smartphone, color: 'text-green-600' },
}

const typeMap: Record<string, string> = {
  rem_: 'Lembrete de Vencimento',
  ovr_: 'Aviso de Atraso',
  payment_received: 'Pagamento Confirmado',
  welcome: 'Boas-vindas',
}

function getNotificationType(notificationType: string): string {
  for (const [key, value] of Object.entries(typeMap)) {
    if (notificationType.startsWith(key)) {
      return value
    }
  }
  return notificationType
}

export default function LogsLembretesPage() {
  const [logs, setLogs] = React.useState<NotificationLog[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [channelFilter, setChannelFilter] = React.useState<string>('all')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [typeFilter, setTypeFilter] = React.useState<string>('all')
  const [dateRange, setDateRange] = React.useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const [currentPage, setCurrentPage] = React.useState(1)
  const [totalLogs, setTotalLogs] = React.useState(0)
  const [selectedLog, setSelectedLog] = React.useState<NotificationLog | null>(null)
  const [resendingId, setResendingId] = React.useState<string | null>(null)
  const [stats, setStats] = React.useState({
    total: 0,
    sent: 0,
    failed: 0,
    email: 0,
    whatsapp: 0,
  })

  const itemsPerPage = 20
  const { toast } = useToast()

  const fetchLogs = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', currentPage.toString())
      params.append('limit', itemsPerPage.toString())

      if (searchTerm) params.append('search', searchTerm)
      if (channelFilter !== 'all') params.append('channel', channelFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (dateRange.from) params.append('from', dateRange.from.toISOString())
      if (dateRange.to) params.append('to', dateRange.to.toISOString())

      const response = await fetch(`/api/v1/notification-logs?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Falha ao carregar os logs.')
      }
      const data = await response.json()
      setLogs(data.logs || [])
      setTotalLogs(data.total || 0)
      setStats(data.stats || stats)
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
  }, [currentPage, searchTerm, channelFilter, statusFilter, typeFilter, dateRange, toast])

  React.useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleFilterChange = (type: string, value: string) => {
    switch (type) {
      case 'channel':
        setChannelFilter(value)
        break
      case 'status':
        setStatusFilter(value)
        break
      case 'type':
        setTypeFilter(value)
        break
    }
    setCurrentPage(1)
  }

  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    setDateRange(range)
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(totalLogs / itemsPerPage)

  const handleResend = async (logId: string) => {
    setResendingId(logId)
    try {
      const response = await fetch(`/api/v1/notification-logs/${logId}/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: 'Sucesso',
          description: data.message,
        })
        // Recarregar os logs para mostrar o novo envio
        await fetchLogs()
      } else {
        toast({
          title: 'Erro',
          description: data.message || 'Falha ao reenviar notificação',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao reenviar notificação',
        variant: 'destructive',
      })
    } finally {
      setResendingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 videira-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

        <div className="relative z-10 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/admin/configuracoes">
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
                <History className="h-8 w-8" />
                Logs de Lembretes
              </h1>
              <p className="text-base text-white/90 mt-2 font-medium">
                Histórico completo de notificações enviadas
              </p>
              <p className="text-sm text-white/70 mt-1">
                {totalLogs} {totalLogs === 1 ? 'registro encontrado' : 'registros encontrados'}
              </p>
            </div>
            <Button
              onClick={fetchLogs}
              className="bg-white text-videira-blue hover:bg-white/90 shadow-lg font-semibold"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-videira-blue">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-videira-blue" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Enviados</p>
                <p className="text-2xl font-bold">{stats.sent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Falharam</p>
                <p className="text-2xl font-bold">{stats.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-2xl font-bold">{stats.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-600">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">WhatsApp</p>
                <p className="text-2xl font-bold">{stats.whatsapp}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="shadow-lg border-l-4 border-l-videira-purple">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Filter className="h-5 w-5 text-videira-purple" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por usuário, email ou conteúdo..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <DateRangePicker
                value={{ from: dateRange.from, to: dateRange.to }}
                onDateRangeChange={handleDateRangeChange}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select
                value={channelFilter}
                onValueChange={(value) => handleFilterChange('channel', value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os canais</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="sent">Enviado</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={typeFilter}
                onValueChange={(value) => handleFilterChange('type', value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="rem_">Lembretes</SelectItem>
                  <SelectItem value="ovr_">Avisos de Atraso</SelectItem>
                  <SelectItem value="payment_received">Pagamento Confirmado</SelectItem>
                  <SelectItem value="welcome">Boas-vindas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Logs */}
      <Card className="shadow-lg border-t-4 border-t-videira-cyan">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-videira-cyan" />
            Histórico de Notificações
          </CardTitle>
          <CardDescription>Registros detalhados de todas as notificações enviadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-videira-cyan/5 via-videira-blue/5 to-videira-purple/5">
                    <TableHead className="font-semibold min-w-[150px]">Usuário</TableHead>
                    <TableHead className="font-semibold min-w-[120px]">Tipo</TableHead>
                    <TableHead className="font-semibold text-center min-w-[80px]">Canal</TableHead>
                    <TableHead className="font-semibold text-center min-w-[80px]">Status</TableHead>
                    <TableHead className="hidden lg:table-cell font-semibold min-w-[120px]">
                      Destinatário
                    </TableHead>
                    <TableHead className="hidden xl:table-cell font-semibold min-w-[120px]">
                      Data
                    </TableHead>
                    <TableHead className="font-semibold text-center min-w-[80px]">Ações</TableHead>
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
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-16 mx-auto" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20 mx-auto" />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-8 w-8 mx-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : logs.length > 0 ? (
                    logs.map((log) => {
                      const StatusIcon = statusMap[log.status]?.icon || Clock
                      const ChannelIcon = channelMap[log.channel]?.icon || MessageSquare

                      return (
                        <TableRow key={log.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            <div className="space-y-1">
                              <div className="font-medium text-sm">{log.userName || 'N/A'}</div>
                              <div className="text-xs text-muted-foreground">{log.userEmail}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {getNotificationType(log.notificationType)}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {log.notificationType}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div
                              className={`flex items-center justify-center gap-1 ${channelMap[log.channel]?.color}`}
                            >
                              <ChannelIcon className="h-4 w-4" />
                              <span className="text-xs font-medium">
                                {channelMap[log.channel]?.text}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={statusMap[log.status]?.variant || 'default'}
                              className="text-xs"
                            >
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusMap[log.status]?.text || log.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="text-sm font-mono">{log.recipient}</div>
                          </TableCell>
                          <TableCell className="hidden xl:table-cell text-muted-foreground text-sm">
                            {new Date(log.createdAt).toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => setSelectedLog(log)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Detalhes da Notificação</DialogTitle>
                                    <DialogDescription>
                                      Informações completas sobre o envio
                                    </DialogDescription>
                                  </DialogHeader>
                                  {selectedLog && (
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <label className="text-sm font-medium">Usuário</label>
                                          <p className="text-sm text-muted-foreground">
                                            {selectedLog.userName}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Email</label>
                                          <p className="text-sm text-muted-foreground">
                                            {selectedLog.userEmail}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Tipo</label>
                                          <p className="text-sm text-muted-foreground">
                                            {getNotificationType(selectedLog.notificationType)}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Canal</label>
                                          <p className="text-sm text-muted-foreground">
                                            {channelMap[selectedLog.channel]?.text}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Status</label>
                                          <Badge
                                            variant={
                                              statusMap[selectedLog.status]?.variant || 'default'
                                            }
                                            className="text-xs"
                                          >
                                            {statusMap[selectedLog.status]?.text ||
                                              selectedLog.status}
                                          </Badge>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Data</label>
                                          <p className="text-sm text-muted-foreground">
                                            {new Date(selectedLog.createdAt).toLocaleString(
                                              'pt-BR',
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Destinatário</label>
                                        <p className="text-sm text-muted-foreground font-mono">
                                          {selectedLog.recipient}
                                        </p>
                                      </div>
                                      {selectedLog.subject && (
                                        <div>
                                          <label className="text-sm font-medium">Assunto</label>
                                          <p className="text-sm text-muted-foreground">
                                            {selectedLog.subject}
                                          </p>
                                        </div>
                                      )}
                                      <div>
                                        <label className="text-sm font-medium">Conteúdo</label>
                                        <div className="bg-muted p-3 rounded-md text-sm max-h-40 overflow-y-auto">
                                          {selectedLog.messageContent}
                                        </div>
                                      </div>
                                      {selectedLog.errorMessage && (
                                        <div>
                                          <label className="text-sm font-medium text-red-600">
                                            Erro
                                          </label>
                                          <div className="bg-red-50 border border-red-200 p-3 rounded-md text-sm text-red-800">
                                            {selectedLog.errorMessage}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-videira-blue hover:text-videira-blue hover:bg-videira-blue/10"
                                onClick={() => handleResend(log.id)}
                                disabled={resendingId === log.id}
                                title="Reenviar notificação"
                              >
                                {resendingId === log.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-24">
                        <div className="flex flex-col items-center gap-2 py-8">
                          <History className="h-12 w-12 text-muted-foreground" />
                          <p className="text-lg font-medium text-muted-foreground">
                            Nenhum log encontrado
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
                {Math.min(currentPage * itemsPerPage, totalLogs)} de {totalLogs} resultados
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <div className="flex items-center gap-2 px-4">
                  <span className="text-sm font-medium">
                    Página {currentPage} de {totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || isLoading}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
