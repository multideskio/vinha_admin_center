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
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'

const churchProfileSchema = z.object({
  id: z.string().optional(),
  cnpj: z.string().min(1, 'O CNPJ/CPF é obrigatório.'),
  razaoSocial: z.string().min(1, 'A razão social é obrigatória.'),
  nomeFantasia: z.string().min(1, 'O nome fantasia é obrigatório.'),
  email: z.string().email({ message: 'E-mail inválido.' }),
  cep: z.string().min(9, { message: 'O CEP deve ter 8 dígitos.' }),
  state: z.string().length(2, { message: 'UF deve ter 2 letras.' }),
  city: z.string().min(1, { message: 'A cidade é obrigatória.' }),
  neighborhood: z.string().min(1, { message: 'O bairro é obrigatório.' }),
  address: z.string().min(1, { message: 'O endereço é obrigatório.' }),
  foundationDate: z.string().optional(),
  titheDay: z.coerce.number().min(1).max(31),
  phone: z.string().min(1, { message: 'O celular é obrigatório.' }),
  treasurerFirstName: z.string().min(1, 'O nome do tesoureiro é obrigatório.'),
  treasurerLastName: z.string().min(1, 'O sobrenome do tesoureiro é obrigatório.'),
  treasurerCpf: z.string().min(14, 'O CPF do tesoureiro deve ter 11 dígitos.'),
  newPassword: z.string().optional().or(z.literal('')),
  facebook: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
})

type ChurchProfile = z.infer<typeof churchProfileSchema> & { userId?: string; avatarUrl?: string }

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

export default function IgrejaProfilePage() {
  const [church, setChurch] = React.useState<ChurchProfile | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false)
  const [previewImage, setPreviewImage] = React.useState<string | null>(null)
  const { toast } = useToast()

  const form = useForm<ChurchProfile>({
    resolver: zodResolver(churchProfileSchema),
    defaultValues: {},
  })

  const fetchProfile = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/igreja/perfil')
      if (!response.ok) throw new Error('Falha ao carregar perfil.')
      const data = await response.json()
      setChurch(data)
      form.reset(data)
    } catch (error) {
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

  const onSubmit = async (data: ChurchProfile) => {
    try {
      const response = await fetch('/api/v1/igreja/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Falha ao atualizar perfil.')
      toast({ title: 'Sucesso', description: 'Perfil atualizado.', variant: 'success' })
      fetchProfile()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
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
        formData.append('filename', `igreja-${church?.id}-${file.name}`)

        const response = await fetch('/api/v1/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) throw new Error('Falha no upload da imagem')

        const result = await response.json()
        
        const updateResponse = await fetch('/api/v1/igreja/perfil', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl: result.url }),
        })

        if (!updateResponse.ok) throw new Error('Falha ao atualizar avatar')

        setPreviewImage(result.url)
        setChurch(prev => prev ? { ...prev, avatarUrl: result.url } : null)
        
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
    if (!value || value === church?.[fieldName]) return

    try {
      const response = await fetch('/api/v1/igreja/perfil', {
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
      
      setChurch((prev) => (prev ? { ...prev, [fieldName]: value } : null))
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
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
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Left Column: Profile Card */}
      <div className="lg:col-span-1">
        <Card>
          <CardContent className="flex flex-col items-center pt-6 text-center">
            <div className="relative">
              <ClickableAvatar
                src={previewImage || church.avatarUrl || "https://placehold.co/96x96.png"}
                alt={church.nomeFantasia}
                fallback="IDM"
                className={cn("h-24 w-24", isUploadingPhoto && "opacity-50")}
              />
              {isUploadingPhoto && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}
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
                disabled={isUploadingPhoto}
              />
            </div>
            <h2 className="mt-4 text-xl font-semibold">{church.nomeFantasia}</h2>
            <p className="text-muted-foreground">Igreja</p>
          </CardContent>
          <Separator />
          <CardContent className="pt-6">
            <h3 className="mb-4 font-semibold">Redes sociais</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Facebook className="h-5 w-5 text-muted-foreground" />
                <Input
                  defaultValue={church.facebook ?? ''}
                  placeholder="https://facebook.com/..."
                  onBlur={(e) => handleSocialLinkBlur('facebook', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <Instagram className="h-5 w-5 text-muted-foreground" />
                <Input
                  defaultValue={church.instagram ?? ''}
                  placeholder="https://instagram.com/..."
                  onBlur={(e) => handleSocialLinkBlur('instagram', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <Input
                  defaultValue={church.website ?? ''}
                  placeholder="https://website.com/..."
                  onBlur={(e) => handleSocialLinkBlur('website', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Tabs and Form */}
      <div className="lg:col-span-2">
        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Dados da Igreja</TabsTrigger>
            <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <Card>
              <CardContent className="pt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CNPJ</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  let value = e.target.value.replace(/\D/g, '')
                                  if (value.length <= 14) {
                                    value = value.replace(/(\d{2})(\d)/, '$1.$2')
                                    value = value.replace(/(\d{3})(\d)/, '$1.$2')
                                    value = value.replace(/(\d{3})(\d)/, '$1/$2')
                                    value = value.replace(/(\d{4})(\d)/, '$1-$2')
                                  }
                                  field.onChange(value)
                                }}
                                maxLength={18}
                                disabled
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
                                onChange={(e) => {
                                  let value = e.target.value.replace(/\D/g, '')
                                  if (value.length >= 5) {
                                    value = value.slice(0, 5) + '-' + value.slice(5, 8)
                                  }
                                  field.onChange(value)
                                }}
                                maxLength={9}
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
                          <FormItem>
                            <FormLabel>Data de Fundação</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="dd/mm/aaaa"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  let value = e.target.value.replace(/\D/g, '')
                                  if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2)
                                  if (value.length >= 5) value = value.slice(0, 5) + '/' + value.slice(5, 9)
                                  field.onChange(value)
                                }}
                                maxLength={10}
                              />
                            </FormControl>
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
                              <PhoneInput
                                country={'br'}
                                value={field.value ?? ''}
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
                                  borderRadius: 'calc(var(--radius) - 2px) 0 0 calc(var(--radius) - 2px)',
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
                              <Input
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  let value = e.target.value.replace(/\D/g, '')
                                  if (value.length <= 11) {
                                    value = value.replace(/(\d{3})(\d)/, '$1.$2')
                                    value = value.replace(/(\d{3})(\d)/, '$1.$2')
                                    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
                                  }
                                  field.onChange(value)
                                }}
                                maxLength={14}
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
                      <Button type="submit">Alterar cadastro</Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="configuracoes">
            {church.userId && <SettingsTab userId={church.userId} />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
