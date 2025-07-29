
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

export default function WhatsappSettingsPage() {
    return (
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
        </div>
    );
}
