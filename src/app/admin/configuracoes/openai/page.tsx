'use client'

import * as React from 'react'
import { Eye, EyeOff, Loader2, Trash2, CheckCircle2, Shield, Bot, Info } from 'lucide-react'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

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
      const res = await fetch('/api/v1/settings/openai', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ openaiApiKey: value }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Falha ao salvar')
      toast({ title: 'Sucesso', description: 'Chave OpenAI salva.', variant: 'success' })
      setValue('')
      load()
    } catch (e: unknown) {
      toast({ title: 'Erro', description: e instanceof Error ? e.message : 'Erro desconhecido', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }, [value, toast, load])

  const clear = React.useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/v1/settings/openai', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ openaiApiKey: '' }) })
      if (!res.ok) throw new Error('Falha ao limpar')
      toast({ title: 'Removida', description: 'Chave OpenAI removida.', variant: 'success' })
      load()
    } catch (e: unknown) {
      toast({ title: 'Erro', description: e instanceof Error ? e.message : 'Erro desconhecido', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }, [toast, load])

  return (
    <div className="grid gap-6">
      <div>
        <CardTitle>OpenAI</CardTitle>
        <CardDescription>Configure a chave para agentes/IA auxiliarem no painel.</CardDescription>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda: Form simples */}
        <Card>
          <CardContent className="pt-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">OpenAI API Key</p>
                <p className="text-sm text-muted-foreground">Apenas uma credencial é necessária.</p>
                <p className="text-xs text-muted-foreground mt-1">Atualizada: {updatedAt || '—'}</p>
              </div>
              {hasKey && (
                <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
                  <CheckCircle2 className="h-4 w-4" /> Chave ativa
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type={show ? 'text' : 'password'}
                  placeholder={masked || 'sk-...'}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full pr-9"
                />
                <Button variant="ghost" size="icon" className="absolute top-1/2 -translate-y-1/2 right-1" onClick={() => setShow((s) => !s)}>
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button onClick={save} disabled={saving || !value.trim()}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salvar
              </Button>
              {hasKey && (
                <Button variant="outline" onClick={clear} disabled={saving}>
                  <Trash2 className="h-4 w-4 mr-2" /> Remover
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Coluna Direita: Informações úteis */}
        <Card>
          <CardContent className="pt-6 space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 font-medium text-foreground"><Bot className="h-4 w-4" /> Como será usada?</div>
            <ul className="list-disc ml-5 space-y-1">
              <li>Assistir usuários no painel com respostas contextuais.</li>
              <li>Gerar/resumir mensagens e templates (quando habilitado).</li>
              <li>Auxiliar em relatórios e insights (futuro opcional).</li>
            </ul>
            <div className="flex items-center gap-2 font-medium text-foreground mt-4"><Shield className="h-4 w-4" /> Segurança</div>
            <ul className="list-disc ml-5 space-y-1">
              <li>A chave é armazenada por empresa e exibida mascarada.</li>
              <li>Você pode removê-la a qualquer momento.</li>
              <li>O uso fica restrito ao backend do sistema.</li>
            </ul>
            <div className="flex items-center gap-2 font-medium text-foreground mt-4"><Info className="h-4 w-4" /> Observações</div>
            <ul className="list-disc ml-5 space-y-1">
              <li>Necessário estar autenticado como admin para alterar.</li>
              <li>Após salvar, recarregue features que dependem da chave.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
