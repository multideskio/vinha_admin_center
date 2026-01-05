/**
 * @fileoverview Página de criação de nova conta para pastores e igrejas.
 * @version 1.1
 * @date 2024-08-07
 * @author PH
 */

'use client'

import * as React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Calendar as CalendarIcon,
  Building,
  User,
  Loader2,
  ChevronsUpDown,
  Check,
} from 'lucide-react'
import { format, subYears } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

// Validação de CPF
const validateCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, '')

  if (cleaned.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cleaned)) return false // Todos os dígitos iguais

  // Valida primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i)
  }
  let digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== parseInt(cleaned.charAt(9))) return false

  // Valida segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i)
  }
  digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== parseInt(cleaned.charAt(10))) return false

  return true
}

// Validação de CNPJ
const validateCNPJ = (cnpj: string): boolean => {
  const cleaned = cnpj.replace(/\D/g, '')

  if (cleaned.length !== 14) return false
  if (/^(\d)\1{13}$/.test(cleaned)) return false // Todos os dígitos iguais

  // Valida primeiro dígito verificador
  let sum = 0
  let pos = 5
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * pos
    pos = pos === 2 ? 9 : pos - 1
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (digit !== parseInt(cleaned.charAt(12))) return false

  // Valida segundo dígito verificador
  sum = 0
  pos = 6
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * pos
    pos = pos === 2 ? 9 : pos - 1
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (digit !== parseInt(cleaned.charAt(13))) return false

  return true
}

const pastorSchema = z.object({
  firstName: z.string().min(1, 'O nome é obrigatório.'),
  lastName: z.string().min(1, 'O sobrenome é obrigatório.'),
  cpf: z.string().min(14, 'O CPF é obrigatório.').refine(validateCPF, 'CPF inválido.'),
  birthDate: z.date({ required_error: 'A data de nascimento é obrigatória.' }).refine((date) => {
    const age = new Date().getFullYear() - date.getFullYear()
    const monthDiff = new Date().getMonth() - date.getMonth()
    const dayDiff = new Date().getDate() - date.getDate()
    const adjustedAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age
    return adjustedAge >= 18
  }, 'Você deve ter pelo menos 18 anos.'),
  email: z.string().email('E-mail inválido.'),
  supervisorId: z.string({ required_error: 'Selecione um supervisor.' }),
})

const churchSchema = z.object({
  nomeFantasia: z.string().min(1, 'O nome fantasia é obrigatório.'),
  razaoSocial: z.string().min(1, 'A razão social é obrigatória.'),
  cnpj: z.string().min(18, 'O CNPJ é obrigatório.').refine(validateCNPJ, 'CNPJ inválido.'),
  email: z.string().email('E-mail inválido.'),
  supervisorId: z.string({ required_error: 'Selecione um supervisor.' }),
})

type PastorFormValues = z.infer<typeof pastorSchema>
type ChurchFormValues = z.infer<typeof churchSchema>
type Supervisor = { id: string; name: string }

const PastorForm = ({
  supervisors,
  onSearchChange,
  isSearching,
}: {
  supervisors: Supervisor[]
  onSearchChange: (search: string) => void
  isSearching: boolean
}) => {
  const [openSupervisor, setOpenSupervisor] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<PastorFormValues>({
    resolver: zodResolver(pastorSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      cpf: '',
      email: '',
    },
  })

  const onSubmit = async (data: PastorFormValues) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout para registro

    try {
      const response = await fetch('/api/v1/auth/register/pastor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          birthDate: data.birthDate.toISOString().split('T')[0], // Converte Date para string YYYY-MM-DD
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Falha ao criar conta')
      }

      toast({
        title: 'Sucesso!',
        description: result.message || 'Conta criada. Verifique seu email.',
      })

      // Redirecionar para login após 2 segundos
      setTimeout(() => router.push('/auth/login'), 2000)
    } catch (error) {
      clearTimeout(timeoutId)

      if ((error as Error).name === 'AbortError') {
        toast({
          title: 'Erro',
          description: 'Tempo esgotado. Tente novamente.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Erro',
          description: (error as Error).message || 'Erro ao criar conta',
          variant: 'destructive',
        })
      }
    }
  }

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 14)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <CardHeader className="px-0 pb-6">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-videira-blue/15 ring-2 ring-videira-blue/30">
              <User className="h-5 w-5 text-videira-blue" />
            </div>
            Informações do Pastor
          </CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Primeiro nome" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sobrenome</FormLabel>
                <FormControl>
                  <Input placeholder="Sobrenome" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF</FormLabel>
                <FormControl>
                  <Input
                    placeholder="000.000.000-00"
                    {...field}
                    onChange={(e) => field.onChange(formatCPF(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de nascimento</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground',
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, 'dd/MM/yyyy') : <span>dd/mm/aaaa</span>}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > subYears(new Date(), 18) || date < new Date('1900-01-01')
                      }
                      defaultMonth={subYears(new Date(), 18)}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="seu@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="supervisorId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Supervisor</FormLabel>
                <Popover open={openSupervisor} onOpenChange={setOpenSupervisor}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          'w-full justify-between border-2',
                          !field.value && 'text-muted-foreground',
                        )}
                      >
                        {field.value
                          ? supervisors.find((s) => s.id === field.value)?.name
                          : 'Escolha um supervisor...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Buscar supervisor..."
                        onValueChange={onSearchChange}
                      />
                      <CommandList>
                        {isSearching && (
                          <div className="flex items-center justify-center p-3 border-b">
                            <Loader2 className="h-4 w-4 animate-spin text-videira-blue mr-2" />
                            <span className="text-sm text-muted-foreground">Buscando...</span>
                          </div>
                        )}
                        <CommandEmpty>Nenhum supervisor encontrado.</CommandEmpty>
                        <CommandGroup>
                          {supervisors.map((supervisor: Supervisor) => (
                            <CommandItem
                              key={supervisor.id}
                              value={supervisor.id}
                              onSelect={() => {
                                form.setValue('supervisorId', supervisor.id)
                                setOpenSupervisor(false)
                                onSearchChange('')
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  field.value === supervisor.id ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              {supervisor.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando conta...
            </>
          ) : (
            'Criar Conta'
          )}
        </Button>
      </form>
    </Form>
  )
}

const ChurchForm = ({
  supervisors,
  onSearchChange,
  isSearching,
}: {
  supervisors: Supervisor[]
  onSearchChange: (search: string) => void
  isSearching: boolean
}) => {
  const [openSupervisor, setOpenSupervisor] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<ChurchFormValues>({
    resolver: zodResolver(churchSchema),
    defaultValues: {
      nomeFantasia: '',
      razaoSocial: '',
      cnpj: '',
      email: '',
    },
  })

  const onSubmit = async (data: ChurchFormValues) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout para registro

    try {
      const response = await fetch('/api/v1/auth/register/church', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Falha ao criar conta')
      }

      toast({
        title: 'Sucesso!',
        description: result.message || 'Conta criada. Verifique seu email.',
      })

      // Redirecionar para login após 2 segundos
      setTimeout(() => router.push('/auth/login'), 2000)
    } catch (error) {
      clearTimeout(timeoutId)

      if ((error as Error).name === 'AbortError') {
        toast({
          title: 'Erro',
          description: 'Tempo esgotado. Tente novamente.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Erro',
          description: (error as Error).message || 'Erro ao criar conta',
          variant: 'destructive',
        })
      }
    }
  }

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <CardHeader className="px-0 pb-6">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-videira-purple/15 ring-2 ring-videira-purple/30">
              <Building className="h-5 w-5 text-videira-purple" />
            </div>
            Informações da Igreja
          </CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="cnpj"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CNPJ</FormLabel>
                <FormControl>
                  <Input
                    placeholder="00.000.000/0000-00"
                    {...field}
                    onChange={(e) => field.onChange(formatCNPJ(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="razaoSocial"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Razão Social</FormLabel>
                <FormControl>
                  <Input placeholder="Razão social da igreja" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nomeFantasia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Fantasia</FormLabel>
                <FormControl>
                  <Input placeholder="Nome da sua igreja" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail da Igreja</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="contato@suaigreja.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="supervisorId"
            render={({ field }) => (
              <FormItem className="sm:col-span-2 flex flex-col">
                <FormLabel>Supervisor</FormLabel>
                <Popover open={openSupervisor} onOpenChange={setOpenSupervisor}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          'w-full justify-between border-2',
                          !field.value && 'text-muted-foreground',
                        )}
                      >
                        {field.value
                          ? supervisors.find((s) => s.id === field.value)?.name
                          : 'Escolha um supervisor...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Buscar supervisor..."
                        onValueChange={onSearchChange}
                      />
                      <CommandList>
                        {isSearching && (
                          <div className="flex items-center justify-center p-3 border-b">
                            <Loader2 className="h-4 w-4 animate-spin text-videira-purple mr-2" />
                            <span className="text-sm text-muted-foreground">Buscando...</span>
                          </div>
                        )}
                        <CommandEmpty>Nenhum supervisor encontrado.</CommandEmpty>
                        <CommandGroup>
                          {supervisors.map((supervisor: Supervisor) => (
                            <CommandItem
                              key={supervisor.id}
                              value={supervisor.id}
                              onSelect={() => {
                                form.setValue('supervisorId', supervisor.id)
                                setOpenSupervisor(false)
                                onSearchChange('')
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  field.value === supervisor.id ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              {supervisor.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando conta...
            </>
          ) : (
            'Criar Conta'
          )}
        </Button>
      </form>
    </Form>
  )
}

export default function NovaContaPage() {
  const [supervisors, setSupervisors] = React.useState<Supervisor[]>([])
  const [initialSupervisors, setInitialSupervisors] = React.useState<Supervisor[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isSearching, setIsSearching] = React.useState(false)

  // Fetch inicial
  React.useEffect(() => {
    async function fetchSupervisors(): Promise<void> {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

      try {
        const response = await fetch('/api/v1/supervisores?minimal=true&limit=50', {
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        if (!response.ok) throw new Error('Falha ao carregar supervisores')
        const data = await response.json()
        const formattedData = data.supervisors.map(
          (s: { id: string; firstName: string; lastName: string }) => ({
            id: s.id,
            name: `${s.firstName} ${s.lastName}`,
          }),
        )
        setSupervisors(formattedData)
        setInitialSupervisors(formattedData) // Salva cache inicial
      } catch (error) {
        clearTimeout(timeoutId)
        if ((error as Error).name === 'AbortError') {
          console.error('Tempo esgotado ao carregar supervisores')
        } else {
          console.error(error)
        }
      } finally {
        setIsLoading(false)
      }
    }
    fetchSupervisors()
  }, [])

  // Busca server-side com debounce
  React.useEffect(() => {
    if (!searchQuery) {
      // Se limpar a busca, restaura do cache ao invés de recarregar
      setSupervisors(initialSupervisors)
      return
    }

    // Debounce de 300ms
    const timer = setTimeout(async () => {
      setIsSearching(true)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

      try {
        const response = await fetch(
          `/api/v1/supervisores?minimal=true&search=${encodeURIComponent(searchQuery)}&limit=100`,
          { signal: controller.signal },
        )
        clearTimeout(timeoutId)
        if (!response.ok) throw new Error('Falha ao buscar supervisores')
        const data = await response.json()
        const formattedData = data.supervisors.map(
          (s: { id: string; firstName: string; lastName: string }) => ({
            id: s.id,
            name: `${s.firstName} ${s.lastName}`,
          }),
        )
        setSupervisors(formattedData)
      } catch (error) {
        clearTimeout(timeoutId)
        if ((error as Error).name === 'AbortError') {
          console.error('Tempo esgotado ao buscar supervisores')
        } else {
          console.error(error)
        }
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, initialSupervisors])

  return (
    <Card className="w-full max-w-2xl border-t-4 border-t-videira-purple shadow-xl">
      <CardHeader className="text-center space-y-4 pb-6">
        <div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-videira-purple via-videira-blue to-videira-cyan bg-clip-text text-transparent">
            Criar Nova Conta
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Escolha o tipo de cadastro que deseja realizar
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-videira-purple mx-auto" />
              <p className="text-sm text-muted-foreground">Carregando supervisores...</p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="pastor">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 h-auto">
              <TabsTrigger
                value="pastor"
                className="gap-2 data-[state=active]:bg-videira-blue data-[state=active]:text-white font-semibold py-3"
              >
                <User className="h-4 w-4" />
                Cadastro de Pastor
              </TabsTrigger>
              <TabsTrigger
                value="igreja"
                className="gap-2 data-[state=active]:bg-videira-purple data-[state=active]:text-white font-semibold py-3"
              >
                <Building className="h-4 w-4" />
                Cadastro de Igreja
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pastor" className="mt-6">
              <PastorForm
                supervisors={supervisors}
                onSearchChange={setSearchQuery}
                isSearching={isSearching}
              />
            </TabsContent>
            <TabsContent value="igreja" className="mt-6">
              <ChurchForm
                supervisors={supervisors}
                onSearchChange={setSearchQuery}
                isSearching={isSearching}
              />
            </TabsContent>
          </Tabs>
        )}
        <div className="mt-6 text-center border-t pt-6">
          <p className="text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link
              href="/auth/login"
              className="text-videira-blue hover:text-videira-cyan font-semibold transition-colors"
            >
              Faça o login
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
