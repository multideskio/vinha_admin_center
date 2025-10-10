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

- **Autenticação Segura:** Sistema de login robusto com gerenciamento de sessões JWT e hashing de senhas.
- **Dashboards Interativos:** Cada nível de usuário possui um dashboard customizado com KPIs, gráficos e dados relevantes para suas responsabilidades.
- **Gerenciamento de Usuários:** CRUD completo para todos os níveis de usuários (Gerentes, Supervisores, Pastores, etc.) com paridade de features.
- **Sistema de Pagamentos Completo:**
  - **PIX:** Geração de QR Code Base64 e string copia e cola, polling otimizado (3s), confirmação instantânea (1-5s)
  - **Cartão de Crédito:** Validação visual com react-credit-cards-2, suporte Visa/Mastercard/Elo, aprovação imediata
  - **Boleto:** Geração com linha digitável, PDF para download, vencimento em 7 dias
  - **Webhook Cielo:** Confirmação automática de pagamentos via `/api/v1/webhooks/cielo`
  - **Documentação:** Guias completos em `PAYMENT_VALIDATION.md` e `WEBHOOK_CIELO.md`
- **Sistema de Notificações Automáticas:** 
  - Envio via WhatsApp (Evolution API v2) e Email (AWS SES)
  - Templates personalizáveis com variáveis dinâmicas
  - Processamento automático via cron jobs
  - 4 tipos de eventos: boas-vindas, pagamentos, lembretes, atrasos
  - Controle de duplicação e logs de auditoria
- **Upload de Avatares:** Integração com AWS S3 e CloudFront para armazenamento e distribuição de imagens.
- **Configurações da Empresa:**
  - Logo customizável exibido em todo o sistema
  - Nome da aplicação e email de suporte
  - Modo de manutenção com página customizada
- **Gestão de Redes Sociais:** Gerenciamento de links de Facebook, Instagram e Website com auto-save.
- **Sistema de Relatórios:** Geração de relatórios em PDF e Excel (Financeiro, Membros, Igrejas, Contribuições) com filtros por período.
- **Gestão Financeira:** Acompanhamento de transações, contribuições (dízimos e ofertas) e relatórios financeiros.
- **Configurações de Gateway:** Integração completa com Cielo (credenciais, webhook URL, métodos aceitos).
- **Layout Responsivo:** A aplicação é totalmente otimizada para uso em dispositivos móveis e desktops.

## Primeiros Passos

Para iniciar o projeto em ambiente de desenvolvimento, execute o seguinte comando:

```bash
npm run dev
```

Isso iniciará o servidor de desenvolvimento do Next.js na porta `http://localhost:9002`.

## Documentação Adicional

### Geral
- **[CHANGELOG.md](./CHANGELOG.md)** - Histórico de versões e mudanças
- **[ROADMAP.md](./ROADMAP.md)** - Planejamento e próximas features
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Guia de contribuição

### Técnica
- **[FRONTEND_DOCS.md](./FRONTEND_DOCS.md)** - Documentação do frontend
- **[BACKEND_DOCS.md](./BACKEND_DOCS.md)** - Documentação do backend
- **[DB_DOCS.md](./DB_DOCS.md)** - Documentação do banco de dados
- **[IMPLEMENTATION_NOTES.md](./IMPLEMENTATION_NOTES.md)** - Notas técnicas de implementação

### Integrações
- **[CIELO_API_GUIDE.md](./CIELO_API_GUIDE.md)** - Guia de integração com Cielo
- **[CRON_SETUP.md](./CRON_SETUP.md)** - Configuração do sistema de notificações automáticas
