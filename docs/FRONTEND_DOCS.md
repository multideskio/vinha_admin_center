# 📄 Documentação do Frontend - Vinha Admin Center

Este documento detalha a arquitetura, tecnologias e estrutura do frontend da aplicação Vinha Admin Center.

## ✨ Tecnologias Principais

- **Framework:** [Next.js](https://nextjs.org/) (com App Router)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **UI Framework:** [React](https://reactjs.org/)
- **Autenticação:** [Lucia Auth](https://lucia-auth.com/) para gerenciamento de sessões no lado do servidor.
- **Comunicação com Backend:** **API RESTful**. O frontend utiliza `fetch` (principalmente dentro de hooks como `useEffect`) para se comunicar com os endpoints da API do Next.js localizados em `src/app/api/v1/`.
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Componentes:** [ShadCN/UI](https://ui.shadcn.com/) - Uma coleção de componentes reutilizáveis e acessíveis.
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Gráficos:** [Recharts](https://recharts.org/)
- **Formulários:** [React Hook Form](https://react-hook-form.com/) com [Zod](https://zod.dev/) para validação.

---

## 📂 Estrutura de Arquivos

A estrutura de pastas segue as convenções do Next.js App Router para uma organização clara e escalável.

```
src
├── app
│   ├── api           # Endpoints da API RESTful (backend)
│   │   └── v1
│   │       ├── admin
│   │       ├── dashboard
│   │       ├── transacoes
│   │       ├── company
│   │       ├── cron
│   │       └── ...
│   ├── admin         # Layout e páginas do painel de Administrador (COMPLETO)
│   │   ├── _components      # Componentes específicos (header, sidebar)
│   │   ├── administradores  # CRUD de administradores
│   │   ├── gerentes         # CRUD de gerentes
│   │   ├── supervisores     # CRUD de supervisores
│   │   ├── pastores         # CRUD de pastores
│   │   ├── igrejas          # CRUD de igrejas
│   │   ├── regioes          # Gerenciamento de regiões
│   │   ├── transacoes       # Listagem e detalhes de transações
│   │   ├── relatorios       # Relatórios financeiros
│   │   ├── dashboard        # Dashboard com KPIs e gráficos
│   │   ├── gateways         # Configuração Cielo/Bradesco
│   │   ├── configuracoes    # Configurações gerais, SMTP, WhatsApp, S3
│   │   ├── roadmap          # Roadmap do projeto
│   │   └── changelog        # Histórico de mudanças
│   ├── auth          # Layout e páginas de autenticação (login, cadastro, etc.)
│   ├── manager       # Layout e páginas do painel de Gerente (COMPLETO)
│   │   ├── _components      # Componentes específicos (header, sidebar)
│   │   ├── supervisores     # CRUD de supervisores
│   │   ├── pastores         # CRUD de pastores
│   │   ├── igrejas          # CRUD de igrejas
│   │   └── dashboard        # Dashboard com KPIs e gráficos
│   ├── supervisor    # Layout e páginas do painel de Supervisor (PENDENTE)
│   ├── pastor        # Layout e páginas do painel de Pastor (PENDENTE)
│   ├── church        # Layout e páginas do painel de Igreja (PENDENTE)
│   └── maintenance   # Página de modo manutenção
├── actions           # Server Actions (usadas primariamente para autenticação)
├── components
│   ├── layout        # Componentes de layout (Sidebars, Header) - DEPRECIADO
│   └── ui            # Componentes da biblioteca ShadCN/UI
├── hooks             # Hooks customizados (ex: use-toast)
└── lib               # Utilitários, configurações (auth.ts) e funções auxiliares (cn)
```

### Principais Diretórios

- **`src/app/[role]`**: Cada diretório dentro de `app` (como `admin`, `manager`, etc.) representa um perfil de usuário diferente e contém seu próprio `layout.tsx` e sub-rotas.
- **`src/app/[role]/_components`**: Diretório específico de cada perfil que armazena os componentes de cliente (como `sidebar.tsx` e `header.tsx`) para aquele layout, isolando-os para evitar conflitos de renderização no Next.js.
- **`src/app/api`**: Contém os _Route Handlers_ que formam a API RESTful do backend. É a principal fonte de dados para as páginas do cliente.
- **`src/app/auth`**: Contém todas as páginas relacionadas à autenticação.
- **`src/actions`**: Armazena as Server Actions. Com a migração para a API REST, seu uso principal se concentra em operações específicas como o fluxo de login (`loginUser`) e logout (`logoutUser`).
- **`src/lib/jwt.ts`**: Arquivo central de autenticação com Lucia Auth, responsável por validar sessões e gerenciar cookies.
- **`src/lib/company.ts`**: Utilitário para buscar configurações da empresa (logo, nome, modo manutenção).
- **`src/lib/notifications.ts`**: Serviço de notificações (email e WhatsApp) usado pelo sistema de cron.

---

## 🎨 Estilização e Tema

- **Tailwind CSS:** A estilização é feita primariamente com classes utilitárias do Tailwind CSS.
- **Variáveis CSS:** As cores do tema (primária, secundária, fundo, etc.) são definidas como variáveis CSS no arquivo `src/app/globals.css`, permitindo a fácil customização do tema e suporte a modo escuro (`dark mode`).
- **Responsividade:** O layout é construído com um foco "mobile-first". Classes de breakpoint do Tailwind (`sm`, `md`, `lg`) são usadas para adaptar a interface a diferentes tamanhos de tela.

---

## 🔗 Fluxo de Autenticação

1.  O usuário acessa a página de login (`/auth/login`).
2.  O formulário (`LoginPage`) chama a Server Action `loginUser`.
3.  A ação `loginUser` executa no servidor:
    - Valida os dados de entrada.
    - Verifica o usuário e a senha no banco.
    - Se as credenciais forem válidas, cria uma sessão com `lucia.createSession()` e define o cookie de sessão no navegador.
    - Retorna um objeto de sucesso com o `role` do usuário.
4.  O frontend recebe a resposta e redireciona o usuário para o dashboard apropriado (ex: `/admin`, `/manager`).
5.  Em cada painel (`/admin`, `/manager`, etc.), o `layout.tsx` principal usa a função `validateRequest` de `lucia` para verificar a sessão e redireciona para login se inválida.
6.  O middleware (`src/middleware.ts`) verifica o modo de manutenção e bloqueia acesso se ativo (exceto para admins).

---

## 🎯 Status de Implementação - Painel Admin (/admin)

### ✅ Funcionalidades Completas

#### Dashboard
- KPIs: Arrecadação mensal, membros, transações, igrejas, pastores, supervisores, gerentes
- Gráficos: Arrecadação por método, por região, igrejas por região, novos membros
- Tabelas: Últimas transações e cadastros recentes
- API: `/api/v1/dashboard/admin` (funcional)

#### Gestão de Usuários
- **Administradores**: CRUD completo com perfil detalhado
- **Gerentes**: CRUD completo com perfil detalhado
- **Supervisores**: CRUD completo com perfil detalhado e vinculação a regiões
- **Pastores**: CRUD completo com perfil detalhado e vinculação a supervisores
- **Igrejas**: CRUD completo com perfil detalhado (CNPJ, razão social, tesoureiro)

#### Gestão Financeira
- **Transações**: Listagem com filtros, busca, paginação e detalhes
- **Relatórios**: Página de relatórios financeiros implementada
- **Gateways**: Configuração de Cielo e Bradesco (credenciais, ambiente, métodos aceitos)

#### Configurações
- **Gerais**: Nome da empresa, logo (upload S3), email de suporte, modo manutenção
- **SMTP**: Configuração de servidor de email
- **WhatsApp**: Integração com API de WhatsApp
- **S3**: Configuração de armazenamento (AWS S3, MinIO, CloudFront)
- **Mensagens**: Templates de notificações personalizáveis
- **Regiões**: Gerenciamento de regiões com cores

#### Sistema de Notificações
- Endpoint cron: `/api/v1/cron/notifications`
- Eventos: Boas-vindas, pagamento recebido, lembretes, atraso
- Canais: Email e WhatsApp
- Deduplicação: Controle via `notification_logs`
- Proteção: `CRON_SECRET` obrigatório

#### Documentação
- **Roadmap**: Renderização dinâmica de `docs/ROADMAP.md`
- **Changelog**: Renderização dinâmica de `docs/CHANGELOG.md`
- Acesso via menu do usuário no header

### ⏸️ Funcionalidades em Standby
- **Webhooks**: Interface existe mas funcionalidade não implementada (sem dispatcher, retry, validação)
- **Chaves de API**: Interface existe mas desabilitada (chaves em texto plano, precisa criptografia)

### 🎨 Recursos de UI/UX
- Avatar do usuário no header (com fallback de iniciais)
- Logo da empresa no header e sidebar
- Modo manutenção funcional com middleware
- Metadata dinâmica baseada em configurações da empresa
- Tema dark/light mode
- Layout responsivo (mobile-first)
- Skeleton loaders em todas as páginas
- Toast notifications para feedback

### 🎯 Status de Implementação - Painel Manager (/manager)

#### ✅ Funcionalidades Completas

##### Dashboard
- KPIs: Supervisores, pastores, igrejas, transações, arrecadação mensal
- Gráficos: Arrecadação por método, igrejas por supervisor
- Tabelas: Últimas transações e cadastros recentes
- API: `/api/v1/manager/dashboard` (funcional)

##### Sistema de Pagamentos
- **PIX:** Geração de QR Code e string copia e cola, polling otimizado (3s), confirmação instantânea
- **Cartão de Crédito:** Formulário com validação visual, suporte a Visa/Mastercard/Elo, aprovação imediata
- **Boleto:** Geração com linha digitável, PDF para download, vencimento em 7 dias
- **Webhook Cielo:** Confirmação automática de pagamentos via `/api/v1/webhooks/cielo`
- **Histórico:** Visualização de todas as contribuições em `/manager/transacoes`
- API: `/api/v1/transacoes` (POST para criar, GET para listar)

##### Gestão de Supervisores
- CRUD completo com listagem, criação, edição e exclusão
- Perfil detalhado com avatar, dados pessoais, redes sociais
- Aba de transações com histórico completo
- Aba de configurações de notificações (email/WhatsApp)
- Exclusão com motivo obrigatório (soft delete)
- API: `/api/v1/manager/supervisores` e `/api/v1/manager/supervisores/[id]`

##### Gestão de Pastores
- CRUD completo seguindo padrão de supervisores
- Perfil detalhado com todas as funcionalidades
- Vinculação a supervisores
- Transações e notificações
- API: `/api/v1/manager/pastores` e `/api/v1/manager/pastores/[id]`

##### Gestão de Igrejas
- CRUD completo com CNPJ, razão social, tesoureiro
- Perfil detalhado com avatar e dados completos
- Transações e configurações de notificações
- Exclusão apenas via perfil com motivo obrigatório
- API: `/api/v1/manager/igrejas` e `/api/v1/manager/igrejas/[id]`

##### Recursos Compartilhados
- **PhoneInput Component**: Componente padronizado para telefones com DDI (+55)
- **CEP Lookup**: Endpoint `/api/v1/cep` para preenchimento automático de endereços
- **Avatar Upload**: Integração com S3 para upload de imagens de perfil
- **Notification Settings**: Configurações de notificações por email e WhatsApp
- **Soft Delete**: Exclusão lógica com motivo obrigatório para auditoria

##### Segurança e Permissões
- Manager só acessa supervisores vinculados a ele (filtro por managerId)
- Pastores e igrejas filtrados por supervisores do manager
- Validação de sessão em todos os endpoints
- Verificação de ownership em operações de edição/exclusão
- Sanitização de dados em formulários de pagamento
- Validação de cartão no frontend e backend

### 📊 Próximos Painéis a Implementar
1. **Supervisor** (`/supervisor`) - Gerenciar pastores e igrejas da sua região
2. **Pastor** (`/pastor`) - Visualizar dados da própria atuação
3. **Church** (`/church`) - Dashboard financeiro e gestão da igreja

---

## 🔄 Comunicação com o Backend

A aplicação utiliza uma abordagem híbrida:

1.  **API REST (Preferencial):** Para a maioria das operações CRUD (Criar, Ler, Atualizar, Deletar), o frontend faz chamadas `fetch` para os endpoints da API REST em `src/app/api/v1/`. Isso é feito dentro de componentes do cliente, geralmente com `useEffect`.
    - **Exemplo:** As páginas de Regiões, Administradores, Gateways, Dashboard e Transações buscam e manipulam dados exclusivamente através de seus respectivos endpoints na API.
    - **Autenticação**: Endpoints protegidos usam `validateRequest()` para verificar sessão
    - **Formato**: JSON com tratamento de erros padronizado

2.  **Server Actions (Para Casos Específicos):** São usadas para funcionalidades onde uma chamada de procedimento remoto (RPC) do cliente para o servidor é mais direta, como no processo de login e logout.
    - **Exemplo**: `loginUser`, `logoutUser` em `src/actions/auth.ts`

3.  **Cron Jobs (Externos):** Sistema de notificações automatizado via endpoint `/api/v1/cron/notifications` protegido por `CRON_SECRET`.

---

## 🔧 Utilitários e Bibliotecas

### Principais Utilitários
- **`src/lib/company.ts`**: Busca configurações da empresa do banco
- **`src/lib/notifications.ts`**: Serviço de envio de notificações (email/WhatsApp)
- **`src/lib/s3.ts`**: Cliente S3 para upload de arquivos
- **`src/lib/jwt.ts`**: Validação de sessões com Lucia Auth
- **`src/lib/types.ts`**: Tipos TypeScript centralizados
- **`src/lib/error-types.ts`**: Tratamento padronizado de erros

### Componentes UI Principais
- **ShadCN/UI**: Badge, Button, Card, Dialog, Form, Input, Select, Table, Toast, Skeleton
- **Recharts**: BarChart, PieChart, LineChart com configuração customizada
- **React Hook Form + Zod**: Validação de formulários tipada
- **Date-fns**: Manipulação de datas (pt-BR)

---

Esta documentação deve ser mantida atualizada conforme novas funcionalidades e estruturas são adicionadas ao projeto.
