
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
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

const whatsappSettingsSchema = z.object({
  apiUrl: z.string().url('URL da API inválida.'),
  apiKey: z.string().min(1, 'API Key é obrigatória.'),
  apiInstance: z.string().min(1, 'Nome da instância é obrigatório.'),
});

type WhatsappSettingsValues = z.infer<typeof whatsappSettingsSchema>;

export default function WhatsappSettingsPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [isTesting, setIsTesting] = React.useState(false);
    const [testPhone, setTestPhone] = React.useState('');
    const [testMessage, setTestMessage] = React.useState('Olá! Esta é uma mensagem de teste do sistema Vinha.');

    const form = useForm<WhatsappSettingsValues>({
        resolver: zodResolver(whatsappSettingsSchema),
        defaultValues: {
            apiUrl: '',
            apiKey: '',
            apiInstance: '',
        },
    });

    React.useEffect(() => {
        const fetchConfig = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/v1/settings/whatsapp');
                if (!response.ok) throw new Error('Falha ao carregar configurações do WhatsApp.');
                const data = await response.json();
                if (data.config) {
                    form.reset({
                        apiUrl: data.config.apiUrl || '',
                        apiKey: data.config.apiKey || '',
                        apiInstance: data.config.apiInstance || '',
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

    const onSubmit = async (data: WhatsappSettingsValues) => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/v1/settings/whatsapp', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Falha ao salvar configurações do WhatsApp.');
            toast({ title: "Sucesso!", description: "Configurações do WhatsApp salvas com sucesso.", variant: "success" });
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendTestMessage = async () => {
        if (!testPhone || !testMessage) {
            toast({ title: "Atenção", description: "Por favor, preencha o número e a mensagem.", variant: "destructive" });
            return;
        }
        setIsTesting(true);
        try {
            const currentConfig = form.getValues();
            const response = await fetch('/api/v1/settings/whatsapp/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: testPhone, message: testMessage, config: currentConfig }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Falha ao enviar mensagem de teste.');
            toast({ title: "Sucesso!", description: "Mensagem de teste enviada!", variant: "success" });
        } catch (error: any) {
            toast({ title: 'Erro no Teste', description: error.message, variant: 'destructive' });
        } finally {
            setIsTesting(false);
        }
    };
    
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Separator />
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Form {...form}>
             <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuração do WhatsApp</CardTitle>
                            <CardDescription>
                                Configure as credenciais para integração com a API do WhatsApp.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className='space-y-4'>
                                <FormField control={form.control} name="apiUrl" render={({field}) => (
                                    <FormItem><FormLabel>URL da API</FormLabel><FormControl><Input placeholder='https://api.seuservico.com' {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="apiInstance" render={({field}) => (
                                    <FormItem><FormLabel>Nome da Instância</FormLabel><FormControl><Input placeholder='ex: sua_instancia' {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="apiKey" render={({field}) => (
                                    <FormItem><FormLabel>API Key</FormLabel><FormControl><Input type='password' placeholder='Sua chave de API secreta' {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>
                                )} />
                                <div className='flex justify-end'>
                                    <Button type="submit" disabled={isSaving}>
                                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Salvar Configurações
                                    </Button>
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <h3 className="text-lg font-medium mb-2">Testar Envio</h3>
                                <div className='space-y-4'>
                                    <div className='space-y-2'>
                                        <Label>Número de Telefone (com DDI)</Label>
                                        <Input placeholder='Ex: 5562981154120' value={testPhone} onChange={(e) => setTestPhone(e.target.value)}/>
                                    </div>
                                    <div className='space-y-2'>
                                        <Label>Mensagem</Label>
                                        <Textarea placeholder='Digite sua mensagem de teste...' value={testMessage} onChange={(e) => setTestMessage(e.target.value)} />
                                    </div>
                                    <div className='flex justify-end'>
                                        <Button type="button" variant="outline" onClick={handleSendTestMessage} disabled={isTesting}>
                                            {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Testar Envio
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </Form>
    );
}
