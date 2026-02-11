---
inclusion: always
---

# Contexto do Projeto: Vinha Admin Center

## Visão Geral

Sistema completo de gestão para igrejas e organizações religiosas desenvolvido pela Multidesk.io.

## Informações Essenciais

### Versão Atual

- **v0.3.0** - Production Ready
- Status: 100% estável, 0 bugs críticos
- Última atualização: Q4 2025

### Stack Principal

- **Frontend**: Next.js 15.5.3, React 18.3.1, TypeScript 5.0, Tailwind CSS 3.4.1
- **Backend**: Next.js API Routes, JWT Auth
- **Database**: PostgreSQL 14+, Drizzle ORM
- **Integrações**: AWS S3/SES, Cielo API, Bradesco API, WhatsApp Evolution API v2

### Estrutura de Diretórios Importantes

```
src/
├── actions/          # Server Actions (auth, user-creation, logout)
├── app/             # App Router (páginas e layouts)
│   ├── admin/       # Painel administrativo
│   ├── gerente/     # Painel de gerente
│   ├── supervisor/  # Painel de supervisor
│   ├── pastor/      # Painel de pastor
│   └── igreja/      # Painel de igreja
├── components/      # Componentes reutilizáveis
├── lib/            # Utilitários e configurações
│   ├── db/         # Configuração do banco
│   ├── auth/       # Sistema de autenticação
│   └── services/   # Serviços externos
└── types/          # Definições TypeScript
```

### Níveis de Acesso (Roles)

1. **Admin** - Controle total do sistema
2. **Manager** - Supervisão de rede regional
3. **Supervisor** - Gestão regional de igrejas
4. **Pastor** - Perfil pessoal e contribuições
5. **Igreja** - Administração da igreja

### Funcionalidades Principais

- Gestão multi-nível de usuários
- Sistema de pagamentos (PIX, Cartão, Boleto)
- Dashboards com KPIs em tempo real
- Comunicação automática (Email + WhatsApp)
- Relatórios personalizáveis
- Sistema de webhooks

### Convenções de Código

- Usar TypeScript estrito
- Componentes funcionais com hooks
- Server Components por padrão (Next.js 15)
- Validação com Zod
- Estilização com Tailwind CSS
- Design System Videira (paleta de cores personalizada)

### Comandos Importantes

```bash
npm run dev              # Desenvolvimento (porta 9002)
npm run db:push          # Aplicar migrações
npm run db:seed          # Popular dados de teste
npm run typecheck        # Verificação TypeScript
npm run quality:check    # Verificação completa
```

### Usuários de Teste

- Admin: admin@vinha.com / admin123
- Manager: manager@vinha.com / manager123
- Supervisor: supervisor@vinha.com / supervisor123
- Pastor: pastor@vinha.com / pastor123
- Igreja: igreja@vinha.com / igreja123

## Prioridades de Desenvolvimento

1. Segurança e autenticação
2. Performance e otimização de queries
3. Experiência do usuário
4. Qualidade e manutenibilidade do código
5. Documentação clara e atualizada
