# Vinha Admin Center

Este é o painel de administração para o sistema Vinha Ministérios.

## Visão Geral do Projeto

O Vinha Admin Center é uma aplicação completa construída com Next.js e TypeScript, projetada para gerenciar todos os aspectos do sistema de ministérios, incluindo usuários, igrejas, transações e configurações. A interface é construída com **ShadCN/UI** para componentes modernos e responsivos e **Tailwind CSS** para estilização. O backend utiliza **PostgreSQL** com **Drizzle ORM**, e a autenticação é gerenciada de forma segura com **Lucia Auth**.

## Estrutura de Perfis de Usuário

O sistema suporta múltiplos níveis de acesso, cada um com seu próprio painel e permissões, garantindo que cada usuário tenha acesso apenas às ferramentas e dados relevantes para sua função:

- **Administrador (`/admin`):** Acesso total a todas as funcionalidades do sistema, incluindo gerenciamento de todos os outros usuários, configurações globais e relatórios.
- **Gerente (`/manager`):** Visualiza e gerencia uma rede específica de supervisores, pastores e igrejas.
- **Supervisor (`/supervisor`):** Supervisiona um grupo de pastores e igrejas dentro de uma região.
- **Pastor (`/pastor`):** Gerencia seu próprio perfil, contribuições e pode estar associado a uma ou mais igrejas.
- **Igreja (`/igreja`):** Gerencia suas próprias informações, finanças e membros.

## Funcionalidades Principais

- **Autenticação Segura:** Sistema de login robusto com gerenciamento de sessões e hashing de senhas.
- **Dashboards Interativos:** Cada nível de usuário possui um dashboard customizado com KPIs, gráficos e dados relevantes para suas responsabilidades.
- **Gerenciamento de Usuários:** CRUD completo para todos os níveis de usuários (Gerentes, Supervisores, Pastores, etc.) com paridade de features.
- **Sistema de Notificações:** Envio de mensagens via WhatsApp (Evolution API v2) e Email (AWS SES) com templates personalizáveis.
- **Upload de Avatares:** Integração com AWS S3 e CloudFront para armazenamento e distribuição de imagens.
- **Gestão de Redes Sociais:** Gerenciamento de links de Facebook, Instagram e Website com auto-save.
- **Sistema de Relatórios:** Geração de relatórios em PDF e Excel (Financeiro, Membros, Igrejas, Contribuições) com filtros por período.
- **Gestão Financeira:** Acompanhamento de transações, contribuições (dízimos e ofertas) e relatórios financeiros.
- **Configurações de Gateway:** Integração com gateways de pagamento como Cielo e Bradesco.
- **Layout Responsivo:** A aplicação é totalmente otimizada para uso em dispositivos móveis e desktops.

## Primeiros Passos

Para iniciar o projeto em ambiente de desenvolvimento, execute o seguinte comando:

```bash
npm run dev
```

Isso iniciará o servidor de desenvolvimento do Next.js na porta `http://localhost:9002`.

## Documentação Adicional

- **[CHANGELOG.md](./CHANGELOG.md)** - Histórico de versões e mudanças
- **[ROADMAP.md](./ROADMAP.md)** - Planejamento e próximas features
- **[FRONTEND_DOCS.md](./FRONTEND_DOCS.md)** - Documentação do frontend
- **[BACKEND_DOCS.md](./BACKEND_DOCS.md)** - Documentação do backend
- **[DB_DOCS.md](./DB_DOCS.md)** - Documentação do banco de dados
- **[CIELO_API_GUIDE.md](./CIELO_API_GUIDE.md)** - Guia de integração com Cielo
- **[IMPLEMENTATION_NOTES.md](./IMPLEMENTATION_NOTES.md)** - Notas técnicas de implementação
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Guia de contribuição
