/**
 * @fileoverview Página de edição de perfil do pastor (visão do supervisor).
 * @version 1.3
 * @date 2025-01-06
 * @author Sistema de Padronização
 * @lastReview 2025-01-06 17:35
 */

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
  Lock,
  Calendar as CalendarIcon,
  Loader2,
  Mail,
  Smartphone,
  MoreHorizontal,
  User,
  Bell,
  CreditCard,
  ChevronLeft,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useParams, useRouter } from 'next/navigation'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
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
import {
  pastorProfileSchema,
  type TransactionStatus,
  type UserNotificationSettings,
  type NotificationType,
  NOTIFICATION_TYPES,
} from '@/lib/types'
import { Separator } from '@/components/ui/separator'

const pastorUpdateSchema = pastorProfileSchema
  .extend({
    newPassword: z.string().optional().or(z.literal('')),
    avatarUrl: z.string().optional(),
  })
  .partial()

type PastorFormData = z.infer<typeof pastorUpdateSchema>

type PastorProfile = PastorFormData & {
  id?: string
  cpf?: string
  status?: string
  avatarUrl?: string
  facebook?: string
  instagram?: string
  website?: string
  email?: string
  phone?: string
}

type Transaction = {
  id: string
  amount: number
  status: TransactionStatus
  date: string
  paymentMethod: string
  contributorName: string
}

const TransactionsTab = ({ pastorId }: { pastorId: string }) => {
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const { toast } = useToast()

  React.useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/v1/supervisor/pastores/${pastorId}/transactions`)
        if (!response.ok) throw new Error('Falha ao carregar transações.')
        const data = await response.json()
        setTransactions(data.transactions || [])
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }
    fetchTransactions()
  }, [pastorId, toast])

  const statusMap: {
    [key in TransactionStatus]: {
      text: string
      variant: 'success' | 'warning' | 'destructive' | 'outline'
    }
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
          <CreditCard className="h-5 w-5 text-videira-purple" />
          Transações do Pastor
        </CardTitle>
        <CardDescription>Histórico de transações financeiras do pastor.</CardDescription>
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
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
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
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(transaction.amount)}
                    </TableCell>
                    <TableCell className="text-right">
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
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    Nenhuma transação encontrada para este pastor.
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

const notificationSettingsConfig = {
  payment_notifications: 'Notificações de Pagamento',
  due_date_reminders: 'Lembretes de Vencimento',
  network_reports: 'Relatórios da Rede',
}

const SettingsTab = ({ pastorId }: { pastorId: string }) => {
  const [settings, setSettings] = React.useState<UserNotificationSettings>({
    payment_notifications: { email: false, whatsapp: false },
    due_date_reminders: { email: false, whatsapp: false },
    network_reports: { email: false, whatsapp: false },
  })
  const [isLoading, setIsLoading] = React.useState(true)
  const { toast } = useToast()

  const fetchSettings = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/v1/supervisor/pastores/${pastorId}/notification-settings`)
      if (!response.ok) throw new Error('Falha ao carregar configurações.')
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [pastorId, toast])

  React.useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSwitchChange = (
    type: NotificationType,
    channel: 'email' | 'whatsapp',
    value: boolean,
  ) => {
    setSettings((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [channel]: value,
      },
    }))
  }

  const handleSaveSettings = async () => {
    try {
      const response = await fetch(
        `/api/v1/supervisor/pastores/${pastorId}/notification-settings`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        },
      )
      if (!response.ok) throw new Error('Falha ao salvar configurações.')
      toast({
        title: 'Sucesso',
        description: 'Configurações de notificação salvas.',
        variant: 'success',
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
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
          <Bell className="h-5 w-5 text-green-500" />
          Configurações de Notificação
        </CardTitle>
        <CardDescription>Gerencie quais notificações este pastor receberá.</CardDescription>
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

export default function PastorProfilePage() {
  const [pastor, setPastor] = React.useState<PastorProfile | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [previewImage, setPreviewImage] = React.useState<string | null>(null)

  const params = useParams()
  const router = useRouter()
  const { id } = params
  const { toast } = useToast()

  const form = useForm<z.infer<typeof pastorUpdateSchema>>({
    resolver: zodResolver(pastorUpdateSchema),
    defaultValues: {},
  })

  const fetchData = React.useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const [pastorRes] = await Promise.all([fetch(`/api/v1/supervisor/pastores/${id}`)])

      if (!pastorRes.ok) throw new Error('Falha ao carregar dados do pastor.')

      const pastorData = await pastorRes.json()

      const sanitizedData = {
        ...pastorData,
        birthDate: pastorData.birthDate ? new Date(pastorData.birthDate) : null,
        newPassword: '',
      }

      setPastor(sanitizedData)
      // Supervisor não precisa escolher supervisor - ele é o próprio supervisor
      form.reset(sanitizedData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [id, form, toast])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const onSubmit = async (data: PastorFormData) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/v1/supervisor/pastores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Falha ao atualizar o pastor.')
      toast({ title: 'Sucesso', description: 'Pastor atualizado com sucesso.', variant: 'success' })

      // Recarregar dados após salvar
      await fetchData()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este pastor? Esta ação é irreversível.')) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/v1/supervisor/pastores/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Falha ao excluir o pastor.')
      }
      toast({ title: 'Sucesso!', description: 'Pastor excluído com sucesso.', variant: 'success' })
      router.push('/supervisor/pastores')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setIsUploading(true)
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'avatars')
        formData.append('filename', `pastor-${id}-${file.name}`)

        const response = await fetch('/api/v1/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Falha no upload da imagem')
        }

        const result = await response.json()

        // Atualizar avatar no banco
        const updateResponse = await fetch(`/api/v1/supervisor/pastores/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl: result.url }),
        })

        if (!updateResponse.ok) {
          throw new Error('Falha ao atualizar avatar')
        }

        setPreviewImage(result.url)
        setPastor((prev) => (prev ? { ...prev, avatarUrl: result.url } : null))

        toast({
          title: 'Sucesso',
          description: 'Avatar atualizado com sucesso!',
          variant: 'success',
        })
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Falha ao fazer upload da imagem.',
          variant: 'destructive',
        })
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleSocialLinkBlur = async (
    fieldName: 'facebook' | 'instagram' | 'website',
    value: string,
  ) => {
    // Não fazer nada se o valor estiver vazio ou for igual ao valor atual
    if (!value || value === pastor?.[fieldName]) {
      return
    }

    try {
      const payload = { [fieldName]: value || null }

      const response = await fetch(`/api/v1/supervisor/pastores/${id}`, {
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
      setPastor((prev) => (prev ? { ...prev, [fieldName]: value } : null))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
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

  if (!pastor) {
    return <p>Pastor não encontrado.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header com link de volta */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 videira-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />

        <div className="relative z-10 p-6 flex items-center gap-4">
          <Link href="/supervisor/pastores">
            <Button
              variant="ghost"
              size="icon"
              className="bg-white/20 hover:bg-white/30 text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
              {pastor.firstName} {pastor.lastName}
            </h1>
            <p className="text-white/90 text-sm mt-1">Editar dados do pastor</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="shadow-lg border-t-4 border-t-videira-cyan">
            <CardContent className="flex flex-col items-center pt-6 text-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src={previewImage || pastor.avatarUrl || 'https://placehold.co/96x96.png'}
                    alt={pastor.firstName ?? ''}
                    data-ai-hint="male pastor"
                  />
                  <AvatarFallback>
                    {pastor.firstName?.[0]}
                    {pastor.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                    <Loader2 className="h-6 w-6 animate-spin text-videira-cyan" />
                  </div>
                )}
                <Label
                  htmlFor="photo-upload"
                  className={`absolute bottom-0 right-0 cursor-pointer ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-background border border-border hover:bg-muted">
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Camera className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <span className="sr-only">Trocar foto</span>
                </Label>
                <Input
                  id="photo-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  disabled={isUploading}
                />
              </div>
              <h2 className="mt-4 text-xl font-semibold">
                {pastor.firstName} {pastor.lastName}
              </h2>
              <p className="text-muted-foreground">Pastor</p>
            </CardContent>
            <Separator />
            <CardContent className="pt-6">
              <h3 className="mb-4 font-semibold">Redes sociais</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Facebook className="h-5 w-5 text-muted-foreground" />
                  <Input
                    defaultValue={pastor.facebook || ''}
                    placeholder="https://facebook.com/..."
                    onBlur={(e) => handleSocialLinkBlur('facebook', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Instagram className="h-5 w-5 text-muted-foreground" />
                  <Input
                    defaultValue={pastor.instagram || ''}
                    placeholder="https://instagram.com/..."
                    onBlur={(e) => handleSocialLinkBlur('instagram', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <Input
                    defaultValue={pastor.website || ''}
                    placeholder="https://website.com/..."
                    onBlur={(e) => handleSocialLinkBlur('website', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="profile">
            <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-videira-cyan/10 to-videira-blue/10">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Transações
              </TabsTrigger>
              <TabsTrigger value="configuracoes" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Configurações
              </TabsTrigger>
              <TabsTrigger value="delete" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Excluir
              </TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <Card className="shadow-lg border-t-4 border-t-videira-blue">
                <CardContent className="pt-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Supervisor não pode alterar o supervisor do pastor - ele é o próprio supervisor */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value ?? ''} />
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
                              <FormLabel>Sobre-nome</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value ?? ''} />
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
                                <Input {...field} disabled value={pastor?.cpf ?? ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="birthDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data de nascimento</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={'outline'}
                                      className={cn(
                                        'w-full pl-3 text-left font-normal',
                                        !field.value && 'text-muted-foreground',
                                      )}
                                    >
                                      {field.value ? (
                                        format(new Date(field.value), 'dd/MM/yyyy', {
                                          locale: ptBR,
                                        })
                                      ) : (
                                        <span>dd/mm/aaaa</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value ? new Date(field.value) : undefined}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date > new Date() || date < new Date('1900-01-01')
                                    }
                                    initialFocus
                                    locale={ptBR}
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Celular</FormLabel>
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
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-1">
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} value={field.value ?? ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="cep"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CEP</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value ?? ''} />
                              </FormControl>
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
                                <Input {...field} value={field.value ?? ''} />
                              </FormControl>
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
                                <Input {...field} value={field.value ?? ''} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rua</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Complemento..."
                                  {...field}
                                  value={field.value ?? ''}
                                />
                              </FormControl>
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
                                  value={field.value ?? ''}
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
                                <Input {...field} value={field.value ?? ''} />
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
                                <Input
                                  type="number"
                                  {...field}
                                  value={
                                    typeof field.value === 'number'
                                      ? field.value.toString()
                                      : (field.value ?? '')
                                  }
                                />
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
                          <strong>Importante</strong> - Ao atualizar a senha, o usuário não poderá
                          acessar usando a senha anterior.
                        </AlertDescription>
                      </Alert>

                      <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <Label>Atualize a senha do pastor</Label>
                            <FormControl>
                              <div className="relative mt-1">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                  type="password"
                                  placeholder="Nova senha"
                                  className="pl-9"
                                  {...field}
                                  value={field.value ?? ''}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end">
                        <Button type="submit" disabled={isSaving || isUploading}>
                          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {isSaving ? 'Salvando...' : 'Alterar cadastro'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions">
              <TransactionsTab pastorId={id as string} />
            </TabsContent>

            <TabsContent value="configuracoes">
              <SettingsTab pastorId={id as string} />
            </TabsContent>

            <TabsContent value="delete">
              <Card className="border-destructive shadow-lg">
                <CardHeader>
                  <CardTitle className="text-destructive">Excluir Cadastro</CardTitle>
                  <CardDescription>
                    Esta ação é irreversível. Tenha certeza de que deseja excluir permanentemente
                    este cadastro.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isDeleting ? 'Excluindo...' : 'Excluir permanentemente'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
