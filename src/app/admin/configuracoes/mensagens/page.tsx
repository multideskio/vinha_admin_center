
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function MessagesSettingsPage() {
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Mensagens Automáticas</CardTitle>
                    <CardDescription>
                        Personalize as mensagens e configure quando elas devem ser enviadas. Use variáveis como <code className='bg-muted text-muted-foreground px-1 py-0.5 rounded'>{'{{nome}}'}</code>, <code className='bg-muted text-muted-foreground px-1 py-0.5 rounded'>{'{{valor}}'}</code> ou <code className='bg-muted text-muted-foreground px-1 py-0.5 rounded'>{'{{pedido}}'}</code> para inserir dados dinâmicos.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="boasVindas">
                        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto">
                            <TabsTrigger value="boasVindas">Boas-Vindas</TabsTrigger>
                            <TabsTrigger value="lembretes">Lembretes de Pagamento</TabsTrigger>
                            <TabsTrigger value="pagamentos">Confirmação e Atraso</TabsTrigger>
                        </TabsList>

                        <TabsContent value="boasVindas" className="mt-4">
                            <div className='space-y-2 rounded-lg border p-4'>
                                <Label className="text-base font-semibold">Mensagem de Boas-Vindas</Label>
                                <p className="text-sm text-muted-foreground">Enviada assim que um novo membro se cadastra.</p>
                                <Textarea defaultValue={'Olá {{nome}}, seja bem-vindo(a) à nossa plataforma! Estamos felizes em ter você conosco.'} rows={4} className="mt-2" />
                            </div>
                        </TabsContent>

                        <TabsContent value="lembretes" className="mt-4 space-y-6">
                            <div className='space-y-4 rounded-lg border p-4'>
                                <Label className="text-base font-semibold">1º Lembrete de Pagamento</Label>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm text-muted-foreground">Enviar</p>
                                    <Input type="number" defaultValue="5" className="w-16" />
                                    <Select defaultValue="dias">
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="dias">dias</SelectItem>
                                            <SelectItem value="semanas">semanas</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm text-muted-foreground">antes do vencimento.</p>
                                </div>
                                <Textarea defaultValue={'Olá {{nome}}, passando para lembrar que sua contribuição vencerá em breve. Deus abençoe!'} rows={4} />
                            </div>
                            <div className='space-y-4 rounded-lg border p-4'>
                                <Label className="text-base font-semibold">2º Lembrete de Pagamento</Label>
                                 <div className="flex items-center gap-2">
                                    <p className="text-sm text-muted-foreground">Enviar</p>
                                    <Input type="number" defaultValue="1" className="w-16" />
                                    <Select defaultValue="dias">
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="dias">dias</SelectItem>
                                            <SelectItem value="semanas">semanas</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm text-muted-foreground">antes do vencimento.</p>
                                </div>
                                <Textarea defaultValue={'Olá {{nome}}, sua contribuição vence amanhã! Contamos com você.'} rows={4} />
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="pagamentos" className="mt-4 space-y-6">
                            <div className='space-y-2 rounded-lg border p-4'>
                                <Label className="text-base font-semibold">Pagamento Realizado com Sucesso</Label>
                                <p className="text-sm text-muted-foreground">Enviada imediatamente após a confirmação do pagamento.</p>
                                <Textarea defaultValue={'Olá {{nome}}, recebemos sua contribuição com gratidão. Que o Senhor te retribua!'} rows={4} className="mt-2" />
                            </div>
                            <div className='space-y-4 rounded-lg border p-4'>
                                <Label className="text-base font-semibold">1º Aviso de Atraso</Label>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm text-muted-foreground">Enviar</p>
                                    <Input type="number" defaultValue="1" className="w-16" />
                                     <Select defaultValue="dias">
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="dias">dias</SelectItem>
                                            <SelectItem value="semanas">semanas</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm text-muted-foreground">após o vencimento.</p>
                                </div>
                                <Textarea defaultValue={'Olá {{nome}}, notamos que sua contribuição está pendente. Se precisar de ajuda, entre em contato conosco.'} rows={4} />
                            </div>
                             <div className='space-y-4 rounded-lg border p-4'>
                                <Label className="text-base font-semibold">2º Aviso de Atraso</Label>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm text-muted-foreground">Enviar</p>
                                    <Input type="number" defaultValue="5" className="w-16" />
                                    <Select defaultValue="dias">
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="dias">dias</SelectItem>
                                            <SelectItem value="semanas">semanas</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm text-muted-foreground">após o vencimento.</p>
                                </div>
                                <Textarea defaultValue={'Olá {{nome}}, sua contribuição ainda está pendente. Sua fidelidade é muito importante para a obra.'} rows={4} />
                            </div>
                        </TabsContent>
                    </Tabs>
                    <div className='flex justify-end mt-6'>
                        <Button>Salvar Mensagens</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
