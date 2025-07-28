
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Camera,
  Facebook,
  Instagram,
  Globe,
  Youtube,
  MessageCircle,
} from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

const companyProfileSchema = z.object({
  cnpj: z.string().optional(),
  establishmentName: z.string().min(1, 'O nome é obrigatório.'),
  supportEmail: z.string().email('E-mail inválido.'),
  landline: z.string().optional(),
  whatsapp: z.string().optional(),
  cep: z.string().optional(),
  uf: z.string().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  complement: z.string().optional(),
  facebook: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
});

type CompanyProfile = z.infer<typeof companyProfileSchema>;

const companyData: CompanyProfile = {
  cnpj: '00.000.000/0001-00',
  establishmentName: 'Vinha Ministérios',
  supportEmail: 'email@exemplo.com',
  landline: '(00) 0000-0000',
  whatsapp: '+55 (00) 0 0000-0000',
  cep: '00000-000',
  uf: 'UF',
  city: 'Cidade',
  neighborhood: 'Bairro...',
  complement: 'Quadra, Lote, Número',
  facebook: 'https://facebook.com',
  instagram: 'https://instagram.com',
  website: 'https://youtube.com',
};


export default function ConfiguracoesPage() {

    const form = useForm<CompanyProfile>({
        resolver: zodResolver(companyProfileSchema),
        defaultValues: companyData,
      });

      const onSubmit = (data: CompanyProfile) => {
        console.log(data);
        // Handle form submission
      };

  return (
    <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-muted-foreground">Bom dia, Paulo!</p>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Gerenciamento do perfil da empresa
                </h1>
            </div>
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">Vinha</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                    <BreadcrumbLink href="/configuracoes">Configurações gerais</BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        </div>


        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1">
            <Card>
            <CardContent className="flex flex-col items-center pt-6 text-center">
                <div className="relative">
                <Avatar className="h-24 w-24">
                    <AvatarImage src="https://placehold.co/96x96/34d399/ffffff.png" alt="Vinha" data-ai-hint="logo company" />
                    <AvatarFallback>VM</AvatarFallback>
                </Avatar>
                <Button
                    variant="outline"
                    size="icon"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                >
                    <Camera className="h-4 w-4" />
                    <span className="sr-only">Trocar foto</span>
                </Button>
                </div>
                <h2 className="mt-4 text-xl font-semibold">
                Vinha Ministérios
                </h2>
                <p className="text-muted-foreground">Administração</p>
            </CardContent>
            <Separator />
            <CardContent className="pt-6">
                <h3 className="mb-4 font-semibold">Redes sociais</h3>
                <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className='p-2 rounded-full bg-blue-600 text-white'>
                        <Facebook className="h-4 w-4" />
                    </div>
                    <Input
                    defaultValue={companyData.facebook}
                    placeholder="https://facebook.com/..."
                    />
                </div>
                <div className="flex items-center gap-3">
                    <div className='p-2 rounded-full bg-black text-white'>
                        <Globe className="h-4 w-4" />
                    </div>
                    <Input
                    defaultValue={companyData.website}
                    placeholder="https://website.com/..."
                    />
                </div>
                 <div className="flex items-center gap-3">
                    <div className='p-2 rounded-full bg-red-600 text-white'>
                        <Instagram className="h-4 w-4" />
                    </div>
                    <Input
                    defaultValue={companyData.instagram}
                    placeholder="https://instagram.com/..."
                    />
                </div>
                </div>
            </CardContent>
            </Card>
        </div>

        {/* Right Column: Tabs and Form */}
        <div className="lg:col-span-3">
            <Tabs defaultValue="profile">
            <TabsList>
                <TabsTrigger value="profile">Dados do perfil</TabsTrigger>
                <TabsTrigger value="smtp">Configuração de SMTP</TabsTrigger>
                <TabsTrigger value="whatsapp">Configuração de WhatsApp</TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
                <Card>
                <CardContent className="pt-6">
                    <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="cnpj"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>CNPJ</FormLabel>
                                    <FormControl>
                                    <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="establishmentName"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do estabelecimento</FormLabel>
                                    <FormControl>
                                    <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="supportEmail"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>E-mail de suporte</FormLabel>
                                <FormControl>
                                <Input type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                             <FormField
                                control={form.control}
                                name="landline"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Telefone fixo</FormLabel>
                                    <FormControl>
                                    <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="whatsapp"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Celular/WhatsApp</FormLabel>
                                    <FormControl>
                                    <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>


                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <FormField control={form.control} name="cep" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>CEP</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="uf" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>UF</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="city" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cidade</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField control={form.control} name="neighborhood" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bairro</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="complement" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Complemento</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                </FormItem>
                            )} />
                        </div>

                        <div className="flex">
                          <Button type="submit">Atualizar perfil</Button>
                        </div>
                    </form>
                    </Form>
                </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="smtp">
                <Card>
                <CardHeader>
                    <CardTitle>Configuração de SMTP</CardTitle>
                    <CardDescription>
                        Configure os dados do seu servidor de e-mail para o envio de notificações.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Formulário de configuração de SMTP aqui.</p>
                </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="whatsapp">
            <Card>
              <CardHeader>
                <CardTitle>Configuração de WhatsApp</CardTitle>
                <CardDescription>
                  Integre com a API do WhatsApp para enviar mensagens automáticas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Formulário de configuração do WhatsApp aqui.</p>
              </CardContent>
            </Card>
          </TabsContent>
            </Tabs>
        </div>
        </div>
    </div>
  );
}

    