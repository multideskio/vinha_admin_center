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
  Settings,
  Trash2,
  Save,
  ShieldCheck,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { SendMessageDialog } from '@/components/ui/send-message-dialog'
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
import { PhoneInput } from '@/components/ui/phone-input'

const adminProfileSchema = z
  .object({
    firstName: z.string().min(1, 'O nome é obrigatório.').optional(),
    lastName: z.string().min(1, 'O sobrenome é obrigatório.').optional(),
    email: z.string().email('E-mail inválido.').optional(),
    phone: z.string().optional(),
    cep: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    neighborhood: z.string().optional(),
    address: z.string().optional(),
    newPassword: z.string().optional().or(z.literal('')),
    role: z.enum(['admin', 'superadmin']).optional(),
    facebook: z.string().url().or(z.literal('')).optional(),
    instagram: z.string().url().or(z.literal('')).optional(),
    website: z.string().url().or(z.literal('')).optional(),
  })
  .partial()

type AdminProfile = z.infer<typeof adminProfileSchema> & {
  id?: string
  cpf?: string
  status?: string
  avatarUrl?: string
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
          detalhado para a exclusão deste administrador.
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

export default function AdminProfilePage() {
  const [admin, setAdmin] = React.useState<AdminProfile | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [previewImage, setPreviewImage] = React.useState<string | null>(null)
  const [notificationSettings, setNotificationSettings] = React.useState<Record<string, { email: boolean; whatsapp: boolean }>>({
    payment_notifications: { email: false, whatsapp: false },
    due_date_reminders: { email: false, whatsapp: false },
    network_reports: { email: false, whatsapp: false },
  })

  const params = useParams()
  const router = useRouter()
  const { id } = params
  const { toast } = useToast()

  const form = useForm<AdminProfile>({
    resolver: zodResolver(adminProfileSchema),
    defaultValues: {},
  })

  const fetchAdmin = React.useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/v1/administradores/${id}`)
      if (!response.ok) throw new Error('Falha ao carregar dados do administrador')
      const data = await response.json()

      const sanitizedData = {
        ...data,
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        cpf: data.cpf ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
        cep: data.cep ?? '',
        state: data.state ?? '',
        city: data.city ?? '',
        neighborhood: data.neighborhood ?? '',
        address: data.address ?? '',
        role: data.permission ?? 'admin',
        newPassword: '',
        facebook: data.facebook ?? '',
        instagram: data.instagram ?? '',
        website: data.website ?? '',
      }

      setAdmin(sanitizedData)
      form.reset(sanitizedData)
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do administrador.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [id, form, toast])

  const fetchNotificationSettings = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/users/${id}/notification-settings`)
      if (!response.ok) throw new Error('Falha ao carregar configurações')
      const data = await response.json()
      setNotificationSettings(data)
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }, [id])

  React.useEffect(() => {
    fetchAdmin()
    fetchNotificationSettings()
  }, [fetchAdmin, fetchNotificationSettings])

  const onSubmit = async (data: Partial<AdminProfile>) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/v1/administradores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Falha ao atualizar o administrador.')
      toast({
        title: 'Sucesso',
        description: 'Administrador atualizado com sucesso.',
        variant: 'success',
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (reason: string) => {
    try {
      const response = await fetch(`/api/v1/administradores/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletionReason: reason }),
      })
      if (!response.ok) throw new Error('Falha ao excluir o administrador.')
      toast({
        title: 'Sucesso!',
        description: 'Administrador excluído com sucesso.',
        variant: 'success',
      })
      router.push('/admin/administradores')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    }
  }

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'avatars')
        formData.append('filename', `admin-${id}-${file.name}`)

        const response = await fetch('/api/v1/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Falha no upload da imagem')
        }

        const result = await response.json()
        
        const updateResponse = await fetch(`/api/v1/administradores/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl: result.url }),
        })

        if (!updateResponse.ok) {
          throw new Error('Falha ao atualizar avatar')
        }

        await updateResponse.json()
        setPreviewImage(result.url)
        setAdmin(prev => prev ? { ...prev, avatarUrl: result.url } : null)
        
        await fetchAdmin()
        
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

  const handleSocialLinkBlur = async (field: 'facebook' | 'instagram' | 'website', value: string) => {
    try {
      const response = await fetch(`/api/v1/administradores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (!response.ok) throw new Error('Falha ao atualizar link')
      toast({ title: 'Sucesso', description: 'Link atualizado com sucesso.', variant: 'success' })
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao atualizar link.', variant: 'destructive' })
    }
  }

  const handleSaveNotifications = async () => {
    try {
      const response = await fetch(`/api/v1/users/${id}/notification-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationSettings),
      })
      if (!response.ok) throw new Error('Falha ao salvar configurações')
      toast({ title: 'Sucesso', description: 'Configurações salvas com sucesso.', variant: 'success' })
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao salvar configurações.', variant: 'destructive' })
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

  if (!admin) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="shadow-lg border-l-4 border-l-destructive">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 py-12">
              <AlertTriangle className="h-16 w-16 text-destructive" />
              <h2 className="text-2xl font-bold">Administrador não encontrado</h2>
              <p className="text-muted-foreground">O administrador solicitado não existe ou foi removido.</p>
              <Link href="/admin/administradores">
                <Button className="mt-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para Administradores
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
                <Link href="/admin/administradores">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-white/90 hover:text-white hover:bg-white/20 mb-3 -ml-2"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Administradores
                  </Button>
                </Link>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-3">
                  <ShieldCheck className="h-8 w-8" />
                  Perfil do Administrador
                </h1>
                <p className="text-base text-white/90 mt-2 font-medium">
                  {admin.firstName} {admin.lastName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={admin.status === 'active' ? 'success' : 'destructive'}
                  className={cn(
                    "text-sm px-6 py-2 font-bold shadow-xl border-2 transition-all",
                    admin.status === 'active' 
                      ? "bg-green-500 text-white border-green-400 hover:bg-green-600" 
                      : "bg-red-500 text-white border-red-400 hover:bg-red-600"
                  )}
                >
                  {admin.status === 'active' ? '✓ Ativo' : '✗ Inativo'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-t-4 border-t-videira-cyan hover:shadow-xl transition-all">
              <CardContent className="flex flex-col items-center pt-6 text-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={previewImage || admin.avatarUrl || undefined} />
                  <AvatarFallback className="text-lg">
                    {admin.firstName?.[0]}{admin.lastName?.[0]}
                  </AvatarFallback>
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
                <h2 className="mt-4 text-xl font-semibold">
                  {admin.firstName} {admin.lastName}
                </h2>
                <p className="text-sm text-muted-foreground font-medium">
                  {admin.role === 'admin' ? 'Administrador' : 'Super Administrador'}
                </p>
                <div className="flex gap-2 mt-4">
                  <SendMessageDialog
                    recipientName={`${admin.firstName} ${admin.lastName}`}
                    recipientEmail={admin.email || ''}
                    recipientPhone={admin.phone || ''}
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
                    onClick={() => window.open(`https://wa.me/55${admin.phone?.replace(/\D/g, '')}`, '_blank')}
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
                      defaultValue={admin.facebook ?? ''}
                      placeholder="https://facebook.com/..."
                      onBlur={(e) => handleSocialLinkBlur('facebook', e.target.value)}
                      className="border-blue-200 focus:border-blue-400"
                    />
                  </div>
                  <div className="flex items-center gap-3 group">
                    <Instagram className="h-5 w-5 text-pink-600 group-hover:scale-110 transition-transform" />
                    <Input
                      defaultValue={admin.instagram ?? ''}
                      placeholder="https://instagram.com/..."
                      onBlur={(e) => handleSocialLinkBlur('instagram', e.target.value)}
                      className="border-pink-200 focus:border-pink-400"
                    />
                  </div>
                  <div className="flex items-center gap-3 group">
                    <Globe className="h-5 w-5 text-videira-purple group-hover:scale-110 transition-transform" />
                    <Input
                      defaultValue={admin.website ?? ''}
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
              <TabsList className="grid w-full grid-cols-3 gap-2 bg-muted/50 p-1 rounded-lg">
                <TabsTrigger 
                  value="profile"
                  className="data-[state=active]:bg-videira-blue data-[state=active]:text-white font-semibold"
                >
                  <UserCog className="h-4 w-4 mr-2" />
                  Perfil
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
                  <CardDescription>Atualize as informações pessoais do administrador</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Celular</FormLabel>
                              <FormControl>
                                <PhoneInput
                                  value={field.value ?? ''}
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
                          name="role"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel>Permissão do usuário</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value ?? 'admin'}
                                  className="flex pt-2 space-x-4"
                                >
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="admin" />
                                    </FormControl>
                                    <FormLabel className="font-normal">Administrador</FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="superadmin" />
                                    </FormControl>
                                    <FormLabel className="font-normal">Super</FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

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
                            <FormLabel>Atualize a senha do administrador</FormLabel>
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
                    Gerencie os canais de notificação preferidos do administrador
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
                          checked={notificationSettings.payment_notifications?.email ?? false}
                          onCheckedChange={(checked) =>
                            setNotificationSettings((prev) => ({
                              ...prev,
                              payment_notifications: { email: checked, whatsapp: prev.payment_notifications?.whatsapp ?? false },
                            }))
                          }
                        />
                        <span className="text-xs text-muted-foreground">Email</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <Smartphone className="h-5 w-5 text-green-600" />
                        <Switch
                          checked={notificationSettings.payment_notifications?.whatsapp ?? false}
                          onCheckedChange={(checked) =>
                            setNotificationSettings((prev) => ({
                              ...prev,
                              payment_notifications: { email: prev.payment_notifications?.email ?? false, whatsapp: checked },
                            }))
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
                          checked={notificationSettings.due_date_reminders?.email ?? false}
                          onCheckedChange={(checked) =>
                            setNotificationSettings((prev) => ({
                              ...prev,
                              due_date_reminders: { email: checked, whatsapp: prev.due_date_reminders?.whatsapp ?? false },
                            }))
                          }
                        />
                        <span className="text-xs text-muted-foreground">Email</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <Smartphone className="h-5 w-5 text-green-600" />
                        <Switch
                          checked={notificationSettings.due_date_reminders?.whatsapp ?? false}
                          onCheckedChange={(checked) =>
                            setNotificationSettings((prev) => ({
                              ...prev,
                              due_date_reminders: { email: prev.due_date_reminders?.email ?? false, whatsapp: checked },
                            }))
                          }
                        />
                        <span className="text-xs text-muted-foreground">WhatsApp</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border-2 border-videira-purple/30 hover:border-videira-purple p-4 transition-all hover:shadow-md">
                    <div>
                      <p className="font-semibold">Relatórios da Rede</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Escolha os canais de comunicação
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-center gap-2">
                        <Mail className="h-5 w-5 text-videira-blue" />
                        <Switch
                          checked={notificationSettings.network_reports?.email ?? false}
                          onCheckedChange={(checked) =>
                            setNotificationSettings((prev) => ({
                              ...prev,
                              network_reports: { email: checked, whatsapp: prev.network_reports?.whatsapp ?? false },
                            }))
                          }
                        />
                        <span className="text-xs text-muted-foreground">Email</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <Smartphone className="h-5 w-5 text-green-600" />
                        <Switch
                          checked={notificationSettings.network_reports?.whatsapp ?? false}
                          onCheckedChange={(checked) =>
                            setNotificationSettings((prev) => ({
                              ...prev,
                              network_reports: { email: prev.network_reports?.email ?? false, whatsapp: checked },
                            }))
                          }
                        />
                        <span className="text-xs text-muted-foreground">WhatsApp</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={handleSaveNotifications}
                      className="bg-videira-purple hover:bg-videira-purple/90 text-white font-semibold shadow-lg"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Configurações
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
                      <strong>Atenção:</strong> Esta ação não pode ser desfeita. Todos os dados associados
                      a este administrador serão marcados como excluídos.
                    </AlertDescription>
                  </Alert>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="font-semibold shadow-lg"
                    >
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
