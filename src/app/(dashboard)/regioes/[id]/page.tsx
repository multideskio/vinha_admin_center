
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Palette,
  Type,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';

const regionProfileSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'O nome da região é obrigatório.'),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, 'A cor deve estar no formato hexadecimal.'),
});

type RegionProfile = z.infer<typeof regionProfileSchema>;

// Mock data, em um cenário real, viria de uma API com base no [id]
const regionData: RegionProfile = {
  id: 'reg-01',
  name: 'Sul',
  color: '#3b82f6',
};

export default function RegionProfilePage() {
  const form = useForm<RegionProfile>({
    resolver: zodResolver(regionProfileSchema),
    defaultValues: regionData,
  });

  const onSubmit = (data: RegionProfile) => {
    console.log('Dados da região atualizados:', data);
    // Aqui iria a lógica para submeter os dados para a API
  };
  
  const selectedColor = form.watch('color');

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Coluna da Esquerda: Card de Visualização */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Visualização da Região</CardTitle>
            <CardDescription>Veja como a tag da região será exibida.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-6 text-center">
            <div
              className="mb-4 flex h-24 w-24 items-center justify-center rounded-full"
              style={{ backgroundColor: selectedColor || regionData.color }}
            >
                <Palette className="h-12 w-12 text-white" />
            </div>
            <h2 className="mt-4 text-xl font-semibold">
              {form.watch('name') || regionData.name}
            </h2>
            <p className="text-muted-foreground">Região</p>
          </CardContent>
        </Card>
      </div>

      {/* Coluna da Direita: Formulário de Edição */}
      <div className="lg:col-span-2">
        <Card>
            <CardHeader>
                <CardTitle>Editar Região</CardTitle>
                <CardDescription>Altere o nome e a cor de identificação da região.</CardDescription>
            </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Região</FormLabel>
                      <FormControl>
                        <div className="relative">
                            <Type className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="Ex: Sudeste" className="pl-9" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor de Identificação</FormLabel>
                      <FormControl>
                        <div className="relative">
                            <Input type="color" className="p-1 h-14" {...field} />
                        </div>
                      </FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Separator />

                <div className="flex justify-end">
                  <Button type="submit">Salvar Alterações</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
