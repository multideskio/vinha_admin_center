'use client'

import * as React from 'react'
import DOMPurify from 'isomorphic-dompurify'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Loader2,
  Mail,
  ChevronLeft,
  Save,
  Send,
  AlertTriangle,
  Ban,
  History,
  Trash2,
  Settings,
  ChevronRight,
  Eye,
} from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const smtpSettingsSchema = z.object({
  host: z.string().min(1, 'Servidor SMTP é obrigatório.'),
  port: z.coerce.number().min(1, 'Porta é obrigatória.'),
  user: z.string().min(1, 'Usuário SMTP é obrigatório.'),
  password: z.string().min(1, 'Senha SMTP é obrigatória.'),
  from: z.string().email('E-mail de envio inválido.').optional().nullable(),
})

type SmtpSettingsValues = z.infer<typeof smtpSettingsSchema>

interface EmailBlacklistItem {
  id: string
  email: string
  reason?: string
  createdAt: string
  active: boolean
  attemptCount?: number
  lastAttemptAt?: string
}

interface EmailLogItem {
  id: string
  userId?: string
  email?: string
  recipient?: string
  subject?: string
  status: string
  createdAt: string
  sentAt?: string
  error?: string
  errorMessage?: string
  messageContent?: string
}

/**
 * Sanitiza HTML para prevenir XSS ao renderizar conteúdo de email
 */
function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'b',
      'i',
      'u',
      'a',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'h4',
      'div',
      'span',
      'table',
      'tr',
      'td',
      'th',
      'thead',
      'tbody',
      'img',
      'hr',
      'blockquote',
      'pre',
      'code',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'style', 'class', 'width', 'height', 'target', 'rel'],
  })
}

export default function SmtpSettingsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isTesting, setIsTesting] = React.useState(false)
  const [testEmail, setTestEmail] = React.useState('')
  const [blacklist, setBlacklist] = React.useState<EmailBlacklistItem[]>([])
  const [emailLogs, setEmailLogs] = React.useState<EmailLogItem[]>([])
  const [loadingBlacklist, setLoadingBlacklist] = React.useState(false)
  const [loadingLogs, setLoadingLogs] = React.useState(false)
  const [logsPage, setLogsPage] = React.useState(1)
  const [blacklistPage, setBlacklistPage] = React.useState(1)
  const [totalLogs, setTotalLogs] = React.useState(0)
  const [totalBlacklist, setTotalBlacklist] = React.useState(0)
  const logsPerPage = 20
  const blacklistPerPage = 20
  const [selectedEmail, setSelectedEmail] = React.useState<EmailLogItem | null>(null)
  const [showEmailDialog, setShowEmailDialog] = React.useState(false)

  const form = useForm<SmtpSettingsValues>({
    resolver: zodResolver(smtpSettingsSchema),
    defaultValues: {
      host: '',
      port: 587,
      user: '',
      password: '',
      from: '',
    },
  })

  React.useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/v1/settings/smtp')
        if (!response.ok) throw new Error('Falha ao carregar configurações SMTP.')
        const data = await response.json()
        if (data.config) {
          form.reset({
            host: data.config.host || '',
            port: data.config.port || 587,
            user: data.config.user || '',
            password: data.config.password || '',
            from: data.config.from || '',
          })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }
    fetchConfig()
    // fetchBlacklist e fetchEmailLogs são chamados em useEffects separados abaixo
    // para evitar dependências desnecessárias e loops infinitos
  }, [form, toast])

  React.useEffect(() => {
    fetchEmailLogs(logsPage)
  }, [logsPage])

  React.useEffect(() => {
    fetchBlacklist(blacklistPage)
  }, [blacklistPage])

  const fetchBlacklist = async (page = 1) => {
    setLoadingBlacklist(true)
    try {
      const response = await fetch(
        `/api/v1/email-blacklist?active=true&page=${page}&limit=${blacklistPerPage}`,
      )
      if (response.ok) {
        const data = await response.json()
        setBlacklist(data.blacklist || [])
        setTotalBlacklist(data.total || 0)
      }
    } catch (error) {
      console.error('Erro ao carregar blacklist:', error)
    } finally {
      setLoadingBlacklist(false)
    }
  }

  const fetchEmailLogs = async (page = 1) => {
    setLoadingLogs(true)
    try {
      const response = await fetch(
        `/api/v1/notification-logs?channel=email&page=${page}&limit=${logsPerPage}`,
      )
      if (response.ok) {
        const data = await response.json()
        setEmailLogs(data.logs || [])
        setTotalLogs(data.total || 0)
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
    } finally {
      setLoadingLogs(false)
    }
  }

  const handleRemoveFromBlacklist = async (email: string) => {
    try {
      const response = await fetch(`/api/v1/email-blacklist?email=${email}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Falha ao remover da blacklist')
      toast({ title: 'Sucesso', description: 'Email removido da blacklist', variant: 'success' })
      fetchBlacklist(blacklistPage)
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao remover email', variant: 'destructive' })
    }
  }

  const onSubmit = async (data: SmtpSettingsValues) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/v1/settings/smtp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Falha ao salvar configurações SMTP.')
      }

      toast({
        title: 'Sucesso!',
        description: 'Configurações de SMTP salvas com sucesso.',
        variant: 'success',
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: 'Atenção',
        description: 'Por favor, insira um e-mail de destino.',
        variant: 'destructive',
      })
      return
    }

    // Validar se as configurações estão preenchidas
    const currentConfig = form.getValues()
    if (!currentConfig.host || !currentConfig.user || !currentConfig.password) {
      toast({
        title: 'Configurações Incompletas',
        description: 'Por favor, preencha todas as configurações SMTP antes de testar.',
        variant: 'destructive',
      })
      return
    }

    setIsTesting(true)
    try {
      const response = await fetch('/api/v1/settings/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, config: currentConfig }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Falha ao enviar e-mail de teste.')
      }

      toast({
        title: 'Sucesso!',
        description: 'E-mail de teste enviado com sucesso!',
        variant: 'success',
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro no Teste', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsTesting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Separator />
          <div>
            <Skeleton className="h-7 w-1/4 mb-2" />
            <Skeleton className="h-10 w-full mb-4" />
            <div className="flex justify-end">
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
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
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-3">
              <Mail className="h-8 w-8" />
              Configuração SMTP / SES
            </h1>
            <p className="text-base text-white/90 mt-2 font-medium">
              Configure o serviço para envio de e-mails transacionais
            </p>
          </div>
        </div>
      </div>

      {/* Tabs de Monitoramento e Configuração */}
      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuração
          </TabsTrigger>
          <TabsTrigger value="blacklist" className="flex items-center gap-2">
            <Ban className="h-4 w-4" />
            Bloqueados ({blacklist.length})
          </TabsTrigger>
        </TabsList>

        {/* Logs */}
        <TabsContent value="logs">
          <Card className="shadow-lg border-t-4 border-t-videira-purple">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-videira-purple/15 ring-2 ring-videira-purple/30">
                  <History className="h-5 w-5 text-videira-purple" />
                </div>
                Histórico de Disparos
              </CardTitle>
              <CardDescription>Últimos 50 emails enviados pelo sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLogs ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : emailLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum email enviado ainda</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Destinatário</TableHead>
                        <TableHead>Assunto</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emailLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-sm">{log.recipient}</TableCell>
                          <TableCell className="max-w-xs truncate">{log.subject}</TableCell>
                          <TableCell>
                            <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                              {log.status === 'sent' ? 'Enviado' : 'Falhou'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {log.sentAt ? new Date(log.sentAt).toLocaleString('pt-BR') : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedEmail(log)
                                setShowEmailDialog(true)
                              }}
                              className="text-videira-blue hover:text-videira-blue/80"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {(logsPage - 1) * logsPerPage + 1} a{' '}
                      {Math.min(logsPage * logsPerPage, totalLogs)} de {totalLogs}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                        disabled={logsPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLogsPage((p) => p + 1)}
                        disabled={logsPage * logsPerPage >= totalLogs}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuração */}
        <TabsContent value="config">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card className="shadow-lg border-t-4 border-t-videira-blue">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-videira-blue/15 ring-2 ring-videira-blue/30">
                      <Mail className="h-5 w-5 text-videira-blue" />
                    </div>
                    Credenciais SMTP / Amazon SES
                  </CardTitle>
                  <CardDescription>
                    Configure Amazon SES, SendGrid ou outro provedor SMTP
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="host"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Servidor SMTP</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="email-smtp.us-east-1.amazonaws.com"
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="port"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Porta</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="587"
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="user"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Usuário SMTP</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Seu usuário SMTP"
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha SMTP</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Sua senha SMTP"
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="from"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail de Envio (From)</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="remetente@autorizado.com"
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="bg-videira-blue hover:bg-videira-blue/90 text-white font-semibold shadow-lg"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Salvar Configurações
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-t-4 border-t-videira-cyan">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-videira-cyan/15 ring-2 ring-videira-cyan/30">
                      <Send className="h-5 w-5 text-videira-cyan" />
                    </div>
                    Testar Configuração
                  </CardTitle>
                  <CardDescription>
                    Envie um e-mail de teste para validar as configurações
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="bg-videira-blue/10 border-videira-blue/30">
                    <AlertTriangle className="h-4 w-4 text-videira-blue" />
                    <AlertDescription className="text-videira-blue">
                      <strong>Amazon SES:</strong> Certifique-se de que o e-mail de destino está
                      verificado no SES se estiver em modo Sandbox.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label className="font-semibold">E-mail de Destino</Label>
                    <Input
                      type="email"
                      placeholder="Ex: teste@vinha.com"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      className="border-2"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={handleSendTestEmail}
                      disabled={isTesting}
                      className="bg-white dark:bg-background border-2 border-videira-cyan text-videira-cyan hover:bg-videira-cyan hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
                    >
                      {isTesting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Enviar E-mail de Teste
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </TabsContent>

        {/* Blacklist */}
        <TabsContent value="blacklist">
          <Card className="shadow-lg border-t-4 border-t-red-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-red-500/15 ring-2 ring-red-500/30">
                  <Ban className="h-5 w-5 text-red-500" />
                </div>
                Emails Bloqueados (Blacklist)
              </CardTitle>
              <CardDescription>
                Emails que falharam permanentemente ou foram marcados como spam
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingBlacklist ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : blacklist.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Ban className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum email bloqueado</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Tentativas</TableHead>
                        <TableHead>Última Tentativa</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blacklist.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-sm">{item.email}</TableCell>
                          <TableCell>
                            <Badge variant={item.reason === 'bounce' ? 'destructive' : 'secondary'}>
                              {item.reason === 'bounce'
                                ? 'Bounce'
                                : item.reason === 'complaint'
                                  ? 'Spam'
                                  : item.reason}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.attemptCount ?? 0}x</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.lastAttemptAt
                              ? new Date(item.lastAttemptAt).toLocaleString('pt-BR')
                              : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFromBlacklist(item.email)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {(blacklistPage - 1) * blacklistPerPage + 1} a{' '}
                      {Math.min(blacklistPage * blacklistPerPage, totalBlacklist)} de{' '}
                      {totalBlacklist}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBlacklistPage((p) => Math.max(1, p - 1))}
                        disabled={blacklistPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBlacklistPage((p) => p + 1)}
                        disabled={blacklistPage * blacklistPerPage >= totalBlacklist}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Visualização de Email */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-videira-blue" />
              Visualizar Email
            </DialogTitle>
            <DialogDescription>
              Cópia do email enviado para {selectedEmail?.recipient}
            </DialogDescription>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Destinatário</p>
                  <p className="font-mono text-sm">{selectedEmail.recipient}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Status</p>
                  <Badge variant={selectedEmail.status === 'sent' ? 'default' : 'destructive'}>
                    {selectedEmail.status === 'sent' ? 'Enviado' : 'Falhou'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Assunto</p>
                  <p className="text-sm">{selectedEmail.subject}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Data</p>
                  <p className="text-sm">
                    {selectedEmail.sentAt
                      ? new Date(selectedEmail.sentAt).toLocaleString('pt-BR')
                      : 'N/A'}
                  </p>
                </div>
                {selectedEmail.errorMessage && (
                  <div className="col-span-2">
                    <p className="text-sm font-semibold text-muted-foreground">Erro</p>
                    <p className="text-sm text-red-500">{selectedEmail.errorMessage}</p>
                  </div>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">
                  Conteúdo do Email
                </p>
                <div
                  className="border rounded-lg p-4 bg-white dark:bg-gray-950 overflow-auto"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(selectedEmail.messageContent || '<p>Sem conteúdo</p>'),
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
