
'use client';

import {
  Settings,
  Mail,
  Smartphone,
  MessageSquareQuote,
  ChevronRight,
  Cloud,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';

import {
  Card,
} from '@/components/ui/card';

const settingsLinks = [
  {
    href: '/admin/configuracoes/gerais',
    icon: Settings,
    title: 'Geral',
    description: 'Nome da aplicação, modo de manutenção e logo.',
  },
  {
    href: '/admin/gateways',
    icon: CreditCard,
    title: 'Gateways de Pagamento',
    description: 'Conecte e gerencie provedores como Cielo e Bradesco.',
  },
  {
    href: '/admin/configuracoes/smtp',
    icon: Mail,
    title: 'SMTP',
    description: 'Configurações para envio de e-mails transacionais.',
  },
  {
    href: '/admin/configuracoes/whatsapp',
    icon: Smartphone,
    title: 'WhatsApp',
    description: 'Integração com a API para envio de mensagens.',
  },
  {
    href: '/admin/configuracoes/mensagens',
    icon: MessageSquareQuote,
    title: 'Mensagens Automáticas',
    description: 'Personalize os templates de comunicação.',
  },
  // {
  //   href: '/admin/configuracoes/webhooks',
  //   icon: Webhook,
  //   title: 'Webhooks',
  //   description: 'Envie eventos do sistema para outros serviços.',
  //   disabled: true, // Em desenvolvimento
  // },
  {
    href: '/admin/configuracoes/s3',
    icon: Cloud,
    title: 'Armazenamento (S3)',
    description: 'Configure o local para armazenamento de arquivos (ex: S3, MinIO).',
  },
  // {
  //   href: '/admin/configuracoes/api',
  //   icon: KeyRound,
  //   title: 'Chaves de API',
  //   description: 'Gerencie as chaves para acesso programático à API.',
  //   disabled: true, // Em desenvolvimento - Segurança pendente
  // }
];

export default function SettingsPage() {
  return (
    <div className="grid gap-6">
       <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Configurações
            </h1>
            <p className="text-sm text-muted-foreground">
                Gerencie as configurações e integrações da plataforma.
            </p>
        </div>

      {settingsLinks.map((link) => (
        <Link href={link.href} key={link.href} className="group">
          <Card className="hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                    <link.icon className="h-6 w-6 text-muted-foreground" />
                    <div>
                        <h3 className="font-semibold">{link.title}</h3>
                        <p className="text-sm text-muted-foreground">
                        {link.description}
                        </p>
                    </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
