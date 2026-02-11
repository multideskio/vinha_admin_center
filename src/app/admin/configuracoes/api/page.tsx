'use client'

import * as React from 'react'
import { PlusCircle, MoreHorizontal, Copy, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertTitle } from '@/components/ui/alert'

type ApiKey = {
  id: string
  name: string
  key: string
  status: 'active' | 'inactive'
  lastUsedAt: string | null
  createdAt: string
}

const newKeySchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
})

const NewKeyModal = ({ onKeyCreated }: { onKeyCreated: () => void }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [newKey, setNewKey] = React.useState<string | null>(null)
  const [isCreating, setIsCreating] = React.useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof newKeySchema>>({
    resolver: zodResolver(newKeySchema),
    defaultValues: { name: '' },
  })

  const handleCreateKey = async (values: z.infer<typeof newKeySchema>) => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/v1/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Falha ao criar chave.')

      setNewKey(result.key)
      onKeyCreated()
      form.reset()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setNewKey(null)
  }

  const copyToClipboard = () => {
    if (!newKey) return
    navigator.clipboard.writeText(newKey)
    toast({ title: 'Sucesso', description: 'Chave copiada para a área de transferência.' })
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
        setIsOpen(open)
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Criar nova chave
        </Button>
      </DialogTrigger>
      <DialogContent>
        {!newKey ? (
          <>
            <DialogHeader>
              <DialogTitle>Criar Nova Chave de API</DialogTitle>
              <DialogDescription>
                Dê um nome para sua nova chave para identificá-la.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateKey)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Chave</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Integração Contábil" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Chave
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Chave de API Criada com Sucesso!</DialogTitle>
              <DialogDescription>
                Copie sua chave de API. Você não poderá vê-la novamente.
              </DialogDescription>
            </DialogHeader>
            <Alert variant="destructive">
              <KeyRound className="h-4 w-4" />
              <AlertTitle>Guarde esta chave em um lugar seguro!</AlertTitle>
            </Alert>
            <div className="relative rounded-md bg-muted font-mono text-sm p-4 break-all">
              {newKey}
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={copyToClipboard}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Concluído</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function ApiKeysPage() {
  const [keys, setKeys] = React.useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const { toast } = useToast()

  const [openaiKeyMasked, setOpenaiKeyMasked] = React.useState('')
  const [openaiInput, setOpenaiInput] = React.useState('')
  const [showOpenai, setShowOpenai] = React.useState(false)
  const [savingOpenai, setSavingOpenai] = React.useState(false)

  const fetchOpenAI = React.useCallback(async () => {
    try {
      const res = await fetch('/api/v1/settings/openai')
      if (!res.ok) return
      const data = await res.json()
      setOpenaiKeyMasked(data.openaiApiKey || '')
    } catch (error) {
      console.error('Error fetching OpenAI settings:', error)
    }
  }, [])

  const saveOpenAI = React.useCallback(async () => {
    setSavingOpenai(true)
    try {
      const res = await fetch('/api/v1/settings/openai', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openaiApiKey: openaiInput }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Falha ao salvar chave OpenAI.')
      toast({ title: 'Sucesso', description: 'Chave OpenAI salva.', variant: 'success' })
      setOpenaiInput('')
      fetchOpenAI()
    } catch (e: unknown) {
      toast({
        title: 'Erro',
        description: e instanceof Error ? e.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setSavingOpenai(false)
    }
  }, [openaiInput, toast, fetchOpenAI])

  const fetchKeys = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/api-keys')
      if (response.status === 401) {
        setKeys([])
        return
      }
      if (!response.ok) throw new Error('Falha ao carregar chaves de API.')
      const data = await response.json()
      setKeys(data.keys)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      // Silencioso para não poluir a UI quando endpoint estiver desabilitado/restrito
      console.warn('API Keys fetch:', errorMessage)
      setKeys([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchKeys()
    fetchOpenAI()
  }, [fetchKeys, fetchOpenAI])

  const handleToggleStatus = async (id: string, currentStatus: 'active' | 'inactive') => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      const response = await fetch(`/api/v1/api-keys/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) throw new Error('Falha ao atualizar status da chave.')
      toast({ title: 'Sucesso', description: 'Status da chave atualizado.' })
      fetchKeys()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/api-keys/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Falha ao excluir a chave.')
      toast({
        title: 'Sucesso!',
        description: 'Chave de API excluída com sucesso.',
        variant: 'success',
      })
      fetchKeys()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>Chaves de API</CardTitle>
          <CardDescription>
            Gerencie chaves de API para integrações e acesso seguro.
          </CardDescription>
        </div>
        <NewKeyModal onKeyCreated={fetchKeys} />
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">OpenAI API Key</p>
              <p className="text-sm text-muted-foreground">Configure a chave para agentes/IA.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  type={showOpenai ? 'text' : 'password'}
                  placeholder={openaiKeyMasked || 'sk-...'}
                  value={openaiInput}
                  onChange={(e) => setOpenaiInput(e.target.value)}
                  className="w-64"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 -translate-y-1/2 right-1"
                  onClick={() => setShowOpenai((s) => !s)}
                >
                  {showOpenai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button onClick={saveOpenAI} disabled={savingOpenai || !openaiInput.trim()}>
                {savingOpenai ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salvar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Chave (Prefixo)</TableHead>
                <TableHead>Último Uso</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8" />
                      </TableCell>
                    </TableRow>
                  ))
                : keys.map((apiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell className="font-medium">{apiKey.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
                          <span>{apiKey.key}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {apiKey.lastUsedAt
                          ? formatDistanceToNow(new Date(apiKey.lastUsedAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })
                          : 'Nunca'}
                      </TableCell>
                      <TableCell>{format(new Date(apiKey.createdAt), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={apiKey.status === 'active' ? 'success' : 'secondary'}>
                          {apiKey.status === 'active' ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Alternar menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(apiKey.id, apiKey.status)}
                            >
                              {apiKey.status === 'active' ? 'Desativar' : 'Ativar'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  Excluir Chave
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. A exclusão permanente desta
                                    chave de API pode quebrar as integrações existentes.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(apiKey.id)}>
                                    Sim, excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
