'use client'

import * as React from 'react'
import { Loader2, Plus, Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'
import type { PaymentMethod } from '@/types/transaction'

type User = {
  id: string
  email: string
  name: string
  role: string
}

type ManualTransactionModalProps = {
  onSuccess: () => void
}

export function ManualTransactionModal({ onSuccess }: ManualTransactionModalProps) {
  const [open, setOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [users, setUsers] = React.useState<User[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const { toast } = useToast()

  // Form state
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null)
  const [amount, setAmount] = React.useState('')
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('pix')
  const [description, setDescription] = React.useState('')
  const [approveImmediately, setApproveImmediately] = React.useState(true)

  const debouncedSearch = useDebounce(searchTerm, 300)

  // Buscar usuários
  React.useEffect(() => {
    if (debouncedSearch.length < 2) {
      setUsers([])
      return
    }

    const searchUsers = async () => {
      setIsSearching(true)
      try {
        const response = await fetch(
          `/api/v1/admin/users/search?q=${encodeURIComponent(debouncedSearch)}`,
        )
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users || [])
        }
      } catch (error) {
        console.error('Erro ao buscar usuários:', error)
      } finally {
        setIsSearching(false)
      }
    }

    searchUsers()
  }, [debouncedSearch])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedUser) {
      toast({
        title: 'Erro',
        description: 'Selecione um contribuinte',
        variant: 'destructive',
      })
      return
    }

    const amountNumber = parseFloat(amount.replace(',', '.'))
    if (isNaN(amountNumber) || amountNumber <= 0) {
      toast({
        title: 'Erro',
        description: 'Informe um valor válido',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/admin/transacoes/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contributorId: selectedUser.id,
          amount: amountNumber,
          paymentMethod,
          description: description || undefined,
          approveImmediately,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar transação')
      }

      toast({
        title: 'Sucesso',
        description: data.message,
        variant: 'success',
      })

      // Reset form
      setSelectedUser(null)
      setAmount('')
      setPaymentMethod('pix')
      setDescription('')
      setApproveImmediately(true)
      setOpen(false)
      onSuccess()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao criar transação',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-videira-purple hover:bg-videira-purple/90 text-white font-semibold gap-2"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nova Transação Manual</span>
          <span className="sm:hidden">Nova</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Transação Manual</DialogTitle>
          <DialogDescription>
            Registre um pagamento feito por transferência, dinheiro ou outro meio fora do sistema.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Seleção de Contribuinte */}
            <div className="grid gap-2">
              <Label htmlFor="contributor">Contribuinte *</Label>
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={searchOpen}
                    className="w-full justify-between"
                  >
                    {selectedUser ? (
                      <span className="truncate">
                        {selectedUser.name} ({selectedUser.email})
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Buscar contribuinte...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Digite nome ou email..."
                      value={searchTerm}
                      onValueChange={setSearchTerm}
                    />
                    <CommandList>
                      {isSearching ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : users.length === 0 ? (
                        <CommandEmpty>
                          {searchTerm.length < 2
                            ? 'Digite pelo menos 2 caracteres'
                            : 'Nenhum usuário encontrado'}
                        </CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {users.map((user) => (
                            <CommandItem
                              key={user.id}
                              value={user.id}
                              onSelect={() => {
                                setSelectedUser(user)
                                setSearchOpen(false)
                                setSearchTerm('')
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  selectedUser?.id === user.id ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{user.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {user.email} • {user.role}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Valor */}
            <div className="grid gap-2">
              <Label htmlFor="amount">Valor (R$) *</Label>
              <Input
                id="amount"
                type="text"
                placeholder="0,00"
                value={amount}
                onChange={(e) => {
                  // Permitir apenas números e vírgula/ponto
                  const value = e.target.value.replace(/[^0-9.,]/g, '')
                  setAmount(value)
                }}
              />
            </div>

            {/* Método de Pagamento */}
            <div className="grid gap-2">
              <Label htmlFor="method">Método de Pagamento</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX / Transferência</SelectItem>
                  <SelectItem value="boleto">Boleto / Dinheiro</SelectItem>
                  <SelectItem value="credit_card">Cartão</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Descrição */}
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Ex: Pagamento via transferência bancária"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Aprovar Imediatamente */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="approve"
                checked={approveImmediately}
                onCheckedChange={(checked) => setApproveImmediately(checked === true)}
              />
              <Label htmlFor="approve" className="text-sm font-normal cursor-pointer">
                Aprovar imediatamente (dar baixa agora)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-videira-purple hover:bg-videira-purple/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Transação'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
