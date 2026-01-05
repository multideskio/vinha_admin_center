'use client'

import * as React from 'react'
import {
  Eye,
  EyeOff,
  Loader2,
  Trash2,
  CheckCircle2,
  Shield,
  Bot,
  Info,
  ChevronLeft,
  Save,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardTitle, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

export default function OpenAISettingsPage() {
  const { toast } = useToast()
  const [masked, setMasked] = React.useState('')
  const [hasKey, setHasKey] = React.useState(false)
  const [updatedAt, setUpdatedAt] = React.useState<string | null>(null)
  const [value, setValue] = React.useState('')
  const [show, setShow] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const load = React.useCallback(async () => {
    try {
      const res = await fetch('/api/v1/settings/openai')
      if (!res.ok) return
      const data = await res.json()
      setMasked(data.openaiApiKey || '')
      setHasKey(!!data.hasKey)
      setUpdatedAt(data.updatedAt ? new Date(data.updatedAt).toLocaleString('pt-BR') : null)
    } catch (error) {
      console.error('Error loading OpenAI settings:', error)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const save = React.useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/v1/settings/openai', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openaiApiKey: value }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Falha ao salvar')
      toast({ title: 'Sucesso', description: 'Chave OpenAI salva.', variant: 'success' })
      setValue('')
      load()
    } catch (e: unknown) {
      toast({
        title: 'Erro',
        description: e instanceof Error ? e.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }, [value, toast, load])

  const clear = React.useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/v1/settings/openai', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openaiApiKey: '' }),
      })
      if (!res.ok) throw new Error('Falha ao limpar')
      toast({ title: 'Removida', description: 'Chave OpenAI removida.', variant: 'success' })
      load()
    } catch (e: unknown) {
      toast({
        title: 'Erro',
        description: e instanceof Error ? e.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }, [toast, load])

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
                <Sparkles className="h-8 w-8" />
                Configuração OpenAI
              </h1>
              <p className="text-base text-white/90 mt-2 font-medium">
                Configure a chave da API para recursos de IA
              </p>
            </div>
            {hasKey && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 border-2 border-green-400">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <span className="text-sm font-semibold text-white">Chave Ativa</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda: Form simples */}
        <Card className="shadow-lg border-t-4 border-t-videira-blue">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-videira-blue/15 ring-2 ring-videira-blue/30">
                <Bot className="h-5 w-5 text-videira-blue" />
              </div>
              Chave da API OpenAI
            </CardTitle>
            <CardDescription>Configure sua API key para habilitar recursos de IA</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {updatedAt ? `Última atualização: ${updatedAt}` : 'Nenhuma chave configurada'}
              </p>
            </div>

            <Alert className="bg-videira-purple/10 border-videira-purple/30">
              <Info className="h-4 w-4 text-videira-purple" />
              <AlertDescription className="text-videira-purple text-sm">
                <strong>Formato:</strong> A chave deve começar com{' '}
                <code className="bg-white px-1 rounded text-xs">sk-</code> ou{' '}
                <code className="bg-white px-1 rounded text-xs">sk-proj-</code>
              </AlertDescription>
            </Alert>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type={show ? 'text' : 'password'}
                  placeholder={masked || 'sk-proj-...'}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full pr-10 border-2"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 -translate-y-1/2 right-1"
                  onClick={() => setShow((s) => !s)}
                  type="button"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={save}
                disabled={saving || !value.trim()}
                className="flex-1 bg-videira-blue hover:bg-videira-blue/90 text-white font-semibold shadow-lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Chave
                  </>
                )}
              </Button>
              {hasKey && (
                <Button
                  onClick={clear}
                  disabled={saving}
                  className="bg-white dark:bg-background border-2 border-destructive text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Coluna Direita: Informações úteis */}
        <Card className="shadow-lg border-t-4 border-t-videira-purple">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-videira-purple/15 ring-2 ring-videira-purple/30">
                <Sparkles className="h-5 w-5 text-videira-purple" />
              </div>
              Recursos de IA
            </CardTitle>
            <CardDescription>Como a OpenAI é utilizada no sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <div className="flex items-center gap-2 font-semibold text-foreground mb-2">
                <div className="p-1.5 rounded-lg bg-videira-cyan/15 ring-1 ring-videira-cyan/30">
                  <Bot className="h-4 w-4 text-videira-cyan" />
                </div>
                Como será usada?
              </div>
              <ul className="ml-7 space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-videira-cyan mt-1.5" />
                  <span>Gerar sugestões de templates de mensagens automáticas</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-videira-blue mt-1.5" />
                  <span>Criar insights do dashboard com análise de dados</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-videira-purple mt-1.5" />
                  <span>Auxiliar em relatórios e recomendações (futuro)</span>
                </li>
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 font-semibold text-foreground mb-2">
                <div className="p-1.5 rounded-lg bg-green-500/15 ring-1 ring-green-500/30">
                  <Shield className="h-4 w-4 text-green-600" />
                </div>
                Segurança
              </div>
              <ul className="ml-7 space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-videira-cyan mt-1.5" />
                  <span>Chave armazenada por empresa e exibida mascarada</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-videira-blue mt-1.5" />
                  <span>Remoção disponível a qualquer momento</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-videira-purple mt-1.5" />
                  <span>Uso restrito ao backend do sistema</span>
                </li>
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 font-semibold text-foreground mb-2">
                <div className="p-1.5 rounded-lg bg-amber-500/15 ring-1 ring-amber-500/30">
                  <Info className="h-4 w-4 text-amber-600" />
                </div>
                Observações
              </div>
              <ul className="ml-7 space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-videira-cyan mt-1.5" />
                  <span>Necessário autenticação como admin para alterar</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-videira-blue mt-1.5" />
                  <span>
                    Modelo usado: <code className="bg-muted px-1 rounded">gpt-4o-mini</code>
                  </span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
