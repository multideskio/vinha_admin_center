
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

export default function SettingsPage() {
  return (
    <div className="grid gap-6">
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
            <CardTitle>Integrações</CardTitle>
            <CardDescription>
                Gerencie suas integrações com serviços externos.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Label>Google Analytics</Label>
                    <p className='text-sm text-muted-foreground'>Integração para análise de tráfego.</p>
                </div>
                <Button variant="outline">Conectar</Button>
            </div>
             <Separator />
             <div className="flex items-center justify-between">
                <div>
                    <Label>Mailchimp</Label>
                    <p className='text-sm text-muted-foreground'>Integração para marketing por e-mail.</p>
                </div>
                <Button variant="outline">Conectar</Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
