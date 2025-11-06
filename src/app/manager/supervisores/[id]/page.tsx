/**
 * @fileoverview Página de edição de perfil do supervisor (visão do admin).
 * @version 1.5
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
  Loader2,
  Mail,
  Smartphone,
  MoreHorizontal,
  ArrowRightLeft,
  UserCog,
  ArrowLeft,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'

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
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { supervisorProfileSchema } from '@/lib/types'
import type { TransactionStatus } from '@/lib/types'
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
import { PhoneInput } from '@/components/ui/phone-input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const supervisorUpdateSchema = supervisorProfileSchema
  .extend({
    newPassword: z.string().optional().or(z.literal('')),
  })
  .partial()

type SupervisorFormData = z.infer<typeof supervisorUpdateSchema>

type SupervisorProfile = SupervisorFormData & {
  id?: string
  status?: string
}

type Region = {
  id: string
  name: string
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
    setSettings(prev => ({
      ...prev,
      [type]: { ...prev[type as keyof typeof prev], [channel]: value }
    }))
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-t-4 border-t-videira-cyan">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-videira-cyan/15 ring-2 ring-videira-cyan/30">
            <Mail className="h-5 w-5 text-videira-cyan" />
          </div>
          Configurações de Notificação
        </CardTitle>
        <CardDescription>
          Gerencie quais notificações este usuário receberá
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">Notificações de Pagamento</p>
            <p className="text-sm text-muted-foreground">
              Receber avisos sobre pagamentos recebidos, recusados, etc.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2" title="Notificar por Email">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Switch 
                checked={settings.payment_notifications.email}
                onCheckedChange={(v) => updateSetting('payment_notifications', 'email', v)}
              />
            </div>
            <div className="flex items-center gap-2" title="Notificar por WhatsApp">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <Switch 
                checked={settings.payment_notifications.whatsapp}
                onCheckedChange={(v) => updateSetting('payment_notifications', 'whatsapp', v)}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">Lembretes de Vencimento</p>
            <p className="text-sm text-muted-foreground">
              Receber lembretes sobre pagamentos próximos do vencimento.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2" title="Notificar por Email">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Switch 
                checked={settings.due_date_reminders.email}
                onCheckedChange={(v) => updateSetting('due_date_reminders', 'email', v)}
              />
            </div>
            <div className="flex items-center gap-2" title="Notificar por WhatsApp">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <Switch 
                checked={settings.due_date_reminders.whatsapp}
                onCheckedChange={(v) => updateSetting('due_date_reminders', 'whatsapp', v)}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">Relatórios da Rede</p>
            <p className="text-sm text-muted-foreground">
              Receber relatórios sobre a rede de supervisão.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2" title="Notificar por Email">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Switch 
                checked={settings.network_reports.email}
                onCheckedChange={(v) => updateSetting('network_reports', 'email', v)}
              />
            </div>
            <div className="flex items-center gap-2" title="Notificar por WhatsApp">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <Switch 
                checked={settings.network_reports.whatsapp}
                onCheckedChange={(v) => updateSetting('network_reports', 'whatsapp', v)}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-2">
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
    <Card className="shadow-lg border-t-4 border-t-videira-purple">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-videira-purple/15 ring-2 ring-videira-purple/30">
            <ArrowRightLeft className="h-5 w-5 text-videira-purple" />
          </div>
          Transações do Usuário
        </CardTitle>
        <CardDescription>Histórico de transações financeiras do usuário</CardDescription>
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
                <TableRow key={transaction.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-xs">{transaction.id}</TableCell>
                  <TableCell>
                    <Badge variant={statusMap[transaction.status]?.variant || 'default'}>
                      {statusMap[transaction.status]?.text || transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{transaction.date}</TableCell>
                  <TableCell className="text-right font-semibold">
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

export default function SupervisorProfilePage(): JSX.Element {
  const [supervisor, setSupervisor] = React.useState<SupervisorProfile | null>(null)
  const [regions, setRegions] = React.useState<Region[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [previewImage, setPreviewImage] = React.useState<string | null>(null)

  const params = useParams()
  const router = useRouter()
  const { id } = params
  const { toast } = useToast()

  const form = useForm<SupervisorFormData>({
    resolver: zodResolver(supervisorUpdateSchema),
    defaultValues: {},
  })

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

  const fetchData = React.useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const [supervisorRes, regionsRes] = await Promise.all([
        fetch(`/api/v1/manager/supervisores/${id}`),
        fetch('/api/v1/regioes?minimal=true'),
      ])

      if (!supervisorRes.ok) throw new Error('Falha ao carregar dados do supervisor.')
      if (!regionsRes.ok) throw new Error('Falha ao carregar regiões.')

      const supervisorData = await supervisorRes.json()
      const regionsData = await regionsRes.json()

      setSupervisor(supervisorData)
      setRegions(regionsData.regions)
      form.reset(supervisorData)
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

  const onSubmit = async (data: SupervisorFormData) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/v1/manager/supervisores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Falha ao atualizar o supervisor.')
      await response.json()
      toast({
        title: 'Sucesso',
        description: 'Supervisor atualizado com sucesso.',
        variant: 'success',
      })
      fetchData()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (reason: string) => {
    try {
      const response = await fetch(`/api/v1/manager/supervisores/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletionReason: reason }),
      })
      if (!response.ok) throw new Error('Falha ao excluir o supervisor.')
      toast({
        title: 'Sucesso!',
        description: 'Supervisor excluído com sucesso.',
        variant: 'success',
      })
      router.push('/manager/supervisores')
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

      const response = await fetch(`/api/v1/manager/supervisores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Falha ao atualizar ${fieldName}.`)
      }

      const updatedData = await response.json()
      toast({
        title: 'Sucesso!',
        description: `Link do ${fieldName} atualizado.`,
        variant: 'success',
      })
      if (updatedData.supervisor) {
        setSupervisor(updatedData.supervisor)
      } else {
        setSupervisor((prev) => (prev ? { ...prev, [fieldName]: value } : null))
      }
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
        formData.append('filename', `supervisor-${id}-${file.name}`)

        const response = await fetch('/api/v1/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Falha no upload da imagem')
        }

        const result = await response.json()
        
        // Atualizar avatar no banco
        const updateResponse = await fetch(`/api/v1/manager/supervisores/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl: result.url }),
        })

        if (!updateResponse.ok) {
          throw new Error('Falha ao atualizar avatar')
        }

        await updateResponse.json()
        setPreviewImage(result.url)
        setSupervisor(prev => prev ? { ...prev, avatarUrl: result.url } : null)
        
        toast({
          title: 'Sucesso',
          description: 'Avatar atualizado com sucesso!',
          variant: 'success',
        })
      } catch (error) {
        console.error('Photo upload error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Falha ao fazer upload da imagem.'
        toast({
          title: 'Erro',
          description: errorMessage,
          variant: 'destructive',
        })
      }
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

  if (!supervisor) {
    return <p>Supervisor não encontrado.</p>
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
                <Link href="/manager/supervisores">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-white/90 hover:text-white hover:bg-white/20 mb-3 -ml-2"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Supervisores
                  </Button>
                </Link>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-3">
                  <UserCog className="h-8 w-8" />
                  {supervisor.firstName} {supervisor.lastName}
                </h1>
                <p className="text-base text-white/90 mt-2 font-medium">
                  Perfil do Supervisor
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={supervisor.status === 'active' ? 'success' : 'destructive'}
                  className={cn(
                    "text-sm px-6 py-2 font-bold shadow-xl border-2 transition-all",
                    supervisor.status === 'active' 
                      ? "bg-green-500 text-white border-green-400 hover:bg-green-600" 
                      : "bg-red-500 text-white border-red-400 hover:bg-red-600"
                  )}
                >
                  {supervisor.status === 'active' ? '✓ Ativo' : '✗ Inativo'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="shadow-lg border-t-4 border-t-videira-cyan hover:shadow-xl transition-all">
            <CardContent className="flex flex-col items-center pt-6 text-center">
              <div className="relative">
                <Avatar className="h-24 w-24 ring-4 ring-videira-cyan/30">
                  <AvatarImage
                    src={previewImage || supervisor.avatarUrl || 'https://placehold.co/96x96.png'}
                    alt={supervisor.firstName ?? ''}
                    data-ai-hint="male person"
                  />
                  <AvatarFallback className="bg-videira-cyan/10 text-videira-cyan font-bold text-lg">
                    {supervisor.firstName?.[0]}
                    {supervisor.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <Label htmlFor="photo-upload" className="absolute bottom-0 right-0 cursor-pointer">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-videira-cyan text-white border-2 border-white hover:bg-videira-cyan/90 shadow-lg transition-all">
                    <Camera className="h-4 w-4" />
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
              <h2 className="mt-4 text-xl font-bold">
                {supervisor.firstName} {supervisor.lastName}
              </h2>
              <p className="text-sm text-muted-foreground font-medium">Supervisor</p>
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
                    defaultValue={supervisor.facebook ?? ''}
                    placeholder="https://facebook.com/..."
                    onBlur={(e) => handleSocialLinkBlur('facebook', e.target.value)}
                    className="border-blue-200 focus:border-blue-400"
                  />
                </div>
                <div className="flex items-center gap-3 group">
                  <Instagram className="h-5 w-5 text-pink-600 group-hover:scale-110 transition-transform" />
                  <Input
                    defaultValue={supervisor.instagram ?? ''}
                    placeholder="https://instagram.com/..."
                    onBlur={(e) => handleSocialLinkBlur('instagram', e.target.value)}
                    className="border-pink-200 focus:border-pink-400"
                  />
                </div>
                <div className="flex items-center gap-3 group">
                  <Globe className="h-5 w-5 text-videira-purple group-hover:scale-110 transition-transform" />
                  <Input
                    defaultValue={supervisor.website ?? ''}
                    placeholder="https://website.com/..."
                    onBlur={(e) => handleSocialLinkBlur('website', e.target.value)}
                    className="border-videira-purple/30 focus:border-videira-purple"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 gap-2 bg-muted/50 p-1">
              <TabsTrigger 
                value="profile"
                className="data-[state=active]:bg-videira-blue data-[state=active]:text-white font-semibold"
              >
                Dados do perfil
              </TabsTrigger>
              <TabsTrigger 
                value="transactions"
                className="data-[state=active]:bg-videira-purple data-[state=active]:text-white font-semibold"
              >
                Transações
              </TabsTrigger>
              <TabsTrigger 
                value="configuracoes"
                className="data-[state=active]:bg-videira-cyan data-[state=active]:text-white font-semibold"
              >
                Configurações
              </TabsTrigger>
              <TabsTrigger 
                value="delete"
                className="data-[state=active]:bg-destructive data-[state=active]:text-white font-semibold"
              >
                Excluir
              </TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <Card className="shadow-lg border-t-4 border-t-videira-blue">
                <CardHeader>
                  <CardTitle>Dados do Supervisor</CardTitle>
                  <CardDescription>Atualize as informações do perfil</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="regionId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Região</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? ''}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma região" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {regions.map((region) => (
                                  <SelectItem key={region.id} value={region.id}>
                                    {region.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                              <FormLabel>Sobrenome</FormLabel>
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
                                <Input {...field} disabled value={supervisor.cpf ?? ''} />
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
                                  placeholder="Endereço completo..."
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
                            <Label>Atualize a senha do supervisor</Label>
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
                        <Button 
                          type="submit" 
                          disabled={isSaving}
                          className="bg-videira-blue hover:bg-videira-blue/90 text-white font-semibold shadow-lg"
                        >
                          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Salvar Alterações
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
              <Card className="border-l-4 border-l-destructive shadow-lg bg-gradient-to-br from-destructive/5 to-transparent">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Excluir Cadastro
                  </CardTitle>
                  <CardDescription>
                    Esta ação é irreversível. Tenha certeza de que deseja excluir permanentemente
                    este cadastro.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="font-semibold shadow-lg">
                      Excluir Permanentemente
                    </Button>
                  </AlertDialogTrigger>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        <DeleteProfileDialog onConfirm={handleDelete} />
        </div>
      </div>
    </AlertDialog>
  )
}
