
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const regionSchema = z.object({
  name: z.string().min(1, 'O nome da região é obrigatório.'),
  managerId: z.string({ required_error: 'Selecione um gerente.' }),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida.'),
});

type RegionForm = z.infer<typeof regionSchema>;

const regionData: RegionForm = {
    name: 'Sudeste',
    managerId: 'mgr-02',
    color: '#16a34a'
};

const managers = [
  { id: 'mgr-01', name: 'João Silva' },
  { id: 'mgr-02', name: 'Maria Oliveira' },
  { id: 'mgr-03', name: 'Paulo Ferreira' },
];

export default function RegionEditPage() {
  const form = useForm<RegionForm>({
    resolver: zodResolver(regionSchema),
    defaultValues: regionData,
  });

  const onSubmit = (data: RegionForm) => {
    console.log(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar Região</CardTitle>
        <CardDescription>
          Altere as informações da região abaixo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nome da Região</FormLabel>
                    <FormControl>
                        <Input {...field} />
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
                    <FormLabel>Cor da Região</FormLabel>
                    <FormControl>
                        <Input type="color" {...field} className='h-10' />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
              control={form.control}
              name="managerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gerente Responsável</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um gerente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {managers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
                <Button variant="outline" type="button">Cancelar</Button>
                <Button type="submit">Salvar Alterações</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
