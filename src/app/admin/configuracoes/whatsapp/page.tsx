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
import Image from 'next/image'
import {
  Loader2,
  Smartphone,
  CheckCircle,
  XCircle,
  QrCode,
  RefreshCw,
  LogOut,
  RotateCcw,
  ChevronLeft,
  Save,
  Send,
  AlertTriangle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

const whatsappSettingsSchema = z.object({
  apiUrl: z.string().url('URL da API inválida.'),
  apiKey: z.string().min(1, 'API Key é obrigatória.'),
  apiInstance: z.string().min(1, 'Nome da instância é obrigatório.'),
})

type WhatsappSettingsValues = z.infer<typeof whatsappSettingsSchema>

export default function WhatsappSettingsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isTesting, setIsTesting] = React.useState(false)
  const [testPhone, setTestPhone] = React.useState('')
  const [testMessage, setTestMessage] = React.useState(
    'Olá! Esta é uma mensagem de teste do sistema Vinha.',
  )
  const [connectionStatus, setConnectionStatus] = React.useState<
    'disconnected' | 'connecting' | 'connected'
  >('disconnected')
  const [qrCode, setQrCode] = React.useState<string | null>(null)
  const [instanceInfo, setInstanceInfo] = React.useState<Record<string, unknown> | null>(null)
  const [isConnecting, setIsConnecting] = React.useState(false)
  const [qrCodeExpired, setQrCodeExpired] = React.useState(false)
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)
  const [isRestarting, setIsRestarting] = React.useState(false)

  const form = useForm<WhatsappSettingsValues>({
    resolver: zodResolver(whatsappSettingsSchema),
    defaultValues: {
      apiUrl: '',
      apiKey: '',
      apiInstance: '',
    },
  })

  React.useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/v1/settings/whatsapp')
        if (!response.ok) throw new Error('Falha ao carregar configurações do WhatsApp.')
        const data = await response.json()
        if (data.config) {
          form.reset({
            apiUrl: data.config.apiUrl || '',
            apiKey: data.config.apiKey || '',
            apiInstance: data.config.apiInstance || '',
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

  const onSubmit = async (data: WhatsappSettingsValues) => {
    setIsSaving(true)
    try {
      // Verificar/criar instância no Evolution API
      const instanceResponse = await fetch('/api/v1/whatsapp/instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceName: data.apiInstance,
          serverUrl: data.apiUrl,
          apiKey: data.apiKey,
        }),
      })

      const instanceResult = await instanceResponse.json()

      if (!instanceResponse.ok) {
        throw new Error(instanceResult.error || 'Erro ao configurar instância')
      }

      // Salvar configurações localmente
      const response = await fetch('/api/v1/settings/whatsapp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Falha ao salvar configurações do WhatsApp.')

      if (instanceResult.created) {
        toast({
          title: 'Instância criada!',
          description: 'Nova instância WhatsApp criada com sucesso.',
          variant: 'success',
        })
      } else {
        // Instância já existe - verificar estado de conexão
        const connectionStateResponse = await fetch('/api/v1/whatsapp/connectionState', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiUrl: data.apiUrl,
            apiKey: data.apiKey,
            instanceName: data.apiInstance,
          }),
        })

        if (connectionStateResponse.ok) {
          const connectionData = await connectionStateResponse.json()
          const isConnected = connectionData.instance?.state === 'open'

          if (isConnected) {
            toast({
              title: 'Configurações salvas!',
              description: 'Instância já existe e está conectada.',
              variant: 'success',
            })
          } else {
            toast({
              title: 'Instância encontrada!',
              description:
                'A instância já existe mas não está conectada. Clique em "Conectar WhatsApp" para conectar.',
              variant: 'default',
            })
          }
        } else {
          toast({
            title: 'Configurações salvas!',
            description: 'Instância já existe e configurações foram atualizadas.',
            variant: 'success',
          })
        }
      }

      // Verificar status da instância após salvar
      await checkInstanceStatus()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const checkInstanceStatus = async () => {
    try {
      const config = form.getValues()
      if (!config.apiUrl || !config.apiKey || !config.apiInstance) return

      console.log('Verificando status da instância:', config.apiInstance)

      const response = await fetch('/api/v1/whatsapp/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl: config.apiUrl,
          apiKey: config.apiKey,
          instanceName: config.apiInstance,
        }),
      })

      if (!response.ok) {
        // Silently handle - instance not configured yet
        if (!isConnecting) {
          setConnectionStatus('disconnected')
          setInstanceInfo(null)
        }
        return
      }

      const data = await response.json()
      console.log('Status response:', data)

      if (data.connected && data.status === 'open') {
        console.log('Instância conectada! Atualizando estado...')
        setConnectionStatus('connected')
        setInstanceInfo(data.instance)
        setQrCode(null)
        setIsConnecting(false)
        setQrCodeExpired(false)

        // Buscar informações detalhadas do perfil
        await fetchInstanceInfo()
      } else if (!isConnecting) {
        console.log('Instância não conectada:', data.status)
        setConnectionStatus('disconnected')
        setInstanceInfo(null)
        if (!qrCode) {
          setQrCodeExpired(false)
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error)
      if (!isConnecting) {
        setConnectionStatus('disconnected')
        setInstanceInfo(null)
      }
    }
  }

  const fetchInstanceInfo = async () => {
    try {
      const config = form.getValues()
      const response = await fetch('/api/v1/whatsapp/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl: config.apiUrl,
          apiKey: config.apiKey,
          instanceName: config.apiInstance,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.connected) {
          setInstanceInfo(data.instance)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar informações da instância:', error)
    }
  }

  const connectInstance = async (): Promise<void> => {
    setIsConnecting(true)
    setConnectionStatus('connecting')
    setQrCode(null)
    setQrCodeExpired(false)

    try {
      const config = form.getValues()
      const response = await fetch('/api/v1/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl: config.apiUrl,
          apiKey: config.apiKey,
          instanceName: config.apiInstance,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao conectar instância')
      }

      const data = await response.json()

      if (data.success) {
        if (data.connected) {
          // Já está conectado
          setConnectionStatus('connected')
          setInstanceInfo(data.instance)
          setQrCode(null)
          setIsConnecting(false)
          toast({
            title: 'Sucesso!',
            description: 'WhatsApp já está conectado.',
            variant: 'success',
          })
          return
        } else if (data.qrCode) {
          // QR Code recebido
          setQrCode(data.qrCode)
          toast({
            title: 'QR Code gerado!',
            description: 'Escaneie o QR Code com seu WhatsApp.',
            variant: 'success',
          })

          // Polling para verificar conexão
          const interval = setInterval(async () => {
            const config = form.getValues()
            try {
              const statusResponse = await fetch('/api/v1/whatsapp/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  apiUrl: config.apiUrl,
                  apiKey: config.apiKey,
                  instanceName: config.apiInstance,
                }),
              })

              if (statusResponse.ok) {
                const statusData = await statusResponse.json()
                console.log('Status polling response:', statusData)

                if (statusData.connected && statusData.status === 'open') {
                  clearInterval(interval)
                  setConnectionStatus('connected')
                  setInstanceInfo(statusData.instance)
                  setQrCode(null)
                  setIsConnecting(false)
                  setQrCodeExpired(false)

                  // Buscar informações detalhadas do perfil
                  try {
                    await fetchInstanceInfo()
                  } catch (error) {
                    console.error('Erro ao buscar info da instância:', error)
                  }

                  toast({
                    title: 'Conectado!',
                    description: 'WhatsApp conectado com sucesso.',
                    variant: 'success',
                  })
                }
              }
            } catch (error) {
              console.error('Erro no polling:', error)
            }
          }, 3000)

          // Limpar interval após 2 minutos
          setTimeout(() => {
            clearInterval(interval)

            // Verificar o status atual antes de expirar
            setIsConnecting(false)
            setQrCodeExpired(true)
            toast({
              title: 'QR Code expirado',
              description:
                'O QR Code expirou. Clique em "Gerar Novo QR Code" para tentar novamente.',
              variant: 'destructive',
            })
          }, 120000)

          // Note: Cleanup will be handled by component unmount or when connection succeeds
        } else {
          throw new Error('QR Code não foi gerado')
        }
      } else {
        throw new Error(data.message || 'Erro ao conectar instância')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      })
      setConnectionStatus('disconnected')
      setQrCode(null)
      setIsConnecting(false)
      setQrCodeExpired(false)
    }
  }

  React.useEffect(() => {
    if (!isLoading) {
      checkInstanceStatus().catch(console.error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading])

  const handleSendTestMessage = async () => {
    if (!testPhone || !testMessage) {
      toast({
        title: 'Atenção',
        description: 'Por favor, preencha o número e a mensagem.',
        variant: 'destructive',
      })
      return
    }
    setIsTesting(true)
    try {
      const currentConfig = form.getValues()
      const response = await fetch('/api/v1/settings/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone, message: testMessage, config: currentConfig }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Falha ao enviar mensagem de teste.')
      toast({ title: 'Sucesso!', description: 'Mensagem de teste enviada!', variant: 'success' })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro no Teste', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsTesting(false)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const config = form.getValues()
      if (!config.apiUrl || !config.apiKey || !config.apiInstance) {
        toast({
          title: 'Erro',
          description: 'Configurações não encontradas. Configure primeiro.',
          variant: 'destructive',
        })
        return
      }

      const response = await fetch('/api/v1/whatsapp/logout', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl: config.apiUrl,
          apiKey: config.apiKey,
          instanceName: config.apiInstance,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Falha ao fazer logout.')
      }

      toast({
        title: 'Logout realizado!',
        description: 'WhatsApp desconectado com sucesso.',
        variant: 'success',
      })

      // Atualizar status após logout
      setConnectionStatus('disconnected')
      setInstanceInfo(null)
      setQrCode(null)
      setIsConnecting(false)
      setQrCodeExpired(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: 'Erro no Logout',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleRestart = async () => {
    setIsRestarting(true)
    try {
      const config = form.getValues()
      if (!config.apiUrl || !config.apiKey || !config.apiInstance) {
        toast({
          title: 'Erro',
          description: 'Configurações não encontradas. Configure primeiro.',
          variant: 'destructive',
        })
        return
      }

      const response = await fetch('/api/v1/whatsapp/restart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl: config.apiUrl,
          apiKey: config.apiKey,
          instanceName: config.apiInstance,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Falha ao reiniciar.')
      }

      toast({
        title: 'Instância reiniciada!',
        description: 'WhatsApp foi reiniciado com sucesso.',
        variant: 'success',
      })

      // Aguardar um pouco e verificar status
      setTimeout(() => {
        checkInstanceStatus()
      }, 2000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: 'Erro no Restart',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsRestarting(false)
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
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Separator />
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-3">
                <Smartphone className="h-8 w-8" />
                Configuração WhatsApp
              </h1>
              <p className="text-base text-white/90 mt-2 font-medium">
                Integração com Evolution API para envio de mensagens
              </p>
            </div>
            {connectionStatus === 'connected' && (
              <Badge className="bg-green-500 text-white border-green-400 px-6 py-2 text-sm font-bold shadow-xl">
                <CheckCircle className="h-4 w-4 mr-2" />
                WhatsApp Conectado
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Configurações - 70% */}
        <div className="lg:col-span-7 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card className="shadow-lg border-t-4 border-t-videira-blue">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-videira-blue/15 ring-2 ring-videira-blue/30">
                      <Smartphone className="h-5 w-5 text-videira-blue" />
                    </div>
                    Credenciais Evolution API
                  </CardTitle>
                  <CardDescription>
                    Configure a URL, API Key e nome da instância do WhatsApp
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="apiUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL da API</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://api.seuservico.com"
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
                      name="apiInstance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Instância</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="ex: sua_instancia"
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
                      name="apiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Key</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Sua chave de API secreta"
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
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>

          {/* Card de Teste */}
          <Card className="shadow-lg border-t-4 border-t-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-500/15 ring-2 ring-green-500/30">
                  <Send className="h-5 w-5 text-green-600" />
                </div>
                Testar Envio de Mensagem
              </CardTitle>
              <CardDescription>
                Envie uma mensagem de teste para validar a configuração
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="font-semibold">Número de Telefone (com DDI)</Label>
                <Input
                  placeholder="Ex: 5562981154120"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="border-2"
                />
                <p className="text-xs text-muted-foreground">
                  Formato: DDI + DDD + Número (sem espaços ou caracteres especiais)
                </p>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Mensagem</Label>
                <Textarea
                  placeholder="Digite sua mensagem de teste..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  rows={4}
                  className="border-2"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleSendTestMessage}
                  disabled={isTesting || connectionStatus !== 'connected'}
                  className="bg-white dark:bg-background border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Mensagem de Teste
                    </>
                  )}
                </Button>
              </div>
              {connectionStatus !== 'connected' && (
                <Alert className="bg-amber-500/10 border-amber-500/30">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-600">
                    <strong>WhatsApp desconectado.</strong> Conecte primeiro para testar o envio.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status WhatsApp - 30% */}
        <div className="lg:col-span-3">
          <div className="sticky top-4">
            {/* Mockup de Celular com estilo Videira */}
            <div className="mx-auto max-w-sm">
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2.5rem] p-2 shadow-2xl ring-4 ring-videira-cyan/20">
                {/* Tela do celular */}
                <div className="bg-white rounded-[2rem] overflow-hidden h-[600px] flex flex-col">
                  {/* Header do WhatsApp */}
                  <div className="bg-green-600 text-white p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      <span className="font-medium">WhatsApp Business</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={checkInstanceStatus}
                      disabled={isConnecting}
                      className="text-white hover:bg-green-700 h-8 w-8 p-0"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 p-4 bg-gray-50 flex flex-col justify-center items-center space-y-4">
                    {/* Status Badge */}
                    <div className="text-center">
                      {connectionStatus === 'connected' && (
                        <Badge variant="success" className="flex items-center gap-1 justify-center">
                          <CheckCircle className="h-3 w-3" />
                          Conectado
                        </Badge>
                      )}
                      {connectionStatus === 'connecting' && (
                        <Badge variant="warning" className="flex items-center gap-1 justify-center">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Conectando...
                        </Badge>
                      )}
                      {connectionStatus === 'disconnected' && (
                        <Badge
                          variant="destructive"
                          className="flex items-center gap-1 justify-center"
                        >
                          <XCircle className="h-3 w-3" />
                          Desconectado
                        </Badge>
                      )}
                    </div>

                    {/* Perfil Conectado */}
                    {connectionStatus === 'connected' && instanceInfo && (
                      <div className="text-center space-y-4">
                        <Avatar className="h-20 w-20 mx-auto border-4 border-green-500">
                          <AvatarImage src={String(instanceInfo.profilePictureUrl || '')} />
                          <AvatarFallback className="bg-green-100">
                            <Smartphone className="h-10 w-10 text-green-600" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-800 text-lg">
                            {String(instanceInfo.profileName || 'WhatsApp Business')}
                          </p>
                          <p className="text-sm text-gray-600">
                            {String(instanceInfo.number || 'Número não disponível')}
                          </p>
                          {Boolean(instanceInfo.description) && (
                            <p className="text-xs text-gray-500 px-2">
                              {String(instanceInfo.description)}
                            </p>
                          )}
                          <div className="flex items-center justify-center gap-1 text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium">Online</span>
                          </div>
                          {Boolean(instanceInfo.businessProfile) && (
                            <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                              <p className="text-xs text-blue-600 font-medium">Perfil Business</p>
                            </div>
                          )}
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex gap-2 justify-center pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRestart}
                            disabled={isRestarting || isLoggingOut}
                            className="flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            {isRestarting ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3 w-3" />
                            )}
                            {isRestarting ? 'Reiniciando...' : 'Restart'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleLogout}
                            disabled={isLoggingOut || isRestarting}
                            className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                          >
                            {isLoggingOut ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <LogOut className="h-3 w-3" />
                            )}
                            {isLoggingOut ? 'Desconectando...' : 'Logout'}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* QR Code */}
                    {qrCode && (connectionStatus === 'connecting' || qrCodeExpired) && (
                      <div className="text-center space-y-4">
                        <div className="space-y-2">
                          <QrCode className="h-8 w-8 mx-auto text-gray-600" />
                          <p className="text-sm text-gray-600 font-medium">
                            {qrCodeExpired ? 'QR Code Expirado' : 'Escaneie o QR Code'}
                          </p>
                        </div>
                        <div
                          className={`bg-white p-3 rounded-xl shadow-inner ${qrCodeExpired ? 'opacity-50' : ''}`}
                        >
                          <Image
                            src={qrCode}
                            alt="QR Code WhatsApp"
                            width={256}
                            height={256}
                            className="w-40 h-40 mx-auto rounded-lg"
                          />
                          {qrCodeExpired && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                              <div className="text-white text-center">
                                <XCircle className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-sm font-medium">Expirado</p>
                              </div>
                            </div>
                          )}
                        </div>
                        {!qrCodeExpired ? (
                          <div className="text-xs text-gray-500 px-4 leading-relaxed">
                            <p>1. Abra o WhatsApp no seu celular</p>
                            <p>2. Toque em Menu → Aparelhos conectados</p>
                            <p>3. Toque em &quot;Conectar um aparelho&quot;</p>
                            <p>4. Aponte para esta tela</p>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            onClick={() => {
                              setQrCodeExpired(false)
                              connectInstance()
                            }}
                            disabled={isConnecting}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full flex items-center gap-2 mx-auto"
                          >
                            {isConnecting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                            {isConnecting ? 'Gerando...' : 'Gerar Novo QR Code'}
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Botão Conectar */}
                    {connectionStatus === 'disconnected' && (
                      <div className="text-center space-y-4">
                        <div className="space-y-2">
                          <Smartphone className="h-16 w-16 mx-auto text-gray-400" />
                          <p className="text-gray-600 font-medium">WhatsApp Desconectado</p>
                          <p className="text-xs text-gray-500 px-4">
                            Conecte seu WhatsApp para começar a enviar mensagens
                          </p>
                        </div>
                        <Button
                          type="button"
                          onClick={connectInstance}
                          disabled={isConnecting}
                          className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-full flex items-center gap-2 mx-auto"
                        >
                          {isConnecting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <QrCode className="h-4 w-4" />
                          )}
                          {isConnecting ? 'Conectando...' : 'Conectar WhatsApp'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
