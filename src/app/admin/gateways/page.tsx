
'use client';

import * as React from 'react';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
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
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

type Gateway = {
    id: string;
    name: string;
    isActive: boolean;
    acceptedPaymentMethods: string | null;
    href: string;
}

export default function GatewaysPage() {
    const [gateways, setGateways] = React.useState<Gateway[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const { toast } = useToast();

    const fetchGateways = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/v1/gateways');
            if(!response.ok) throw new Error('Falha ao carregar gateways.');
            const data = await response.json();
            const formattedGateways = data.gateways.map((g: any) => ({
                id: g.id,
                name: g.gatewayName,
                isActive: g.isActive,
                acceptedPaymentMethods: g.acceptedPaymentMethods,
                href: `/admin/gateways/${g.gatewayName.toLowerCase()}`
            }));
            setGateways(formattedGateways);
        } catch(error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive'});
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    React.useEffect(() => {
        fetchGateways();
    }, [fetchGateways]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Gateways de Pagamento
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os gateways para processamento de transações.
          </p>
        </div>
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Novo Gateway
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Selecione um Gateway</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                    <Link href="/admin/gateways/cielo">Configurar Cielo</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/admin/gateways/bradesco">Configurar Bradesco</Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
             <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Nome</TableHead>
                 <TableHead>Tipos de Pagamento</TableHead>
                 <TableHead>Status</TableHead>
                 <TableHead>
                   <span className="sr-only">Ações</span>
                 </TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
                {Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                ))}
             </TableBody>
           </Table>
          ) : gateways.length > 0 ? (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipos de Pagamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                    <span className="sr-only">Ações</span>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {gateways.map((gateway) => (
                    <TableRow key={gateway.id}>
                    <TableCell className="font-medium">{gateway.name}</TableCell>
                    <TableCell className="text-muted-foreground">{gateway.acceptedPaymentMethods?.split(',').join(', ')}</TableCell>
                    <TableCell>
                        <Badge
                        variant={gateway.isActive ? 'success' : 'secondary'}
                        >
                        {gateway.isActive ? 'Ativo' : 'Inativo'}
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
                            <DropdownMenuItem asChild>
                                <Link href={gateway.href}>Configurar</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>{gateway.isActive ? 'Desativar' : 'Ativar'}</DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
          </Table>
          ) : (
            <div className="text-center text-muted-foreground p-12">
              <h3 className="text-lg font-semibold">Nenhum Gateway Encontrado</h3>
              <p>Clique em "Novo Gateway" para configurar um método de pagamento.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
