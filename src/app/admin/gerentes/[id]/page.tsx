'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { managerProfileSchema } from '@/lib/types'
import { PhoneInput } from '@/components/ui/phone-input'
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
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
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
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClickableAvatar } from '@/components/ui/clickable-avatar'
import { SendMessageDialog } from '@/components/ui/send-message-dialog'
import { Switch } from '@/components/ui/switch'
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
import Link from 'next/link'
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
import type { NotificationType, UserNotificationSettings, ManagerProfile as ManagerProfileType } from '@/lib/types'
import { NOTIFICATION_TYPES } from '@/lib/types'

type ManagerProfile = ManagerProfileType & {
  id: string
  status: string
  avatarUrl?: string
  newPassword?: string
}

type Transaction = {
  id: string
  amount: number
  status: 'approved' | 'pending' | 'refused' | 'refunded'
  date: string
}

type FormData = Partial<z.infer<typeof managerProfileSchema>> & { newPassword?: string }

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
    [key: string]: { text: string; variant: 'success' | 'warning' | 'destructive' | 'outline' }
  } = {
    approved: { text: 'Aprovada', variant: 'success' },
    pending: { text: 'Pendente', variant: 'warning' },
    refused: { text: 'Recusada', variant: 'destructive' },
    refunded: { text: 'Reembolsada', variant: 'outline' },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transações do Usuário</CardTitle>
        <CardDescription>Histórico de transações financeiras do usuário.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID da Transação</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Valor</TableHead>
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
                          <Link href={`/admin/transacoes/${transaction.id}`}>Ver Detalhes</Link>
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
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Notificação</CardTitle>
        <CardDescription>Gerencie quais notificações este usuário receberá.</CardDescription>
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

export default function GerenteProfilePage() {
  const [manager, setManager] = React.useState<ManagerProfile | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [previewImage, setPreviewImage] = React.useState<string | null>(null)
  const params = useParams()
  const router = useRouter()
  const { id } = params
  const { toast } = useToast()

  const form = useForm<FormData>({
    resolver: zodResolver(managerProfileSchema.extend({ newPassword: z.string().optional() }).partial()),
    defaultValues: {
      firstName: '',
      lastName: '',
      cpf: '',
      phone: '',
      landline: '',
      email: '',
      cep: '',
      state: '',
      city: '',
      neighborhood: '',
      address: '',
      titheDay: 1,
      newPassword: '',
      facebook: '',
      instagram: '',
      website: '',
    },
  })

  const fetchManager = React.useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/v1/admin/gerentes/${id}`)
      if (!response.ok) throw new Error('Failed to fetch manager data')
      const data = await response.json()

      const sanitizedData = {
        ...data,
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        cpf: data.cpf ?? '',
        phone: data.phone ?? '',
        landline: data.landline ?? '',
        email: data.email ?? '',
        cep: data.cep ?? '',
        state: data.state ?? '',
        city: data.city ?? '',
        neighborhood: data.neighborhood ?? '',
        address: data.address ?? '',
        titheDay: data.titheDay ?? 1,
        newPassword: '',
        facebook: data.facebook ?? '',
        instagram: data.instagram ?? '',
        website: data.website ?? '',
      }

      setManager(sanitizedData)
      form.reset(sanitizedData)
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do gerente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [id, form, toast])

  React.useEffect(() => {
    fetchManager()
  }, [fetchManager])

  const onSubmit = async (data: FormData) => {
    try {
      const response = await fetch(`/api/v1/admin/gerentes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update manager.')
      const updatedData = await response.json()
      toast({
        title: 'Sucesso',
        description: 'Gerente atualizado com sucesso.',
        variant: 'success',
      })
      setManager((prev) => (prev ? { ...prev, ...updatedData.manager } : null))
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o gerente.',
        variant: 'destructive',
      })
    }
  }

  const handleSocialLinkBlur = async (
    fieldName: 'facebook' | 'instagram' | 'website',
    value: string | null,
  ) => {
    try {
      const payload = { [fieldName]: value }

      const response = await fetch(`/api/v1/admin/gerentes/${id}`, {
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
      if (updatedData.manager) {
        setManager(updatedData.manager)
      } else {
        setManager((prev) => (prev ? { ...prev, [fieldName]: value } : null))
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
        formData.append('filename', `manager-${id}-${file.name}`)

        const response = await fetch('/api/v1/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Falha no upload da imagem')
        }

        const result = await response.json()
        
        // Atualizar avatar no banco
        const updateResponse = await fetch(`/api/v1/admin/gerentes/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl: result.url }),
        })

        if (!updateResponse.ok) {
          throw new Error('Falha ao atualizar avatar')
        }

        await updateResponse.json()
        setPreviewImage(result.url)
        setManager(prev => prev ? { ...prev, avatarUrl: result.url } : null)
        
        // Recarregar dados do servidor para garantir sincronização
        await fetchManager()
        
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

  const handleDelete = async (reason: string) => {
    try {
      const response = await fetch(`/api/v1/admin/gerentes/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletionReason: reason }),
      })
      if (!response.ok) throw new Error('Falha ao excluir o gerente.')
      toast({ title: 'Sucesso!', description: 'Gerente excluído com sucesso.', variant: 'success' })
      router.push('/admin/gerentes')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
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
    <AlertDialog>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="flex flex-col items-center pt-6 text-center">
              <div className="relative">
                <ClickableAvatar
                  src={previewImage || manager.avatarUrl || 'https://placehold.co/96x96.png'}
                  alt={`${manager.firstName} ${manager.lastName}`}
                  fallback={`${manager.firstName?.[0] || ''}${manager.lastName?.[0] || ''}`}
                  className="h-24 w-24"
                />
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
              <h2 className="mt-4 text-xl font-semibold">
                {manager.firstName} {manager.lastName}
              </h2>
              <p className="text-muted-foreground">Gerente</p>
              <div className="flex gap-2 mt-3">
                <SendMessageDialog
                  recipientName={`${manager.firstName} ${manager.lastName}`}
                  recipientEmail={manager.email}
                  recipientPhone={manager.phone || ''}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <Mail className="h-3 w-3" />
                    Mensagem
                  </Button>
                </SendMessageDialog>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`https://wa.me/55${manager.phone?.replace(/\D/g, '')}`, '_blank')}
                  className="flex items-center gap-1"
                >
                  <Smartphone className="h-3 w-3" />
                  WhatsApp
                </Button>
              </div>
            </CardContent>
            <Separator />
            <CardContent className="pt-6">
              <h3 className="mb-4 font-semibold">Redes sociais</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Facebook className="h-5 w-5 text-muted-foreground" />
                  <Input
                    defaultValue={manager.facebook ?? ''}
                    placeholder="https://facebook.com/..."
                    onBlur={(e) => handleSocialLinkBlur('facebook', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Instagram className="h-5 w-5 text-muted-foreground" />
                  <Input
                    defaultValue={manager.instagram ?? ''}
                    placeholder="https://instagram.com/..."
                    onBlur={(e) => handleSocialLinkBlur('instagram', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <Input
                    defaultValue={manager.website ?? ''}
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
            <TabsList>
              <TabsTrigger value="profile">Dados do perfil</TabsTrigger>
              <TabsTrigger value="transactions">Transações do usuário</TabsTrigger>
              <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
              <TabsTrigger value="delete">Excluir cadastro</TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <Card>
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
                              <FormLabel>Fixo</FormLabel>
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
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                          {form.formState.isSubmitting && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
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
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Excluir Cadastro</CardTitle>
                  <CardDescription>
                    Esta ação é irreversível. Tenha certeza de que deseja excluir permanentemente
                    este cadastro.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Excluir permanentemente</Button>
                  </AlertDialogTrigger>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        <DeleteProfileDialog onConfirm={handleDelete} />
      </div>
    </AlertDialog>
  )
}
