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
  Mail,
  Smartphone,
  User,
  Info,
  Loader2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { type NotificationType, type UserNotificationSettings } from '@/lib/types'
import { NOTIFICATION_TYPES } from '@/lib/types'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { ClickableAvatar } from '@/components/ui/clickable-avatar'
import { Label } from '@/components/ui/label'
import { PhoneInput } from '@/components/ui/phone-input'

const churchProfileSchema = z.object({
  id: z.string().optional(),
  cnpj: z.string().min(1, 'O CNPJ/CPF é obrigatório.'),
  razaoSocial: z.string().min(1, 'A razão social é obrigatória.'),
  nomeFantasia: z.string().min(1, 'O nome fantasia é obrigatório.'),
  email: z.string().email({ message: 'E-mail inválido.' }),
  cep: z
    .string()
    .min(1, 'O CEP é obrigatório.')
    .refine(
      (value) => {
        const digitsOnly = value.replace(/\D/g, '')
        return digitsOnly.length === 8
      },
      { message: 'O CEP deve ter 8 dígitos.' },
    ),
  state: z.string().length(2, { message: 'UF deve ter 2 letras.' }),
  city: z.string().min(1, { message: 'A cidade é obrigatória.' }),
  neighborhood: z.string().min(1, { message: 'O bairro é obrigatório.' }),
  address: z.string().min(1, { message: 'O endereço é obrigatório.' }),
  number: z.string().optional(),
  complement: z.string().optional(),
  phone: z
    .string()
    .min(1, 'O telefone é obrigatório.')
    .refine(
      (value) => {
        // Remove caracteres não numéricos para contar apenas dígitos
        const digitsOnly = value.replace(/\D/g, '')
        // Telefone brasileiro: código do país (55) + DDD (2) + número (8 ou 9 dígitos)
        // Mínimo: 55 + 2 + 8 = 12 dígitos (fixo)
        // Máximo: 55 + 2 + 9 = 13 dígitos (celular)
        return digitsOnly.length >= 12 && digitsOnly.length <= 13
      },
      {
        message: 'Telefone inválido. Digite um número válido com DDD.',
      },
    ),
  foundationDate: z.string().optional(),
  titheDay: z.coerce.number().min(1).max(31),
  treasurerFirstName: z.string().min(1, { message: 'O nome do tesoureiro é obrigatório.' }),
  treasurerLastName: z.string().min(1, { message: 'O sobrenome do tesoureiro é obrigatório.' }),
  treasurerCpf: z.string().min(1, { message: 'O CPF do tesoureiro é obrigatório.' }),
  newPassword: z.string().optional().or(z.literal('')),
})

type ChurchProfile = z.infer<typeof churchProfileSchema> & {
  userId?: string
  avatarUrl?: string
  facebook?: string | null
  instagram?: string | null
  website?: string | null
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

  const toggleSetting = async (type: NotificationType, channel: 'email' | 'whatsapp') => {
    const newValue = !settings[type]?.[channel]
    setSettings((prev) => ({
      ...prev,
      [type]: { ...prev[type], [channel]: newValue },
    }))

    setIsSavingSettings(true)
    try {
      const response = await fetch(`/api/v1/users/${userId}/notification-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, channel, enabled: newValue }),
      })
      if (!response.ok) throw new Error('Falha ao atualizar configuração.')
      toast({
        title: 'Sucesso',
        description: 'Configuração atualizada com sucesso.',
        variant: 'success',
      })
    } catch (error: unknown) {
      setSettings((prev) => ({
        ...prev,
        [type]: { ...prev[type], [channel]: !newValue },
      }))
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
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {NOTIFICATION_TYPES.filter((t) => t in notificationSettingsConfig).map((type) => (
        <Card key={type} className="shadow-sm border-l-4 border-l-muted">
          <CardHeader>
            <CardTitle className="text-base">
              {notificationSettingsConfig[type as keyof typeof notificationSettingsConfig]}
            </CardTitle>
            <CardDescription className="text-sm">
              Configure como deseja receber notificações.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor={`${type}-email`} className="text-sm font-medium">
                <Mail className="inline h-4 w-4 mr-2" />
                E-mail
              </Label>
              <Switch
                id={`${type}-email`}
                checked={settings[type]?.email || false}
                onCheckedChange={() => toggleSetting(type, 'email')}
                disabled={isSavingSettings}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor={`${type}-whatsapp`} className="text-sm font-medium">
                <Smartphone className="inline h-4 w-4 mr-2" />
                WhatsApp
              </Label>
              <Switch
                id={`${type}-whatsapp`}
                checked={settings[type]?.whatsapp || false}
                onCheckedChange={() => toggleSetting(type, 'whatsapp')}
                disabled={isSavingSettings}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function ChurchProfilePage() {
  const [data, setData] = React.useState<ChurchProfile | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isUploading, setIsUploading] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const { toast } = useToast()

  const form = useForm<ChurchProfile>({
    resolver: zodResolver(churchProfileSchema),
    defaultValues: {
      cnpj: '',
      razaoSocial: '',
      nomeFantasia: '',
      email: '',
      cep: '',
      state: '',
      city: '',
      neighborhood: '',
      address: '',
      number: '',
      complement: '',
      phone: '',
      foundationDate: '',
      titheDay: 10,
      treasurerFirstName: '',
      treasurerLastName: '',
      treasurerCpf: '',
      newPassword: '',
    },
  })

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/igreja/perfil')
      if (!response.ok) throw new Error('Falha ao carregar perfil.')
      const profileData = await response.json()
      setData(profileData)
      // Normalizar dados para evitar inputs não controlados (undefined/null -> string vazia)
      // Converter foundationDate de dd/mm/yyyy para yyyy-mm-dd (formato do input date)
      let normalizedFoundationDate = ''
      if (profileData.foundationDate) {
        const [day, month, year] = profileData.foundationDate.split('/')
        if (day && month && year) {
          normalizedFoundationDate = `${year}-${month}-${day}`
        }
      }

      // Normalizar telefone: garantir que seja string (não null/undefined)
      const normalizedPhone =
        profileData.phone && profileData.phone.trim() !== '' ? profileData.phone : ''

      console.log('[IGREJA_PERFIL_FETCH]', {
        phoneFromAPI: profileData.phone,
        normalizedPhone,
        phoneType: typeof profileData.phone,
      })

      const normalizedData: ChurchProfile = {
        ...profileData,
        cnpj: profileData.cnpj ?? '',
        razaoSocial: profileData.razaoSocial ?? '',
        nomeFantasia: profileData.nomeFantasia ?? '',
        email: profileData.email ?? '',
        cep: profileData.cep ?? '',
        state: profileData.state ?? '',
        city: profileData.city ?? '',
        neighborhood: profileData.neighborhood ?? '',
        address: profileData.address ?? '',
        number: profileData.number ?? '',
        complement: profileData.complement ?? '',
        phone: normalizedPhone,
        foundationDate: normalizedFoundationDate,
        titheDay: profileData.titheDay ?? 10,
        treasurerFirstName: profileData.treasurerFirstName ?? '',
        treasurerLastName: profileData.treasurerLastName ?? '',
        treasurerCpf: profileData.treasurerCpf ?? '',
        newPassword: '',
      }
      form.reset(normalizedData)
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
    fetchData()
  }, [fetchData])

  const handleAvatarChange = async (file: File) => {
    if (!data) return
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Falha ao fazer upload da imagem.')
      const { url } = await response.json()

      const updateResponse = await fetch('/api/v1/igreja/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: url }),
      })

      if (!updateResponse.ok) throw new Error('Falha ao atualizar avatar.')

      setData((prev) => (prev ? { ...prev, avatarUrl: url } : null))
      toast({ title: 'Sucesso', description: 'Avatar atualizado com sucesso.', variant: 'success' })
    } catch (error: unknown) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSocialLinkBlur = async (
    field: 'facebook' | 'instagram' | 'website',
    value: string,
  ) => {
    try {
      const response = await fetch('/api/v1/igreja/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })

      if (!response.ok) throw new Error('Falha ao atualizar rede social.')

      setData((prev) => (prev ? { ...prev, [field]: value } : null))
      toast({ title: 'Sucesso', description: 'Rede social atualizada.', variant: 'success' })
    } catch (error: unknown) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    }
  }

  const onSubmit = async (formData: ChurchProfile) => {
    setIsSaving(true)
    try {
      // Converter foundationDate de yyyy-mm-dd (formato do input date) para dd/mm/yyyy (formato esperado pela API)
      const submitData = { ...formData }
      if (submitData.foundationDate && submitData.foundationDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = submitData.foundationDate.split('-')
        submitData.foundationDate = `${day}/${month}/${year}`
      }

      // Garantir que phone seja enviado como string mesmo se vazio
      submitData.phone = submitData.phone ? String(submitData.phone) : ''

      console.log('[IGREJA_PERFIL_SUBMIT]', {
        phone: submitData.phone,
        phoneType: typeof submitData.phone,
        phoneLength: submitData.phone?.length,
      })

      const response = await fetch('/api/v1/igreja/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Falha ao atualizar perfil.')
      }

      // Recarregar dados atualizados
      await fetchData()
      toast({ title: 'Sucesso', description: 'Perfil atualizado com sucesso.', variant: 'success' })
    } catch (error: unknown) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  if (!data) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar dados da igreja. Por favor, tente novamente.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header com gradiente Videira */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 videira-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 p-4 sm:p-6 md:p-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow-lg">
            Meu Perfil
          </h1>
          <p className="text-sm sm:text-base text-white/90 mt-2 font-medium">
            Gerencie as informações da sua igreja
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-3">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg border-t-4 border-t-videira-cyan">
            <CardContent className="flex flex-col items-center pt-4 sm:pt-6 text-center px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="relative">
                <ClickableAvatar
                  src={data.avatarUrl}
                  alt={data.nomeFantasia || 'Igreja'}
                  fallback={(data.nomeFantasia || 'IG').substring(0, 2).toUpperCase()}
                  className={cn(
                    'h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-videira-cyan/30',
                    isUploading && 'opacity-50',
                  )}
                  enableModal={!!data.avatarUrl}
                />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-videira-cyan" />
                  </div>
                )}
                <Label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 cursor-pointer"
                  aria-disabled={isUploading}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-videira-cyan border-2 border-white hover:bg-videira-cyan/90 shadow-lg transition-all',
                      isUploading && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <span className="sr-only">Trocar foto</span>
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleAvatarChange(file)
                  }}
                  disabled={isUploading}
                />
              </div>
              <h2 className="mt-3 sm:mt-4 text-lg sm:text-xl font-semibold break-words">
                {data.nomeFantasia}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground break-words">
                {data.razaoSocial}
              </p>
            </CardContent>
            <Separator />
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
              <h3 className="mb-3 sm:mb-4 font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-videira-cyan flex-shrink-0" />
                <span>Redes sociais</span>
              </h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Facebook className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  <Input
                    defaultValue={data.facebook ?? ''}
                    placeholder="https://facebook.com/..."
                    onBlur={(e) => handleSocialLinkBlur('facebook', e.target.value)}
                    className="border-2 focus:border-videira-cyan text-xs sm:text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Instagram className="h-4 w-4 sm:h-5 sm:w-5 text-pink-600 flex-shrink-0" />
                  <Input
                    defaultValue={data.instagram ?? ''}
                    placeholder="https://instagram.com/..."
                    onBlur={(e) => handleSocialLinkBlur('instagram', e.target.value)}
                    className="border-2 focus:border-videira-cyan text-xs sm:text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-videira-cyan flex-shrink-0" />
                  <Input
                    defaultValue={data.website ?? ''}
                    placeholder="https://website.com/..."
                    onBlur={(e) => handleSocialLinkBlur('website', e.target.value)}
                    className="border-2 focus:border-videira-cyan text-xs sm:text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tabs and Form */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="profile" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-2 p-1 bg-gradient-to-r from-videira-cyan/10 to-videira-blue/10">
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-videira-cyan data-[state=active]:text-white text-xs sm:text-sm"
              >
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span>Perfil</span>
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-videira-blue data-[state=active]:text-white text-xs sm:text-sm"
              >
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span>Configurações</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4 sm:space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                  <Card className="shadow-lg border-l-4 border-l-videira-blue">
                    <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Info className="h-4 w-4 sm:h-5 sm:w-5 text-videira-blue flex-shrink-0" />
                        <span>Dados da Igreja</span>
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Informações cadastrais da igreja
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <FormField
                          control={form.control}
                          name="nomeFantasia"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Fantasia *</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="razaoSocial"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Razão Social *</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="cnpj"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CNPJ *</FormLabel>
                              <FormControl>
                                <Input {...field} />
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
                              <FormLabel>E-mail *</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} />
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
                              <FormLabel>Telefone *</FormLabel>
                              <FormControl>
                                <PhoneInput
                                  type="mobile"
                                  value={field.value || ''}
                                  onChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="foundationDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data de Fundação</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="cep"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CEP *</FormLabel>
                              <FormControl>
                                <Input {...field} />
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
                              <FormLabel>Estado *</FormLabel>
                              <FormControl>
                                <Input maxLength={2} {...field} />
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
                              <FormLabel>Cidade *</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="neighborhood"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bairro *</FormLabel>
                              <FormControl>
                                <Input {...field} />
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
                              <FormLabel>Logradouro *</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="complement"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Complemento</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="treasurerFirstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome do Tesoureiro *</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="treasurerLastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sobrenome do Tesoureiro *</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="treasurerCpf"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CPF do Tesoureiro *</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="titheDay"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dia do Dízimo (1-31)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={31}
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) =>
                                  field.onChange(e.target.value ? Number(e.target.value) : '')
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              <Lock className="inline h-4 w-4 mr-2" />
                              Nova Senha (deixe em branco para não alterar)
                            </FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-videira-cyan to-videira-blue hover:from-videira-cyan/90 hover:to-videira-blue/90 text-white font-semibold shadow-lg"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Alterações'
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card className="shadow-lg border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-green-500" />
                    Notificações
                  </CardTitle>
                  <CardDescription>Gerencie como deseja receber notificações</CardDescription>
                </CardHeader>
                <CardContent>{data.userId && <SettingsTab userId={data.userId} />}</CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
