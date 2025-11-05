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
import { Calendar as CalendarIcon, Building, User, Loader2, ChevronsUpDown, Check } from 'lucide-react'
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

const pastorSchema = z.object({
  firstName: z.string().min(1, 'O nome é obrigatório.'),
  lastName: z.string().min(1, 'O sobrenome é obrigatório.'),
  cpf: z.string().min(14, 'O CPF é obrigatório.'),
  birthDate: z.date({ required_error: 'A data de nascimento é obrigatória.' }),
  email: z.string().email('E-mail inválido.'),
  supervisorId: z.string({ required_error: 'Selecione um supervisor.' }),
})

const churchSchema = z.object({
  nomeFantasia: z.string().min(1, 'O nome fantasia é obrigatório.'),
  razaoSocial: z.string().min(1, 'A razão social é obrigatória.'),
  cnpj: z.string().min(18, 'O CNPJ é obrigatório.'),
  email: z.string().email('E-mail inválido.'),
  supervisorId: z.string({ required_error: 'Selecione um supervisor.' }),
})

type PastorFormValues = z.infer<typeof pastorSchema>
type ChurchFormValues = z.infer<typeof churchSchema>
type Supervisor = { id: string; name: string }

const PastorForm = ({ 
  supervisors, 
  onSearchChange 
}: { 
  supervisors: Supervisor[]
  onSearchChange: (search: string) => void
}) => {
  const [openSupervisor, setOpenSupervisor] = React.useState(false)
  
  const form = useForm<PastorFormValues>({
    resolver: zodResolver(pastorSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      cpf: '',
      email: '',
    },
  })

  const onSubmit = (data: PastorFormValues) => {
    console.log('Pastor Data:', data)
    // Handle pastor registration
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
                          !field.value && 'text-muted-foreground'
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
                                  field.value === supervisor.id ? 'opacity-100' : 'opacity-0'
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
        <Button type="submit" className="w-full" size="lg">
          Próximo
        </Button>
      </form>
    </Form>
  )
}

const ChurchForm = ({ 
  supervisors,
  onSearchChange 
}: { 
  supervisors: Supervisor[]
  onSearchChange: (search: string) => void
}) => {
  const [openSupervisor, setOpenSupervisor] = React.useState(false)
  
  const form = useForm<ChurchFormValues>({
    resolver: zodResolver(churchSchema),
    defaultValues: {
      nomeFantasia: '',
      razaoSocial: '',
      cnpj: '',
      email: '',
    },
  })

  const onSubmit = (data: ChurchFormValues) => {
    console.log('Church Data:', data)
    // Handle church registration
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
                          !field.value && 'text-muted-foreground'
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
                                  field.value === supervisor.id ? 'opacity-100' : 'opacity-0'
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
        <Button type="submit" className="w-full" size="lg">
          Próximo
        </Button>
      </form>
    </Form>
  )
}

export default function NovaContaPage() {
  const [supervisors, setSupervisors] = React.useState<Supervisor[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isSearching, setIsSearching] = React.useState(false)

  // Fetch inicial
  React.useEffect(() => {
    async function fetchSupervisors(): Promise<void> {
      try {
        const response = await fetch('/api/v1/supervisores?minimal=true&limit=50')
        if (!response.ok) throw new Error('Falha ao carregar supervisores')
        const data = await response.json()
        const formattedData = data.supervisors.map(
          (s: { id: string; firstName: string; lastName: string }) => ({
            id: s.id,
            name: `${s.firstName} ${s.lastName}`,
          }),
        )
        setSupervisors(formattedData)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSupervisors()
  }, [])

  // Busca server-side com debounce
  React.useEffect(() => {
    if (!searchQuery) {
      // Se limpar a busca, recarrega os primeiros 50
      async function resetSupervisors(): Promise<void> {
        setIsSearching(true)
        try {
          const response = await fetch('/api/v1/supervisores?minimal=true&limit=50')
          if (!response.ok) throw new Error('Falha ao carregar supervisores')
          const data = await response.json()
          const formattedData = data.supervisors.map(
            (s: { id: string; firstName: string; lastName: string }) => ({
              id: s.id,
              name: `${s.firstName} ${s.lastName}`,
            }),
          )
          setSupervisors(formattedData)
        } catch (error) {
          console.error(error)
        } finally {
          setIsSearching(false)
        }
      }
      resetSupervisors()
      return
    }

    // Debounce de 300ms
    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await fetch(
          `/api/v1/supervisores?minimal=true&search=${encodeURIComponent(searchQuery)}&limit=100`
        )
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
        console.error(error)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

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
              <PastorForm supervisors={supervisors} onSearchChange={setSearchQuery} />
            </TabsContent>
            <TabsContent value="igreja" className="mt-6">
              <ChurchForm supervisors={supervisors} onSearchChange={setSearchQuery} />
            </TabsContent>
          </Tabs>
        )}
        <div className="mt-6 text-center border-t pt-6">
          <p className="text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link href="/auth/login" className="text-videira-blue hover:text-videira-cyan font-semibold transition-colors">
              Faça o login
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
