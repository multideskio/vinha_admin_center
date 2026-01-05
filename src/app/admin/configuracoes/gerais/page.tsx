'use client'

import * as React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Upload, Loader2, Settings, ChevronLeft, Save } from 'lucide-react'
import Link from 'next/link'
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
import Image from 'next/image'

const generalSettingsSchema = z.object({
  name: z.string().min(1, 'O nome da aplicação é obrigatório.'),
  supportEmail: z.string().email('E-mail de suporte inválido.'),
  logoUrl: z.string().url('URL da logo inválida.').optional().nullable().or(z.literal('')),
  maintenanceMode: z.boolean().default(false),
})

type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>

export default function GeneralSettingsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null)

  const form = useForm<GeneralSettingsValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      name: '',
      supportEmail: '',
      logoUrl: '',
      maintenanceMode: false,
    },
  })

  const fetchSettings = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/company')
      if (!response.ok) throw new Error('Falha ao carregar configurações.')
      const data = await response.json()
      form.reset(data.company)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [form, toast])

  React.useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  React.useEffect(() => {
    const logoUrl = form.watch('logoUrl')
    if (logoUrl) setLogoPreview(logoUrl)
  }, [form])

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validação de tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'A logo deve ter no máximo 5MB.',
        variant: 'destructive',
      })
      return
    }

    // Validação de tipo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Erro',
        description: 'Apenas arquivos PNG, JPG ou SVG são permitidos.',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'uploads')

      const response = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Falha ao fazer upload da logo.')
      }

      const { url } = await response.json()
      form.setValue('logoUrl', url)
      setLogoPreview(url)
      toast({ title: 'Sucesso!', description: 'Logo enviada com sucesso.', variant: 'success' })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsUploading(false)
    }
  }

  const onSubmit = async (data: GeneralSettingsValues) => {
    setIsSaving(true)
    try {
      // Validação adicional para modo manutenção
      if (data.maintenanceMode) {
        const confirmMaintenance = window.confirm(
          'Atenção: Ativar o modo de manutenção impedirá que usuários acessem o sistema. Deseja continuar?',
        )
        if (!confirmMaintenance) {
          setIsSaving(false)
          return
        }
      }

      const response = await fetch('/api/v1/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Falha ao salvar configurações.')
      }

      toast({
        title: 'Sucesso!',
        description: 'Configurações gerais salvas com sucesso.',
        variant: 'success',
      })

      // Recarregar dados para sincronizar
      await fetchSettings()

      // Forçar atualização do SEO dinâmico
      window.dispatchEvent(new CustomEvent('company-settings-updated', {
        detail: { name: data.name, logoUrl: data.logoUrl }
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-8">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-8 w-32" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Moderno com Gradiente Videira */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 videira-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

        <div className="relative z-10 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/admin/configuracoes">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/90 hover:text-white hover:bg-white/20"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-3">
              <Settings className="h-8 w-8" />
              Configurações Gerais
            </h1>
            <p className="text-base text-white/90 mt-2 font-medium">Ajustes gerais da plataforma</p>
          </div>
        </div>
      </div>

      <Card className="shadow-lg border-t-4 border-t-videira-blue">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-videira-blue/15 ring-2 ring-videira-blue/30">
              <Settings className="h-5 w-5 text-videira-blue" />
            </div>
            Configurações da Empresa
          </CardTitle>
          <CardDescription>Configure nome, logo e modo de manutenção</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Aplicação</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="supportEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail de Suporte</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <Label>Logo da Aplicação</Label>
                {logoPreview && (
                  <div className="mb-4">
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      width={80}
                      height={80}
                      className="h-20 object-contain"
                    />
                  </div>
                )}
                <div className="flex items-center justify-center w-full">
                  <Label
                    htmlFor="logo-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/50"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isUploading ? (
                        <Loader2 className="w-8 h-8 mb-4 text-muted-foreground animate-spin" />
                      ) : (
                        <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                      )}
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Clique para enviar</span> ou arraste e solte
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG ou SVG (max. 5MB, recomendado: 200x80px)
                      </p>
                    </div>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      className="hidden"
                      onChange={handleLogoUpload}
                      disabled={isUploading}
                    />
                  </Label>
                </div>
              </div>
              <FormField
                control={form.control}
                name="maintenanceMode"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-medium">Modo de Manutenção</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Quando ativado, apenas administradores podem acessar o sistema
                      </div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardContent>
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
            </CardContent>
          </form>
        </Form>
      </Card>
    </div>
  )
}
