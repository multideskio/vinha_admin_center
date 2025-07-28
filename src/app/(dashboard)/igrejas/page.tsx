
'use client';

import * as React from 'react';
import {
  MoreHorizontal,
  PlusCircle,
  AlertTriangle,
  List,
  Grid3x3,
  FileText,
  Phone,
  Mail,
  MapPin,
  Pencil,
  User,
  Building,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { DateRangePicker } from '@/components/ui/date-range-picker';

const churchSchema = z.object({
  id: z.string().optional(),
  supervisorId: z.string({ required_error: 'Selecione um supervisor.' }),
  cnpj: z.string().min(1, 'O CNPJ/CPF é obrigatório.'),
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
  status: z.enum(['active', 'inactive']),
});

type Church = z.infer<typeof churchSchema>;

const initialChurches: Church[] = [
  {
    id: 'chu-01',
    razaoSocial: 'IGREJA EVANGELICA ASSEMBLEIA DE DEUS',
    nomeFantasia: 'Assembleia de Deus Madureira',
    email: 'contato@admadureira.com',
    phone: '(11) 98888-7777',
    status: 'active',
    cnpj: '55.343.456/0001-21',
    cep: '01002-000',
    state: 'SP',
    city: 'São Paulo',
    neighborhood: 'Sé',
    address: 'Praça da Sé, 100',
    foundationDate: new Date('1950-01-15T00:00:00'),
    titheDay: 10,
    supervisorId: 'sup-01',
    treasurerFirstName: 'José',
    treasurerLastName: 'Contas',
    treasurerCpf: '123.456.789-00',
  },
  {
    id: 'chu-02',
    razaoSocial: 'IGREJA UNIVERSAL DO REINO DE DEUS',
    nomeFantasia: 'IURD',
    email: 'faleconosco@universal.org',
    phone: '(21) 97777-8888',
    status: 'active',
    cnpj: '29.744.757/0001-97',
    cep: '20221-901',
    state: 'RJ',
    city: 'Rio de Janeiro',
    neighborhood: 'Del Castilho',
    address: 'Av. Dom Hélder Câmara, 4242',
    foundationDate: new Date('1977-07-09T00:00:00'),
    titheDay: 5,
    supervisorId: 'sup-02',
    treasurerFirstName: 'Maria',
    treasurerLastName: 'Finanças',
    treasurerCpf: '098.765.432-11',
  },
];

const supervisors = [
  { id: 'sup-01', name: 'Carlos Andrade' },
  { id: 'sup-02', name: 'Ana Beatriz' },
  { id: 'sup-03', name: 'Jabez Henrique' },
];

const ChurchFormModal = ({
  onSave,
  children,
}: {
  onSave: (data: Church) => void;
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isFetchingCep, setIsFetchingCep] = React.useState(false);
  const [isFetchingCnpj, setIsFetchingCnpj] = React.useState(false);

  const form = useForm<Church>({
    resolver: zodResolver(churchSchema),
    defaultValues: {
      razaoSocial: '',
      nomeFantasia: '',
      cnpj: '',
      email: '',
      cep: '',
      state: '',
      city: '',
      neighborhood: '',
      address: '',
      titheDay: 1,
      phone: '',
      treasurerFirstName: '',
      treasurerLastName: '',
      treasurerCpf: '',
      status: 'active',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  const handleSave = (data: Church) => {
    onSave(data);
    setIsOpen(false);
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 14);
  };
    
  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const formatGenericDocument = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 11) {
        return formatCPF(value);
    }
    return formatCNPJ(value);
  }

  const formatCEP = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  };

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length !== 8) return;

    setIsFetchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        form.setValue('address', data.logradouro);
        form.setValue('neighborhood', data.bairro);
        form.setValue('city', data.localidade);
        form.setValue('state', data.uf);
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setIsFetchingCep(false);
    }
  };

  const handleCnpjBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cnpj = e.target.value.replace(/\D/g, '');
    if (cnpj.length !== 14) return;

    setIsFetchingCnpj(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      if(response.ok) {
        const data = await response.json();
        form.setValue('razaoSocial', data.razao_social);
        form.setValue('nomeFantasia', data.nome_fantasia);
        form.setValue('cep', formatCEP(data.cep));
        form.setValue('state', data.uf);
        form.setValue('city', data.municipio);
        form.setValue('neighborhood', data.bairro);
        form.setValue('address', `${data.logradouro}, ${data.numero}`);
      }
    } catch (error) {
      console.error('Erro ao buscar CNPJ:', error);
    } finally {
      setIsFetchingCnpj(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Cadastro de igrejas</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 p-2 overflow-y-auto max-h-[80vh]">
            <FormField
              control={form.control}
              name="supervisorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Selecione um supervisor</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um supervisor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {supervisors.map((supervisor) => (
                        <SelectItem key={supervisor.id} value={supervisor.id}>
                          {supervisor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>CNPJ/CPF</FormLabel>
                        <FormControl>
                        <Input
                            placeholder="Apenas números"
                            {...field}
                            onChange={(e) => field.onChange(formatGenericDocument(e.target.value))}
                            onBlur={handleCnpjBlur}
                            disabled={isFetchingCnpj}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                    control={form.control}
                    name="razaoSocial"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Razão social</FormLabel>
                        <FormControl>
                        <Input placeholder="Razão social" {...field} disabled={isFetchingCnpj} />
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
                        <FormLabel>Nome fantasia</FormLabel>
                        <FormControl>
                        <Input placeholder="Nome fantasia" {...field} disabled={isFetchingCnpj} />
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
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                        <Input type="email" placeholder="exemplo@gmail.com" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="00000-000"
                        {...field}
                        onChange={(e) => field.onChange(formatCEP(e.target.value))}
                        onBlur={handleCepBlur}
                        disabled={isFetchingCep || isFetchingCnpj}
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
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input placeholder="UF" {...field} disabled={isFetchingCep || isFetchingCnpj} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nome da cidade"
                        {...field}
                        disabled={isFetchingCep || isFetchingCnpj}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                    control={form.control}
                    name="neighborhood"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Bairro</FormLabel>
                        <FormControl>
                        <Input
                            placeholder="Nome do bairro"
                            {...field}
                            disabled={isFetchingCep || isFetchingCnpj}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                        <Input
                            placeholder="O restante do endereço"
                            {...field}
                            disabled={isFetchingCep || isFetchingCnpj}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="foundationDate"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Data de fundação</FormLabel>
                        <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button
                                variant={'outline'}
                                className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                                )}
                            >
                                {field.value ? (
                                format(field.value, 'dd/MM/yyyy')
                                ) : (
                                <span>dd/mm/aaaa</span>
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
                            disabled={(date) =>
                                date > new Date() || date < new Date('1900-01-01')
                            }
                            initialFocus
                            />
                        </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                    )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="titheDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia do dízimo</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="1 a 31"
                        {...field}
                      />
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
                    <FormLabel>Celular *</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm">
                          🇧🇷 +55
                        </span>
                        <Input
                          placeholder="(00) 00000-0000"
                          {...field}
                          className="rounded-l-none"
                          onChange={(e) => field.onChange(formatPhone(e.target.value))}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <FormField
                    control={form.control}
                    name="treasurerFirstName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nome Tesoureiro</FormLabel>
                        <FormControl>
                        <Input placeholder="Nome" {...field} />
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
                        <FormLabel>Sobrenome Tesoureiro</FormLabel>
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
                        <FormLabel>CPF Tesoureiro</FormLabel>
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

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Fechar</Button>
              </DialogClose>
              <Button type="submit" disabled={isFetchingCep || isFetchingCnpj}>
                {isFetchingCep || isFetchingCnpj ? 'Buscando dados...' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default function IgrejasPage() {
  const [churches, setChurches] = React.useState<Church[]>(initialChurches);
  const [viewMode, setViewMode] = React.useState<'table' | 'card'>('table');

  const handleSave = (data: Church) => {
    // Create new church
    const newChurch: Church = {
      ...data,
      id: `chu-${Date.now()}`,
      status: 'active',
    };
    setChurches([...churches, newChurch]);
  };

  const handleDelete = (churchId: string) => {
    setChurches(churches.filter((c) => c.id !== churchId));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Igrejas
          </h1>
          <p className="text-sm text-muted-foreground">
            Exibindo {churches.length} de {churches.length} resultados
          </p>
        </div>
        <div className="flex items-center gap-2">
            <DateRangePicker />
            <TooltipProvider>
                <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                    variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('table')}
                    className="h-8 w-8"
                    >
                    <List className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Visualizar em tabela</TooltipContent>
                </Tooltip>
                <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                    variant={viewMode === 'card' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('card')}
                    className="h-8 w-8"
                    >
                    <Grid3x3 className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Visualizar em cards</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <ChurchFormModal onSave={handleSave}>
                <Button size="sm" className="gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Nova Igreja
                </span>
                </Button>
            </ChurchFormModal>
        </div>
      </div>

      {viewMode === 'table' ? (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome Fantasia</TableHead>
                  <TableHead className="hidden md:table-cell">CNPJ</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {churches.map((church) => (
                  <TableRow key={church.id}>
                    <TableCell className="font-medium">{church.nomeFantasia}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {church.cnpj}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {church.email}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant={
                          church.status === 'active' ? 'default' : 'secondary'
                        }
                        className={
                          church.status === 'active'
                            ? 'bg-green-500/20 text-green-700 border-green-400'
                            : 'bg-red-500/20 text-red-700 border-red-400'
                        }
                      >
                        {church.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/igrejas/${church.id}`}>Editar</Link>
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-red-600">
                                Excluir
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Você tem certeza?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Essa ação não pode ser desfeita. Isso excluirá
                                  permanentemente a igreja.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(church.id!)}
                                >
                                  Continuar
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
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {churches.map((church, index) => {
            const supervisor = supervisors.find((s) => s.id === church.supervisorId);
            return (
              <Card key={church.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                    <Image
                      src="https://placehold.co/96x96.png"
                      alt={`Foto da ${church.nomeFantasia}`}
                      width={96}
                      height={96}
                      className="rounded-lg object-cover w-24 h-24"
                      data-ai-hint="church building"
                    />
                    <div className="flex-1 space-y-2 min-w-[200px]">
                      <h3 className="text-lg font-bold">
                        #{index + 1} - {church.nomeFantasia}
                      </h3>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2">
                          <User size={14} />{' '}
                          <span>Supervisor: {supervisor?.name || 'N/A'}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <FileText size={14} /> <span>{church.cnpj}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone size={14} /> <span>{church.phone}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Mail size={14} /> <span>{church.email}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin size={14} />{' '}
                          <span>
                            {church.city} - {church.state}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/igrejas/${church.id}`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

    