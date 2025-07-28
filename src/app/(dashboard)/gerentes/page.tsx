
'use client';

import * as React from 'react';
import { MoreHorizontal, PlusCircle, AlertTriangle } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
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
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';


const managerSchema = z.object({
    id: z.string().optional(),
    firstName: z.string().min(1, { message: "O nome é obrigatório." }),
    lastName: z.string().min(1, { message: "O sobrenome é obrigatório." }),
    cpf: z.string().min(14, { message: "O CPF deve ter 11 dígitos." }),
    email: z.string().email({ message: "E-mail inválido." }),
    cep: z.string().min(9, { message: "O CEP deve ter 8 dígitos." }),
    state: z.string().length(2, { message: "UF deve ter 2 letras." }),
    city: z.string().min(1, { message: "A cidade é obrigatória." }),
    neighborhood: z.string().min(1, { message: "O bairro é obrigatório." }),
    address: z.string().min(1, { message: "O endereço é obrigatório." }),
    titheDay: z.coerce.number().min(1).max(31),
    phone: z.string().min(1, { message: "O celular é obrigatório." }),
    status: z.enum(['active', 'inactive']),
});

type Manager = z.infer<typeof managerSchema>;

const initialManagers: Manager[] = [
    { id: 'mgr-01', firstName: 'João', lastName: 'Silva', email: 'joao.silva@example.com', phone: '(11) 98765-4321', status: 'active', cpf: '111.222.333-44', cep: '01001-000', state: 'SP', city: 'São Paulo', neighborhood: 'Centro', address: 'Av. Paulista, 1000', titheDay: 10 },
    { id: 'mgr-02', firstName: 'Maria', lastName: 'Oliveira', email: 'maria.oliveira@example.com', phone: '(21) 91234-5678', status: 'inactive', cpf: '222.333.444-55', cep: '20040-001', state: 'RJ', city: 'Rio de Janeiro', neighborhood: 'Copacabana', address: 'Av. Atlântica, 2000', titheDay: 5 },
    { id: 'mgr-03', firstName: 'Paulo', lastName: 'Ferreira', email: 'multidesk.io@gmail.com', phone: '(62) 98115-4120', status: 'active', cpf: '037.628.391-23', cep: '75264-230', state: 'GO', city: 'Senador Canedo', neighborhood: 'Terrabela Cerrado I', address: 'Rua RP 15', titheDay: 10 },

];

const GerenteFormModal = ({
    manager,
    onSave,
    children,
  }: {
    manager?: Manager | null;
    onSave: (data: Manager) => void;
    children: React.ReactNode;
  }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [isFetchingCep, setIsFetchingCep] = React.useState(false);

    const form = useForm<Manager>({
        resolver: zodResolver(managerSchema),
        defaultValues: manager || {
            firstName: '',
            lastName: '',
            cpf: '',
            email: '',
            cep: '',
            state: '',
            city: '',
            neighborhood: '',
            address: '',
            titheDay: 1,
            phone: '',
            status: 'active',
        },
    });

    React.useEffect(() => {
        if (isOpen) {
            form.reset(manager || {
                firstName: '',
                lastName: '',
                cpf: '',
                email: '',
                cep: '',
                state: '',
                city: '',
                neighborhood: '',
                address: '',
                titheDay: 1,
                phone: '',
                status: 'active',
            });
        }
    }, [isOpen, manager, form]);

    const handleSave = (data: Manager) => {
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

      const formatCEP = (value: string) => {
        return value
          .replace(/\D/g, '')
          .replace(/(\d{5})(\d)/, '$1-$2')
          .slice(0, 9);
      };

      const formatPhone = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .slice(0, 15);
      }

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
            console.error("Erro ao buscar CEP:", error)
        } finally {
            setIsFetchingCep(false);
        }
      }

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{manager ? 'Editar Gerente' : 'Cadastro de gerente'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
                <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                    <AlertTriangle className="h-4 w-4 text-blue-500" />
                    <AlertDescription className="text-blue-700 dark:text-blue-300">
                        A senha padrão é <strong>123456</strong> até o usuário cadastrar uma nova senha.
                        Você também pode alterar a senha no menu de perfil da pessoa cadastrada.
                    </AlertDescription>
                </Alert>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="firstName" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl><Input placeholder="Primeiro nome" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="lastName" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Sobrenome</FormLabel>
                            <FormControl><Input placeholder="Sobrenome" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="cpf" render={({ field }) => (
                        <FormItem>
                            <FormLabel>CPF</FormLabel>
                            <FormControl><Input placeholder="000.000.000-00" {...field} onChange={(e) => field.onChange(formatCPF(e.target.value))} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl><Input type="email" placeholder="exemplo@gmail.com" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="cep" render={({ field }) => (
                        <FormItem>
                            <FormLabel>CEP</FormLabel>
                            <FormControl><Input placeholder="00000-000" {...field} onChange={(e) => field.onChange(formatCEP(e.target.value))} onBlur={handleCepBlur} disabled={isFetchingCep} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="state" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <FormControl><Input placeholder="UF" {...field} disabled={isFetchingCep} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="city" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cidade</FormLabel>
                            <FormControl><Input placeholder="Nome da cidade" {...field} disabled={isFetchingCep} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="neighborhood" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Bairro</FormLabel>
                            <FormControl><Input placeholder="Nome do bairro" {...field} disabled={isFetchingCep} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                 <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl><Input placeholder="O restante do endereço" {...field} disabled={isFetchingCep} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="titheDay" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Dia do dízimo</FormLabel>
                            <FormControl><Input type="number" min="1" max="31" placeholder="1 a 31" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Celular *</FormLabel>
                            <FormControl>
                                <div className="flex items-center">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm">
                                        🇧🇷 +55
                                    </span>
                                    <Input placeholder="(00) 00000-0000" {...field} className="rounded-l-none" onChange={(e) => field.onChange(formatPhone(e.target.value))}/>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isFetchingCep}>
                        {isFetchingCep ? 'Buscando CEP...' : 'Salvar'}
                    </Button>
                </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  };


export default function GerentesPage() {
    const [managers, setManagers] = React.useState<Manager[]>(initialManagers);
    const [selectedManager, setSelectedManager] = React.useState<Manager | null>(null);

    const handleSave = (data: Manager) => {
        // Create new manager
        const newManager: Manager = {
        ...data,
        id: `mgr-${Date.now()}`,
        status: 'active'
        };
        setManagers([...managers, newManager]);
      };

      const handleDelete = (managerId: string) => {
        setManagers(managers.filter(m => m.id !== managerId));
      }


  return (
    <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Gerentes
            </h1>
            <GerenteFormModal onSave={handleSave}>
                <Button size="sm" className="gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Novo Gerente
                    </span>
                </Button>
            </GerenteFormModal>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Gerentes</CardTitle>
          <CardDescription>
            Gerencie os gerentes da sua associação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Celular</TableHead>
                <TableHead className='hidden sm:table-cell'>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {managers.map((manager) => (
                <TableRow key={manager.id}>
                  <TableCell className="font-medium">{`${manager.firstName} ${manager.lastName}`}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{manager.email}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{manager.phone}</TableCell>
                  <TableCell className='hidden sm:table-cell'>
                    <Badge variant={manager.status === 'active' ? 'default' : 'secondary'} className={manager.status === 'active' ? 'bg-green-500/20 text-green-700 border-green-400' : 'bg-red-500/20 text-red-700 border-red-400'}>
                        {manager.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                           <Link href={`/gerentes/${manager.id}`}>Editar</Link>
                        </DropdownMenuItem>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <button className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-red-600">
                                    Excluir
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Essa ação não pode ser desfeita. Isso excluirá permanentemente o gerente.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(manager.id!)}>Continuar</AlertDialogAction>
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
  );
}
