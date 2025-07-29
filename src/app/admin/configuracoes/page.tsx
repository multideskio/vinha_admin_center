
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Smartphone, Bot } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


export default function SettingsPage() {
  return (
    <div className="grid gap-8">
       <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais</CardTitle>
          <CardDescription>
            Ajustes gerais da plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="appName">Nome da Aplicação</Label>
              <Input id="appName" defaultValue="Vinha Ministérios" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="supportEmail">E-mail de Suporte</Label>
              <Input id="supportEmail" type="email" defaultValue="suporte@vinha.com" />
            </div>
            <div className="flex items-center space-x-2">
                <Switch id="maintenance-mode" />
                <Label htmlFor="maintenance-mode">Ativar modo de manutenção</Label>
            </div>
          </form>
        </CardContent>
        <CardContent>
             <Button>Salvar Alterações</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className='flex items-center gap-2'>
                <Mail className='h-5 w-5' />
                Configuração de SMTP
            </CardTitle>
            <CardDescription>
                Configure o serviço para envio de e-mails transacionais (ex: Amazon SES, SendGrid).
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                    <Label>Servidor SMTP</Label>
                    <Input placeholder='email-smtp.us-east-1.amazonaws.com' />
                </div>
                <div className='space-y-2'>
                    <Label>Porta</Label>
                    <Input placeholder='587' />
                </div>
                <div className='space-y-2'>
                    <Label>Usuário SMTP</Label>
                    <Input placeholder='Seu usuário SMTP' />
                </div>
                <div className='space-y-2'>
                    <Label>Senha SMTP</Label>
                    <Input type='password' placeholder='Sua senha SMTP' />
                </div>
           </div>
            <div className="flex items-center space-x-2">
                <Switch id="smtp-secure" />
                <Label htmlFor="smtp-secure">Usar conexão segura (SSL/TLS)</Label>
            </div>
             <div className='flex justify-end'>
                <Button>Salvar Configurações de SMTP</Button>
            </div>
        </CardContent>
      </Card>

        <Card>
        <CardHeader>
            <CardTitle className='flex items-center gap-2'>
                <Smartphone className='h-5 w-5' />
                Configuração do WhatsApp
            </CardTitle>
            <CardDescription>
                Configure as credenciais para integração com a API do WhatsApp.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className='space-y-4'>
                <div className='space-y-2'>
                    <Label>URL da API</Label>
                    <Input placeholder='https://api.seuservico.com/send' />
                </div>
                <div className='space-y-2'>
                    <Label>API Key</Label>
                    <Input type='password' placeholder='Sua chave de API secreta' />
                </div>
                 <div className='flex justify-end'>
                    <Button>Salvar Configurações do WhatsApp</Button>
                </div>
           </div>
            <Separator />
             <div>
                <h3 className="text-lg font-medium mb-2">Testar Envio</h3>
                <div className='space-y-4'>
                     <div className='space-y-2'>
                        <Label>Número de Telefone (com DDI)</Label>
                        <Input placeholder='Ex: 5562981154120' />
                    </div>
                     <div className='space-y-2'>
                        <Label>Mensagem</Label>
                        <Textarea placeholder='Digite sua mensagem de teste...' />
                    </div>
                    <div className='flex justify-end'>
                        <Button variant="outline">Testar Envio</Button>
                    </div>
                </div>
           </div>
        </CardContent>
      </Card>

        <Card>
        <CardHeader>
            <CardTitle className='flex items-center gap-2'>
                <Bot className='h-5 w-5' />
                Mensagens Automáticas
            </CardTitle>
            <CardDescription>
                Personalize as mensagens automáticas enviadas aos usuários. Use <code className='bg-muted text-muted-foreground px-1 py-0.5 rounded'>&#123;nome&#125;</code> para inserir o nome do usuário.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="boasVindas">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="boasVindas">Boas-Vindas</TabsTrigger>
                    <TabsTrigger value="lembretes">Lembretes</TabsTrigger>
                    <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
                </TabsList>
                <TabsContent value="boasVindas" className="mt-4">
                    <div className='space-y-2'>
                        <Label>Mensagem de Boas-Vindas</Label>
                        <Textarea defaultValue={'Olá {nome}, seja bem-vindo(a) à nossa plataforma! Estamos felizes em ter você conosco.'} rows={5} />
                    </div>
                </TabsContent>
                <TabsContent value="lembretes" className="mt-4 space-y-6">
                    <div className='space-y-2'>
                        <Label>1º Lembrete de Pagamento (Ex: 5 dias antes)</Label>
                        <Textarea defaultValue={'Olá {nome}, passando para lembrar que sua contribuição vencerá em breve. Deus abençoe!'} rows={4} />
                    </div>
                     <div className='space-y-2'>
                        <Label>2º Lembrete de Pagamento (Ex: 1 dia antes)</Label>
                        <Textarea defaultValue={'Olá {nome}, sua contribuição vence amanhã! Contamos com você.'} rows={4} />
                    </div>
                </TabsContent>
                <TabsContent value="pagamentos" className="mt-4 space-y-6">
                    <div className='space-y-2'>
                        <Label>Mensagem de Pagamento Realizado</Label>
                        <Textarea defaultValue={'Olá {nome}, recebemos sua contribuição com gratidão. Que o Senhor te retribua!'} rows={4} />
                    </div>
                    <div className='space-y-2'>
                        <Label>1ª Mensagem de Atraso (Ex: 1 dia após)</Label>
                        <Textarea defaultValue={'Olá {nome}, notamos que sua contribuição está pendente. Se precisar de ajuda, entre em contato conosco.'} rows={4} />
                    </div>
                    <div className='space-y-2'>
                        <Label>2ª Mensagem de Atraso (Ex: 5 dias após)</Label>
                        <Textarea defaultValue={'Olá {nome}, sua contribuição ainda está pendente. Sua fidelidade é muito importante para a obra.'} rows={4} />
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
