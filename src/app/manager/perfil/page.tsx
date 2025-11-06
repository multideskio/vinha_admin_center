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
  Loader2,
  Mail,
  Smartphone,
  User,
  ArrowRightLeft,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { ClickableAvatar } from '@/components/ui/clickable-avatar'
import { Separator } from '@/components/ui/separator'

import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

import {
  type NotificationType,
  type UserNotificationSettings,
  type TransactionStatus,
} from '@/lib/types'

import { Switch } from '@/components/ui/switch'
import { PhoneInput } from '@/components/ui/phone-input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import Link from 'next/link'

const managerUpdateSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  cpf: z.string().optional(),
  phone: z.string().nullable().optional(),
  landline: z.string().nullable().optional(),
  cep: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  titheDay: z.number().nullable().optional(),
  facebook: z.string().nullable().optional(),
  instagram: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  avatarUrl: z.string().optional(),
  newPassword: z.string().optional().or(z.literal('')),
  id: z.string().optional(),
  number: z.string().nullable().optional(),
  complement: z.string().nullable().optional(),
})

type ManagerProfile = {
  email?: string
  firstName?: string
  lastName?: string
  cpf?: string
  phone?: string | null
  landline?: string | null
  cep?: string | null
  state?: string | null
  city?: string | null
  neighborhood?: string | null
  address?: string | null
  titheDay?: number | null
  facebook?: string | null
  instagram?: string | null
  website?: string | null
  avatarUrl?: string
  newPassword?: string
  id?: string
  number?: string | null
  complement?: string | null
  userId?: string
}

type Transaction = {
  id: string
  amount: number
  status: 'approved' | 'pending' | 'refused' | 'refunded'
  date: string
}

const TransactionsTab = ({ userId }: { userId: string }) => {
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [startDate, setStartDate] = React.useState('')
  const [endDate, setEndDate] = React.useState('')
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')
  const { toast } = useToast()

  React.useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          userId,
          page: page.toString(),
          limit: '10',
          sort: sortOrder,
        })
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)
        
        const response = await fetch(`/api/v1/manager/transacoes?${params}`)
        if (!response.ok) throw new Error('Falha ao carregar transações.')
        const data = await response.json()
        setTransactions(data.transactions)
        setTotalPages(data.pagination?.totalPages || 1)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }
    fetchTransactions()
  }, [userId, page, startDate, endDate, sortOrder, toast])

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
    <Card className="shadow-lg border-t-4 border-t-videira-cyan">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-full bg-gradient-to-br from-videira-cyan/20 to-videira-blue/20 text-videira-cyan">
            <ArrowRightLeft className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl">Minhas Transações</CardTitle>
            <CardDescription className="mt-1">Histórico das minhas contribuições</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <Label>Data Início</Label>
            <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1) }} />
          </div>
          <div className="flex-1">
            <Label>Data Fim</Label>
            <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1) }} />
          </div>
          <div className="flex-1">
            <Label>Ordenar</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={sortOrder} onChange={(e) => { setSortOrder(e.target.value as 'asc' | 'desc'); setPage(1) }}>
              <option value="desc">Mais recentes</option>
              <option value="asc">Mais antigas</option>
            </select>
          </div>
        </div>
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
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      transaction.amount,
                    )}
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
                          <Link href={`/manager/transacoes/${transaction.id}`}>Ver Detalhes</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  Nenhuma transação encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              className="border-2"
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
              className="border-2"
            >
              Próxima
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const SettingsTab = ({ userId }: { userId: string }) => {
  const [settings, setSettings] = React.useState<UserNotificationSettings>({
    payment_notifications: { email: false, whatsapp: false },
    due_date_reminders: { email: false, whatsapp: false },
    network_reports: { email: false, whatsapp: false },
  })
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const { toast } = useToast()

  const fetchSettings = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/v1/users/${userId}/notification-settings`)
      if (!response.ok) throw new Error('Falha ao carregar configurações.')
      const data = await response.json()
      setSettings(data)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [userId, toast])

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
    setIsSaving(true)
    try {
      const response = await fetch(`/api/v1/users/${userId}/notification-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!response.ok) throw new Error('Falha ao salvar configurações.')
      toast({
        title: 'Sucesso',
        description: 'Configurações salvas com sucesso.',
        variant: 'success',
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: message, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="shadow-lg">
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
    <Card className="shadow-lg border-t-4 border-t-videira-cyan">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-full bg-gradient-to-br from-videira-cyan/20 to-videira-blue/20 text-videira-cyan">
            <Lock className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl">Configurações de Notificação</CardTitle>
            <CardDescription className="mt-1">Gerencie suas preferências de notificações</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border-2 p-4 hover:bg-muted/30 transition-colors">
          <div>
            <p className="font-semibold">Notificações de Pagamento</p>
            <p className="text-sm text-muted-foreground">
              Receber avisos sobre pagamentos recebidos, recusados, etc.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2" title="Notificar por Email">
              <Mail className="h-4 w-4 text-videira-cyan" />
              <Switch
                checked={settings.payment_notifications.email}
                onCheckedChange={(v) => handleSwitchChange('payment_notifications', 'email', v)}
              />
            </div>
            <div className="flex items-center gap-2" title="Notificar por WhatsApp">
              <Smartphone className="h-4 w-4 text-green-600" />
              <Switch
                checked={settings.payment_notifications.whatsapp}
                onCheckedChange={(v) => handleSwitchChange('payment_notifications', 'whatsapp', v)}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border-2 p-4 hover:bg-muted/30 transition-colors">
          <div>
            <p className="font-semibold">Lembretes de Vencimento</p>
            <p className="text-sm text-muted-foreground">
              Receber lembretes sobre pagamentos próximos do vencimento.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2" title="Notificar por Email">
              <Mail className="h-4 w-4 text-videira-cyan" />
              <Switch
                checked={settings.due_date_reminders.email}
                onCheckedChange={(v) => handleSwitchChange('due_date_reminders', 'email', v)}
              />
            </div>
            <div className="flex items-center gap-2" title="Notificar por WhatsApp">
              <Smartphone className="h-4 w-4 text-green-600" />
              <Switch
                checked={settings.due_date_reminders.whatsapp}
                onCheckedChange={(v) => handleSwitchChange('due_date_reminders', 'whatsapp', v)}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border-2 p-4 hover:bg-muted/30 transition-colors">
          <div>
            <p className="font-semibold">Relatórios da Rede</p>
            <p className="text-sm text-muted-foreground">
              Receber relatórios sobre a rede de supervisão.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2" title="Notificar por Email">
              <Mail className="h-4 w-4 text-videira-cyan" />
              <Switch
                checked={settings.network_reports.email}
                onCheckedChange={(v) => handleSwitchChange('network_reports', 'email', v)}
              />
            </div>
            <div className="flex items-center gap-2" title="Notificar por WhatsApp">
              <Smartphone className="h-4 w-4 text-green-600" />
              <Switch
                checked={settings.network_reports.whatsapp}
                onCheckedChange={(v) => handleSwitchChange('network_reports', 'whatsapp', v)}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} disabled={isSaving} className="bg-videira-cyan hover:bg-videira-cyan/90 text-white font-semibold shadow-lg">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Configurações
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function GerenteProfilePage() {
  const [manager, setManager] = React.useState<ManagerProfile | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [previewImage, setPreviewImage] = React.useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<ManagerProfile>({
    resolver: zodResolver(managerUpdateSchema),
    defaultValues: {},
  })

  const fetchManager = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/v1/manager/perfil`)
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: 'Sessão Expirada',
            description: 'Por favor, faça login novamente.',
            variant: 'destructive',
          })
          router.push('/auth/login')
          return
        }
        throw new Error('Falha ao carregar dados do gerente')
      }
      const data = await response.json()

      setManager(data.manager)
      form.reset(data.manager)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [form, toast, router])

  React.useEffect(() => {
    fetchManager()
  }, [fetchManager])

  const onSubmit = async (data: Partial<ManagerProfile>) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/v1/manager/perfil`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Falha ao atualizar o gerente.')
      toast({ title: 'Sucesso', description: 'Perfil atualizado com sucesso.', variant: 'success' })
      fetchManager()
    } catch (error: unknown) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o gerente.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'avatars')
        formData.append('filename', `manager-${manager?.id}-${file.name}`)

        const response = await fetch('/api/v1/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) throw new Error('Falha no upload')
        const result = await response.json()
        
        const updateResponse = await fetch('/api/v1/manager/perfil', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl: result.url }),
        })

        if (!updateResponse.ok) throw new Error('Falha ao atualizar avatar')

        setPreviewImage(result.url)
        setManager(prev => prev ? { ...prev, avatarUrl: result.url } : null)
        toast({ title: 'Sucesso', description: 'Avatar atualizado!', variant: 'success' })
      } catch (error) {
        toast({ title: 'Erro', description: 'Falha ao fazer upload.', variant: 'destructive' })
      }
    }
  }

  const handleSocialLinkBlur = async (
    fieldName: 'facebook' | 'instagram' | 'website',
    value: string,
  ) => {
    try {
      const response = await fetch('/api/v1/manager/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [fieldName]: value }),
      })

      if (!response.ok) throw new Error(`Falha ao atualizar ${fieldName}`)

      toast({ title: 'Sucesso', description: `Link atualizado!`, variant: 'success' })
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao atualizar.', variant: 'destructive' })
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

  if (!manager) {
    return <p>Gerente não encontrado.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header com gradiente Videira */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg">
        <div className="absolute inset-0 videira-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />
        
        <div className="relative z-10 p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-3">
                <User className="h-8 w-8" />
                Meu Perfil
              </h1>
              <p className="text-base text-white/90 mt-2 font-medium">
                Gerencie suas informações pessoais
              </p>
            </div>
            <Badge 
              variant="success"
              className="text-sm px-6 py-2 font-bold shadow-xl border-2 bg-green-500 text-white border-green-400 hover:bg-green-600"
            >
              ✓ Ativo
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg border-t-4 border-t-videira-cyan">
          <CardContent className="flex flex-col items-center pt-6 text-center">
            <div className="relative">
              <ClickableAvatar
                src={previewImage || manager.avatarUrl || 'https://placehold.co/96x96.png'}
                alt={manager.firstName ?? ''}
                fallback={`${manager.firstName?.[0] || ''}${manager.lastName?.[0] || ''}`}
                className="h-24 w-24 ring-4 ring-videira-cyan/30"
              />
              <Label htmlFor="photo-upload" className="absolute bottom-0 right-0 cursor-pointer">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-videira-cyan border-2 border-white hover:bg-videira-cyan/90 shadow-lg">
                  <Camera className="h-4 w-4 text-white" />
                </div>
                <span className="sr-only">Trocar foto</span>
              </Label>
              <Input
                id="photo-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </div>
            <h2 className="mt-4 text-xl font-semibold">
              {manager.firstName} {manager.lastName}
            </h2>
            <p className="text-muted-foreground">Gerente</p>
          </CardContent>
          <Separator />
          <CardContent className="pt-6">
            <h3 className="mb-4 font-semibold flex items-center gap-2">
              <Globe className="h-5 w-5 text-videira-cyan" />
              Redes sociais
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Facebook className="h-5 w-5 text-blue-600" />
                <Input
                  defaultValue={manager.facebook ?? ''}
                  placeholder="https://facebook.com/..."
                  onBlur={(e) => handleSocialLinkBlur('facebook', e.target.value)}
                  className="border-2 focus:border-videira-cyan"
                />
              </div>
              <div className="flex items-center gap-3">
                <Instagram className="h-5 w-5 text-pink-600" />
                <Input
                  defaultValue={manager.instagram ?? ''}
                  placeholder="https://instagram.com/..."
                  onBlur={(e) => handleSocialLinkBlur('instagram', e.target.value)}
                  className="border-2 focus:border-videira-cyan"
                />
              </div>
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-videira-cyan" />
                <Input 
                  defaultValue={manager.website ?? ''} 
                  placeholder="https://website.com/..."
                  onBlur={(e) => handleSocialLinkBlur('website', e.target.value)}
                  className="border-2 focus:border-videira-cyan"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Tabs and Form */}
      <div className="lg:col-span-2">
        <Tabs defaultValue="profile">
          <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-videira-cyan/10 via-videira-blue/10 to-videira-purple/10">
            <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:text-videira-cyan data-[state=active]:font-semibold">
              Dados do perfil
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-white data-[state=active]:text-videira-cyan data-[state=active]:font-semibold">
              Transações
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="data-[state=active]:bg-white data-[state=active]:text-videira-cyan data-[state=active]:font-semibold">
              Configurações
            </TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <Card className="shadow-lg border-t-4 border-t-videira-cyan">
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
                              <Input {...field} disabled value={field.value ?? ''} />
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
                            <FormLabel>Celular/WhatsApp</FormLabel>
                            <FormControl>
                              <PhoneInput
                                value={field.value || ''}
                                onChange={field.onChange}
                                type="mobile"
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
                            <FormLabel>Telefone Fixo</FormLabel>
                            <FormControl>
                              <PhoneInput
                                value={field.value || ''}
                                onChange={field.onChange}
                                type="landline"
                              />
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
                              <Input type="email" {...field} value={field.value ?? ''} />
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
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cidade</FormLabel>
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
                            <FormLabel>Endereço</FormLabel>
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
                              <Input type="number" {...field} value={field.value ?? ''} />
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
                          <Label>Atualize a senha do gerente</Label>
                          <FormControl>
                            <div className="relative mt-1">
                              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                type="password"
                                placeholder="Nova Senha"
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
                      <Button type="submit" disabled={isSaving} className="bg-videira-cyan hover:bg-videira-cyan/90 text-white font-semibold shadow-lg">
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Alterar cadastro
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="transactions">
            {manager.userId && <TransactionsTab userId={manager.userId} />}
          </TabsContent>
          <TabsContent value="configuracoes">
            {manager.userId && <SettingsTab userId={manager.userId} />}
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </div>
  )
}
