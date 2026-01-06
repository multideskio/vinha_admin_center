/**
 * @fileoverview Página de edição de perfil da igreja (visão do gerente).
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 * @lastReview 2025-01-05 22:00 - Layout responsivo verificado, funcionando corretamente
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
  Church,
  ArrowLeft,
  Mail,
  Smartphone,
  MoreHorizontal,
  ArrowRightLeft,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { PhoneInput } from '@/components/ui/phone-input'
import { Textarea } from '@/components/ui/textarea'
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
import type { TransactionStatus } from '@/lib/types'

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
import { churchProfileSchema } from '@/lib/types'

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
  name: string
}

type Transaction = {
  id: string
  amount: number
  status: 'approved' | 'pending' | 'refused' | 'refunded'
  date: string
}

const SettingsTab = ({ userId }: { userId: string }) => {
  const [settings, setSettings] = React.useState({
    payment_notifications: { email: false, whatsapp: false },
    due_date_reminders: { email: false, whatsapp: false },
    network_reports: { email: false, whatsapp: false },
  })
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const { toast } = useToast()

  React.useEffect(() => {
    const fetchSettings = async () => {
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
    }
    fetchSettings()
  }, [userId, toast])

  const handleSave = async () => {
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = (type: string, channel: 'email' | 'whatsapp', value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [type]: { ...prev[type as keyof typeof prev], [channel]: value },
    }))
  }

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <Skeleton className="h-64 w-full" />
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
            <CardDescription className="mt-1">
              Gerencie quais notificações este usuário receberá
            </CardDescription>
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
                onCheckedChange={(v) => updateSetting('payment_notifications', 'email', v)}
              />
            </div>
            <div className="flex items-center gap-2" title="Notificar por WhatsApp">
              <Smartphone className="h-4 w-4 text-green-600" />
              <Switch
                checked={settings.payment_notifications.whatsapp}
                onCheckedChange={(v) => updateSetting('payment_notifications', 'whatsapp', v)}
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
                onCheckedChange={(v) => updateSetting('due_date_reminders', 'email', v)}
              />
            </div>
            <div className="flex items-center gap-2" title="Notificar por WhatsApp">
              <Smartphone className="h-4 w-4 text-green-600" />
              <Switch
                checked={settings.due_date_reminders.whatsapp}
                onCheckedChange={(v) => updateSetting('due_date_reminders', 'whatsapp', v)}
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
                onCheckedChange={(v) => updateSetting('network_reports', 'email', v)}
              />
            </div>
            <div className="flex items-center gap-2" title="Notificar por WhatsApp">
              <Smartphone className="h-4 w-4 text-green-600" />
              <Switch
                checked={settings.network_reports.whatsapp}
                onCheckedChange={(v) => updateSetting('network_reports', 'whatsapp', v)}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-videira-cyan hover:bg-videira-cyan/90 text-white font-semibold shadow-lg"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Configurações
          </Button>
        </div>
      </CardContent>
    </Card>
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
        const response = await fetch(`/api/v1/manager/transacoes?userId=${userId}`)
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
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-full bg-gradient-to-br from-videira-cyan/20 to-videira-blue/20 text-videira-cyan">
            <ArrowRightLeft className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl">Transações</CardTitle>
            <CardDescription className="mt-1">Histórico de transações financeiras</CardDescription>
          </div>
        </div>
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

const DeleteProfileDialog = ({ onConfirm }: { onConfirm: (reason: string) => void }) => {
  const [reason, setReason] = React.useState('')
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Excluir Cadastro</AlertDialogTitle>
        <AlertDialogDescription>
          Esta ação é irreversível. Por favor, forneça um motivo para a exclusão deste perfil para
          fins de auditoria.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="space-y-2">
        <Label htmlFor="deletion-reason">Motivo da Exclusão</Label>
        <Textarea
          id="deletion-reason"
          placeholder="Ex: Duplicidade de cadastro, solicitação do usuário, etc."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction onClick={() => onConfirm(reason)} disabled={!reason.trim()}>
          Excluir permanentemente
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  )
}

// TransactionsTab component removed as it was unused

export default function IgrejaProfilePage() {
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
    defaultValues: {},
  })

  const fetchData = React.useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const [churchRes, supervisorsRes] = await Promise.all([
        fetch(`/api/v1/manager/igrejas/${id}`),
        fetch('/api/v1/manager/supervisores?minimal=true'),
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
      const response = await fetch(`/api/v1/manager/igrejas/${id}`, {
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
      const response = await fetch(`/api/v1/manager/igrejas/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletionReason: reason }),
      })
      if (!response.ok) throw new Error('Falha ao excluir a igreja.')
      toast({ title: 'Sucesso!', description: 'Igreja excluída com sucesso.', variant: 'success' })
      router.push('/manager/igrejas')
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
      const response = await fetch(`/api/v1/manager/igrejas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [fieldName]: value }),
      })
      if (!response.ok) throw new Error(`Falha ao atualizar ${fieldName}.`)
      toast({
        title: 'Sucesso!',
        description: `Link do ${fieldName} atualizado.`,
        variant: 'success',
      })
      setChurch((prev) => (prev ? { ...prev, [fieldName]: value } : null))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    }
  }

  const handleCepBlur = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length !== 8) return

    try {
      const response = await fetch(`/api/v1/cep?cep=${cleanCep}`)
      if (!response.ok) return

      const data = await response.json()
      form.setValue('address', data.address || '')
      form.setValue('neighborhood', data.neighborhood || '')
      form.setValue('city', data.city || '')
      form.setValue('state', data.state || '')
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
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
        const updateResponse = await fetch(`/api/v1/manager/igrejas/${id}`, {
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

  if (isLoading || !church) {
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
      {/* Header Moderno com Gradiente Videira */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg">
        <div className="absolute inset-0 videira-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

        <div className="relative z-10 p-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/manager/igrejas">
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
                <Church className="h-8 w-8" />
                {church.nomeFantasia}
              </h1>
              <p className="text-base text-white/90 mt-2 font-medium">Perfil da Igreja</p>
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
          <Card className="shadow-lg border-t-4 border-t-videira-cyan">
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
                <Label htmlFor="photo-upload" className="absolute bottom-0 right-0 cursor-pointer">
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
              <p className="text-muted-foreground">Igreja</p>
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
                    defaultValue={church.facebook ?? ''}
                    placeholder="https://facebook.com/..."
                    onBlur={(e) => handleSocialLinkBlur('facebook', e.target.value)}
                    className="border-2 focus:border-videira-cyan"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Instagram className="h-5 w-5 text-pink-600" />
                  <Input
                    defaultValue={church.instagram ?? ''}
                    placeholder="https://instagram.com/..."
                    onBlur={(e) => handleSocialLinkBlur('instagram', e.target.value)}
                    className="border-2 focus:border-videira-cyan"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-videira-cyan" />
                  <Input
                    defaultValue={church.website ?? ''}
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
            <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-videira-cyan/10 via-videira-blue/10 to-videira-purple/10">
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-white data-[state=active]:text-videira-cyan data-[state=active]:font-semibold"
              >
                Dados da Igreja
              </TabsTrigger>
              <TabsTrigger
                value="transactions"
                className="data-[state=active]:bg-white data-[state=active]:text-videira-cyan data-[state=active]:font-semibold"
              >
                Transações
              </TabsTrigger>
              <TabsTrigger
                value="configuracoes"
                className="data-[state=active]:bg-white data-[state=active]:text-videira-cyan data-[state=active]:font-semibold"
              >
                Configurações
              </TabsTrigger>
              <TabsTrigger
                value="delete"
                className="data-[state=active]:bg-white data-[state=active]:text-destructive data-[state=active]:font-semibold"
              >
                Excluir
              </TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <Card className="shadow-lg border-t-4 border-t-videira-cyan">
                <CardContent className="pt-6">
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
                                    {supervisor.name}
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
                                <Input
                                  {...field}
                                  value={field.value ?? ''}
                                  onBlur={(e) => handleCepBlur(e.target.value)}
                                />
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
                                    selected={field.value || undefined}
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
                        <Button type="submit" disabled={isSaving}>
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
              <TransactionsTab userId={id as string} />
            </TabsContent>
            <TabsContent value="configuracoes">
              <SettingsTab userId={id as string} />
            </TabsContent>
            <TabsContent value="delete">
              <Card className="shadow-lg border-t-4 border-t-destructive bg-gradient-to-br from-red-50/50 to-white">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-full bg-red-100 text-destructive">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-destructive text-xl">Excluir Cadastro</CardTitle>
                      <CardDescription className="mt-2">
                        Esta ação é irreversível. Tenha certeza de que deseja excluir
                        permanentemente esta igreja.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="font-semibold shadow-lg">
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Excluir permanentemente
                      </Button>
                    </AlertDialogTrigger>
                    <DeleteProfileDialog onConfirm={handleDelete} />
                  </AlertDialog>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
