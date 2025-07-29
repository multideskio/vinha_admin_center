
'use client';

import * as React from 'react';
import { PlusCircle, Globe, RefreshCw, Trash2, Pencil, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';


import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
  } from '@/components/ui/dialog';
  import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';


const webhookSchema = z.object({
    id: z.string().uuid().optional(),
    url: z.string().url({ message: "Por favor, insira uma URL válida." }),
    secret: z.string().min(1, "O segredo é obrigatório.").optional(),
    events: z.array(z.string()).refine((value) => value.some((item) => item), {
      message: "Você deve selecionar pelo menos um evento.",
    }),
    isActive: z.boolean().default(true),
});

type Webhook = z.infer<typeof webhookSchema> & { createdAt?: string };

const availableEvents = [
    { id: 'transacao_criada', label: 'Transação Criada' },
    { id: 'transacao_aprovada', label: 'Transação Aprovada' },
    { id: 'transacao_recusada', label: 'Transação Recusada' },
    { id: 'usuario_criado', label: 'Usuário Criado' },
    { id: 'usuario_atualizado', label: 'Usuário Atualizado' },
]

const WebhookFormModal = ({ onSave, children, webhook }: { onSave: () => void; children: React.ReactNode, webhook?: Webhook }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const { toast } = useToast();
    const form = useForm<Webhook>({
        resolver: zodResolver(webhookSchema),
        defaultValues: webhook ? { ...webhook } : { url: '', secret: '', events: [], isActive: true },
    });

    React.useEffect(() => {
        if (isOpen) {
            form.reset(webhook ? { ...webhook } : { url: '', secret: '', events: [], isActive: true });
        }
    }, [isOpen, webhook, form]);

    const generateSecret = () => {
        const secret = `whsec_${[...Array(32)].map(() => Math.random().toString(36)[2]).join('')}`;
        form.setValue('secret', secret);
    }
    
    const onSubmit = async (data: Webhook) => {
        const method = webhook ? 'PUT' : 'POST';
        const url = webhook ? `/api/v1/webhooks/${webhook.id}` : '/api/v1/webhooks';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Falha ao ${webhook ? 'atualizar' : 'criar'} webhook.`);
            }
            toast({ title: 'Sucesso!', description: `Webhook ${webhook ? 'atualizado' : 'criado'} com sucesso.`, variant: 'success'});
            onSave();
            setIsOpen(false);
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive'});
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{webhook ? 'Editar Webhook' : 'Adicionar Novo Webhook'}</DialogTitle>
                    <DialogDescription>
                        Configure uma nova URL para receber notificações de eventos do sistema.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField control={form.control} name="url" render={({ field }) => (
                            <FormItem>
                                <FormLabel>URL do Endpoint</FormLabel>
                                <FormControl><Input placeholder="https://seu-servico.com/webhook" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="secret" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Segredo do Webhook</FormLabel>
                                <FormControl>
                                    <div className='flex gap-2'>
                                        <Input placeholder="whsec_..." {...field} value={field.value ?? ''} />
                                        <Button type="button" variant="outline" onClick={generateSecret}><RefreshCw className='h-4 w-4' /></Button>
                                    </div>
                                </FormControl>
                                <FormDescription>Usado para assinar os eventos. Guarde com segurança.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="events" render={() => (
                            <FormItem>
                                <FormLabel>Eventos</FormLabel>
                                <FormDescription>Selecione os eventos que você deseja receber.</FormDescription>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                {availableEvents.map((item) => (
                                    <FormField key={item.id} control={form.control} name="events" render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value?.includes(item.id)}
                                                    onCheckedChange={(checked) => {
                                                    const currentValue = field.value || [];
                                                    return checked
                                                        ? field.onChange([...currentValue, item.id])
                                                        : field.onChange(currentValue?.filter((value) => value !== item.id))
                                                    }}
                                                />
                                            </FormControl>
                                            <FormLabel className="font-normal">{item.label}</FormLabel>
                                        </FormItem>
                                    )} />
                                ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar
                            </Button>
                         </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default function WebhooksPage() {
    const [webhooks, setWebhooks] = React.useState<Webhook[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const { toast } = useToast();

    const fetchWebhooks = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/v1/webhooks');
            if(!response.ok) throw new Error('Falha ao buscar webhooks.');
            const data = await response.json();
            setWebhooks(data.webhooks);
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive'});
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    React.useEffect(() => {
        fetchWebhooks();
    }, [fetchWebhooks]);

    const handleToggleActive = async (webhook: Webhook) => {
        try {
            const response = await fetch(`/api/v1/webhooks/${webhook.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !webhook.isActive })
            });
            if (!response.ok) throw new Error('Falha ao atualizar o status do webhook.');
            toast({ title: 'Sucesso!', description: 'Status do webhook atualizado.', variant: 'success' });
            fetchWebhooks();
        } catch(error: any) {
             toast({ title: 'Erro', description: error.message, variant: 'destructive'});
        }
    }

    const handleDelete = async (id?: string) => {
        if (!id) return;
        try {
            const response = await fetch(`/api/v1/webhooks/${id}`, { method: 'DELETE' });
            if(!response.ok) throw new Error('Falha ao excluir webhook.');
            toast({ title: "Sucesso!", description: 'Webhook excluído com sucesso.', variant: 'success' });
            fetchWebhooks();
        } catch (error: any) {
             toast({ title: 'Erro', description: error.message, variant: 'destructive'});
        }
    }
  
    return (
    <div className="grid gap-6">
        <div className='flex items-center justify-between'>
            <div>
                <CardTitle>Webhooks de Saída</CardTitle>
                <CardDescription>
                Gerencie os endpoints que recebem eventos do seu sistema.
                </CardDescription>
            </div>
            <WebhookFormModal onSave={fetchWebhooks}>
                <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Adicionar Webhook
                </Button>
            </WebhookFormModal>
        </div>
      
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead>Eventos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-2/3" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                    </TableRow>
                  ))
              ) : webhooks.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        Nenhum webhook configurado.
                    </TableCell>
                </TableRow>
              ) : webhooks.map((webhook) => (
                <TableRow key={webhook.id}>
                    <TableCell className='font-medium'>
                        <div className='flex flex-col'>
                           <div className='flex items-center gap-2'>
                                <Globe className='h-4 w-4 text-muted-foreground' />
                                <span>{webhook.url}</span>
                            </div>
                           <span className='text-xs text-muted-foreground pl-6'>
                                Criado {webhook.createdAt ? formatDistanceToNow(new Date(webhook.createdAt), { addSuffix: true, locale: ptBR }) : 'há pouco'}
                           </span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className='flex flex-wrap gap-1'>
                            {Array.isArray(webhook.events) && webhook.events.map(event => (
                                <Badge key={event} variant="secondary">{availableEvents.find(e => e.id === event)?.label || event}</Badge>
                            ))}
                        </div>
                    </TableCell>
                     <TableCell>
                        <Badge variant={webhook.isActive ? 'success' : 'secondary'}>
                            {webhook.isActive ? <CheckCircle className='h-4 w-4 mr-1' /> : <XCircle className='h-4 w-4 mr-1' />}
                            {webhook.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <div className='flex items-center gap-2'>
                            <Switch checked={webhook.isActive} onCheckedChange={() => handleToggleActive(webhook)} />
                            <WebhookFormModal webhook={webhook} onSave={fetchWebhooks}>
                                <Button variant="ghost" size="icon"><Pencil className='h-4 w-4' /></Button>
                            </WebhookFormModal>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(webhook.id!)}><Trash2 className='h-4 w-4' /></Button>
                        </div>
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

    