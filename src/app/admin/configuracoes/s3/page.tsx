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
import { Alert, AlertDescription } from '@/components/ui/alert'
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
import { Loader2, Cloud, ChevronLeft, Save, CheckCircle, AlertTriangle } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

const s3SettingsSchema = z.object({
  endpoint: z.string().min(1, 'Endpoint é obrigatório.'),
  bucket: z.string().min(1, 'Nome do bucket é obrigatório.'),
  region: z.string().min(1, 'Região é obrigatória.'),
  accessKeyId: z.string().min(1, 'Access Key ID é obrigatório.'),
  secretAccessKey: z.string().min(1, 'Secret Access Key é obrigatório.'),
  forcePathStyle: z.boolean().default(false),
  cloudfrontUrl: z.string().optional(),
})

type S3SettingsValues = z.infer<typeof s3SettingsSchema>

export default function S3SettingsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isTesting, setIsTesting] = React.useState(false)

  const form = useForm<S3SettingsValues>({
    resolver: zodResolver(s3SettingsSchema),
    defaultValues: {
      endpoint: '',
      bucket: '',
      region: '',
      accessKeyId: '',
      secretAccessKey: '',
      forcePathStyle: false,
      cloudfrontUrl: '',
    },
  })

  React.useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/v1/settings/s3')
        if (!response.ok) throw new Error('Falha ao carregar configurações S3.')
        const data = await response.json()
        if (data.config) {
          form.reset({
            endpoint: data.config.endpoint || '',
            bucket: data.config.bucket || '',
            region: data.config.region || '',
            accessKeyId: data.config.accessKeyId || '',
            secretAccessKey: data.config.secretAccessKey || '',
            forcePathStyle: data.config.forcePathStyle || false,
            cloudfrontUrl: data.config.cloudfrontUrl || '',
          })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }
    fetchConfig()
  }, [form, toast])

  const handleTestConnection = async () => {
    setIsTesting(true)
    try {
      const currentConfig = form.getValues()
      const response = await fetch('/api/v1/settings/s3/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentConfig),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Falha ao testar conexão S3.')
      toast({
        title: 'Sucesso!',
        description: 'Conexão com o S3 estabelecida com sucesso.',
        variant: 'success',
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro na Conexão', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsTesting(false)
    }
  }

  const onSubmit = async (data: S3SettingsValues) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/v1/settings/s3', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Falha ao salvar configurações S3.')
      toast({
        title: 'Sucesso!',
        description: 'Configurações de S3 salvas com sucesso.',
        variant: 'success',
      })
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
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full md:col-span-2" />
          </div>
          <Skeleton className="h-6 w-1/3" />
          <div className="flex justify-end">
            <Skeleton className="h-10 w-32" />
          </div>
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
              <Cloud className="h-8 w-8" />
              Armazenamento S3
            </h1>
            <p className="text-base text-white/90 mt-2 font-medium">
              Configure o provedor de armazenamento de objetos
            </p>
          </div>
        </div>
      </div>

      {/* Card Informativo sobre S3 */}
      <Card className="shadow-lg border-l-4 border-l-videira-purple bg-gradient-to-br from-videira-purple/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-videira-purple">
            <div className="p-2 rounded-lg bg-videira-purple/15 ring-2 ring-videira-purple/30">
              <CheckCircle className="h-5 w-5 text-videira-purple" />
            </div>
            Sistema de Upload Configurado
          </CardTitle>
          <CardDescription>Usando S3 para armazenamento de arquivos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-videira-cyan mt-2 ring-2 ring-videira-cyan/30" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Avatares de usuários</span> - Fotos de
              perfil de pastores, supervisores, gerentes
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-videira-blue mt-2 ring-2 ring-videira-blue/30" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Logos da empresa</span> - Logotipo da
              organização
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-videira-purple mt-2 ring-2 ring-videira-purple/30" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Arquivos gerais</span> - Uploads via
              API /api/v1/upload
            </p>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-lg border-t-4 border-t-videira-blue">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-videira-blue/15 ring-2 ring-videira-blue/30">
                  <Cloud className="h-5 w-5 text-videira-blue" />
                </div>
                Credenciais S3 / S3-Compatible
              </CardTitle>
              <CardDescription>
                Configure AWS S3, MinIO, DigitalOcean Spaces ou outro provedor S3-compatible
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="endpoint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endpoint</FormLabel>
                      <FormControl>
                        <Input placeholder="s3.amazonaws.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bucket"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Bucket</FormLabel>
                      <FormControl>
                        <Input placeholder="seu-bucket-aqui" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Região</FormLabel>
                      <FormControl>
                        <Input placeholder="us-east-1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accessKeyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Key ID</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Sua chave de acesso" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="secretAccessKey"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Secret Access Key</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Sua chave de acesso secreta"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cloudfrontUrl"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>CloudFront URL (Opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://d1v03qm1k6ud1f.cloudfront.net"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="forcePathStyle"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 pt-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <Label htmlFor="force-path-style">
                      Forçar estilo de caminho (Use para MinIO)
                    </Label>
                  </FormItem>
                )}
              />
              <Separator />
              <Alert className="bg-videira-blue/10 border-videira-blue/30">
                <AlertTriangle className="h-4 w-4 text-videira-blue" />
                <AlertDescription className="text-videira-blue">
                  <strong>AWS S3:</strong> Use{' '}
                  <code className="bg-white px-1 rounded">s3.amazonaws.com</code> como endpoint.
                  Para MinIO ou DigitalOcean, use a URL completa (ex:{' '}
                  <code className="bg-white px-1 rounded">https://minio.seuservidor.com</code>).
                </AlertDescription>
              </Alert>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="bg-white dark:bg-background border-2 border-videira-cyan text-videira-cyan hover:bg-videira-cyan hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Testar Conexão
                    </>
                  )}
                </Button>
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
                      Salvar Configurações
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  )
}
