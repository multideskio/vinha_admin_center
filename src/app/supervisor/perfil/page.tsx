'use client'

import * as React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Camera,
  Facebook,
  Instagram,
  Globe,
  AlertTriangle,
  Info,
  Lock,
  Mail,
  Smartphone,
  MoreHorizontal,
  RefreshCw,
  Loader2,
  ArrowRightLeft,
  User,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClickableAvatar } from '@/components/ui/clickable-avatar'
import { supervisorProfileSchema } from '@/lib/types'
import type { NotificationType, UserNotificationSettings } from '@/lib/types'
import { NOTIFICATION_TYPES } from '@/lib/types'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'

const supervisorUpdateSchema = supervisorProfileSchema
  .extend({
    newPassword: z.string().optional().or(z.literal('')),
  })
  .partial()

type SupervisorProfile = z.infer<typeof supervisorUpdateSchema> & {
  id?: string
}

const notificationSettingsConfig = {
  payment_notifications: 'Notificações de Pagamento',
  due_date_reminders: 'Lembretes de Vencimento',
  network_reports: 'Relatórios da Rede',
}

type Transaction = {
  id: string
  amount: string | number
  status: string
  paymentMethod: string
  createdAt: string
  date?: string
  Payment?: {
    Status?: number
  }
  [key: string]: unknown
}

const TransactionsTab = ({ userId }: { userId: string }) => {
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [syncingTransactions, setSyncingTransactions] = React.useState<Set<string>>(new Set())
  const { toast } = useToast()

  React.useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/v1/supervisor/transacoes?userId=${userId}`)
        if (!response.ok) throw new Error('Falha ao carregar transações.')
        const data = await response.json()
        setTransactions(data.transactions || [])
      } catch (error: unknown) {
        toast({
          title: 'Erro',
          description: error instanceof Error ? error.message : 'Erro desconhecido',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchTransactions()
  }, [userId, toast])

  const syncTransaction = async (transactionId: string) => {
    setSyncingTransactions((prev) => new Set(prev).add(transactionId))

    try {
      const response = await fetch(`/api/v1/transacoes/${transactionId}`)
      const data = await response.json()

      if (data.transaction?.Payment?.Status === 2) {
        // Atualiza a transação local
        setTransactions((prev) =>
          prev.map((t) => (t.id === transactionId ? { ...t, status: 'approved' } : t)),
        )
        toast({
          title: 'Sincronizado!',
          description: 'Transação confirmada com sucesso.',
          variant: 'success',
        })
      } else {
        toast({
          title: 'Ainda Pendente',
          description: 'Transação ainda não foi confirmada pela Cielo.',
          variant: 'default',
        })
      }
    } catch (error) {
      console.error('Erro ao sincronizar transação:', error)
      toast({
        title: 'Erro na Sincronização',
        description: 'Não foi possível sincronizar a transação. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSyncingTransactions((prev) => {
        const newSet = new Set(prev)
        newSet.delete(transactionId)
        return newSet
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  const statusMap: {
    [key: string]: { text: string; variant: 'success' | 'warning' | 'destructive' | 'outline' }
  } = {
    approved: { text: 'Aprovada', variant: 'success' },
    pending: { text: 'Pendente', variant: 'warning' },
    refused: { text: 'Recusada', variant: 'destructive' },
    refunded: { text: 'Reembolsada', variant: 'outline' },
  }

  return (
    <Card className="shadow-lg border-t-4 border-t-videira-purple">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-videira-purple" />
          Minhas Transações
        </CardTitle>
        <CardDescription>Histórico das suas transações financeiras.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border-2">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-videira-cyan/10 via-videira-blue/10 to-videira-purple/10">
                <TableHead className="font-semibold">ID da Transação</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Data</TableHead>
                <TableHead className="text-right font-semibold">Valor</TableHead>
                <TableHead className="text-right min-w-[140px] font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono text-xs">{transaction.id}</TableCell>
                    <TableCell>
                      <Badge variant={statusMap[transaction.status]?.variant || 'default'}>
                        {statusMap[transaction.status]?.text || transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {transaction.date ||
                        new Date(transaction.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(
                        typeof transaction.amount === 'string'
                          ? parseFloat(transaction.amount)
                          : transaction.amount,
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {transaction.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => syncTransaction(transaction.id)}
                            disabled={syncingTransactions.has(transaction.id)}
                            className="h-8 px-2"
                          >
                            {syncingTransactions.has(transaction.id) ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                            <span className="ml-1 text-xs">
                              {syncingTransactions.has(transaction.id)
                                ? 'Sincronizando...'
                                : 'Sincronizar'}
                            </span>
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/supervisor/transacoes/${transaction.id}`}>
                                Ver Detalhes
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    Nenhuma transação encontrada para este usuário.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

const SettingsTab = ({ userId }: { userId: string }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _userId = userId // Temporarily unused but kept for future implementation
  const [settings, setSettings] = React.useState<UserNotificationSettings>(
    {} as UserNotificationSettings,
  )
  const [isLoading, setIsLoading] = React.useState(true)
  const { toast } = useToast()

  React.useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/v1/supervisor/notification-settings')
        if (!response.ok) throw new Error('Falha ao carregar configurações.')
        const data = await response.json()
        setSettings(data)
      } catch (error: unknown) {
        toast({
          title: 'Erro',
          description: error instanceof Error ? error.message : 'Erro desconhecido',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [toast])

  const handleSwitchChange = (
    type: NotificationType,
    channel: 'email' | 'whatsapp',
    value: boolean,
  ) => {
    setSettings((prev: UserNotificationSettings) => ({
      ...prev,
      [type]: {
        ...(prev[type] || { email: false, whatsapp: false }),
        [channel]: value,
      },
    }))
  }

  const handleSaveSettings = async () => {
    try {
      const response = await fetch('/api/v1/supervisor/notification-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!response.ok) throw new Error('Falha ao salvar configurações.')
      toast({
        title: 'Sucesso',
        description: 'Configurações de notificação salvas.',
        variant: 'success',
      })
    } catch (error: unknown) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-t-4 border-t-green-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-green-500" />
          Configurações de Notificação
        </CardTitle>
        <CardDescription>Gerencie quais notificações você receberá.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {NOTIFICATION_TYPES.map((type) => (
          <div key={type} className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">
                {notificationSettingsConfig[type as keyof typeof notificationSettingsConfig]}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2" title="Notificar por Email">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Switch
                  checked={settings[type]?.email ?? false}
                  onCheckedChange={(value) => handleSwitchChange(type, 'email', value)}
                />
              </div>
              <div className="flex items-center gap-2" title="Notificar por WhatsApp">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <Switch
                  checked={settings[type]?.whatsapp ?? false}
                  onCheckedChange={(value) => handleSwitchChange(type, 'whatsapp', value)}
                />
              </div>
            </div>
          </div>
        ))}
        <div className="flex justify-end">
          <Button onClick={handleSaveSettings}>Salvar Configurações</Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SupervisorProfilePage() {
  const [supervisor, setSupervisor] = React.useState<SupervisorProfile | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isFetchingCep, setIsFetchingCep] = React.useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const form = useForm<SupervisorProfile>({
    resolver: zodResolver(supervisorUpdateSchema),
    defaultValues: {},
  })

  const fetchProfile = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/supervisor/perfil')
      if (!response.ok) throw new Error('Falha ao carregar perfil.')
      const data = await response.json()
      setSupervisor(data.supervisor)
      form.reset(data.supervisor)
    } catch (error: unknown) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [form, toast])

  React.useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 9)
  }

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '')
    if (cep.length !== 8) return

    setIsFetchingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()
      if (!data.erro) {
        form.setValue('address', data.logradouro)
        form.setValue('neighborhood', data.bairro)
        form.setValue('city', data.localidade)
        form.setValue('state', data.uf)
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
    } finally {
      setIsFetchingCep(false)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !supervisor) return

    setIsUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'avatars')
      formData.append('filename', `supervisor-${supervisor.id}-${file.name}`)

      const uploadResponse = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Falha no upload da imagem.')
      }

      const uploadResult = await uploadResponse.json()

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error('Falha no upload da imagem.')
      }

      // Atualizar perfil com nova URL
      const payload = { avatarUrl: uploadResult.url }
      const response = await fetch('/api/v1/supervisor/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Falha ao atualizar avatar.')
      }

      toast({
        title: 'Sucesso!',
        description: 'Avatar atualizado com sucesso.',
        variant: 'success',
      })

      // Atualizar estado local
      console.log('Atualizando avatar URL:', uploadResult.url)
      setSupervisor((prev) => (prev ? { ...prev, avatarUrl: uploadResult.url } : null))
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsUploadingAvatar(false)
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSocialLinkBlur = async (
    fieldName: 'facebook' | 'instagram' | 'website',
    value: string,
  ) => {
    try {
      const payload = { [fieldName]: value || null }

      const response = await fetch('/api/v1/supervisor/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Falha ao atualizar ${fieldName}.`)
      }

      toast({
        title: 'Sucesso!',
        description: `Link do ${fieldName} atualizado.`,
        variant: 'success',
      })

      // Atualizar estado local
      setSupervisor((prev) => (prev ? { ...prev, [fieldName]: value || null } : null))
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  const onSubmit = async (data: SupervisorProfile) => {
    try {
      const response = await fetch('/api/v1/supervisor/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Falha ao atualizar perfil.')
      }

      toast({
        title: 'Sucesso!',
        description: 'Perfil atualizado com sucesso.',
        variant: 'success',
      })

      // Recarregar dados atualizados
      fetchProfile()
    } catch (error: unknown) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    }
  }

  if (isLoading || !supervisor) {
    return (
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-96 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header com gradiente Videira */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 videira-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

        <div className="relative z-10 p-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-lg">
            Meu Perfil
          </h1>
          <p className="text-base text-white/90 mt-2 font-medium">
            Gerencie suas informações pessoais e preferências
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg border-t-4 border-t-videira-cyan">
            <CardContent className="flex flex-col items-center pt-6 text-center">
              <div className="relative">
                <ClickableAvatar
                  key={supervisor.avatarUrl || 'no-avatar'}
                  src={supervisor.avatarUrl || undefined}
                  alt={`${supervisor.firstName} ${supervisor.lastName}`}
                  fallback={`${supervisor.firstName?.[0] || ''}${supervisor.lastName?.[0] || ''}`}
                  className="h-24 w-24"
                  enableModal={!!supervisor.avatarUrl}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  <span className="sr-only">Trocar foto</span>
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              <h2 className="mt-4 text-xl font-semibold">
                {supervisor.firstName} {supervisor.lastName}
              </h2>
              <p className="text-muted-foreground">Supervisor</p>
            </CardContent>
            <Separator />
            <CardContent className="pt-6">
              <h3 className="mb-4 font-semibold">Redes sociais</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Facebook className="h-5 w-5 text-muted-foreground" />
                  <Input
                    defaultValue={supervisor.facebook || ''}
                    placeholder="https://facebook.com/..."
                    onBlur={(e) => handleSocialLinkBlur('facebook', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Instagram className="h-5 w-5 text-muted-foreground" />
                  <Input
                    defaultValue={supervisor.instagram || ''}
                    placeholder="https://instagram.com/..."
                    onBlur={(e) => handleSocialLinkBlur('instagram', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <Input
                    defaultValue={supervisor.website || ''}
                    placeholder="https://website.com/..."
                    onBlur={(e) => handleSocialLinkBlur('website', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tabs and Form */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="profile">
            <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-videira-cyan/10 to-videira-blue/10">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Dados do perfil
              </TabsTrigger>
              <TabsTrigger value="transacoes" className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                Transações
              </TabsTrigger>
              <TabsTrigger value="configuracoes" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Configurações
              </TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <Card className="shadow-lg border-t-4 border-t-videira-blue">
                <CardContent className="pt-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sobrenome</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="cpf"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CPF</FormLabel>
                              <FormControl>
                                <Input {...field} disabled />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Celular *</FormLabel>
                              <FormControl>
                                <PhoneInput
                                  country={'br'}
                                  value={field.value}
                                  onChange={field.onChange}
                                  inputClass="!w-full"
                                  containerClass="phone-input-wrapper"
                                  inputStyle={{
                                    width: '100%',
                                    height: '40px',
                                    fontSize: '14px',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: 'calc(var(--radius) - 2px)',
                                    backgroundColor: 'hsl(var(--background))',
                                    color: 'hsl(var(--foreground))',
                                  }}
                                  buttonStyle={{
                                    border: '1px solid hsl(var(--border))',
                                    borderRight: 'none',
                                    backgroundColor: 'hsl(var(--background))',
                                    borderRadius:
                                      'calc(var(--radius) - 2px) 0 0 calc(var(--radius) - 2px)',
                                  }}
                                  dropdownStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: 'calc(var(--radius) - 2px)',
                                    color: 'hsl(var(--foreground))',
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="landline"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone 2</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="cep"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CEP</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ''}
                                  onChange={(e) => field.onChange(formatCEP(e.target.value))}
                                  onBlur={handleCepBlur}
                                  disabled={isFetchingCep}
                                  placeholder="00000-000"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estado/UF</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ''}
                                  disabled={isFetchingCep}
                                  placeholder="UF"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cidade</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ''}
                                  disabled={isFetchingCep}
                                  placeholder="Nome da cidade"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="neighborhood"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bairro</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ''}
                                  disabled={isFetchingCep}
                                  placeholder="Nome do bairro"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Endereço</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Nome da rua"
                                  {...field}
                                  value={field.value || ''}
                                  disabled={isFetchingCep}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Número da casa..."
                                  {...field}
                                  value={field.value || ''}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="complement"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel>Complemento</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ''} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="titheDay"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dia do dízimo</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} value={field.value || ''} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <Alert
                        variant="destructive"
                        className="bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-300"
                      >
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <AlertDescription>
                          <strong>Importante</strong> - Ao atualizar a senha, você não poderá
                          acessar usando a senha anterior.
                        </AlertDescription>
                      </Alert>

                      <Alert
                        variant="default"
                        className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
                      >
                        <Info className="h-4 w-4 text-blue-500" />
                        <AlertDescription className="text-blue-700 dark:text-blue-300">
                          <strong>Informação</strong> - Escolha uma senha adequada para você.
                        </AlertDescription>
                      </Alert>

                      <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <Label>Atualize sua senha</Label>
                            <FormControl>
                              <div className="relative mt-1">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                  type="password"
                                  placeholder="Nova Senha"
                                  className="pl-9"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end">
                        <Button type="submit">Alterar cadastro</Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="transacoes">
              {supervisor.id && <TransactionsTab userId={supervisor.id} />}
            </TabsContent>
            <TabsContent value="configuracoes">
              {supervisor.id && <SettingsTab userId={supervisor.id} />}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
