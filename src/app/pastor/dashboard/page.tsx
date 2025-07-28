
'use client';

import * as React from 'react';
import {
  User,
  Mail,
  Phone,
  Home,
  CalendarIcon,
  Clock,
  Pencil,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const pastorData = {
  firstName: 'Paulo',
  lastName: 'Ferreira',
  cpf: '037.628.391-23',
  birthDate: new Date('2007-02-14T00:00:00'),
  phone: '5562981154120',
  landline: '(00) 0000-0000',
  email: 'pastor@multidesk.io',
  cep: '75264230',
  state: 'GO',
  city: 'Senador Canedo',
  neighborhood: 'Terrabela Cerrado I',
  street: 'Rua RP 15',
  complement: '',
  number: '',
  titheDay: 10,
  facebook: 'https://facebook.com.br',
  instagram: 'https://instagram.com.br',
  website: 'https://website.com.br',
  supervisorId: 'sup-03',
};

const monthlyContributions = [
    { month: 'Jan', total: Math.floor(Math.random() * 500) + 200 },
    { month: 'Fev', total: Math.floor(Math.random() * 500) + 200 },
    { month: 'Mar', total: Math.floor(Math.random() * 500) + 200 },
    { month: 'Abr', total: Math.floor(Math.random() * 500) + 200 },
    { month: 'Mai', total: Math.floor(Math.random() * 500) + 200 },
    { month: 'Jun', total: Math.floor(Math.random() * 500) + 200 },
];

const InfoItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | undefined | null;
}) => (
  <div className="flex items-start gap-4">
    <Icon className="h-5 w-5 text-muted-foreground mt-1" />
    <div>
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-muted-foreground">{value || 'Não informado'}</p>
    </div>
  </div>
);

export default function PastorDashboardPage() {
  return (
    <div className="flex flex-col gap-8">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Dashboard do Pastor
            </h1>
            <p className="text-sm text-muted-foreground">
                Bem-vindo ao seu painel, Pastor {pastorData.firstName}.
            </p>
        </div>
        <Button asChild>
          <Link href="/pastor/perfil">
            <Pencil className="mr-2 h-4 w-4" />
            Editar Perfil
          </Link>
        </Button>
      </div>

        <div className="grid gap-8 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Suas Contribuições Mensais</CardTitle>
                    <CardDescription>Seus dízimos e ofertas dos últimos 6 meses.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-[300px] w-full">
                        <BarChart data={monthlyContributions} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `R$${value}`} />
                            <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src="https://placehold.co/80x80.png" alt={pastorData.firstName} data-ai-hint="male pastor" />
                    <AvatarFallback>
                    {pastorData.firstName.charAt(0)}
                    {pastorData.lastName.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-2xl">
                    {pastorData.firstName} {pastorData.lastName}
                    </CardTitle>
                    <CardDescription>Pastor</CardDescription>
                </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoItem icon={User} label="CPF" value={pastorData.cpf} />
                    <InfoItem
                        icon={CalendarIcon}
                        label="Data de Nascimento"
                        value={format(pastorData.birthDate, 'dd/MM/yyyy')}
                    />
                    <InfoItem icon={Mail} label="E-mail" value={pastorData.email} />
                    <InfoItem icon={Phone} label="Celular" value={pastorData.phone} />
                    <InfoItem icon={Phone} label="Telefone Fixo" value={pastorData.landline} />
                    <InfoItem
                        icon={Clock}
                        label="Dia para dízimo"
                        value={String(pastorData.titheDay)}
                    />
                     <div className="md:col-span-2">
                        <InfoItem
                            icon={Home}
                            label="Endereço"
                            value={`${pastorData.street}, ${pastorData.number || 'S/N'}, ${pastorData.neighborhood}, ${pastorData.city} - ${pastorData.state}`}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
