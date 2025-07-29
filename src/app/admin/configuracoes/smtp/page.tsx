
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

export default function SmtpSettingsPage() {
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Configuração de SMTP</CardTitle>
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
                    <Separator />
                    <div>
                        <h3 className="text-lg font-medium mb-2">Testar Envio de E-mail</h3>
                        <div className='space-y-4'>
                            <div className='space-y-2'>
                                <Label>E-mail de Destino</Label>
                                <Input type="email" placeholder='Ex: teste@vinha.com' />
                            </div>
                            <div className='flex justify-end'>
                                <Button variant="outline">Enviar E-mail de Teste</Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
