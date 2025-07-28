
'use client';

import * as React from 'react';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
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
  } from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from '@/components/ui/date-range-picker';

type Region = {
  id: string;
  name: string;
  color: string;
  monthlyRevenue: number;
};

const initialRegions: Region[] = [
  { id: 'reg-01', name: 'Sul', color: '#3b82f6', monthlyRevenue: 12500.00 },
  { id: 'reg-02', name: 'Sudeste', color: '#16a34a', monthlyRevenue: 25000.00 },
  { id: 'reg-03', name: 'Centro-Oeste', color: '#f97316', monthlyRevenue: 8900.50 },
  { id: 'reg-04', name: 'Norte', color: '#ef4444', monthlyRevenue: 5500.00 },
  { id: 'reg-05', name: 'Nordeste', color: '#8b5cf6', monthlyRevenue: 18750.75 },
];

const RegionFormModal = ({
    onSave,
    children,
  }: {
    onSave: (name: string, color: string) => void;
    children: React.ReactNode;
  }) => {
    const [name, setName] = React.useState('');
    const [color, setColor] = React.useState('#000000');
    const [isOpen, setIsOpen] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setName('');
            setColor('#000000');
        }
    }, [isOpen])

    const handleSave = () => {
      onSave(name, color);
      setIsOpen(false)
    };

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nova Região</DialogTitle>
            <DialogDescription>
              Preencha os dados da nova região.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">
                Cor
              </Label>
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="col-span-3 p-1"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };


export default function RegioesPage() {
    const [regions, setRegions] = React.useState<Region[]>(initialRegions);


    const handleSave = (name: string, color: string) => {
        const newRegion: Region = {
            id: `reg-${Date.now()}`,
            name,
            color,
            monthlyRevenue: 0, // Initial revenue for a new region
        };
        setRegions([...regions, newRegion]);
    };

      const handleDelete = (regionId: string) => {
        setRegions(regions.filter(r => r.id !== regionId));
      }


  return (
    <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Regiões
            </h1>
            <div className='flex items-center gap-2'>
                <DateRangePicker />
                <RegionFormModal onSave={handleSave}>
                    <Button size="sm" className="gap-1">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Nova Região
                        </span>
                    </Button>
                </RegionFormModal>
            </div>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Regiões</CardTitle>
          <CardDescription>
            Gerencie as regiões da sua associação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Cor</TableHead>
                <TableHead className='text-right'>Arrecadação no Mês</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regions.map((region) => (
                <TableRow key={region.id}>
                  <TableCell className="font-medium">{region.name}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge style={{ backgroundColor: region.color, color: 'white' }} className="px-2 py-1 text-xs">
                        Tag
                    </Badge>
                  </TableCell>
                  <TableCell className='text-right'>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(region.monthlyRevenue)}
                  </TableCell>
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
                        <DropdownMenuItem asChild>
                           <Link href={`/regioes/${region.id}`}>Editar</Link>
                        </DropdownMenuItem>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <button className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-red-600">
                                    Excluir
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Essa ação não pode ser desfeita. Isso excluirá permanentemente a região.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(region.id)}>Continuar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
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
