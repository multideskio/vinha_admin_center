'use client'

import * as React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
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
import { Loader2, Mail, ChevronLeft, Save, Send, CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

const smtpSettingsSchema = z.object({
  host: z.string().min(1, 'Servidor SMTP é obrigatório.'),
  port: z.coerce.number().min(1, 'Porta é obrigatória.'),
  user: z.string().min(1, 'Usuário SMTP é obrigatório.'),
  password: z.string().min(1, 'Senha SMTP é obrigatória.'),
  from: z.string().email('E-mail de envio inválido.').optional().nullable(),
})

type SmtpSettingsValues = z.infer<typeof smtpSettingsSchema>

export default function SmtpSettingsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isTesting, setIsTesting] = React.useState(false)
  const [testEmail, setTestEmail] = React.useState('')

  const form = useForm<SmtpSettingsValues>({
    resolver: zodResolver(smtpSettingsSchema),
    defaultValues: {
      host: '',
      port: 587,
      user: '',
      password: '',
      from: '',
    },
  })

  React.useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/v1/settings/smtp')
        if (!response.ok) throw new Error('Falha ao carregar configurações SMTP.')
        const data = await response.json()
        if (data.config) {
          form.reset({
            host: data.config.host || '',
            port: data.config.port || 587,
            user: data.config.user || '',
            password: data.config.password || '',
            from: data.config.from || '',
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

  const onSubmit = async (data: SmtpSettingsValues) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/v1/settings/smtp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Falha ao salvar configurações SMTP.')
      toast({
        title: 'Sucesso!',
        description: 'Configurações de SMTP salvas com sucesso.',
        variant: 'success',
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: 'Atenção',
        description: 'Por favor, insira um e-mail de destino.',
        variant: 'destructive',
      })
      return
    }
    setIsTesting(true)
    try {
      const currentConfig = form.getValues()
      const response = await fetch('/api/v1/settings/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, config: currentConfig }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Falha ao enviar e-mail de teste.')
      toast({
        title: 'Sucesso!',
        description: 'E-mail de teste enviado com sucesso!',
        variant: 'success',
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro no Teste', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsTesting(false)
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
          </div>
          <Separator />
          <div>
            <Skeleton className="h-7 w-1/4 mb-2" />
            <Skeleton className="h-10 w-full mb-4" />
            <div className="flex justify-end">
              <Skeleton className="h-10 w-32" />
            </div>
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
              <Mail className="h-8 w-8" />
              Configuração SMTP / SES
            </h1>
            <p className="text-base text-white/90 mt-2 font-medium">
              Configure o serviço para envio de e-mails transacionais
            </p>
          </div>
        </div>
      </div>

      {/* Card Informativo sobre SES */}
      <Card className="shadow-lg border-l-4 border-l-videira-purple bg-gradient-to-br from-videira-purple/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-videira-purple">
            <div className="p-2 rounded-lg bg-videira-purple/15 ring-2 ring-videira-purple/30">
              <CheckCircle className="h-5 w-5 text-videira-purple" />
            </div>
            Sistema de E-mail Configurado
          </CardTitle>
          <CardDescription>Usando Amazon SES para envios transacionais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-videira-cyan mt-2 ring-2 ring-videira-cyan/30" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Notificações de boas-vindas</span> - Enviadas automaticamente para novos usuários
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-videira-blue mt-2 ring-2 ring-videira-blue/30" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Confirmações de pagamento</span> - Recibos enviados após aprovação
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-videira-purple mt-2 ring-2 ring-videira-purple/30" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Mensagens do sistema</span> - Via componente SendMessageDialog
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-videira-cyan mt-2 ring-2 ring-videira-cyan/30" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Recuperação de senha</span> - Links de reset enviados por email
            </p>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Card de Configuração */}
          <Card className="shadow-lg border-t-4 border-t-videira-blue">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-videira-blue/15 ring-2 ring-videira-blue/30">
                  <Mail className="h-5 w-5 text-videira-blue" />
                </div>
                Credenciais SMTP / Amazon SES
              </CardTitle>
              <CardDescription>
                Configure Amazon SES, SendGrid ou outro provedor SMTP
              </CardDescription>
            </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="host"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Servidor SMTP</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="email-smtp.us-east-1.amazonaws.com"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Porta</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="587" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="user"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuário SMTP</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu usuário SMTP" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha SMTP</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Sua senha SMTP"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="from"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail de Envio (From)</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="remetente@autorizado.com"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-4">
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

        {/* Card de Teste */}
        <Card className="shadow-lg border-t-4 border-t-videira-cyan">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-videira-cyan/15 ring-2 ring-videira-cyan/30">
                <Send className="h-5 w-5 text-videira-cyan" />
              </div>
              Testar Configuração
            </CardTitle>
            <CardDescription>
              Envie um e-mail de teste para validar as configurações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-videira-blue/10 border-videira-blue/30">
              <AlertTriangle className="h-4 w-4 text-videira-blue" />
              <AlertDescription className="text-videira-blue">
                <strong>Amazon SES:</strong> Certifique-se de que o e-mail de destino está verificado no SES se estiver em modo Sandbox.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label className="font-semibold">E-mail de Destino</Label>
              <Input
                type="email"
                placeholder="Ex: teste@vinha.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="border-2"
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleSendTestEmail}
                disabled={isTesting}
                className="bg-white dark:bg-background border-2 border-videira-cyan text-videira-cyan hover:bg-videira-cyan hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar E-mail de Teste
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
