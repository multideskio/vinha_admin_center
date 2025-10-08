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
} from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ClickableAvatar } from '@/components/ui/clickable-avatar'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
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
import { Badge } from '@/components/ui/badge'

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

export default function AdminProfilePage() {
  const [admin, setAdmin] = React.useState<AdminProfile | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [previewImage, setPreviewImage] = React.useState<string | null>(null)

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

  React.useEffect(() => {
    fetchAdmin()
  }, [fetchAdmin])

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

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result as string)
        toast({
          title: 'Preview da Imagem',
          description:
            'A nova imagem está sendo exibida. O upload ainda não foi implementado no backend.',
        })
      }
      reader.readAsDataURL(file)
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

  if (!admin) {
    return <p>Administrador não encontrado.</p>
  }

  return (
    <AlertDialog>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="flex flex-col items-center pt-6 text-center">
              <div className="relative">
                <ClickableAvatar
                  src={previewImage || admin.avatarUrl || 'https://placehold.co/96x96.png'}
                  alt={admin.firstName ?? ''}
                  fallback={`${admin.firstName?.[0] || ''}${admin.lastName?.[0] || ''}`}
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
                {admin.firstName} {admin.lastName}
              </h2>
              <p className="text-muted-foreground">
                {admin.role === 'admin' ? 'Administrador' : 'Super Administrador'}
              </p>
            </CardContent>
            <Separator />
            <CardContent className="pt-6">
              <h3 className="mb-4 font-semibold">Redes sociais</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Facebook className="h-5 w-5 text-muted-foreground" />
                  <Input
                    defaultValue={admin.facebook ?? ''}
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Instagram className="h-5 w-5 text-muted-foreground" />
                  <Input
                    defaultValue={admin.instagram ?? ''}
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <Input defaultValue={admin.website ?? ''} placeholder="https://website.com/..." />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="profile">
            <TabsList>
              <TabsTrigger value="profile">Dados do perfil</TabsTrigger>
              <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
              <TabsTrigger value="delete">Excluir cadastro</TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <Card>
                <CardContent className="pt-6">
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
                                <div className="flex items-center">
                                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm h-10">
                                    🇧🇷 +55
                                  </span>
                                  <Input
                                    {...field}
                                    value={field.value ?? ''}
                                    className="rounded-l-none"
                                  />
                                </div>
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
            <TabsContent value="configuracoes">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Notificação</CardTitle>
                  <CardDescription>
                    Gerencie quais notificações este usuário receberá.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                        <Switch />
                      </div>
                      <div className="flex items-center gap-2" title="Notificar por WhatsApp">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <Switch />
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
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center gap-2" title="Notificar por WhatsApp">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Novos Cadastros</p>
                      <p className="text-sm text-muted-foreground">
                        Receber notificações sobre novos usuários cadastrados no sistema.
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2" title="Notificar por Email">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center gap-2" title="Notificar por WhatsApp">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <Switch />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button>Salvar Configurações</Button>
                  </div>
                </CardContent>
              </Card>
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
