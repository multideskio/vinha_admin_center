
'use client';

import * as React from 'react';
import { PlusCircle, MoreHorizontal, Globe, KeyRound, Trash2, Pencil, RefreshCw } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

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


const webhookSchema = z.object({
    id: z.string().optional(),
    url: z.string().url({ message: "Por favor, insira uma URL válida." }),
    secret: z.string().min(1, "O segredo é obrigatório."),
    events: z.array(z.string()).refine((value) => value.some((item) => item), {
      message: "Você deve selecionar pelo menos um evento.",
    }),
});

type Webhook = z.infer<typeof webhookSchema>;

const availableEvents = [
    { id: 'transacao.criada', label: 'Transação Criada' },
    { id: 'transacao.aprovada', label: 'Transação Aprovada' },
    { id: 'transacao.recusada', label: 'Transação Recusada' },
    { id: 'usuario.criado', label: 'Usuário Criado' },
    { id: 'usuario.atualizado', label: 'Usuário Atualizado' },
]

const WebhookFormModal = ({ onSave, children }: { onSave: (data: Webhook) => void; children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const form = useForm<Webhook>({
        resolver: zodResolver(webhookSchema),
        defaultValues: {
            url: '',
            secret: '',
            events: [],
        },
    });

    const generateSecret = () => {
        const secret = `whsec_${[...Array(32)].map(() => Math.random().toString(36)[2]).join('')}`;
        form.setValue('secret', secret);
    }
    
    const onSubmit = (data: Webhook) => {
        onSave(data);
        form.reset();
        setIsOpen(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Adicionar Novo Webhook</DialogTitle>
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
                                        <Input placeholder="whsec_..." {...field} />
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
                            <Button type="submit">Salvar Webhook</Button>
                         </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default function WebhooksPage() {
    const [webhooks, setWebhooks] = React.useState<Webhook[]>([]);

    const handleSaveWebhook = (data: Webhook) => {
        setWebhooks(prev => [...prev, { ...data, id: `wh_${Date.now()}` }]);
    };
  
    return (
    <div className="grid gap-6">
        <div className='flex items-center justify-between'>
            <div>
                <CardTitle>Webhooks de Saída</CardTitle>
                <CardDescription>
                Gerencie os endpoints que recebem eventos do seu sistema.
                </CardDescription>
            </div>
            <WebhookFormModal onSave={handleSaveWebhook}>
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
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                        Nenhum webhook configurado.
                    </TableCell>
                </TableRow>
              ) : webhooks.map((webhook) => (
                <TableRow key={webhook.id}>
                    <TableCell className='font-medium'>
                        <div className='flex items-center gap-2'>
                           <Globe className='h-4 w-4 text-muted-foreground' />
                           <span>{webhook.url}</span> 
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className='flex flex-wrap gap-1'>
                            {webhook.events.map(event => (
                                <Badge key={event} variant="secondary">{event}</Badge>
                            ))}
                        </div>
                    </TableCell>
                    <TableCell>
                        <Button variant="ghost" size="icon"><Pencil className='h-4 w-4' /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className='h-4 w-4' /></Button>
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
