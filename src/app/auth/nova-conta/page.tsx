
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar as CalendarIcon, Building, User } from 'lucide-react';
import { format, subYears } from 'date-fns';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const pastorSchema = z.object({
  firstName: z.string().min(1, 'O nome é obrigatório.'),
  lastName: z.string().min(1, 'O sobrenome é obrigatório.'),
  cpf: z.string().min(14, 'O CPF é obrigatório.'),
  birthDate: z.date({ required_error: 'A data de nascimento é obrigatória.' }),
  email: z.string().email('E-mail inválido.'),
  supervisorId: z.string({ required_error: 'Selecione um supervisor.' }),
});

const churchSchema = z.object({
  nomeFantasia: z.string().min(1, 'O nome fantasia é obrigatório.'),
  razaoSocial: z.string().min(1, 'A razão social é obrigatória.'),
  cnpj: z.string().min(18, 'O CNPJ é obrigatório.'),
  email: z.string().email('E-mail inválido.'),
  supervisorId: z.string({ required_error: 'Selecione um supervisor.' }),
});


type PastorFormValues = z.infer<typeof pastorSchema>;
type ChurchFormValues = z.infer<typeof churchSchema>;

// Mock data, should come from an API
const supervisors = [
    { id: 'sup-01', name: 'Carlos Andrade' },
    { id: 'sup-02', name: 'Ana Beatriz' },
    { id: 'sup-03', name: 'Jabez Henrique' },
];

const PastorForm = () => {
    const form = useForm<PastorFormValues>({
        resolver: zodResolver(pastorSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            cpf: '',
            email: '',
        }
    });

    const onSubmit = (data: PastorFormValues) => {
        console.log("Pastor Data:", data);
        // Handle pastor registration
    };
    
    const formatCPF = (value: string) => {
        return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        .slice(0, 14);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                 <CardHeader className="px-0">
                    <CardTitle>Informações Iniciais do Pastor</CardTitle>
                </CardHeader>
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
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
                            <FormControl>
                                <Input 
                                    placeholder="000.000.000-00" 
                                    {...field} 
                                    onChange={(e) => field.onChange(formatCPF(e.target.value))}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="birthDate" render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Data de nascimento</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? format(field.value, "dd/MM/yyyy") : <span>dd/mm/aaaa</span>}
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar 
                                        mode="single" 
                                        selected={field.value} 
                                        onSelect={field.onChange} 
                                        disabled={(date) => date > subYears(new Date(), 18) || date < new Date("1900-01-01")} 
                                        defaultMonth={subYears(new Date(), 18)}
                                        initialFocus 
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl><Input type="email" placeholder="seu@email.com" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="supervisorId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Supervisor</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Escolha um supervisor..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {supervisors.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <Button type="submit" className="w-full" size="lg">Próximo</Button>
            </form>
        </Form>
    )
}

const ChurchForm = () => {
    const form = useForm<ChurchFormValues>({
        resolver: zodResolver(churchSchema),
        defaultValues: {
            nomeFantasia: '',
            razaoSocial: '',
            cnpj: '',
            email: '',
        }
    });

    const onSubmit = (data: ChurchFormValues) => {
        console.log("Church Data:", data);
        // Handle church registration
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

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                 <CardHeader className="px-0">
                    <CardTitle>Informações Iniciais da Igreja</CardTitle>
                </CardHeader>
                 <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                    <FormField control={form.control} name="cnpj" render={({ field }) => (
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
                    )} />
                    <FormField control={form.control} name="razaoSocial" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Razão Social</FormLabel>
                            <FormControl><Input placeholder="Razão social da igreja" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="nomeFantasia" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome Fantasia</FormLabel>
                            <FormControl><Input placeholder="Nome da sua igreja" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                            <FormLabel>E-mail da Igreja</FormLabel>
                            <FormControl><Input type="email" placeholder="contato@suaigreja.com" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="supervisorId" render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                            <FormLabel>Supervisor</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Escolha um supervisor..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {supervisors.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <Button type="submit" className="w-full" size="lg">Próximo</Button>
            </form>
        </Form>
    )
}

export default function NovaContaPage() {

  return (
    <Card className="w-full max-w-2xl border-none shadow-none">
        <CardHeader className="text-center">
            <CardTitle className="text-2xl">Qual cadastro iremos fazer hoje?</CardTitle>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="pastor">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pastor" className="gap-2"><User /> Cadastro de Pastor</TabsTrigger>
                    <TabsTrigger value="igreja" className="gap-2"><Building /> Cadastro de Igreja</TabsTrigger>
                </TabsList>
                <TabsContent value="pastor">
                    <PastorForm />
                </TabsContent>
                <TabsContent value="igreja">
                    <ChurchForm />
                </TabsContent>
            </Tabs>
            <div className="mt-6 text-center text-sm">
                Já tem uma conta?{' '}
                <Link href="/auth/login" className="underline">
                    Faça o login
                </Link>
            </div>
        </CardContent>
    </Card>
  );
}
