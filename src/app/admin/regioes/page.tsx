
'use client';

import * as React from 'react';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const regionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'O nome da região é obrigatório.'),
  color: z
    .string()
    .min(7, { message: 'A cor deve estar no formato hexadecimal.' })
    .regex(/^#[0-9a-fA-F]{6}$/, {
      message: 'Cor inválida. Use o formato #RRGGBB.',
    }),
});

export type Region = z.infer<typeof regionSchema> & {
    companyId?: string | null;
    deletedAt?: Date | null;
    deletedBy?: string | null;
    createdAt?: Date;
    updatedAt?: Date | null;
};

const RegionFormModal = ({
  region,
  onSave,
  children,
}: {
  region?: Region;
  onSave: () => void;
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof regionSchema>>({
    resolver: zodResolver(regionSchema),
    defaultValues: region || {
      name: '',
      color: '#000000',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset(
        region || {
          name: '',
          color: '#000000',
        }
      );
    }
  }, [isOpen, region, form]);

  const handleSave = async (data: z.infer<typeof regionSchema>) => {
    const method = data.id ? 'PUT' : 'POST';
    const url = data.id ? `/api/v1/regioes/${data.id}` : '/api/v1/regioes';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar a região.');
      }

      toast({
        title: 'Sucesso!',
        description: `Região ${data.id ? 'atualizada' : 'criada'} com sucesso.`,
        variant: 'success',
      });
      onSave();
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar região',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{region ? 'Editar Região' : 'Nova Região'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSave)}
            className="space-y-4"
          >
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
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor da Região</FormLabel>
                  <FormControl>
                    <Input type="color" {...field} className="h-10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default function RegioesPage() {
  const [regions, setRegions] = React.useState<Region[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  const fetchRegions = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/regioes');
      if (!response.ok) {
        throw new Error('Falha ao buscar as regiões');
      }
      const data = await response.json();
      setRegions(data.regions);
    } catch (error: any) {
       toast({
        title: 'Erro ao buscar regiões',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/regioes/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Falha ao excluir a região');
      }
      toast({
        title: 'Sucesso!',
        description: 'Região excluída com sucesso.',
        variant: 'success',
      });
      fetchRegions();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir região',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Regiões
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as regiões e suas respectivas cores.
          </p>
        </div>
        <RegionFormModal onSave={fetchRegions}>
          <Button size="sm" className="gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Nova Região
            </span>
          </Button>
        </RegionFormModal>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cor</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-6 w-6 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                ))
              ) : (
                regions.map((region) => (
                  <TableRow key={region.id}>
                    <TableCell>
                      <div
                        className="h-6 w-6 rounded-full border"
                        style={{ backgroundColor: region.color }}
                      ></div>
                    </TableCell>
                    <TableCell className="font-medium">{region.name}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <RegionFormModal
                            region={region}
                            onSave={fetchRegions}
                          >
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                            >
                              Editar
                            </DropdownMenuItem>
                          </RegionFormModal>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-red-500"
                                onSelect={(e) => e.preventDefault()}
                              >
                                Excluir
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Você tem certeza?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Essa ação não pode ser desfeita. Isso excluirá
                                  permanentemente a região.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(region.id!)}
                                >
                                  Sim, excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
