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
  UserCog,
  ArrowLeft,
  CreditCard,
  Settings,
  Trash2,
  Save,
  CheckCircle2,
  XCircle,
  Clock,
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
import { ImpersonateButton } from '@/components/ui/impersonate-button'
import { BlockUserButton } from '@/components/ui/block-user-button'
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
import { SendMessageDialog } from '@/components/ui/send-message-dialog'
import { FraudAlert } from '@/components/ui/fraud-alert'

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

type Manager = {
  id: string
  firstName: string
  lastName: string
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
          detalhado para a exclusão deste supervisor.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="space-y-3">
        <Label htmlFor="deletion-reason" className="font-semibold">
          Motivo da Exclusão *
        </Label>
        <Textarea
          id="deletion-reason"
          placeholder="Ex: Duplicidade de cadastro, solicitação do usuário, desligamento da organização, etc."
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
          Transações do Supervisor
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

export default function SupervisorProfilePage(): JSX.Element {
  const [supervisor, setSupervisor] = React.useState<SupervisorProfile | null>(null)
  const [managers, setManagers] = React.useState<Manager[]>([])
  const [regions, setRegions] = React.useState<Region[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [previewImage, setPreviewImage] = React.useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = React.useState<'admin' | 'manager' | null>(null)
  const [notif, setNotif] = React.useState<{
    payment_notifications: { email: boolean; whatsapp: boolean }
    due_date_reminders: { email: boolean; whatsapp: boolean }
    network_reports: { email: boolean; whatsapp: boolean }
  } | null>(null)
  const [savingNotif, setSavingNotif] = React.useState(false)

  const params = useParams()
  const router = useRouter()
  const { id } = params
  const { toast } = useToast()

  const form = useForm<SupervisorFormData>({
    resolver: zodResolver(supervisorUpdateSchema),
    defaultValues: {},
  })

  const fetchData = React.useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const [supervisorRes, managersRes, regionsRes, notifRes] = await Promise.all([
        fetch(`/api/v1/admin/supervisores/${id}`),
        fetch('/api/v1/admin/gerentes?minimal=true'),
        fetch('/api/v1/regioes?minimal=true'),
        fetch(`/api/v1/admin/supervisores/${id}/notification-settings`),
      ])

      if (!supervisorRes.ok) throw new Error('Falha ao carregar dados do supervisor.')
      if (!managersRes.ok) throw new Error('Falha ao carregar gerentes.')
      if (!regionsRes.ok) throw new Error('Falha ao carregar regiões.')
      if (!notifRes.ok) throw new Error('Falha ao carregar configurações de notificação.')

      const supervisorData = await supervisorRes.json()
      const managersData = await managersRes.json()
      const regionsData = await regionsRes.json()
      const notifData = await notifRes.json()

      setSupervisor(supervisorData)
      setManagers(managersData.managers)
      setRegions(regionsData.regions)
      setNotif(notifData)
      form.reset(supervisorData)

      // Buscar role do usuário atual para botão de impersonation
      try {
        const currentUserRes = await fetch('/api/v1/auth/me')
        if (currentUserRes.ok) {
          const currentUser = await currentUserRes.json()
          if (currentUser.role === 'admin' || currentUser.role === 'manager') {
            setCurrentUserRole(currentUser.role)
          }
        }
      } catch {
        // Silenciar erro - não é crítico
      }
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
      const response = await fetch(`/api/v1/admin/supervisores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Falha ao atualizar o supervisor.')
      const updatedData = await response.json()
      toast({
        title: 'Sucesso',
        description: 'Supervisor atualizado com sucesso.',
        variant: 'success',
      })
      setSupervisor((prev) => (prev ? { ...prev, ...updatedData.supervisor } : null))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (reason: string) => {
    try {
      const response = await fetch(`/api/v1/admin/supervisores/${id}`, {
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
      router.push('/admin/supervisores')
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

      const response = await fetch(`/api/v1/admin/supervisores/${id}`, {
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
        const updateResponse = await fetch(`/api/v1/admin/supervisores/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl: result.url }),
        })

        if (!updateResponse.ok) {
          throw new Error('Falha ao atualizar avatar')
        }

        await updateResponse.json()
        setPreviewImage(result.url)
        setSupervisor((prev) => (prev ? { ...prev, avatarUrl: result.url } : null))

        // Recarregar dados do servidor para garantir sincronização
        await fetchData()

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

  if (!supervisor) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="shadow-lg border-l-4 border-l-destructive">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 py-12">
              <XCircle className="h-16 w-16 text-destructive" />
              <h2 className="text-2xl font-bold">Supervisor não encontrado</h2>
              <p className="text-muted-foreground">
                O supervisor solicitado não existe ou foi removido.
              </p>
              <Link href="/admin/supervisores">
                <Button className="mt-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para Supervisores
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
                <Link href="/admin/supervisores">
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
                  Perfil do Supervisor
                </h1>
                <p className="text-base text-white/90 mt-2 font-medium">
                  {supervisor.firstName} {supervisor.lastName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={supervisor.status === 'active' ? 'success' : 'destructive'}
                  className={cn(
                    'text-sm px-6 py-2 font-bold shadow-xl border-2 transition-all',
                    supervisor.status === 'active'
                      ? 'bg-green-500 text-white border-green-400 hover:bg-green-600'
                      : 'bg-red-500 text-white border-red-400 hover:bg-red-600',
                  )}
                >
                  {supervisor.status === 'active' ? '✓ Ativo' : '✗ Inativo'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            {/* Alerta de Fraude */}
            <div className="mb-6">
              <FraudAlert
                userId={id as string}
                userName={`${supervisor.firstName} ${supervisor.lastName}`}
              />
            </div>

            <Card className="shadow-lg border-t-4 border-t-videira-cyan hover:shadow-xl transition-all">
              <CardContent className="flex flex-col items-center pt-6 text-center">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage
                      src={previewImage || supervisor.avatarUrl || 'https://placehold.co/96x96.png'}
                      alt={supervisor.firstName ?? ''}
                      data-ai-hint="male person"
                    />
                    <AvatarFallback>
                      {supervisor.firstName?.[0]}
                      {supervisor.lastName?.[0]}
                    </AvatarFallback>
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
                <h2 className="mt-4 text-xl font-semibold">
                  {supervisor.firstName} {supervisor.lastName}
                </h2>
                <p className="text-sm text-muted-foreground font-medium">Supervisor</p>
                <div className="flex flex-col gap-2 mt-4">
                  <div className="flex gap-2">
                    <SendMessageDialog
                      recipientName={`${supervisor.firstName} ${supervisor.lastName}`}
                      recipientEmail={supervisor.email || ''}
                      recipientPhone={supervisor.phone || ''}
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
                        window.open(
                          `https://wa.me/55${supervisor.phone?.replace(/\D/g, '')}`,
                          '_blank',
                        )
                      }
                      className="bg-white dark:bg-background border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
                    >
                      <Smartphone className="h-4 w-4 mr-1" />
                      WhatsApp
                    </Button>
                  </div>
                  {currentUserRole && (
                    <ImpersonateButton
                      targetUserId={id as string}
                      targetUserName={`${supervisor.firstName} ${supervisor.lastName}`}
                      targetUserRole="supervisor"
                      currentUserRole={currentUserRole}
                    />
                  )}
                  {currentUserRole === 'admin' && (
                    <BlockUserButton
                      targetUserId={id as string}
                      targetUserName={`${supervisor.firstName} ${supervisor.lastName}`}
                    />
                  )}
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
              <TabsList className="grid w-full grid-cols-4 gap-2 bg-muted/50 p-1 rounded-lg">
                <TabsTrigger
                  value="profile"
                  className="data-[state=active]:bg-videira-blue data-[state=active]:text-white font-semibold"
                >
                  <UserCog className="h-4 w-4 mr-2" />
                  Perfil
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
                        <UserCog className="h-5 w-5 text-videira-blue" />
                      </div>
                      Dados do Perfil
                    </CardTitle>
                    <CardDescription>
                      Atualize as informações pessoais do supervisor
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="managerId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Gerente</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione um gerente" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {managers.map((manager) => (
                                      <SelectItem key={manager.id} value={manager.id}>
                                        {manager.firstName} {manager.lastName}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
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
                        </div>
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

                        <Alert className="bg-warning/10 border-warning/30">
                          <AlertTriangle className="h-4 w-4 text-warning" />
                          <AlertDescription className="text-warning">
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
                <Card className="shadow-lg border-t-4 border-t-videira-purple">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-videira-purple/15 ring-2 ring-videira-purple/30">
                        <Settings className="h-5 w-5 text-videira-purple" />
                      </div>
                      Configurações de Notificação
                    </CardTitle>
                    <CardDescription>
                      Gerencie os canais de notificação preferidos do supervisor
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border-2 border-videira-cyan/30 hover:border-videira-cyan p-4 transition-all hover:shadow-md">
                      <div>
                        <p className="font-semibold">Notificações de Pagamento</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Escolha os canais de comunicação
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center gap-2">
                          <Mail className="h-5 w-5 text-videira-blue" />
                          <Switch
                            checked={!!notif?.payment_notifications.email}
                            onCheckedChange={(v) =>
                              setNotif((n) =>
                                n
                                  ? {
                                      ...n,
                                      payment_notifications: {
                                        ...n.payment_notifications,
                                        email: v,
                                      },
                                    }
                                  : n,
                              )
                            }
                          />
                          <span className="text-xs text-muted-foreground">Email</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <Smartphone className="h-5 w-5 text-green-600" />
                          <Switch
                            checked={!!notif?.payment_notifications.whatsapp}
                            onCheckedChange={(v) =>
                              setNotif((n) =>
                                n
                                  ? {
                                      ...n,
                                      payment_notifications: {
                                        ...n.payment_notifications,
                                        whatsapp: v,
                                      },
                                    }
                                  : n,
                              )
                            }
                          />
                          <span className="text-xs text-muted-foreground">WhatsApp</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border-2 border-videira-blue/30 hover:border-videira-blue p-4 transition-all hover:shadow-md">
                      <div>
                        <p className="font-semibold">Lembretes de Vencimento</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Escolha os canais de comunicação
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center gap-2">
                          <Mail className="h-5 w-5 text-videira-blue" />
                          <Switch
                            checked={!!notif?.due_date_reminders.email}
                            onCheckedChange={(v) =>
                              setNotif((n) =>
                                n
                                  ? {
                                      ...n,
                                      due_date_reminders: { ...n.due_date_reminders, email: v },
                                    }
                                  : n,
                              )
                            }
                          />
                          <span className="text-xs text-muted-foreground">Email</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <Smartphone className="h-5 w-5 text-green-600" />
                          <Switch
                            checked={!!notif?.due_date_reminders.whatsapp}
                            onCheckedChange={(v) =>
                              setNotif((n) =>
                                n
                                  ? {
                                      ...n,
                                      due_date_reminders: { ...n.due_date_reminders, whatsapp: v },
                                    }
                                  : n,
                              )
                            }
                          />
                          <span className="text-xs text-muted-foreground">WhatsApp</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border-2 border-videira-purple/30 hover:border-videira-purple p-4 transition-all hover:shadow-md">
                      <div>
                        <p className="font-semibold">Novos Cadastros na Rede</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Escolha os canais de comunicação
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center gap-2">
                          <Mail className="h-5 w-5 text-videira-blue" />
                          <Switch
                            checked={!!notif?.network_reports.email}
                            onCheckedChange={(v) =>
                              setNotif((n) =>
                                n
                                  ? { ...n, network_reports: { ...n.network_reports, email: v } }
                                  : n,
                              )
                            }
                          />
                          <span className="text-xs text-muted-foreground">Email</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <Smartphone className="h-5 w-5 text-green-600" />
                          <Switch
                            checked={!!notif?.network_reports.whatsapp}
                            onCheckedChange={(v) =>
                              setNotif((n) =>
                                n
                                  ? { ...n, network_reports: { ...n.network_reports, whatsapp: v } }
                                  : n,
                              )
                            }
                          />
                          <span className="text-xs text-muted-foreground">WhatsApp</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={async () => {
                          if (!notif) return
                          setSavingNotif(true)
                          try {
                            const res = await fetch(
                              `/api/v1/admin/supervisores/${id}/notification-settings`,
                              {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(notif),
                              },
                            )
                            if (!res.ok) throw new Error('Falha ao salvar configurações.')
                            toast({
                              title: 'Sucesso',
                              description: 'Configurações salvas.',
                              variant: 'success',
                            })
                          } catch (e: unknown) {
                            toast({
                              title: 'Erro',
                              description: e instanceof Error ? e.message : 'Erro desconhecido',
                              variant: 'destructive',
                            })
                          } finally {
                            setSavingNotif(false)
                          }
                        }}
                        disabled={savingNotif}
                        className="bg-videira-purple hover:bg-videira-purple/90 text-white font-semibold shadow-lg"
                      >
                        {savingNotif ? (
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
                      este cadastro. Um motivo será solicitado para fins de auditoria.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Alert className="mb-6 bg-destructive/10 border-destructive/30">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <AlertDescription className="text-destructive">
                        <strong>Atenção:</strong> Esta ação não pode ser desfeita. Todos os dados
                        associados a este supervisor serão marcados como excluídos.
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
