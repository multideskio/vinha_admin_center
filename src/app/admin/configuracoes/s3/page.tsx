
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function S3SettingsPage() {
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Configuração de Armazenamento (S3)</CardTitle>
                    <CardDescription>
                        Configure o provedor de armazenamento de objetos (ex: AWS S3, MinIO) para salvar arquivos.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='space-y-2'>
                            <Label>Endpoint</Label>
                            <Input placeholder='s3.amazonaws.com' />
                        </div>
                        <div className='space-y-2'>
                            <Label>Nome do Bucket</Label>
                            <Input placeholder='seu-bucket-aqui' />
                        </div>
                        <div className='space-y-2'>
                            <Label>Região</Label>
                            <Input placeholder='us-east-1' />
                        </div>
                         <div className='space-y-2'>
                            <Label>Access Key ID</Label>
                            <Input type='password' placeholder='Sua Access Key' />
                        </div>
                         <div className='space-y-2 md:col-span-2'>
                            <Label>Secret Access Key</Label>
                            <Input type='password' placeholder='Sua Secret Access Key' />
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                        <Switch id="force-path-style" />
                        <Label htmlFor="force-path-style">
                            Forçar estilo de caminho (Use para MinIO)
                        </Label>
                    </div>
                    <div className='flex justify-end'>
                        <Button>Salvar Configurações de S3</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
