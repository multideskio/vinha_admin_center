'use client'

import {
  Settings,
  Mail,
  Smartphone,
  MessageSquareQuote,
  ChevronRight,
  Cloud,
  CreditCard,
  KeyRound,
} from 'lucide-react'
import Link from 'next/link'

import { Card } from '@/components/ui/card'

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
  {
    href: '/admin/configuracoes/openai',
    icon: KeyRound,
    title: 'API (OpenAI)',
    description: 'Configure a chave da OpenAI para agentes/IA.',
  },
  // {
  //   href: '/admin/configuracoes/api',
  //   icon: KeyRound,
  //   title: 'Chaves de API',
  //   description: 'Gerencie as chaves para acesso programático à API.',
  //   disabled: true, // Em desenvolvimento - Segurança pendente
  // }
]

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header Moderno com Gradiente Videira */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 videira-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

        <div className="relative z-10 p-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-3">
              <Settings className="h-8 w-8" />
              Configurações
            </h1>
            <p className="text-base text-white/90 mt-2 font-medium">
              Gerencie as configurações e integrações da plataforma
            </p>
            <p className="text-sm text-white/70 mt-1">
              {settingsLinks.length} configurações disponíveis
            </p>
          </div>
        </div>
      </div>

      {/* Cards de Configuração Premium */}
      <div className="grid gap-4">
        {settingsLinks.map((link, index) => {
          const borderColors = [
            'border-l-videira-cyan',
            'border-l-videira-blue',
            'border-l-videira-purple',
            'border-l-videira-cyan',
            'border-l-videira-blue',
            'border-l-videira-purple',
            'border-l-videira-cyan',
          ]

          const iconColors = [
            'text-videira-cyan',
            'text-videira-blue',
            'text-videira-purple',
            'text-videira-cyan',
            'text-videira-blue',
            'text-videira-purple',
            'text-videira-cyan',
          ]

          return (
            <Link href={link.href} key={link.href} className="group">
              <Card
                className={`hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border-l-4 ${borderColors[index]} relative overflow-hidden`}
              >
                {/* Fundo com gradiente sutil */}
                <div
                  className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
                    index % 3 === 0 && 'bg-gradient-to-r from-videira-cyan/5 to-transparent'
                  } ${index % 3 === 1 && 'bg-gradient-to-r from-videira-blue/5 to-transparent'} ${
                    index % 3 === 2 && 'bg-gradient-to-r from-videira-purple/5 to-transparent'
                  }`}
                />

                <div className="flex items-center justify-between p-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                        index % 3 === 0 && 'bg-videira-cyan/15 ring-2 ring-videira-cyan/30'
                      } ${index % 3 === 1 && 'bg-videira-blue/15 ring-2 ring-videira-blue/30'} ${
                        index % 3 === 2 && 'bg-videira-purple/15 ring-2 ring-videira-purple/30'
                      }`}
                    >
                      <link.icon className={`h-6 w-6 ${iconColors[index]}`} />
                    </div>
                    <div>
                      <h3
                        className={`font-semibold text-lg transition-colors duration-300 ${
                          index % 3 === 0 && 'group-hover:text-videira-cyan'
                        } ${index % 3 === 1 && 'group-hover:text-videira-blue'} ${
                          index % 3 === 2 && 'group-hover:text-videira-purple'
                        }`}
                      >
                        {link.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{link.description}</p>
                    </div>
                  </div>
                  <ChevronRight
                    className={`h-6 w-6 ${iconColors[index]} group-hover:translate-x-2 transition-transform duration-300`}
                  />
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
