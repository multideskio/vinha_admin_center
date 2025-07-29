
'use client';

import * as React from 'react';
import { PlusCircle, MoreHorizontal, Trash2, Pencil, ToggleLeft, ToggleRight, Info } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';

const notificationRuleSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "O nome da automação é obrigatório."),
    eventTrigger: z.enum(['user_registered', 'payment_received', 'payment_due_reminder', 'payment_overdue']),
    daysOffset: z.coerce.number().int(),
    messageTemplate: z.string().min(1, "O modelo da mensagem é obrigatório."),
    isActive: z.boolean().default(true),
});

type NotificationRule = z.infer<typeof notificationRuleSchema>;

const initialRules: NotificationRule[] = [
    { id: 'rule-1', name: 'Boas-Vindas', eventTrigger: 'user_registered', daysOffset: 0, messageTemplate: 'Olá {nome}, seja bem-vindo(a) à nossa plataforma! Estamos felizes em ter você conosco.', isActive: true },
    { id: 'rule-2', name: 'Lembrete (5 dias antes)', eventTrigger: 'payment_due_reminder', daysOffset: -5, messageTemplate: 'Olá {nome}, passando para lembrar que sua contribuição vencerá em 5 dias. Deus abençoe!', isActive: true },
    { id: 'rule-3', name: 'Aviso de Atraso (3 dias depois)', eventTrigger: 'payment_overdue', daysOffset: 3, messageTemplate: 'Olá {nome}}, notamos que sua contribuição está pendente. Se precisar de ajuda, entre em contato conosco.', isActive: false },
    { id: 'rule-4', name: 'Pagamento Confirmado', eventTrigger: 'payment_received', daysOffset: 0, messageTemplate: 'Olá {nome}, recebemos sua contribuição no valor de R${valor} com gratidão. Que o Senhor te retribua!', isActive: true },
];

const eventTriggerOptions = {
    'user_registered': 'Novo Usuário Cadastrado',
    'payment_received': 'Pagamento Recebido',
    'payment_due_reminder': 'Lembrete de Vencimento',
    'payment_overdue': 'Aviso de Atraso'
};

const NotificationFormModal = ({ rule, onSave, children }: { rule?: NotificationRule, onSave: (data: NotificationRule) => void; children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const form = useForm<NotificationRule>({
        resolver: zodResolver(notificationRuleSchema),
        defaultValues: rule || {
            name: '',
            eventTrigger: 'payment_due_reminder',
            daysOffset: 0,
            messageTemplate: '',
            isActive: true,
        },
    });

    React.useEffect(() => {
        if(isOpen) {
            form.reset(rule || { name: '', eventTrigger: 'payment_due_reminder', daysOffset: 0, messageTemplate: '', isActive: true });
        }
    }, [isOpen, rule, form]);
    
    const onSubmit = (data: NotificationRule) => {
        onSave(data);
        setIsOpen(false);
    }

    const eventTrigger = form.watch('eventTrigger');

    const renderDaysOffsetLabel = () => {
        switch(eventTrigger) {
            case 'payment_due_reminder': return 'Dias ANTES do Vencimento';
            case 'payment_overdue': return 'Dias APÓS o Vencimento';
            default: return 'Dias de Atraso (0 para imediato)';
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{rule ? 'Editar Automação' : 'Nova Automação de Mensagem'}</DialogTitle>
                    <DialogDescription>
                        Crie regras para enviar mensagens automaticamente com base em eventos.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome da Automação</FormLabel>
                                <FormControl><Input placeholder="Ex: Lembrete de 5 dias" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <FormField control={form.control} name="eventTrigger" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Gatilho do Evento</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {Object.entries(eventTriggerOptions).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />
                             <FormField control={form.control} name="daysOffset" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{renderDaysOffsetLabel()}</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                </FormItem>
                            )} />
                        </div>
                        
                        <FormField control={form.control} name="messageTemplate" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Modelo da Mensagem</FormLabel>
                                <FormControl><Textarea placeholder="Olá {nome}, sua fatura de R${valor} vence em {dias} dias." rows={5} {...field} /></FormControl>
                                <FormDescription>
                                    Variáveis disponíveis: {'{nome}'}, {'{valor}'}, {'{data_vencimento}'}, {'{link_pagamento}'}.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />
                        
                         <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                            <Button type="submit">Salvar Automação</Button>
                         </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default function MessagesSettingsPage() {
    const [rules, setRules] = React.useState<NotificationRule[]>(initialRules);

    const handleSave = (data: NotificationRule) => {
        if(data.id) {
            setRules(rules.map(r => r.id === data.id ? data : r));
        } else {
            setRules([...rules, { ...data, id: `rule-${Date.now()}` }]);
        }
    };

    const handleDelete = (id: string) => {
        setRules(rules.filter(r => r.id !== id));
    }
  
    return (
    <div className="grid gap-6">
        <div className='flex items-center justify-between'>
            <div>
                <CardTitle>Mensagens Automáticas</CardTitle>
                <CardDescription>
                Gerencie as regras de comunicação com os usuários.
                </CardDescription>
            </div>
            <NotificationFormModal onSave={handleSave}>
                <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Adicionar Mensagem
                </Button>
            </NotificationFormModal>
        </div>
      
        <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
                As mensagens são enviadas com base nos gatilhos definidos. Lembretes usam números negativos para "dias antes" (ex: -5) e avisos usam números positivos.
            </AlertDescription>
        </Alert>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Gatilho</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        Nenhuma automação de mensagem criada.
                    </TableCell>
                </TableRow>
              ) : rules.map((rule) => (
                <TableRow key={rule.id}>
                    <TableCell className='font-medium'>{rule.name}</TableCell>
                    <TableCell>
                        <div className='flex flex-col'>
                            <span>{eventTriggerOptions[rule.eventTrigger as keyof typeof eventTriggerOptions]}</span>
                            <span className='text-xs text-muted-foreground'>
                                {
                                 rule.eventTrigger === 'payment_due_reminder' ? `${Math.abs(rule.daysOffset)} dias antes` : 
                                 rule.eventTrigger === 'payment_overdue' ? `${rule.daysOffset} dias após` : `Imediato`
                                }
                            </span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant={rule.isActive ? 'success' : 'secondary'}>
                            {rule.isActive ? 'Ativa' : 'Inativa'}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <div className='flex items-center gap-2'>
                            <Switch checked={rule.isActive} onCheckedChange={(checked) => handleSave({ ...rule, isActive: checked })} />
                            <NotificationFormModal rule={rule} onSave={handleSave}>
                                <Button variant="ghost" size="icon"><Pencil className='h-4 w-4' /></Button>
                            </NotificationFormModal>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(rule.id!)}><Trash2 className='h-4 w-4' /></Button>
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
