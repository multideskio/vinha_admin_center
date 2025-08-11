
'use client';

import * as React from 'react';
import { PlusCircle, MoreHorizontal, KeyRound, Copy, Trash2, Eye, EyeOff } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

// Mock data. This should be replaced with API data.
const apiKeys = [
    { id: '1', name: 'Chave Principal (Servidor)', key: 'vma_sk_....1234', lastUsed: '2 horas atrás', createdAt: '15/07/2024', status: 'active' },
    { id: '2', name: 'Integração Contabilidade', key: 'vma_sk_....5678', lastUsed: '3 dias atrás', createdAt: '10/07/2024', status: 'active' },
    { id: '3', name: 'Chave Legada', key: 'vma_sk_....abcd', lastUsed: 'Nunca', createdAt: '01/01/2024', status: 'inactive' },
]

export default function ApiKeysPage() {
    const [isLoading, setIsLoading] = React.useState(true);
    const { toast } = useToast();

    React.useEffect(() => {
        // Simulating API fetch
        setTimeout(() => setIsLoading(false), 1000);
    }, []);

    const handleDelete = (id: string) => {
        toast({ title: "Ação não implementada", description: `A exclusão da chave ${id} será implementada.`});
    }

  return (
    <div className="grid gap-6">
        <div className='flex items-center justify-between'>
            <div>
                <CardTitle>Chaves de API</CardTitle>
                <CardDescription>
                Gerencie chaves de API para integrações e acesso seguro.
                </CardDescription>
            </div>
            <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Criar nova chave
            </Button>
        </div>
      
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Chave (Prefixo)</TableHead>
                <TableHead>Último Uso</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className='h-5 w-32' /></TableCell>
                        <TableCell><Skeleton className='h-5 w-48' /></TableCell>
                        <TableCell><Skeleton className='h-5 w-24' /></TableCell>
                        <TableCell><Skeleton className='h-5 w-24' /></TableCell>
                        <TableCell><Skeleton className='h-6 w-16 rounded-full' /></TableCell>
                        <TableCell><Skeleton className='h-8 w-8' /></TableCell>
                    </TableRow>
                ))
              ) : apiKeys.map((apiKey) => (
                <TableRow key={apiKey.id}>
                    <TableCell className='font-medium'>{apiKey.name}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
                            <span>{apiKey.key}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><Copy className='h-4 w-4'/></Button>
                        </div>
                    </TableCell>
                    <TableCell>{apiKey.lastUsed}</TableCell>
                    <TableCell>{apiKey.createdAt}</TableCell>
                    <TableCell>
                        <Badge variant={apiKey.status === 'active' ? 'success' : 'secondary'}>
                            {apiKey.status === 'active' ? 'Ativa' : 'Inativa'}
                        </Badge>
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
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem>{apiKey.status === 'active' ? 'Desativar' : 'Ativar'}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive" onSelect={e => e.preventDefault()}>Excluir Chave</DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta ação não pode ser desfeita. A exclusão permanente desta chave de API pode quebrar as integrações existentes.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(apiKey.id)}>Sim, excluir</AlertDialogAction>
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
