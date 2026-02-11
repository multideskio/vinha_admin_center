'use client'

import * as React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, ChurchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PhoneInput } from '@/components/ui/phone-input'
import { useToast } from '@/hooks/use-toast'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

// Schema de validação
const churchSchema = z.object({
  supervisorId: z.string().min(1, 'O supervisor é obrigatório.'),
  cnpj: z.string().min(18, 'O CNPJ deve ter 14 dígitos.'),
  razaoSocial: z.string().min(1, 'A razão social é obrigatória.'),
  nomeFantasia: z.string().min(1, 'O nome fantasia é obrigatório.'),
  email: z.string().email({ message: 'E-mail inválido.' }),
  cep: z.string().min(9, { message: 'O CEP deve ter 8 dígitos.' }),
  state: z.string().length(2, { message: 'UF deve ter 2 letras.' }),
  city: z.string().min(1, { message: 'A cidade é obrigatória.' }),
  neighborhood: z.string().min(1, { message: 'O bairro é obrigatório.' }),
  address: z.string().min(1, { message: 'O endereço é obrigatório.' }),
  foundationDate: z.date({
    required_error: 'A data de fundação é obrigatória.',
  }),
  titheDay: z.coerce.number().min(1).max(31),
  phone: z.string().min(1, { message: 'O celular é obrigatório.' }),
  treasurerFirstName: z.string().min(1, 'O nome do tesoureiro é obrigatório.'),
  treasurerLastName: z.string().min(1, 'O sobrenome do tesoureiro é obrigatório.'),
  treasurerCpf: z.string().min(14, 'O CPF do tesoureiro deve ter 11 dígitos.'),
})

type ChurchFormData = z.infer<typeof churchSchema>

export type Supervisor = {
  id: string
  firstName: string
  lastName: string
}

interface ChurchFormModalProps {
  onSave: () => void
  supervisors: Supervisor[]
  children: React.ReactNode
}

export function ChurchFormModal({ onSave, supervisors, children }: ChurchFormModalProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isFetchingCep, setIsFetchingCep] = React.useState(false)
  const { toast } = useToast()

  const form = useForm<ChurchFormData>({
    resolver: zodResolver(churchSchema),
    defaultValues: {
      supervisorId: '',
      cnpj: '',
      razaoSocial: '',
      nomeFantasia: '',
      email: '',
      cep: '',
      state: '',
      city: '',
      neighborhood: '',
      address: '',
      foundationDate: new Date(),
      titheDay: 1,
      phone: '',
      treasurerFirstName: '',
      treasurerLastName: '',
      treasurerCpf: '',
    },
  })

  // Resetar formulário ao abrir
  React.useEffect(() => {
    if (isOpen) {
      form.reset()
    }
  }, [isOpen, form])

  // Função de formatação de CNPJ
  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .slice(0, 14)
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }

  // Função de formatação de CPF
  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  // Função de formatação de CEP
  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .slice(0, 8)
      .replace(/(\d{5})(\d)/, '$1-$2')
  }

  // Buscar dados do CEP via ViaCEP
  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '')
    if (cep.length !== 8) return

    setIsFetchingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()
      if (!data.erro) {
        form.setValue('address', data.logradouro)
        form.setValue('neighborhood', data.bairro)
        form.setValue('city', data.localidade)
        form.setValue('state', data.uf)
      } else {
        toast({ title: 'Erro', description: 'CEP não encontrado.', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao buscar CEP.', variant: 'destructive' })
    } finally {
      setIsFetchingCep(false)
    }
  }

  // Buscar dados do CNPJ via BrasilAPI
  const handleCnpjBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cnpj = e.target.value.replace(/\D/g, '')
    if (cnpj.length !== 14) return

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`)
      if (response.ok) {
        const data = await response.json()
        form.setValue('razaoSocial', data.razao_social || '')
        form.setValue('nomeFantasia', data.nome_fantasia || data.razao_social || '')
        form.setValue('email', data.email || '')
        form.setValue('phone', data.ddd_telefone_1 || '')

        // Preencher endereço
        if (data.cep) {
          const cepFormatted = formatCEP(data.cep)
          form.setValue('cep', cepFormatted)
          form.setValue('address', `${data.logradouro}, ${data.numero}`)
          form.setValue('neighborhood', data.bairro)
          form.setValue('city', data.municipio)
          form.setValue('state', data.uf)
        }

        toast({
          title: 'Sucesso!',
          description: 'Dados do CNPJ carregados automaticamente.',
          variant: 'success',
        })
      }
    } catch (error) {
      // Silenciosamente falhar - CNPJ pode não estar na base
    }
  }

  // Submeter formulário
  const handleSave = async (data: ChurchFormData) => {
    try {
      const response = await fetch('/api/v1/igrejas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Falha ao cadastrar igreja.')
      }

      toast({
        title: 'Sucesso!',
        description: 'Igreja cadastrada com sucesso.',
        variant: 'success',
      })
      onSave()
      setIsOpen(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <ChurchIcon className="h-5 w-5 text-videira-blue" />
            Cadastro de Igreja
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da nova igreja. A senha padrão será 123456.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 p-4">
            <Alert className="bg-videira-blue/10 border-videira-blue/30">
              <AlertTriangle className="h-4 w-4 text-videira-blue" />
              <AlertDescription className="text-videira-blue">
                A senha padrão é <strong>123456</strong> até o usuário cadastrar uma nova senha.
              </AlertDescription>
            </Alert>

            {/* Supervisor */}
            <FormField
              control={form.control}
              name="supervisorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supervisor *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um supervisor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {supervisors.map((supervisor) => (
                        <SelectItem key={supervisor.id} value={supervisor.id}>
                          {supervisor.firstName} {supervisor.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CNPJ e Razão Social */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="00.000.000/0000-00"
                        {...field}
                        onChange={(e) => field.onChange(formatCNPJ(e.target.value))}
                        onBlur={(e) => {
                          field.onBlur()
                          handleCnpjBlur(e)
                        }}
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
                    <FormLabel>Razão Social *</FormLabel>
                    <FormControl>
                      <Input placeholder="Razão social da igreja" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Nome Fantasia e Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nomeFantasia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Fantasia *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da igreja" {...field} />
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
                    <FormLabel>E-mail *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="exemplo@igreja.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* CEP e Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="00000-000"
                        {...field}
                        onChange={(e) => field.onChange(formatCEP(e.target.value))}
                        onBlur={(e) => {
                          field.onBlur()
                          handleCepBlur(e)
                        }}
                        disabled={isFetchingCep}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <FormControl>
                      <Input placeholder="UF" {...field} disabled={isFetchingCep} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Cidade e Bairro */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da cidade" {...field} disabled={isFetchingCep} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do bairro" {...field} disabled={isFetchingCep} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Endereço */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Rua, número, complemento"
                      {...field}
                      disabled={isFetchingCep}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Data de Fundação, Dia do Dízimo e Telefone */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="foundationDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Fundação *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
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
                name="titheDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia do Dízimo *</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="31" placeholder="1 a 31" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone *</FormLabel>
                    <FormControl>
                      <PhoneInput value={field.value} onChange={field.onChange} type="mobile" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dados do Tesoureiro */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold mb-4">Dados do Tesoureiro</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="treasurerFirstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Primeiro nome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="treasurerLastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sobrenome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Sobrenome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="treasurerCpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF *</FormLabel>
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
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isFetchingCep || form.formState.isSubmitting}
                className="bg-videira-blue hover:bg-videira-blue/90 text-white"
              >
                {form.formState.isSubmitting ? 'Cadastrando...' : 'Cadastrar Igreja'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
