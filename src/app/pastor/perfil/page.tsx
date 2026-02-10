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
  User,
  Loader2,
} from 'lucide-react'
import { PhoneInput } from '@/components/ui/phone-input'

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
import { cn } from '@/lib/utils'
import { type UserNotificationSettings, type NotificationType } from '@/lib/types'
import { NOTIFICATION_TYPES } from '@/lib/types'
import { Switch } from '@/components/ui/switch'

const pastorProfileSchema = z.object({
  firstName: z.string().min(1, 'O nome é obrigatório.'),
  lastName: z.string().min(1, 'O sobrenome é obrigatório.'),
  cpf: z.string(),
  phone: z.string(),
  landline: z.union([z.string(), z.null(), z.literal('')]).optional(),
  email: z.string().email('E-mail inválido.'),
  cep: z.string(),
  state: z.string(),
  city: z.string(),
  neighborhood: z.string(),
  street: z.string(),
  number: z.string().nullable().optional().or(z.literal('')),
  complement: z.string().nullable().optional().or(z.literal('')),
  birthDate: z.string().nullable().optional().or(z.literal('')),
  titheDay: z.coerce.number(),
  newPassword: z.string().optional().or(z.literal('')),
  facebook: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
})

type PastorProfile = z.infer<typeof pastorProfileSchema> & {
  id?: string
  userId?: string
  avatarUrl?: string
}

const notificationSettingsConfig = {
  payment_notifications: 'Notificações de Pagamento',
  due_date_reminders: 'Lembretes de Vencimento',
  network_reports: 'Relatórios da Rede',
}

const SettingsTab = ({ userId }: { userId: string }) => {
  const [settings, setSettings] = React.useState<UserNotificationSettings>(
    NOTIFICATION_TYPES.reduce((acc, type) => {
      acc[type] = { email: false, whatsapp: false }
      return acc
    }, {} as UserNotificationSettings),
  )
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSavingSettings, setIsSavingSettings] = React.useState(false)
  const { toast } = useToast()

  const fetchSettings = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/v1/users/${userId}/notification-settings`)
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
    setIsSavingSettings(true)
    try {
      const response = await fetch(`/api/v1/users/${userId}/notification-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Falha ao salvar configurações.')
      }

      toast({
        title: 'Sucesso',
        description: 'Configurações de notificação salvas.',
        variant: 'success',
      })
    } catch (error: unknown) {
      console.error('Erro ao salvar configurações:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setIsSavingSettings(false)
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
      <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
          <span className="break-words">Configurações de Notificação</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Gerencie quais notificações você receberá.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
        {NOTIFICATION_TYPES.map((type) => (
          <div
            key={type}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 rounded-lg border p-3 sm:p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm sm:text-base break-words">
                {notificationSettingsConfig[type as keyof typeof notificationSettingsConfig]}
              </p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              <div className="flex items-center gap-2" title="Notificar por Email">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Switch
                  checked={settings[type]?.email ?? false}
                  onCheckedChange={(value) => handleSwitchChange(type, 'email', value)}
                />
              </div>
              <div className="flex items-center gap-2" title="Notificar por WhatsApp">
                <Smartphone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Switch
                  checked={settings[type]?.whatsapp ?? false}
                  onCheckedChange={(value) => handleSwitchChange(type, 'whatsapp', value)}
                />
              </div>
            </div>
          </div>
        ))}
        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSaveSettings}
            className="w-full sm:w-auto"
            disabled={isSavingSettings}
          >
            {isSavingSettings ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Configurações'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function PastorProfilePage() {
  const [pastor, setPastor] = React.useState<PastorProfile | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false)
  const [previewImage, setPreviewImage] = React.useState<string | null>(null)
  const { toast } = useToast()

  const form = useForm<PastorProfile>({
    resolver: zodResolver(pastorProfileSchema),
    defaultValues: {},
  })

  const fetchProfile = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/pastor/perfil')
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Falha ao carregar perfil.')
      }
      const data = await response.json()

      // Garantir que street está mapeado corretamente (API retorna address como street)
      // Converter null para undefined para campos opcionais
      const profileData = {
        ...data,
        street: data.street || data.address || '', // Usar street se disponível, senão address
        landline: data.landline || undefined, // Converter null para undefined
        number: data.number || undefined,
        complement: data.complement || undefined,
        birthDate: data.birthDate || undefined,
      }

      setPastor(profileData)
      form.reset(profileData)
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
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

  const onSubmit = async (data: PastorProfile) => {
    setIsSaving(true)
    try {
      // Garantir que street está sendo enviado (API espera street e mapeia para address)
      // Converter undefined/null para null para campos opcionais
      const updateData = {
        ...data,
        street: data.street || '', // Garantir que street está presente
        landline: data.landline || null, // Converter undefined para null
        number: data.number || null,
        complement: data.complement || null,
        birthDate: data.birthDate || null,
      }

      const response = await fetch('/api/v1/pastor/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Falha ao atualizar perfil.')
      }

      toast({ title: 'Sucesso', description: 'Perfil atualizado.', variant: 'success' })
      fetchProfile()
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setIsUploadingPhoto(true)
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'avatars')
        formData.append('filename', `pastor-${pastor?.id}-${file.name}`)

        const response = await fetch('/api/v1/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) throw new Error('Falha no upload da imagem')

        const result = await response.json()

        const updateResponse = await fetch('/api/v1/pastor/perfil', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl: result.url }),
        })

        if (!updateResponse.ok) throw new Error('Falha ao atualizar avatar')

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
        setIsUploadingPhoto(false)
      }
    }
  }

  const handleSocialLinkBlur = async (
    fieldName: 'facebook' | 'instagram' | 'website',
    value: string,
  ) => {
    if (!value || value === pastor?.[fieldName]) return

    try {
      const response = await fetch('/api/v1/pastor/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [fieldName]: value || null }),
      })

      if (!response.ok) throw new Error(`Falha ao atualizar ${fieldName}.`)

      toast({
        title: 'Sucesso!',
        description: `Link do ${fieldName} atualizado.`,
        variant: 'success',
      })

      setPastor((prev) => (prev ? { ...prev, [fieldName]: value } : null))
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    }
  }

  if (isLoading || !pastor) {
    return (
      <div className="flex flex-col gap-6">
        {/* Header Skeleton */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-videira-cyan via-videira-blue to-videira-purple opacity-90" />
          <div className="relative z-10 p-4 sm:p-6 md:p-8">
            <Skeleton className="h-8 sm:h-10 w-48 sm:w-64 bg-white/20 mb-2" />
            <Skeleton className="h-4 sm:h-5 w-72 sm:w-96 bg-white/20" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-full" />
                  <Skeleton className="h-5 w-32 sm:w-40" />
                  <Skeleton className="h-4 w-20 sm:w-24" />
                </div>
                <Separator className="my-4 sm:my-6" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24 sm:w-32" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="space-y-4 sm:space-y-6">
                  <Skeleton className="h-10 w-full sm:w-64" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-10 w-32 sm:w-40 ml-auto" />
                </div>
              </CardContent>
            </Card>
          </div>
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

        <div className="relative z-10 p-4 sm:p-6 md:p-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow-lg">
            Meu Perfil
          </h1>
          <p className="text-sm sm:text-base text-white/90 mt-2 font-medium">
            Gerencie suas informações pessoais e preferências
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="shadow-lg border-t-4 border-t-videira-cyan">
            <CardContent className="flex flex-col items-center pt-4 sm:pt-6 text-center px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="relative">
                <ClickableAvatar
                  src={previewImage || pastor.avatarUrl || 'https://placehold.co/96x96.png'}
                  alt={`${pastor.firstName} ${pastor.lastName}`}
                  fallback={`${pastor.firstName?.[0] || ''}${pastor.lastName?.[0] || ''}`}
                  className={cn('h-20 w-20 sm:h-24 sm:w-24', isUploadingPhoto && 'opacity-50')}
                />
                {isUploadingPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                )}
                <Label htmlFor="photo-upload" className="absolute bottom-0 right-0 cursor-pointer">
                  <div className="flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-background border border-border hover:bg-muted">
                    <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  </div>
                  <span className="sr-only">Trocar foto</span>
                </Label>
                <Input
                  id="photo-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  disabled={isUploadingPhoto}
                />
              </div>
              <h2 className="mt-3 sm:mt-4 text-lg sm:text-xl font-semibold break-words">
                {pastor.firstName} {pastor.lastName}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">Pastor</p>
            </CardContent>
            <Separator />
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
              <h3 className="mb-3 sm:mb-4 font-semibold text-sm sm:text-base">Redes sociais</h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Facebook className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                  <Input
                    defaultValue={pastor.facebook ?? ''}
                    placeholder="https://facebook.com/..."
                    onBlur={(e) => handleSocialLinkBlur('facebook', e.target.value)}
                    className="text-xs sm:text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Instagram className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                  <Input
                    defaultValue={pastor.instagram ?? ''}
                    placeholder="https://instagram.com/..."
                    onBlur={(e) => handleSocialLinkBlur('instagram', e.target.value)}
                    className="text-xs sm:text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                  <Input
                    defaultValue={pastor.website ?? ''}
                    placeholder="https://website.com/..."
                    onBlur={(e) => handleSocialLinkBlur('website', e.target.value)}
                    className="text-xs sm:text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="profile">
            <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-videira-cyan/10 to-videira-blue/10">
              <TabsTrigger
                value="profile"
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Dados do perfil</span>
                <span className="sm:hidden">Perfil</span>
              </TabsTrigger>
              <TabsTrigger
                value="configuracoes"
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Configurações</span>
                <span className="sm:hidden">Config</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <Card className="shadow-lg border-t-4 border-t-videira-blue">
                <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                                <Input {...field} value={field.value ?? ''} disabled />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="birthDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs sm:text-sm">
                                Data de nascimento
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="dd/mm/aaaa"
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={(e) => {
                                    let value = e.target.value.replace(/\D/g, '')
                                    if (value.length >= 2)
                                      value = value.slice(0, 2) + '/' + value.slice(2)
                                    if (value.length >= 5)
                                      value = value.slice(0, 5) + '/' + value.slice(5, 9)
                                    field.onChange(value)
                                  }}
                                  maxLength={10}
                                  className="text-sm"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs sm:text-sm">Celular</FormLabel>
                              <FormControl>
                                <PhoneInput
                                  type="mobile"
                                  value={field.value ?? ''}
                                  onChange={field.onChange}
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
                              <FormLabel className="text-xs sm:text-sm">Telefone 2</FormLabel>
                              <FormControl>
                                <PhoneInput
                                  type="landline"
                                  value={field.value || ''}
                                  onChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-1">
                              <FormLabel className="text-xs sm:text-sm">Email</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  {...field}
                                  value={field.value ?? ''}
                                  className="text-sm"
                                />
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
                              <FormLabel className="text-xs sm:text-sm">CEP</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value ?? ''} className="text-sm" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs sm:text-sm">Estado/UF</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value ?? ''} className="text-sm" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs sm:text-sm">Cidade</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value ?? ''} className="text-sm" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="neighborhood"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs sm:text-sm">Bairro</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value ?? ''} className="text-sm" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="street"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs sm:text-sm">Rua</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Nome da rua..."
                                  {...field}
                                  value={field.value ?? ''}
                                  className="text-sm"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs sm:text-sm">Número</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Número da casa..."
                                  {...field}
                                  value={field.value ?? ''}
                                  className="text-sm"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="complement"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs sm:text-sm">Complemento</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value ?? ''} className="text-sm" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="titheDay"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs sm:text-sm">Dia do dízimo</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  value={field.value ?? ''}
                                  className="text-sm"
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
                        <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                        <AlertDescription className="text-xs sm:text-sm">
                          <strong>Importante</strong> - Ao atualizar a senha, você não poderá
                          acessar usando a senha anterior.
                        </AlertDescription>
                      </Alert>

                      <Alert
                        variant="default"
                        className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
                      >
                        <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <AlertDescription className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                          <strong>Informação</strong> - Escolha uma senha adequada para você.
                        </AlertDescription>
                      </Alert>

                      <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <Label className="text-xs sm:text-sm">Atualize sua senha</Label>
                            <FormControl>
                              <div className="relative mt-1">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                  type="password"
                                  placeholder="Nova Senha"
                                  className="pl-9 text-sm"
                                  {...field}
                                  value={field.value ?? ''}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end pt-2">
                        <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
                          {isSaving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            'Alterar cadastro'
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="configuracoes">
              {pastor.userId && <SettingsTab userId={pastor.userId} />}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
