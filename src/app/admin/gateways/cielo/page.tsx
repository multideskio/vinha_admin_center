'use client'

import * as React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Copy, Check, CreditCard, ChevronLeft, Save } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'

const cieloGatewaySchema = z.object({
  isActive: z.boolean().default(false),
  environment: z.enum(['production', 'development']),
  prodClientId: z.string().optional().nullable(),
  prodClientSecret: z.string().optional().nullable(),
  devClientId: z.string().optional().nullable(),
  devClientSecret: z.string().optional().nullable(),
  acceptedPaymentMethods: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'Você deve selecionar pelo menos um meio de pagamento.',
  }),
})

type CieloGatewayValues = z.infer<typeof cieloGatewaySchema>

const paymentMethods = [
  { id: 'pix', label: 'Pix' },
  { id: 'credit_card', label: 'Cartão de crédito' },
  { id: 'boleto', label: 'Boletos' },
]

export default function CieloGatewayPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const webhookUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/api/v1/webhooks/cielo` : ''

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    toast({ title: 'Copiado!', description: 'URL do webhook copiada.' })
    setTimeout(() => setCopied(false), 2000)
  }

  const form = useForm<CieloGatewayValues>({
    resolver: zodResolver(cieloGatewaySchema),
    defaultValues: {
      isActive: false,
      environment: 'development',
      acceptedPaymentMethods: [],
      prodClientId: '',
      prodClientSecret: '',
      devClientId: '',
      devClientSecret: '',
    },
  })

  const fetchConfig = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/gateways/cielo')
      if (!response.ok) throw new Error('Falha ao carregar configurações.')
      const data = await response.json()
      form.reset({
        ...data.config,
        prodClientId: data.config.prodClientId ?? '',
        prodClientSecret: data.config.prodClientSecret ?? '',
        devClientId: data.config.devClientId ?? '',
        devClientSecret: data.config.devClientSecret ?? '',
        acceptedPaymentMethods: data.config.acceptedPaymentMethods
          ? data.config.acceptedPaymentMethods.split(',')
          : [],
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [form, toast])

  React.useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const onSubmit = async (data: CieloGatewayValues) => {
    setIsSaving(true)
    try {
      const payload = {
        ...data,
        acceptedPaymentMethods: data.acceptedPaymentMethods.join(','),
      }
      const response = await fetch('/api/v1/gateways/cielo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error('Falha ao salvar configurações.')
      toast({
        title: 'Sucesso!',
        description: 'Configurações da Cielo salvas com sucesso.',
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
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-10 w-1/2" />
            <Separator />
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
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
            <Link href="/admin/gateways">
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
              <CreditCard className="h-8 w-8" />
              Gateway Cielo
            </h1>
            <p className="text-base text-white/90 mt-2 font-medium">
              Configure credenciais e opções de pagamento
            </p>
          </div>
        </div>
      </div>

      <Card className="shadow-lg border-t-4 border-t-videira-cyan">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-videira-cyan/15 ring-2 ring-videira-cyan/30">
              <CreditCard className="h-5 w-5 text-videira-cyan" />
            </div>
            Configuração Cielo
          </CardTitle>
          <CardDescription>
            Configure as credenciais da API e métodos de pagamento aceitos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Ativar Gateway</FormLabel>
                      <FormDescription>
                        Ative ou desative o processamento de pagamentos pela Cielo.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="environment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ambiente</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o ambiente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="production">Produção</SelectItem>
                        <SelectItem value="development">Desenvolvimento</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Selecione o ambiente que deseja configurar.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Credenciais de Produção</h3>
                <FormField
                  control={form.control}
                  name="prodClientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MerchantId</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Seu MerchantId de produção"
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
                  name="prodClientSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MerchantKey</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Sua MerchantKey de produção"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Credenciais de Desenvolvimento</h3>
                <FormField
                  control={form.control}
                  name="devClientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MerchantId</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Seu MerchantId de desenvolvimento"
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
                  name="devClientSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MerchantKey</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Sua MerchantKey de desenvolvimento"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="rounded-lg border p-4 bg-muted/50">
                <h3 className="text-sm font-medium mb-2">URL do Webhook</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Configure esta URL no painel da Cielo para receber notificações automáticas de
                  pagamento.
                </p>
                <div className="flex gap-2">
                  <Input value={webhookUrl} readOnly className="font-mono text-xs" />
                  <Button type="button" variant="outline" size="icon" onClick={handleCopyWebhook}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Separator />

              <FormField
                control={form.control}
                name="acceptedPaymentMethods"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Configuração do Checkout</FormLabel>
                      <FormDescription>
                        Selecione os meios de pagamento a serem ativados.
                      </FormDescription>
                    </div>
                    {paymentMethods.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="acceptedPaymentMethods"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value || []
                                    return checked
                                      ? field.onChange([...currentValue, item.id])
                                      : field.onChange(
                                          currentValue?.filter((value) => value !== item.id),
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{item.label}</FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-videira-cyan hover:bg-videira-cyan/90 text-white font-semibold shadow-lg"
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
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
