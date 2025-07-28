
'use client';

import * as React from 'react';
import {
  Building2,
  Mail,
  Phone,
  User,
  MapPin,
  CalendarIcon,
  Clock,
  Pencil,
} from 'lucide-react';
import Link from 'next/link';

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
import { format } from 'date-fns';

const churchData = {
  id: 'chu-01',
  razaoSocial: 'IGREJA EVANGELICA ASSEMBLEIA DE DEUS',
  nomeFantasia: 'Assembleia de Deus Madureira',
  email: 'contato@admadureira.com',
  phone: '(11) 98888-7777',
  cnpj: '55.343.456/0001-21',
  cep: '01002-000',
  state: 'SP',
  city: 'São Paulo',
  neighborhood: 'Sé',
  address: 'Praça da Sé, 100',
  foundationDate: new Date('1950-01-15T00:00:00'),
  titheDay: 10,
  supervisorId: 'sup-01',
  treasurerFirstName: 'José',
  treasurerLastName: 'Contas',
  treasurerCpf: '123.456.789-00',
  facebook: 'https://facebook.com',
  instagram: 'https://instagram.com',
  website: 'https://admadureira.com',
};

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

export default function ChurchDashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Dashboard da Igreja
            </h1>
            <p className="text-sm text-muted-foreground">
                Bem-vindo ao seu painel, {churchData.nomeFantasia}.
            </p>
        </div>
        <Button asChild>
          <Link href="/igreja/perfil">
            <Pencil className="mr-2 h-4 w-4" />
            Editar Perfil
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src="https://placehold.co/80x80.png" alt={churchData.nomeFantasia} data-ai-hint="church building" />
            <AvatarFallback>IDM</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{churchData.nomeFantasia}</CardTitle>
            <CardDescription>{churchData.razaoSocial}</CardDescription>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoItem
            icon={Building2}
            label="CNPJ"
            value={churchData.cnpj}
          />
          <InfoItem icon={Mail} label="E-mail" value={churchData.email} />
          <InfoItem icon={Phone} label="Telefone" value={churchData.phone} />
          <InfoItem
            icon={MapPin}
            label="Endereço"
            value={`${churchData.address}, ${churchData.neighborhood}, ${churchData.city} - ${churchData.state}`}
          />
          <InfoItem
            icon={CalendarIcon}
            label="Data de Fundação"
            value={format(churchData.foundationDate, 'dd/MM/yyyy')}
          />
           <InfoItem
            icon={Clock}
            label="Dia para dízimo"
            value={String(churchData.titheDay)}
          />

          <div className="md:col-span-2 lg:col-span-3">
            <Separator className="my-4" />
            <h3 className='text-lg font-semibold mb-4'>Informações do Tesoureiro</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoItem
                    icon={User}
                    label="Nome do Tesoureiro"
                    value={`${churchData.treasurerFirstName} ${churchData.treasurerLastName}`}
                />
                 <InfoItem
                    icon={User}
                    label="CPF do Tesoureiro"
                    value={churchData.treasurerCpf}
                />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
