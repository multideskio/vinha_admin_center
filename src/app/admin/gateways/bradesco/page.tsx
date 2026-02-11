'use client'

import * as React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Upload,
  Loader2,
  CreditCard,
  ChevronLeft,
  Save,
  Copy,
  Check,
  ShieldCheck,
  Download,
  KeyRound,
  Wifi,
} from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'

const bradescoGatewaySchema = z.object({
  isActive: z.boolean().default(false),
  environment: z.enum(['production', 'development', 'sandbox']),
  prodClientId: z.string().optional().nullable(),
  prodClientSecret: z.string().optional().nullable(),
  devClientId: z.string().optional().nullable(),
  devClientSecret: z.string().optional().nullable(),
  certificatePassword: z.string().optional().nullable(),
  pixKey: z.string().optional().nullable(),
})

type BradescoGatewayValues = z.infer<typeof bradescoGatewaySchema>

export default function BradescoGatewayPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isTesting, setIsTesting] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [certificateFile, setCertificateFile] = React.useState<string | null>(null)
  const [certificateBase64, setCertificateBase64] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [certDialogOpen, setCertDialogOpen] = React.useState(false)
  const [isGeneratingCert, setIsGeneratingCert] = React.useState(false)
  const [certCommonName, setCertCommonName] = React.useState('')
  const [certCnpj, setCertCnpj] = React.useState('')
  const [certOrganization, setCertOrganization] = React.useState('')
  const [certPassword, setCertPassword] = React.useState('')
  const [certValidityDays, setCertValidityDays] = React.useState(365)

  interface CertInfo {
    subject: string
    organization: string
    cnpj: string
    serialNumber: string
    validFrom: string
    validTo: string
    algorithm: string
    type: string
  }

  interface GeneratedCertResult {
    certInfo: CertInfo
    pfxBase64: string
    certPem: string
    keyPem: string
  }

  const [generatedCertResult, setGeneratedCertResult] = React.useState<GeneratedCertResult | null>(
    null,
  )

  const webhookUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/api/v1/webhooks/bradesco` : ''

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    toast({ title: 'Copiado!', description: 'URL do webhook copiada.' })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleGenerateCert = async () => {
    if (!certCommonName || !certCnpj || !certOrganization || !certPassword) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    const cnpjClean = certCnpj.replace(/\D/g, '')
    if (cnpjClean.length !== 14) {
      toast({
        title: 'Erro',
        description: 'CNPJ deve ter 14 dígitos.',
        variant: 'destructive',
      })
      return
    }

    if (certPassword.length < 4) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter no mínimo 4 caracteres.',
        variant: 'destructive',
      })
      return
    }

    setIsGeneratingCert(true)
    setGeneratedCertResult(null)
    try {
      const response = await fetch('/api/v1/gateways/bradesco/generate-cert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commonName: certCommonName,
          cnpj: certCnpj,
          organization: certOrganization,
          password: certPassword,
          validityDays: certValidityDays,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Falha ao gerar certificado.')
      }

      const result = await response.json()

      // Aplicar o certificado gerado diretamente nos campos do formulário
      setCertificateBase64(result.pfxBase64)
      const filePrefix = certCommonName.replace(/\s+/g, '-').toLowerCase()
      setCertificateFile(`${filePrefix}.pfx`)
      form.setValue('certificatePassword', certPassword)
      setGeneratedCertResult({
        certInfo: result.certInfo,
        pfxBase64: result.pfxBase64,
        certPem: result.certPem,
        keyPem: result.keyPem,
      })

      toast({
        title: 'Certificado gerado!',
        description: 'Baixe os arquivos e faça upload do .pem no portal Bradesco.',
        variant: 'success',
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsGeneratingCert(false)
    }
  }

  const downloadFile = (
    content: string,
    filename: string,
    mimeType: string,
    isBase64Binary = false,
  ) => {
    let blob: Blob
    if (isBase64Binary) {
      const binaryString = atob(content)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      blob = new Blob([bytes], { type: mimeType })
    } else {
      blob = new Blob([content], { type: mimeType })
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const form = useForm<BradescoGatewayValues>({
    resolver: zodResolver(bradescoGatewaySchema),
    defaultValues: {
      isActive: false,
      environment: 'development',
      prodClientId: '',
      prodClientSecret: '',
      devClientId: '',
      devClientSecret: '',
      certificatePassword: '',
      pixKey: '',
    },
  })

  const handleCertificateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validação de tipo
    const allowedTypes = ['application/x-pkcs12', 'application/x-pem-file', '.pfx', '.pem']
    const fileExtension = file.name.toLowerCase().split('.').pop()
    if (!allowedTypes.includes(file.type) && !['pfx', 'pem'].includes(fileExtension || '')) {
      toast({
        title: 'Erro',
        description: 'Apenas arquivos .pfx ou .pem são permitidos.',
        variant: 'destructive',
      })
      return
    }

    // Validação de tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'O certificado deve ter no máximo 5MB.',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)
    try {
      // Converter arquivo para base64 para salvar diretamente no banco
      const arrayBuffer = await file.arrayBuffer()
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''),
      )
      setCertificateBase64(base64)
      setCertificateFile(file.name)
      toast({
        title: 'Sucesso!',
        description: 'Certificado carregado com sucesso.',
        variant: 'success',
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsUploading(false)
    }
  }

  const fetchConfig = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/gateways/bradesco')
      if (!response.ok) throw new Error('Falha ao carregar configurações.')
      const data = await response.json()
      form.reset({
        ...data.config,
        prodClientId: data.config.prodClientId ?? '',
        prodClientSecret: data.config.prodClientSecret ?? '',
        devClientId: data.config.devClientId ?? '',
        devClientSecret: data.config.devClientSecret ?? '',
        certificatePassword: data.config.certificatePassword ?? '',
        pixKey: data.config.pixKey ?? '',
      })
      // Se já existe certificado salvo, indicar no estado
      if (data.config.hasCertificate) {
        setCertificateFile('Certificado já cadastrado')
        // Não recebemos o base64 do backend por segurança — manter null
        // O certificateBase64 só será preenchido quando o usuário fizer novo upload
        setCertificateBase64('existing')
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [form, toast])

  React.useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const handleTestConnection = async () => {
    setIsTesting(true)
    try {
      const response = await fetch('/api/v1/gateways/bradesco/test-connection', {
        method: 'POST',
      })
      const data = await response.json()

      if (data.success) {
        const tokenInfo = data.details.tokenPreview ? ` Token: ${data.details.tokenPreview}` : ''
        toast({
          title: 'Conexão OK!',
          description: `Token obtido em ${data.details.responseTimeMs}ms (${data.details.environment}). Expira em ${data.details.expiresIn}s.${tokenInfo}`,
          variant: 'success',
        })
      } else {
        toast({
          title: 'Falha na conexão',
          description: data.error || data.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsTesting(false)
    }
  }

  const onSubmit = async (data: BradescoGatewayValues) => {
    setIsSaving(true)
    try {
      // Validação adicional para ambiente de produção
      if (data.environment === 'production' && data.isActive) {
        if (!data.prodClientId || !data.prodClientSecret) {
          toast({
            title: 'Erro',
            description: 'Credenciais de produção são obrigatórias para ativar em produção.',
            variant: 'destructive',
          })
          setIsSaving(false)
          return
        }
      }

      // Validação adicional para ambiente de desenvolvimento ou sandbox
      if ((data.environment === 'development' || data.environment === 'sandbox') && data.isActive) {
        if (!data.devClientId || !data.devClientSecret) {
          toast({
            title: 'Erro',
            description:
              'Credenciais de desenvolvimento são obrigatórias para ativar em desenvolvimento/sandbox.',
            variant: 'destructive',
          })
          setIsSaving(false)
          return
        }
      }

      // Validação do certificado digital ao ativar
      if (data.isActive) {
        if (!certificateBase64) {
          toast({
            title: 'Erro',
            description:
              'O certificado digital (.pfx ou .pem) é obrigatório para ativar o gateway.',
            variant: 'destructive',
          })
          setIsSaving(false)
          return
        }
        if (!data.certificatePassword) {
          toast({
            title: 'Erro',
            description: 'A senha do certificado é obrigatória para ativar o gateway.',
            variant: 'destructive',
          })
          setIsSaving(false)
          return
        }
        if (!data.pixKey) {
          toast({
            title: 'Erro',
            description: 'A chave PIX do recebedor é obrigatória para ativar o gateway.',
            variant: 'destructive',
          })
          setIsSaving(false)
          return
        }
      }

      const response = await fetch('/api/v1/gateways/bradesco', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          // Só enviar certificado se for um novo upload (não o marcador 'existing')
          certificate:
            certificateBase64 && certificateBase64 !== 'existing' ? certificateBase64 : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Falha ao salvar configurações.')
      }

      toast({
        title: 'Sucesso!',
        description: 'Configurações do Bradesco salvas com sucesso.',
        variant: 'success',
      })

      // Recarregar configurações para sincronizar
      await fetchConfig()
    } catch (error: unknown) {
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
              Gateway Bradesco
            </h1>
            <p className="text-base text-white/90 mt-2 font-medium">
              Configure credenciais e certificados
            </p>
          </div>
        </div>
      </div>

      <Card className="shadow-lg border-t-4 border-t-videira-blue">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-videira-blue/15 ring-2 ring-videira-blue/30">
              <CreditCard className="h-5 w-5 text-videira-blue" />
            </div>
            Configuração Bradesco
          </CardTitle>
          <CardDescription>
            Configure as credenciais da API e certificados de segurança
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
                        Ative ou desative o processamento de pagamentos pelo Bradesco.
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
                        <SelectItem value="development">Desenvolvimento (Homologação)</SelectItem>
                        <SelectItem value="sandbox">Sandbox</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Selecione o ambiente para as credenciais.</FormDescription>
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
                      <FormLabel>Client ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Seu Client ID de produção"
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
                      <FormLabel>Client Secret</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Seu Client Secret de produção"
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
                      <FormLabel>Client ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Seu Client ID de desenvolvimento"
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
                      <FormLabel>Client Secret</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Seu Client Secret de desenvolvimento"
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
                <h3 className="text-lg font-medium">Certificado Digital</h3>

                {/* Gerador de Certificado Auto-Assinado */}
                <div className="rounded-lg border border-dashed border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                      <KeyRound className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                        Certificado Auto-Assinado (Dev/Homologação)
                      </h4>
                      <p className="text-xs text-amber-700/80 dark:text-amber-400/70 mt-1">
                        Para ambientes de desenvolvimento e homologação, o Bradesco aceita
                        certificados auto-assinados. Gere um aqui ou faça upload de um existente.
                        Para produção, use um certificado ICP-Brasil tipo A1.
                      </p>
                      <Dialog open={certDialogOpen} onOpenChange={setCertDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-3 border-amber-500/50 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40"
                          >
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Gerar Certificado Auto-Assinado
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <ShieldCheck className="h-5 w-5 text-amber-600" />
                              {generatedCertResult
                                ? 'Certificado Gerado'
                                : 'Gerar Certificado Auto-Assinado'}
                            </DialogTitle>
                            {!generatedCertResult && (
                              <DialogDescription>
                                Preencha os dados para gerar o certificado para o ambiente
                                sandbox/homologação do Bradesco.
                              </DialogDescription>
                            )}
                          </DialogHeader>

                          {/* Etapa 1: Formulário */}
                          {!generatedCertResult && (
                            <div className="space-y-3 py-1">
                              <div className="space-y-1.5">
                                <Label htmlFor="cert-cn">Razão Social</Label>
                                <Input
                                  id="cert-cn"
                                  placeholder="Ex: Minha Empresa LTDA"
                                  value={certCommonName}
                                  onChange={(e) => setCertCommonName(e.target.value)}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label htmlFor="cert-cnpj">CNPJ</Label>
                                <Input
                                  id="cert-cnpj"
                                  placeholder="00.000.000/0000-00"
                                  value={certCnpj}
                                  onChange={(e) => setCertCnpj(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                  CN gerado no formato RAZÃOSOCIAL:CNPJ (exigido pelo Bradesco)
                                </p>
                              </div>
                              <div className="space-y-1.5">
                                <Label htmlFor="cert-org">Organização</Label>
                                <Input
                                  id="cert-org"
                                  placeholder="Ex: Minha Empresa LTDA"
                                  value={certOrganization}
                                  onChange={(e) => setCertOrganization(e.target.value)}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <Label htmlFor="cert-password">Senha (.pfx)</Label>
                                  <Input
                                    id="cert-password"
                                    type="password"
                                    placeholder="Mín. 4 caracteres"
                                    value={certPassword}
                                    onChange={(e) => setCertPassword(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label htmlFor="cert-validity">Validade (dias)</Label>
                                  <Input
                                    id="cert-validity"
                                    type="number"
                                    min={30}
                                    max={1095}
                                    value={certValidityDays}
                                    onChange={(e) => setCertValidityDays(Number(e.target.value))}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Etapa 2: Resultado e Downloads */}
                          {generatedCertResult && (
                            <div className="space-y-4 py-1">
                              <div className="rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 space-y-1.5">
                                <p className="text-sm font-semibold text-green-700 dark:text-green-400 flex items-center gap-1.5">
                                  <Check className="h-4 w-4" /> Certificado gerado com sucesso
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-500">
                                  CN: {generatedCertResult.certInfo.subject}
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-500">
                                  Válido até:{' '}
                                  {new Date(
                                    generatedCertResult.certInfo.validTo,
                                  ).toLocaleDateString('pt-BR')}
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-500">
                                  RSA 2048 / SHA-256 — Aplicado ao formulário automaticamente
                                </p>
                              </div>

                              <div className="space-y-2">
                                <p className="text-sm font-medium">Baixar arquivos:</p>
                                <div className="flex flex-col gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="justify-start border-amber-300 dark:border-amber-700"
                                    onClick={() =>
                                      downloadFile(
                                        generatedCertResult.certPem,
                                        `${certCommonName.replace(/\s+/g, '-').toLowerCase()}.cert.pem`,
                                        'application/x-pem-file',
                                      )
                                    }
                                  >
                                    <Download className="mr-2 h-4 w-4 text-amber-600" />
                                    <span>
                                      .cert.pem{' '}
                                      <span className="text-xs text-muted-foreground ml-1">
                                        — upload no portal Bradesco
                                      </span>
                                    </span>
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="justify-start"
                                    onClick={() =>
                                      downloadFile(
                                        generatedCertResult.pfxBase64,
                                        `${certCommonName.replace(/\s+/g, '-').toLowerCase()}.pfx`,
                                        'application/x-pkcs12',
                                        true,
                                      )
                                    }
                                  >
                                    <Download className="mr-2 h-4 w-4" />
                                    <span>
                                      .pfx{' '}
                                      <span className="text-xs text-muted-foreground ml-1">
                                        — aplicação mTLS (backup)
                                      </span>
                                    </span>
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="justify-start"
                                    onClick={() =>
                                      downloadFile(
                                        generatedCertResult.keyPem,
                                        `${certCommonName.replace(/\s+/g, '-').toLowerCase()}.key.pem`,
                                        'application/x-pem-file',
                                      )
                                    }
                                  >
                                    <Download className="mr-2 h-4 w-4" />
                                    <span>
                                      .key.pem{' '}
                                      <span className="text-xs text-muted-foreground ml-1">
                                        — chave privada (guardar seguro)
                                      </span>
                                    </span>
                                  </Button>
                                </div>
                              </div>

                              <p className="text-xs text-amber-600 dark:text-amber-400">
                                Faça upload do .cert.pem no portal Bradesco Developers (passo 6 —
                                Solicitar Credencial) para gerar client_id e client_secret.
                              </p>
                            </div>
                          )}

                          <DialogFooter>
                            {generatedCertResult ? (
                              <Button
                                type="button"
                                onClick={() => {
                                  setCertDialogOpen(false)
                                  setGeneratedCertResult(null)
                                }}
                              >
                                Concluir
                              </Button>
                            ) : (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setCertDialogOpen(false)}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  type="button"
                                  onClick={handleGenerateCert}
                                  disabled={isGeneratingCert}
                                  className="bg-amber-600 hover:bg-amber-700 text-white"
                                >
                                  {isGeneratingCert ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Gerando...
                                    </>
                                  ) : (
                                    <>
                                      <ShieldCheck className="mr-2 h-4 w-4" />
                                      Gerar Certificado
                                    </>
                                  )}
                                </Button>
                              </>
                            )}
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>

                <FormItem>
                  <FormLabel>Arquivo do Certificado (.pfx, .pem)</FormLabel>
                  <FormControl>
                    <div className="flex items-center justify-center w-full">
                      <Label
                        htmlFor="certificate-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/50"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {isUploading ? (
                            <Loader2 className="w-8 h-8 mb-4 text-muted-foreground animate-spin" />
                          ) : (
                            <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                          )}
                          <p className="mb-2 text-sm text-muted-foreground">
                            {certificateFile ? (
                              <span className="font-semibold text-green-600">
                                {certificateFile}
                              </span>
                            ) : (
                              <>
                                <span className="font-semibold">Clique para enviar</span> ou arraste
                                e solte
                              </>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Certificado (.pfx ou .pem, max. 5MB)
                          </p>
                        </div>
                        <Input
                          id="certificate-upload"
                          type="file"
                          accept=".pfx,.pem,application/x-pkcs12,application/x-pem-file"
                          className="hidden"
                          onChange={handleCertificateUpload}
                          disabled={isUploading}
                        />
                      </Label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
                <FormField
                  control={form.control}
                  name="certificatePassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha do Certificado</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Senha do arquivo de certificado"
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
                <h3 className="text-lg font-medium">Chave PIX do Recebedor</h3>
                <FormField
                  control={form.control}
                  name="pixKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chave PIX</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="CNPJ, e-mail, telefone ou chave aleatória (EVP)"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Chave PIX cadastrada no Bradesco para receber os pagamentos.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="rounded-lg border p-4 bg-muted/50">
                <h3 className="text-sm font-medium mb-2">URL do Webhook</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Configure esta URL no painel do Bradesco para receber notificações automáticas de
                  pagamento (PIX e Boleto).
                </p>
                <div className="flex gap-2">
                  <Input value={webhookUrl} readOnly className="font-mono text-xs" />
                  <Button type="button" variant="outline" size="icon" onClick={handleCopyWebhook}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isTesting || isSaving}
                  onClick={handleTestConnection}
                  className="font-semibold"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <Wifi className="mr-2 h-4 w-4" />
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
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
