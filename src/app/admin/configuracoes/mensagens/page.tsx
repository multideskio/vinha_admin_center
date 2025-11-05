'use client'

import * as React from 'react'
import { PlusCircle, Trash2, Pencil, Info, Loader2, Mail, Smartphone, Wand2, MessageSquare, ChevronLeft, Save, Send, Plus } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle, CardHeader } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

const notificationRuleSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'O nome da automação é obrigatório.'),
  eventTrigger: z.enum([
    'user_registered',
    'payment_received',
    'payment_due_reminder',
    'payment_overdue',
  ]),
  daysOffset: z.coerce.number().int(),
  messageTemplate: z.string().min(1, 'O modelo da mensagem é obrigatório.'),
  sendViaEmail: z.boolean().default(true),
  sendViaWhatsapp: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

type NotificationRule = z.infer<typeof notificationRuleSchema> & { createdAt?: string }

const eventTriggerOptions = {
  user_registered: 'Novo Usuário Cadastrado',
  payment_received: 'Pagamento Recebido',
  payment_due_reminder: 'Lembrete de Vencimento',
  payment_overdue: 'Aviso de Atraso',
}

const availableTags = [
  '{nome_usuario}',
  '{valor_transacao}',
  '{data_vencimento}',
  '{link_pagamento}',
  '{nome_igreja}',
]

const NotificationFormModal = ({
  rule,
  onSave,
  children,
}: {
  rule?: NotificationRule
  onSave: () => void
  children: React.ReactNode
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const { toast } = useToast()

  const form = useForm<NotificationRule>({
    resolver: zodResolver(notificationRuleSchema),
    defaultValues: rule
      ? {
          ...rule,
          daysOffset: rule.daysOffset || 0,
        }
      : {
          name: '',
          eventTrigger: 'payment_due_reminder',
          daysOffset: 0,
          messageTemplate: '',
          sendViaEmail: true,
          sendViaWhatsapp: false,
          isActive: true,
        },
  })

  React.useEffect(() => {
    if (isOpen) {
      form.reset(
        rule
          ? {
              ...rule,
              daysOffset: rule.daysOffset || 0,
            }
          : {
              name: '',
              eventTrigger: 'payment_due_reminder',
              daysOffset: 0,
              messageTemplate: '',
              sendViaEmail: true,
              sendViaWhatsapp: false,
              isActive: true,
            },
      )
    }
  }, [isOpen, rule, form])

  const onSubmit = async (data: NotificationRule) => {
    const method = data.id ? 'PUT' : 'POST'
    const url = data.id ? `/api/v1/notification-rules/${data.id}` : '/api/v1/notification-rules'

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error(`Falha ao ${rule ? 'atualizar' : 'criar'} a regra.`)
      toast({
        title: 'Sucesso!',
        description: `Regra ${rule ? 'atualizada' : 'criada'} com sucesso.`,
        variant: 'success',
      })
      onSave()
      setIsOpen(false)
    } catch (error: unknown) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    }
  }

  const suggestWithAI = async () => {
    try {
      const payload = {
        eventTrigger: form.getValues('eventTrigger'),
        daysOffset: Number(form.getValues('daysOffset') || 0),
        variables: ['{nome_usuario}', '{valor_transacao}', '{data_vencimento}', '{link_pagamento}'],
        tone: 'respeitoso e objetivo',
      }
      const res = await fetch('/api/v1/templates/ai-suggest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Falha ao gerar sugestão')
      form.setValue('messageTemplate', data.suggestion || '')
    } catch (e: unknown) {
      toast({ title: 'Erro', description: e instanceof Error ? e.message : 'Erro desconhecido', variant: 'destructive' })
    }
  }

  const eventTrigger = form.watch('eventTrigger')

  const renderDaysOffsetLabel = () => {
    switch (eventTrigger) {
      case 'payment_due_reminder':
        return 'Disparar X dias ANTES do Vencimento'
      case 'payment_overdue':
        return 'Disparar X dias APÓS o Vencimento'
      default:
        return 'Dias de Atraso (0 para imediato)'
    }
  }

  const handleTagClick = (tag: string) => {
    const currentMessage = form.getValues('messageTemplate') || ''
    form.setValue('messageTemplate', currentMessage + tag, { shouldValidate: true })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{rule ? 'Editar Automação' : 'Nova Automação de Mensagem'}</DialogTitle>
          <DialogDescription>
            Crie regras para enviar mensagens automaticamente com base em eventos.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Automação</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Lembrete de 5 dias" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="eventTrigger"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gatilho do Evento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(eventTriggerOptions).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="daysOffset"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{renderDaysOffsetLabel()}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="messageTemplate"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Modelo da Mensagem</FormLabel>
                    <Button type="button" variant="outline" size="sm" onClick={suggestWithAI}>
                      <Wand2 className="h-4 w-4 mr-2" /> Assistente IA
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Olá {nome_usuario}, sua fatura de R${valor_transacao} vence em {data_vencimento}."
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Clique em uma variável para adicioná-la ao texto:
                  </FormDescription>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {availableTags.map((tag) => (
                      <Button
                        key={tag}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-auto px-2 py-0.5 text-xs"
                        onClick={() => handleTagClick(tag)}
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Canais de Envio</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <FormField
                  control={form.control}
                  name="sendViaEmail"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Enviar por E-mail</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sendViaWhatsapp"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Enviar por WhatsApp</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Automação
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default function MessagesSettingsPage() {
  const [rules, setRules] = React.useState<NotificationRule[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const { toast } = useToast()

  const fetchRules = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/notification-rules')
      if (!response.ok) throw new Error('Falha ao buscar as regras de notificação.')
      const data = await response.json()
      setRules(data.rules)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const handleBootstrap = React.useCallback(async () => {
    try {
      const response = await fetch('/api/v1/notification-rules/bootstrap', { method: 'POST' })
      if (!response.ok) throw new Error('Falha ao gerar mensagens automáticas.')
      toast({ title: 'Sucesso!', description: 'Mensagens e regras padrão geradas.', variant: 'success' })
      fetchRules()
    } catch (error: unknown) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    }
  }, [toast, fetchRules])

  React.useEffect(() => {
    fetchRules()
  }, [fetchRules])

  const handleToggleActive = async (rule: NotificationRule) => {
    const newStatus = !rule.isActive
    const originalStatus = rule.isActive

    // Optimistic update
    setRules((currentRules) =>
      currentRules.map((r) => (r.id === rule.id ? { ...r, isActive: newStatus } : r)),
    )

    try {
      const response = await fetch(`/api/v1/notification-rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      })
      if (!response.ok) throw new Error('Falha ao atualizar o status da regra.')
    } catch (error: unknown) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
      // Revert optimistic update
      setRules((currentRules) =>
        currentRules.map((r) => (r.id === rule.id ? { ...r, isActive: originalStatus } : r)),
      )
    }
  }

  const handleDelete = async (id?: string) => {
    if (!id) return

    const originalRules = [...rules]
    setRules((currentRules) => currentRules.filter((r) => r.id !== id))

    try {
      const response = await fetch(`/api/v1/notification-rules/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Falha ao excluir a regra.')
      toast({ title: 'Sucesso!', description: 'Regra excluída com sucesso.', variant: 'success' })
    } catch (error: unknown) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
      setRules(originalRules)
    }
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
                <MessageSquare className="h-8 w-8" />
                Mensagens Automáticas
              </h1>
              <p className="text-base text-white/90 mt-2 font-medium">
                Configure regras para envio automático de notificações
              </p>
              <p className="text-sm text-white/70 mt-1">
                {rules.length} {rules.length === 1 ? 'regra configurada' : 'regras configuradas'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleBootstrap}
                className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/50 font-semibold shadow-lg backdrop-blur-sm"
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Gerar Padrões
              </Button>
              <NotificationFormModal onSave={fetchRules}>
                <Button className="bg-white text-videira-blue hover:bg-white/90 shadow-lg font-semibold">
                  <Plus className="h-5 w-5 mr-2" />
                  Nova Regra
                </Button>
              </NotificationFormModal>
            </div>
          </div>
        </div>
      </div>

      {/* Alerta Informativo */}
      <Alert className="shadow-lg border-l-4 border-l-videira-purple bg-gradient-to-br from-videira-purple/5 to-transparent">
        <Info className="h-4 w-4 text-videira-purple" />
        <AlertDescription className="text-foreground">
          <strong>Dica:</strong> Configure regras para cada evento. Use variáveis como{' '}
          <code className="bg-muted px-1 rounded">{'{nome_usuario}'}</code>,{' '}
          <code className="bg-muted px-1 rounded">{'{valor_transacao}'}</code> e{' '}
          <code className="bg-muted px-1 rounded">{'{data_vencimento}'}</code> nos templates.
        </AlertDescription>
      </Alert>

      <Card className="shadow-lg border-t-4 border-t-videira-blue">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-videira-blue/15 ring-2 ring-videira-blue/30">
              <MessageSquare className="h-5 w-5 text-videira-blue" />
            </div>
            Regras Ativas
          </CardTitle>
          <CardDescription>
            Gerencie as regras de notificação automática por evento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border-2">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-videira-cyan/10 via-videira-blue/10 to-videira-purple/10">
                  <TableHead className="font-semibold">Nome</TableHead>
                  <TableHead className="font-semibold">Gatilho</TableHead>
                  <TableHead className="hidden sm:table-cell font-semibold">Canais</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-48" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-24" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Nenhuma automação de mensagem criada.
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>
                          {
                            eventTriggerOptions[
                              rule.eventTrigger as keyof typeof eventTriggerOptions
                            ]
                          }
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {rule.eventTrigger === 'payment_due_reminder'
                            ? `${Math.abs(rule.daysOffset)} dias antes`
                            : rule.eventTrigger === 'payment_overdue'
                              ? `${rule.daysOffset} dias após`
                              : `Imediato`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        {rule.sendViaEmail && <Mail className="h-4 w-4 text-muted-foreground" />}
                        {rule.sendViaWhatsapp && (
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={rule.isActive ? 'success' : 'secondary'}>
                        {rule.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={() => handleToggleActive(rule)}
                        />
                        <NotificationFormModal rule={rule} onSave={fetchRules}>
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </NotificationFormModal>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
