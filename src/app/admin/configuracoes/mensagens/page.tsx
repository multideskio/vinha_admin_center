
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

export default function MessagesSettingsPage() {
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Mensagens Automáticas</CardTitle>
                    <CardDescription>
                        Personalize as mensagens automáticas enviadas aos usuários. Use <code className='bg-muted text-muted-foreground px-1 py-0.5 rounded'>{'{{nome}}'}</code> para inserir o nome do usuário.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="boasVindas">
                        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto">
                            <TabsTrigger value="boasVindas">Boas-Vindas</TabsTrigger>
                            <TabsTrigger value="lembretes">Lembretes</TabsTrigger>
                            <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
                        </TabsList>
                        <TabsContent value="boasVindas" className="mt-4">
                            <div className='space-y-2'>
                                <Label>Mensagem de Boas-Vindas</Label>
                                <Textarea defaultValue={'Olá {{nome}}, seja bem-vindo(a) à nossa plataforma! Estamos felizes em ter você conosco.'} rows={5} />
                            </div>
                        </TabsContent>
                        <TabsContent value="lembretes" className="mt-4 space-y-6">
                            <div className='space-y-2'>
                                <Label>1º Lembrete de Pagamento (Ex: 5 dias antes)</Label>
                                <Textarea defaultValue={'Olá {{nome}}, passando para lembrar que sua contribuição vencerá em breve. Deus abençoe!'} rows={4} />
                            </div>
                            <div className='space-y-2'>
                                <Label>2º Lembrete de Pagamento (Ex: 1 dia antes)</Label>
                                <Textarea defaultValue={'Olá {{nome}}, sua contribuição vence amanhã! Contamos com você.'} rows={4} />
                            </div>
                        </TabsContent>
                        <TabsContent value="pagamentos" className="mt-4 space-y-6">
                            <div className='space-y-2'>
                                <Label>Pagamento Realizado com Sucesso</Label>
                                <Textarea defaultValue={'Olá {{nome}}, recebemos sua contribuição com gratidão. Que o Senhor te retribua!'} rows={4} />
                            </div>
                            <div className='space-y-2'>
                                <Label>1ª Mensagem de Atraso (Ex: 1 dia após)</Label>
                                <Textarea defaultValue={'Olá {{nome}}, notamos que sua contribuição está pendente. Se precisar de ajuda, entre em contato conosco.'} rows={4} />
                            </div>
                             <div className='space-y-2'>
                                <Label>2ª Mensagem de Atraso (Ex: 5 dias após)</Label>
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
