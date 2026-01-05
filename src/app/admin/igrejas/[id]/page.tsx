/**
 * @fileoverview Página de edição de perfil da igreja (visão do admin).
 * @version 1.4
 * @date 2024-08-08
 * @author PH
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
  ArrowLeft,
  CreditCard,
  Settings,
  Trash2,
  Save,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useParams, useRouter } from 'next/navigation'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
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

import Link from 'next/link'
import {
  churchProfileSchema,
  type TransactionStatus,
  type UserNotificationSettings,
  type NotificationType,
  NOTIFICATION_TYPES,
} from '@/lib/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { SendMessageDialog } from '@/components/ui/send-message-dialog'

const churchUpdateSchema = churchProfileSchema.extend({
  newPassword: z.string().optional().or(z.literal('')),
})

type ChurchProfile = z.infer<typeof churchUpdateSchema> & {
  id: string
  cnpj?: string
  status: string
  avatarUrl?: string
}

type Supervisor = {
  id: string
  firstName: string
  lastName: string
}

type Transaction = {
  id: string
  amount: number
  status: 'approved' | 'pending' | 'refused' | 'refunded'
  date: string
}

const DeleteProfileDialog = ({ onConfirm }: { onConfirm: (reason: string) => void }) => {
  const [reason, setReason] = React.useState('')
  return (
    <AlertDialogContent className="border-2 border-destructive/30">
      <AlertDialogHeader>
        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
          <div className="p-2 rounded-lg bg-destructive/15 ring-2 ring-destructive/30">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          Confirmar Exclusão do Cadastro
        </AlertDialogTitle>
        <AlertDialogDescription>
          Esta ação é irreversível e será registrada para auditoria. Por favor, forneça um motivo
          detalhado para a exclusão desta igreja.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="space-y-3">
        <Label htmlFor="deletion-reason" className="font-semibold">
          Motivo da Exclusão *
        </Label>
        <Textarea
          id="deletion-reason"
          placeholder="Ex: Duplicidade de cadastro, solicitação do usuário, fechamento da igreja, etc."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-[100px] border-destructive/30 focus:border-destructive"
        />
        <p className="text-xs text-muted-foreground">
          Este motivo será armazenado permanentemente no sistema.
        </p>
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction
          onClick={() => onConfirm(reason)}
          disabled={!reason.trim()}
          className="bg-destructive hover:bg-destructive/90 font-semibold"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Confirmar Exclusão
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  )
}

const TransactionsTab = ({ userId }: { userId: string }) => {
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const { toast } = useToast()

  React.useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/v1/transacoes?userId=${userId}`)
        if (!response.ok) throw new Error('Falha ao carregar transações.')
        const data = await response.json()
        setTransactions(data.transactions)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }
    fetchTransactions()
  }, [userId, toast])

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
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-videira-cyan/15 ring-2 ring-videira-cyan/30">
            <CreditCard className="h-5 w-5 text-videira-cyan" />
          </div>
          Transações da Igreja
        </CardTitle>
        <CardDescription>Histórico completo de transações financeiras</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-videira-cyan/5 via-videira-blue/5 to-videira-purple/5">
                <TableHead className="font-semibold">ID da Transação</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Data</TableHead>
                <TableHead className="text-right font-semibold">Valor</TableHead>
                <TableHead className="text-right font-semibold">Ações</TableHead>
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
                transactions.map((transaction) => {
                  const statusInfo = statusMap[transaction.status] || {
                    text: transaction.status,
                    variant: 'default' as const,
                  }
                  const StatusIcon =
                    transaction.status === 'approved'
                      ? CheckCircle2
                      : transaction.status === 'pending'
                        ? Clock
                        : XCircle

                  return (
                    <TableRow key={transaction.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-xs">{transaction.id}</TableCell>
                      <TableCell>
                        <Badge
                          variant={statusInfo.variant}
                          className="flex items-center gap-1 w-fit"
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.text}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(transaction.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/transacoes/${transaction.id}`}>
                          <Button
                            size="sm"
                            className="bg-white dark:bg-background border-2 border-videira-cyan text-videira-cyan hover:bg-videira-cyan hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
                          >
                            Ver Detalhes
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-32">
                    <div className="flex flex-col items-center gap-3 py-8">
                      <CreditCard className="h-12 w-12 text-muted-foreground" />
                      <p className="text-lg font-medium text-muted-foreground">
                        Nenhuma transação encontrada
                      </p>
                    </div>
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

const SettingsTab = ({ userId }: { userId: string }) => {
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
      const response = await fetch(`/api/v1/users/${userId}/notification-settings`)
      if (!response.ok) throw new Error('Falha ao carregar configurações.')
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
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
    try {
      const response = await fetch(`/api/v1/users/${userId}/notification-settings`, {
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    }
  }

  if (isLoading) {
    return (
      <Card className="shadow-lg border-t-4 border-t-videira-purple">
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
    <Card className="shadow-lg border-t-4 border-t-videira-purple">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-videira-purple/15 ring-2 ring-videira-purple/30">
            <Settings className="h-5 w-5 text-videira-purple" />
          </div>
          Configurações de Notificação
        </CardTitle>
        <CardDescription>Gerencie os canais de notificação preferidos da igreja</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {NOTIFICATION_TYPES.map((type, index) => (
          <div
            key={type}
            className={cn(
              'flex items-center justify-between rounded-lg border-2 p-4 transition-all hover:shadow-md',
              index === 0 && 'border-videira-cyan/30 hover:border-videira-cyan',
              index === 1 && 'border-videira-blue/30 hover:border-videira-blue',
              index === 2 && 'border-videira-purple/30 hover:border-videira-purple',
            )}
          >
            <div>
              <p className="font-semibold">
                {notificationSettingsConfig[type as keyof typeof notificationSettingsConfig]}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Escolha os canais de comunicação</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <Mail className="h-5 w-5 text-videira-blue" />
                <Switch
                  checked={settings[type]?.email ?? false}
                  onCheckedChange={(value) => handleSwitchChange(type, 'email', value)}
                />
                <span className="text-xs text-muted-foreground">Email</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Smartphone className="h-5 w-5 text-green-600" />
                <Switch
                  checked={settings[type]?.whatsapp ?? false}
                  onCheckedChange={(value) => handleSwitchChange(type, 'whatsapp', value)}
                />
                <span className="text-xs text-muted-foreground">WhatsApp</span>
              </div>
            </div>
          </div>
        ))}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSaveSettings}
            className="bg-videira-purple hover:bg-videira-purple/90 text-white font-semibold shadow-lg"
          >
            <Save className="mr-2 h-4 w-4" />
            Salvar Configurações
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function IgrejaProfilePage(): JSX.Element {
  const [church, setChurch] = React.useState<ChurchProfile | null>(null)
  const [supervisors, setSupervisors] = React.useState<Supervisor[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [previewImage, setPreviewImage] = React.useState<string | null>(null)

  const params = useParams()
  const router = useRouter()
  const { id } = params
  const { toast } = useToast()

  const form = useForm<z.infer<typeof churchUpdateSchema>>({
    resolver: zodResolver(churchUpdateSchema),
    defaultValues: {
      razaoSocial: '',
      nomeFantasia: '',
      email: '',
      phone: '',
      cep: '',
      state: '',
      city: '',
      neighborhood: '',
      address: '',
      foundationDate: new Date(),
      titheDay: 1,
      supervisorId: '',
      treasurerFirstName: '',
      treasurerLastName: '',
      treasurerCpf: '',
    },
  })

  const fetchData = React.useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const [churchRes, supervisorsRes] = await Promise.all([
        fetch(`/api/v1/igrejas/${id}`),
        fetch('/api/v1/supervisores?minimal=true'),
      ])

      if (!churchRes.ok) throw new Error('Falha ao carregar dados da igreja.')
      if (!supervisorsRes.ok) throw new Error('Falha ao carregar supervisores.')

      const churchData = await churchRes.json()
      const supervisorsData = await supervisorsRes.json()

      const sanitizedData = {
        ...churchData,
        foundationDate: churchData.foundationDate ? new Date(churchData.foundationDate) : null,
      }

      setChurch(sanitizedData)
      setSupervisors(supervisorsData.supervisors)
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

  const onSubmit = async (data: Partial<ChurchProfile>) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/v1/igrejas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Falha ao atualizar a igreja.')
      toast({ title: 'Sucesso', description: 'Igreja atualizada com sucesso.', variant: 'success' })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (reason: string) => {
    try {
      const response = await fetch(`/api/v1/igrejas/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletionReason: reason }),
      })
      if (!response.ok) throw new Error('Falha ao excluir a igreja.')
      toast({ title: 'Sucesso!', description: 'Igreja excluída com sucesso.', variant: 'success' })
      router.push('/admin/igrejas')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    }
  }

  const handleSocialLinkBlur = async (
    fieldName: 'facebook' | 'instagram' | 'website',
    value: string | null,
  ) => {
    try {
      const payload = { [fieldName]: value }

      const response = await fetch(`/api/v1/igrejas/${id}`, {
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
      setChurch((prev) => (prev ? { ...prev, [fieldName]: value } : null))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'avatars')
        formData.append('filename', `igreja-${id}-${file.name}`)

        const response = await fetch('/api/v1/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Falha no upload da imagem')
        }

        const result = await response.json()

        // Atualizar avatar no banco
        const updateResponse = await fetch(`/api/v1/igrejas/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl: result.url }),
        })

        if (!updateResponse.ok) {
          throw new Error('Falha ao atualizar avatar')
        }

        setPreviewImage(result.url)
        setChurch((prev) => (prev ? { ...prev, avatarUrl: result.url } : null))

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
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {/* Header Skeleton */}
        <Card className="shadow-lg border-l-4 border-l-videira-blue">
          <CardContent className="pt-6">
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-t-4 border-t-videira-cyan">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-4">
                  <Skeleton className="h-24 w-24 rounded-full" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
                <Separator className="my-6" />
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-t-4 border-t-videira-blue">
              <CardContent className="pt-6">
                <Skeleton className="h-96 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!church) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="shadow-lg border-l-4 border-l-destructive">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 py-12">
              <XCircle className="h-16 w-16 text-destructive" />
              <h2 className="text-2xl font-bold">Igreja não encontrada</h2>
              <p className="text-muted-foreground">
                A igreja solicitada não existe ou foi removida.
              </p>
              <Link href="/admin/igrejas">
                <Button className="mt-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para Igrejas
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <AlertDialog>
      <div className="flex flex-col gap-6">
        {/* Header Moderno com Gradiente Videira */}
        <div className="relative overflow-hidden rounded-2xl shadow-lg">
          <div className="absolute inset-0 videira-gradient opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

          <div className="relative z-10 p-8">
            <div className="flex items-center justify-between">
              <div>
                <Link href="/admin/igrejas">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/90 hover:text-white hover:bg-white/20 mb-3 -ml-2"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Igrejas
                  </Button>
                </Link>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-3">
                  <Building2 className="h-8 w-8" />
                  Perfil da Igreja
                </h1>
                <p className="text-base text-white/90 mt-2 font-medium">{church.nomeFantasia}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={church.status === 'active' ? 'success' : 'destructive'}
                  className={cn(
                    'text-sm px-6 py-2 font-bold shadow-xl border-2 transition-all',
                    church.status === 'active'
                      ? 'bg-green-500 text-white border-green-400 hover:bg-green-600'
                      : 'bg-red-500 text-white border-red-400 hover:bg-red-600',
                  )}
                >
                  {church.status === 'active' ? '✓ Ativo' : '✗ Inativo'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-t-4 border-t-videira-cyan hover:shadow-xl transition-all">
              <CardContent className="flex flex-col items-center pt-6 text-center">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage
                      src={previewImage || church.avatarUrl || 'https://placehold.co/96x96.png'}
                      alt={church.nomeFantasia ?? ''}
                      data-ai-hint="church building"
                    />
                    <AvatarFallback>{church.nomeFantasia?.[0]}</AvatarFallback>
                  </Avatar>
                  <Label
                    htmlFor="photo-upload"
                    className="absolute bottom-0 right-0 cursor-pointer"
                  >
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-background border border-border hover:bg-muted">
                      <Camera className="h-4 w-4 text-muted-foreground" />
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
                <h2 className="mt-4 text-xl font-semibold">{church.nomeFantasia}</h2>
                <p className="text-sm text-muted-foreground font-medium">Igreja</p>

                <div className="flex gap-2 mt-4">
                  <SendMessageDialog
                    recipientName={church.nomeFantasia || ''}
                    recipientEmail={church.email || ''}
                    recipientPhone={church.phone || ''}
                  >
                    <Button
                      size="sm"
                      className="bg-white dark:bg-background border-2 border-videira-blue text-videira-blue hover:bg-videira-blue hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Mensagem
                    </Button>
                  </SendMessageDialog>
                  <Button
                    size="sm"
                    onClick={() =>
                      window.open(`https://wa.me/55${church.phone?.replace(/\D/g, '')}`, '_blank')
                    }
                    className="bg-white dark:bg-background border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
                  >
                    <Smartphone className="h-4 w-4 mr-1" />
                    WhatsApp
                  </Button>
                </div>
              </CardContent>
              <Separator />
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-videira-purple/15 ring-2 ring-videira-purple/30">
                    <Globe className="h-4 w-4 text-videira-purple" />
                  </div>
                  <h3 className="font-semibold">Redes Sociais</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 group">
                    <Facebook className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                    <Input
                      defaultValue={church.facebook ?? ''}
                      placeholder="https://facebook.com/..."
                      onBlur={(e) => handleSocialLinkBlur('facebook', e.target.value)}
                      className="border-blue-200 focus:border-blue-400"
                    />
                  </div>
                  <div className="flex items-center gap-3 group">
                    <Instagram className="h-5 w-5 text-pink-600 group-hover:scale-110 transition-transform" />
                    <Input
                      defaultValue={church.instagram ?? ''}
                      placeholder="https://instagram.com/..."
                      onBlur={(e) => handleSocialLinkBlur('instagram', e.target.value)}
                      className="border-pink-200 focus:border-pink-400"
                    />
                  </div>
                  <div className="flex items-center gap-3 group">
                    <Globe className="h-5 w-5 text-videira-purple group-hover:scale-110 transition-transform" />
                    <Input
                      defaultValue={church.website ?? ''}
                      placeholder="https://website.com/..."
                      onBlur={(e) => handleSocialLinkBlur('website', e.target.value)}
                      className="border-videira-purple/30 focus:border-videira-purple"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Tabs and Form */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 gap-2 bg-muted/50 p-1 rounded-lg">
                <TabsTrigger
                  value="profile"
                  className="data-[state=active]:bg-videira-blue data-[state=active]:text-white font-semibold"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Dados
                </TabsTrigger>
                <TabsTrigger
                  value="transactions"
                  className="data-[state=active]:bg-videira-cyan data-[state=active]:text-white font-semibold"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Transações
                </TabsTrigger>
                <TabsTrigger
                  value="configuracoes"
                  className="data-[state=active]:bg-videira-purple data-[state=active]:text-white font-semibold"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </TabsTrigger>
                <TabsTrigger
                  value="delete"
                  className="data-[state=active]:bg-destructive data-[state=active]:text-white font-semibold"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </TabsTrigger>
              </TabsList>
              <TabsContent value="profile">
                <Card className="shadow-lg border-t-4 border-t-videira-blue">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-videira-blue/15 ring-2 ring-videira-blue/30">
                        <Building2 className="h-5 w-5 text-videira-blue" />
                      </div>
                      Dados da Igreja
                    </CardTitle>
                    <CardDescription>Atualize as informações da igreja</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="supervisorId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Selecione um supervisor</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um supervisor" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {supervisors.map((supervisor) => (
                                    <SelectItem key={supervisor.id} value={supervisor.id}>
                                      {supervisor.firstName} {supervisor.lastName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="cnpj"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CNPJ</FormLabel>
                                <FormControl>
                                  <Input {...field} disabled value={church.cnpj ?? ''} />
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

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="razaoSocial"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Razão Social</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="nomeFantasia"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome Fantasia</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value ?? ''} />
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

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                          <FormField
                            control={form.control}
                            name="foundationDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Data de Fundação</FormLabel>
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
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Celular</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <Separator />
                        <h3 className="text-lg font-medium">Dados do Tesoureiro</h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                          <FormField
                            control={form.control}
                            name="treasurerFirstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value ?? ''} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="treasurerLastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sobrenome</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value ?? ''} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="treasurerCpf"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CPF</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value ?? ''} />
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
                            <strong>Importante</strong> - É necessário ter um usuário para a igreja
                            poder acessar o sistema.
                          </AlertDescription>
                        </Alert>

                        <FormField
                          control={form.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Crie ou atualize a senha da igreja</FormLabel>
                              <FormControl>
                                <div className="relative mt-1">
                                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                  <Input
                                    type="password"
                                    placeholder="Nova senha"
                                    className="pl-9"
                                    value={field.value ?? ''}
                                    onChange={field.onChange}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end">
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
                                Salvar Alterações
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="transactions">
                <TransactionsTab userId={id as string} />
              </TabsContent>
              <TabsContent value="configuracoes">
                <SettingsTab userId={id as string} />
              </TabsContent>
              <TabsContent value="delete">
                <Card className="shadow-lg border-t-4 border-t-destructive">
                  <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-destructive/15 ring-2 ring-destructive/30">
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </div>
                      Excluir Cadastro
                    </CardTitle>
                    <CardDescription>
                      Esta ação é irreversível. Tenha certeza de que deseja excluir permanentemente
                      esta igreja. Um motivo será solicitado para fins de auditoria.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Alert className="mb-6 bg-destructive/10 border-destructive/30">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <AlertDescription className="text-destructive">
                        <strong>Atenção:</strong> Esta ação não pode ser desfeita. Todos os dados
                        associados a esta igreja serão marcados como excluídos.
                      </AlertDescription>
                    </Alert>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="font-semibold shadow-lg">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir Permanentemente
                      </Button>
                    </AlertDialogTrigger>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        <DeleteProfileDialog onConfirm={handleDelete} />
      </div>
    </AlertDialog>
  )
}
