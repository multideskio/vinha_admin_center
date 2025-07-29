
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Upload } from 'lucide-react';

export default function GeneralSettingsPage() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais</CardTitle>
          <CardDescription>
            Ajustes gerais da plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-2">
            <Label htmlFor="appName">Nome da Aplicação</Label>
            <Input id="appName" defaultValue="Vinha Ministérios" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supportEmail">E-mail de Suporte</Label>
            <Input id="supportEmail" type="email" defaultValue="suporte@vinha.com" />
          </div>
          <div className="space-y-2">
            <Label>Logo da Aplicação</Label>
            <div className="flex items-center justify-center w-full">
                <Label htmlFor="logo-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                            <span className="font-semibold">Clique para enviar</span> ou arraste e solte
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG ou SVG (max. 800x400px)</p>
                    </div>
                    <Input id="logo-upload" type="file" className="hidden" />
                </Label>
            </div>
          </div>
          <div className="flex items-center space-x-2 pt-4">
              <Switch id="maintenance-mode" />
              <Label htmlFor="maintenance-mode">Ativar modo de manutenção</Label>
          </div>
        </CardContent>
        <CardContent>
             <Button>Salvar Alterações</Button>
        </CardContent>
      </Card>
    </div>
  );
}
