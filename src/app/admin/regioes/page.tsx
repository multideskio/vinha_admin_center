
'use client';

import * as React from 'react';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
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
  id: z.string().optional(),
  name: z.string().min(1, 'O nome da região é obrigatório.'),
  managerId: z.string({ required_error: 'Selecione um gerente.' }),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, { message: 'Cor inválida.'}),
});

type Region = z.infer<typeof regionSchema>;

const initialRegions: (Region & { manager: string; churches: number })[] = [
  {
    id: 'reg-01',
    name: 'Sul',
    manager: 'João Silva',
    churches: 15,
    managerId: 'mgr-01',
    color: '#3b82f6',
  },
  {
    id: 'reg-02',
    name: 'Sudeste',
    manager: 'Maria Oliveira',
    churches: 35,
    managerId: 'mgr-02',
    color: '#16a34a',
  },
  {
    id: 'reg-03',
    name: 'Centro-Oeste',
    manager: 'Paulo Ferreira',
    churches: 10,
    managerId: 'mgr-03',
    color: '#f97316',
  },
];

const managers = [
  { id: 'mgr-01', name: 'João Silva' },
  { id: 'mgr-02', name: 'Maria Oliveira' },
  { id: 'mgr-03', name: 'Paulo Ferreira' },
];

const RegionFormModal = ({ onSave, children }: { onSave: (data: Region) => void; children: React.ReactNode; }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const form = useForm<Region>({
      resolver: zodResolver(regionSchema),
      defaultValues: { name: '', managerId: undefined, color: '#000000' },
    });
  
    const handleSave = (data: Region) => {
      onSave(data);
      setIsOpen(false);
      form.reset();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>{children}</DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Região</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Região</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Nordeste" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                 <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor da Região</FormLabel>
                      <FormControl>
                        <Input type='color' {...field} className='h-10' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" type="button">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit">Salvar</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      );
}

export default function RegioesPage() {
    const [regions, setRegions] = React.useState(initialRegions);

    const handleSave = (data: Region) => {
        const newRegion = {
            ...data,
            id: `reg-${Date.now()}`,
            manager: managers.find(m => m.id === data.managerId)?.name || 'N/A',
            churches: 0,
        };
        setRegions([...regions, newRegion]);
    }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Regiões
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as regiões e seus respectivos gerentes.
          </p>
        </div>
        <RegionFormModal onSave={handleSave}>
            <Button size="sm" className="gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Nova Região
            </span>
            </Button>
        </RegionFormModal>
      </div>

      <Card>
        <CardContent className='pt-6'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cor</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Gerente Responsável</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regions.map((region) => (
                <TableRow key={region.id}>
                  <TableCell>
                    <div className='h-6 w-6 rounded-full border' style={{ backgroundColor: region.color }}></div>
                  </TableCell>
                  <TableCell className="font-medium">{region.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {region.manager}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link href={`/admin/regioes/${region.id}`}>Editar</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
