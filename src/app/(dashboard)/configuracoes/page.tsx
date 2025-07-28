
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
  AlertCircle,
  X,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
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
  address: z.string().optional(),
  facebook: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
});

const smtpSchema = z.object({
    senderName: z.string().min(1, "O nome do remetente é obrigatório."),
    senderEmail: z.string().email("E-mail do remetente inválido."),
    smtpHost: z.string().min(1, "O host SMTP é obrigatório."),
    smtpLogin: z.string().min(1, "O login SMTP é obrigatório."),
    smtpPassword: z.string().min(1, "A senha SMTP é obrigatória."),
    smtpPort: z.coerce.number().min(1, "A porta SMTP é obrigatória."),
    smtpProtocol: z.enum(["TLS", "SSL"]),
});

const whatsappSchema = z.object({
    apiUrl: z.string().url("URL da API inválida."),
    instance: z.string().min(1, "A instância é obrigatória."),
    apiKey: z.string().min(1, "A API Key é obrigatória."),
    enableSupportButton: z.boolean().default(false),
});


type CompanyProfile = z.infer<typeof companyProfileSchema>;
type SmtpProfile = z.infer<typeof smtpSchema>;
type WhatsappProfile = z.infer<typeof whatsappSchema>;

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
  address: 'Endereço',
  facebook: 'https://facebook.com',
  instagram: 'https://instagram.com',
  website: 'https://youtube.com',
};

const smtpData: SmtpProfile = {
    senderName: "Multidesk.io",
    senderEmail: "igrsysten@gmail.com",
    smtpHost: "smtp.gmail.com",
    smtpLogin: "seu-email@email.com",
    smtpPassword: "•••••",
    smtpPort: 587,
    smtpProtocol: "TLS",
};

const whatsappData: WhatsappProfile = {
    apiUrl: "https://api.conect.app",
    instance: "igrsysten@gmail.com",
    apiKey: "••••••••••••",
    enableSupportButton: true,
};


export default function ConfiguracoesPage() {
    const [isFetchingCep, setIsFetchingCep] = React.useState(false);
    const [isFetchingCnpj, setIsFetchingCnpj] = React.useState(false);


    const profileForm = useForm<CompanyProfile>({
        resolver: zodResolver(companyProfileSchema),
        defaultValues: companyData,
    });

    const smtpForm = useForm<SmtpProfile>({
        resolver: zodResolver(smtpSchema),
        defaultValues: smtpData
    });

    const whatsappForm = useForm<WhatsappProfile>({
        resolver: zodResolver(whatsappSchema),
        defaultValues: whatsappData
    });


    const onProfileSubmit = (data: CompanyProfile) => {
        console.log("Profile data:", data);
        // Handle form submission
    };

    const onSmtpSubmit = (data: SmtpProfile) => {
        console.log("SMTP data:", data);
        // Handle SMTP form submission
    };

    const onWhatsappSubmit = (data: WhatsappProfile) => {
        console.log("WhatsApp data:", data);
        // Handle WhatsApp form submission
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

    const formatCEP = (value: string) => {
        return value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
    };

    const handleCnpjBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const cnpj = e.target.value.replace(/\D/g, '');
        if (cnpj.length !== 14) return;

        setIsFetchingCnpj(true);
        try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
        if(response.ok) {
            const data = await response.json();
            profileForm.setValue('establishmentName', data.razao_social);
            profileForm.setValue('cep', formatCEP(data.cep));
            profileForm.setValue('uf', data.uf);
            profileForm.setValue('city', data.municipio);
            profileForm.setValue('neighborhood', data.bairro);
            profileForm.setValue('address', `${data.logradouro}, ${data.numero}`);
        }
        } catch (error) {
        console.error('Erro ao buscar CNPJ:', error);
        } finally {
        setIsFetchingCnpj(false);
        }
    };

    const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const cep = e.target.value.replace(/\D/g, '');
        if (cep.length !== 8) return;

        setIsFetchingCep(true);
        try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
            profileForm.setValue('address', data.logradouro);
            profileForm.setValue('neighborhood', data.bairro);
            profileForm.setValue('city', data.localidade);
            profileForm.setValue('uf', data.uf);
        }
        } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        } finally {
        setIsFetchingCep(false);
        }
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
                    <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField
                                control={profileForm.control}
                                name="cnpj"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>CNPJ</FormLabel>
                                    <FormControl>
                                    <Input {...field}
                                     onChange={(e) => field.onChange(formatCNPJ(e.target.value))}
                                     onBlur={handleCnpjBlur}
                                     disabled={isFetchingCnpj}
                                    />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={profileForm.control}
                                name="establishmentName"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do estabelecimento</FormLabel>
                                    <FormControl>
                                    <Input {...field} disabled={isFetchingCnpj} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={profileForm.control}
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
                                control={profileForm.control}
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
                                control={profileForm.control}
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
                            <FormField control={profileForm.control} name="cep" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>CEP</FormLabel>
                                    <FormControl><Input {...field} 
                                        onChange={(e) => field.onChange(formatCEP(e.target.value))}
                                        onBlur={handleCepBlur}
                                        disabled={isFetchingCnpj || isFetchingCep}
                                    /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={profileForm.control} name="uf" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>UF</FormLabel>
                                    <FormControl><Input {...field} disabled={isFetchingCnpj || isFetchingCep} /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={profileForm.control} name="city" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cidade</FormLabel>
                                    <FormControl><Input {...field} disabled={isFetchingCnpj || isFetchingCep} /></FormControl>
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField control={profileForm.control} name="neighborhood" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bairro</FormLabel>
                                    <FormControl><Input {...field} disabled={isFetchingCnpj || isFetchingCep} /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={profileForm.control} name="address" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Endereço</FormLabel>
                                    <FormControl><Input {...field} disabled={isFetchingCnpj || isFetchingCep} /></FormControl>
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={profileForm.control} name="complement" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Complemento</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                            </FormItem>
                        )} />

                        <div className="flex">
                          <Button type="submit" disabled={isFetchingCnpj || isFetchingCep}>
                            {isFetchingCnpj || isFetchingCep ? 'Buscando dados...' : 'Atualizar perfil'}
                          </Button>
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
                    <Form {...smtpForm}>
                        <form onSubmit={smtpForm.handleSubmit(onSmtpSubmit)} className="space-y-6">
                        <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300">
                            <AlertCircle className="h-4 w-4 text-blue-500" />
                            <AlertTitle>Atenção!</AlertTitle>
                            <AlertDescription>
                                Essas informações são necessárias para melhor desempendo do sistema.
                            </AlertDescription>
                        </Alert>
                        <FormField
                            control={smtpForm.control}
                            name="senderName"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome remetente</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={smtpForm.control}
                            name="senderEmail"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email remetente</FormLabel>
                                <FormControl><Input type="email" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={smtpForm.control}
                            name="smtpHost"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>SMTP Host</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={smtpForm.control}
                            name="smtpLogin"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>SMTP Login</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={smtpForm.control}
                            name="smtpPassword"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>SMTP Password</FormLabel>
                                <FormControl><Input type="password" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                            <FormField
                                control={smtpForm.control}
                                name="smtpPort"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>SMTP Porta</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={smtpForm.control}
                                name="smtpProtocol"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Protocolo</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="TLS">TLS</SelectItem>
                                        <SelectItem value="SSL">SSL</SelectItem>
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                        
                        <div className="flex gap-2">
                          <Button type="submit">Atualizar SMTP</Button>
                          <Button type="button" variant="secondary">Testar envio de e-mail</Button>
                        </div>

                        </form>
                    </Form>
                </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="whatsapp">
                <Card>
                <CardHeader>
                    <CardTitle>Configuração de WhatsApp</CardTitle>
                    <CardDescription>
                    Integre com a API da Evolution para enviar mensagens automáticas.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...whatsappForm}>
                        <form onSubmit={whatsappForm.handleSubmit(onWhatsappSubmit)} className="space-y-6">
                            <Alert variant='default' className='bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-300 flex justify-between items-center'>
                                <div>
                                    <p>Suporte da API <strong>multidesk.io@gmail.com</strong></p>
                                </div>
                                <button type="button">
                                    <X className="h-4 w-4" />
                                </button>
                            </Alert>
                             <FormField
                                control={whatsappForm.control}
                                name="apiUrl"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>URL da API</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={whatsappForm.control}
                                name="instance"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Instância</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={whatsappForm.control}
                                name="apiKey"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>API KEY</FormLabel>
                                    <FormControl><Input type="password" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={whatsappForm.control}
                                name="enableSupportButton"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">
                                                Ativar botão de suporte do WhatsApp
                                            </FormLabel>
                                        </div>
                                        <FormControl>
                                            <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <div className="flex gap-2">
                                <Button type="submit">Atualizar API WhatsApp</Button>
                                <Button type="button" variant="secondary">Testar envio no WhatsApp</Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
                </Card>
          </TabsContent>
            </Tabs>
        </div>
        </div>
    </div>
  );
}


    