
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

const smtpSettingsSchema = z.object({
  host: z.string().min(1, 'Servidor SMTP é obrigatório.'),
  port: z.coerce.number().min(1, 'Porta é obrigatória.'),
  user: z.string().min(1, 'Usuário SMTP é obrigatório.'),
  password: z.string().min(1, 'Senha SMTP é obrigatória.'),
  secure: z.boolean().default(false),
});

type SmtpSettingsValues = z.infer<typeof smtpSettingsSchema>;

export default function SmtpSettingsPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [isTesting, setIsTesting] = React.useState(false);
    const [testEmail, setTestEmail] = React.useState('');

    const form = useForm<SmtpSettingsValues>({
        resolver: zodResolver(smtpSettingsSchema),
        defaultValues: { secure: false },
    });

    React.useEffect(() => {
        const fetchConfig = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/v1/settings/smtp');
                if (!response.ok) throw new Error('Falha ao carregar configurações SMTP.');
                const data = await response.json();
                if (data.config) {
                    form.reset({
                        host: data.config.host || '',
                        port: data.config.port || 587,
                        user: data.config.user || '',
                        password: data.config.password || '',
                        secure: data.config.secure || false,
                    });
                }
            } catch (error: any) {
                toast({ title: 'Erro', description: error.message, variant: 'destructive' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchConfig();
    }, [form, toast]);

    const onSubmit = async (data: SmtpSettingsValues) => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/v1/settings/smtp', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Falha ao salvar configurações SMTP.');
            toast({ title: "Sucesso!", description: "Configurações de SMTP salvas com sucesso.", variant: "success" });
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendTestEmail = async () => {
        if (!testEmail) {
            toast({ title: "Atenção", description: "Por favor, insira um e-mail de destino.", variant: "destructive" });
            return;
        }
        setIsTesting(true);
        try {
            // A API de teste pode precisar das configurações atuais, mesmo que não salvas
            const currentConfig = form.getValues();
            const response = await fetch('/api/v1/settings/smtp/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: testEmail, config: currentConfig }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Falha ao enviar e-mail de teste.');
            toast({ title: "Sucesso!", description: "E-mail de teste enviado com sucesso!", variant: "success" });
        } catch (error: any) {
            toast({ title: 'Erro no Teste', description: error.message, variant: 'destructive' });
        } finally {
            setIsTesting(false);
        }
    }
    
    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <Skeleton className="h-10 w-full" />
                       <Skeleton className="h-10 w-full" />
                       <Skeleton className="h-10 w-full" />
                       <Skeleton className="h-10 w-full" />
                   </div>
                    <Skeleton className="h-6 w-1/3" />
                    <Separator />
                     <div>
                        <Skeleton className="h-7 w-1/4 mb-2" />
                        <Skeleton className="h-10 w-full mb-4" />
                        <div className="flex justify-end"><Skeleton className="h-10 w-32" /></div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle>Configuração de SMTP</CardTitle>
                        <CardDescription>
                            Configure o serviço para envio de e-mails transacionais (ex: Amazon SES, SendGrid).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <FormField control={form.control} name="host" render={({field}) => (
                                <FormItem><FormLabel>Servidor SMTP</FormLabel><FormControl><Input placeholder='email-smtp.us-east-1.amazonaws.com' {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="port" render={({field}) => (
                                <FormItem><FormLabel>Porta</FormLabel><FormControl><Input type="number" placeholder='587' {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="user" render={({field}) => (
                                <FormItem><FormLabel>Usuário SMTP</FormLabel><FormControl><Input placeholder='Seu usuário SMTP' {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="password" render={({field}) => (
                                <FormItem><FormLabel>Senha SMTP</FormLabel><FormControl><Input type='password' placeholder='Sua senha SMTP' {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="secure" render={({field}) => (
                            <FormItem className="flex items-center space-x-2">
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <Label>Usar conexão segura (SSL/TLS)</Label>
                            </FormItem>
                        )} />
                        <div className='flex justify-end'>
                             <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar Configurações
                            </Button>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="text-lg font-medium mb-2">Testar Envio de E-mail</h3>
                            <div className='space-y-4'>
                                <div className='space-y-2'>
                                    <Label>E-mail de Destino</Label>
                                    <Input type="email" placeholder='Ex: teste@vinha.com' value={testEmail} onChange={e => setTestEmail(e.target.value)} />
                                </div>
                                <div className='flex justify-end'>
                                     <Button type="button" variant="outline" onClick={handleSendTestEmail} disabled={isTesting}>
                                        {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Enviar E-mail de Teste
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </Form>
    );
}
