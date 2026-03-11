# Stack e Serviços — Vinha Admin Center

Documentação da stack tecnológica e dos serviços necessários para rodar a plataforma **100% funcional**.

---

## Stack Tecnológica

### Core

| Tecnologia     | Versão | Uso                                     |
| -------------- | ------ | --------------------------------------- |
| **Next.js**    | 15.5+  | Framework React (App Router, Turbopack) |
| **React**      | 18.3   | UI                                      |
| **TypeScript** | 5.x    | Tipagem estática                        |
| **Node.js**    | 20+    | Runtime                                 |

### Banco de Dados e ORM

| Tecnologia                            | Versão | Uso                                      |
| ------------------------------------- | ------ | ---------------------------------------- |
| **PostgreSQL**                        | 14+    | Banco de dados relacional                |
| **Drizzle ORM**                       | 0.44+  | ORM e migrações                          |
| **Drizzle Kit**                       | 0.31+  | CLI para migrations, seed, studio        |
| **pg** / **@neondatabase/serverless** | -      | Driver PostgreSQL (Neon para serverless) |

### Cache e Filas

| Tecnologia  | Versão | Uso                                      |
| ----------- | ------ | ---------------------------------------- |
| **Redis**   | 6+     | Filas de jobs e cache                    |
| **BullMQ**  | 5.x    | Processamento assíncrono de notificações |
| **ioredis** | 5.x    | Cliente Redis                            |

### Cloud e Storage

| Tecnologia            | Versão | Uso                                             |
| --------------------- | ------ | ----------------------------------------------- |
| **AWS SDK (S3, SES)** | 3.x    | Upload de arquivos e envio de emails            |
| **S3-compatible**     | -      | MinIO, DigitalOcean Spaces, etc. (configurável) |

### Autenticação e Segurança

| Tecnologia | Versão | Uso                                          |
| ---------- | ------ | -------------------------------------------- |
| **jose**   | 6.x    | JWT (tokens, verificação)                    |
| **bcrypt** | 5.x    | Hash de senhas                               |
| **Zod**    | 3.x    | Validação de schemas e variáveis de ambiente |

### UI e Design

| Tecnologia                                    | Versão | Uso                    |
| --------------------------------------------- | ------ | ---------------------- |
| **Tailwind CSS**                              | 3.4    | Estilização            |
| **Radix UI**                                  | -      | Componentes acessíveis |
| **Lucide React**                              | -      | Ícones                 |
| **Recharts**                                  | 2.x    | Gráficos               |
| **date-fns**                                  | 3.x    | Datas                  |
| **react-hook-form** + **@hookform/resolvers** | -      | Formulários            |

### Outros

| Tecnologia                          | Versão | Uso                       |
| ----------------------------------- | ------ | ------------------------- |
| **ExcelJS**                         | 4.x    | Exportação de planilhas   |
| **jsPDF**                           | 4.x    | Geração de PDFs           |
| **nodemailer**                      | 7.x    | Fallback SMTP para emails |
| **react-markdown** + **remark-gfm** | -      | Markdown em conteúdo      |

---

## Serviços Necessários

### Obrigatórios

| Serviço        | Descrição                      | Exemplos                                                                                                 |
| -------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| **PostgreSQL** | Banco de dados principal       | [Neon](https://neon.tech), [Supabase](https://supabase.com), [Railway](https://railway.app), self-hosted |
| **Redis**      | Filas de notificações (BullMQ) | [Upstash](https://upstash.com), [Redis Cloud](https://redis.com/redis-enterprise-cloud/), self-hosted    |

### Opcionais (funcionalidades parciais sem eles)

| Serviço                 | Descrição                                         | Quando necessário                            |
| ----------------------- | ------------------------------------------------- | -------------------------------------------- |
| **S3 ou S3-compatible** | Upload de avatares, documentos, certificados      | Quando precisar de upload de arquivos        |
| **AWS SES ou SMTP**     | Envio de emails (boas-vindas, lembretes, recibos) | Quando precisar de notificações por email    |
| **WhatsApp API**        | Notificações via WhatsApp                         | Quando precisar de notificações via WhatsApp |

> **Nota:** S3, SMTP/SES e WhatsApp são configuráveis no painel admin (`Configurações`), via tabela `other_settings`, não apenas por variáveis de ambiente.

### Gateways de Pagamento

| Gateway      | Uso                                            |
| ------------ | ---------------------------------------------- |
| **Cielo**    | Transações com cartão                          |
| **Bradesco** | PIX e boleto (requer certificado digital .pfx) |

Configurações ficam em `gateway_configurations` no banco.

---

## Lista de Serviços para o Cliente Contratar (Produção)

Lista completa de serviços externos que o cliente precisa contratar/provisionar para colocar o sistema em produção:

| #   | Serviço                        | Fornecedor sugerido                      | Uso                                                                        | Obrigatório?          |
| --- | ------------------------------ | ---------------------------------------- | -------------------------------------------------------------------------- | --------------------- |
| 1   | **Hosting (App)**              | Vercel, Railway, Render, Fly.io          | Rodar a aplicação Next.js                                                  | Sim                   |
| 2   | **PostgreSQL**                 | Neon, Supabase, Railway, Vercel Postgres | Banco de dados principal                                                   | Sim                   |
| 3   | **Redis**                      | Upstash, Redis Cloud, Railway            | Filas de notificações (BullMQ)                                             | Sim                   |
| 4   | **Worker (processo contínuo)** | Railway, Render, Fly.io, VPS, Easypanel  | Rodar o worker de notificações (`npm run dev:worker`) — não roda na Vercel | Sim                   |
| 5   | **AWS S3**                     | AWS                                      | Upload de avatares, documentos, certificados                               | Se usar uploads       |
| 6   | **AWS SES**                    | AWS                                      | Envio de emails (boas-vindas, lembretes, recibos)                          | Se usar emails        |
| 7   | **OpenAI API**                 | OpenAI (ChatGPT)                         | Sugestões de templates por IA, insights no dashboard                       | Se usar IA            |
| 8   | **Cielo**                      | Cielo                                    | Cartão de crédito, PIX, boleto                                             | Se aceitar pagamentos |
| 9   | **Bradesco**                   | Banco Bradesco                           | PIX e boleto (requer conta e certificado digital .pfx)                     | Se aceitar PIX/boleto |
| 10  | **Evolution API (WhatsApp)**   | Self-hosted ou Evolution API Cloud       | Notificações via WhatsApp                                                  | Se usar WhatsApp      |
| 11  | **Domínio**                    | Registro.br, GoDaddy, etc.               | URL customizada (SSL geralmente incluso no Vercel)                         | Recomendado           |

### Resumo rápido

- **Já listados pelo cliente:** Vercel, Neon, AWS (SES + S3), Cielo, OpenAI
- **Faltando na lista:**
  - **Redis** — Upstash ou Redis Cloud (obrigatório para notificações)
  - **Worker hosting** — Railway, Render, etc. (a Vercel não roda processos contínuos)
  - **Bradesco** — Se for aceitar PIX/boleto além da Cielo
  - **Evolution API** — Se for enviar notificações por WhatsApp
  - **Domínio** — Para produção com URL própria

### Grátis / não contratar

| Serviço   | Observação               |
| --------- | ------------------------ |
| ViaCEP    | Gratuito — busca de CEP  |
| BrasilAPI | Gratuito — CNPJ e outros |

---

## Processos Necessários

Para rodar a plataforma **100%**, são necessários **2 processos**:

| Processo                   | Comando                      | Descrição                              |
| -------------------------- | ---------------------------- | -------------------------------------- |
| **App Next.js**            | `npm run dev` ou `npm start` | Interface e APIs                       |
| **Worker de Notificações** | `npm run dev:worker`         | Processa fila Redis (emails, WhatsApp) |

Em produção, o worker deve rodar separadamente (ex.: serviço systemd, container, ou processo PM2).

---

## Variáveis de Ambiente

### Obrigatórias

| Variável                         | Descrição                                       | Exemplo                                               |
| -------------------------------- | ----------------------------------------------- | ----------------------------------------------------- |
| `DATABASE_URL` ou `POSTGRES_URL` | Connection string PostgreSQL                    | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `POSTGRES_URL_NON_POOLING`       | Conexão direta (sem pooler) para migrations     | Usado em Vercel/Neon                                  |
| `JWT_SECRET`                     | Chave para assinar/verificar JWT (min 32 chars) | String aleatória longa                                |
| `DEFAULT_PASSWORD`               | Senha padrão no seed (min 6 chars)              | `123456` (trocar em prod)                             |
| `COMPANY_INIT`                   | UUID da empresa inicial                         | `fc85b9b3-15a2-496b-ae89-...`                         |
| `ADMIN_INIT`                     | UUID do admin inicial                           | `30c77e7c-db30-4ec1-8787-...`                         |

### Recomendadas

| Variável              | Descrição                                              | Padrão                   |
| --------------------- | ------------------------------------------------------ | ------------------------ |
| `REDIS_URL`           | URL do Redis para BullMQ                               | `redis://localhost:6379` |
| `NEXT_PUBLIC_APP_URL` | URL pública da app (links em emails)                   | `http://localhost:9002`  |
| `NEXT_REDIRECT`       | Base de redirecionamento                               | `http://localhost:9002`  |
| `ENCRYPTION_KEY`      | Chave para criptografar dados sensíveis (min 16 chars) | -                        |

### Opcionais (env vars)

| Variável                                                                                  | Descrição                                |
| ----------------------------------------------------------------------------------------- | ---------------------------------------- |
| `CRON_SECRET`                                                                             | Para proteger endpoints de cron (Vercel) |
| `AWS_SES_REGION`                                                                          | Região AWS SES                           |
| `AWS_SES_ACCESS_KEY_ID`                                                                   | Access key AWS                           |
| `AWS_SES_SECRET_ACCESS_KEY`                                                               | Secret key AWS                           |
| `AWS_SES_FROM_EMAIL`                                                                      | Email remetente                          |
| `AWS_S3_REGION`, `AWS_S3_ACCESS_KEY_ID`, `AWS_S3_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME` | S3 (alternativa à config no painel)      |

> **Importante:** S3 e email podem ser configurados pelo painel admin em vez de variáveis de ambiente. O painel usa `other_settings` (endpoint, bucket, credenciais SMTP/SES, WhatsApp API).

---

## Setup Inicial

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar `.env`

Copie o `.env.example` (se existir) ou crie um `.env` com as variáveis obrigatórias:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=sua_chave_secreta_de_pelo_menos_32_caracteres
DEFAULT_PASSWORD=senha123
COMPANY_INIT=uuid-da-empresa
ADMIN_INIT=uuid-do-admin
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_APP_URL=http://localhost:9002
ENCRYPTION_KEY=chave_de_16_chars_min
```

### 3. Rodar migrations e seed

```bash
npm run db:push
npm run db:seed
```

### 4. Iniciar aplicação e worker

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run dev:worker
```

Acesse `http://localhost:9002` (porta padrão: 9002).

---

## Checklist para Produção 100%

- [ ] PostgreSQL provisionado e `DATABASE_URL` configurado
- [ ] Redis provisionado e `REDIS_URL` configurado
- [ ] Worker de notificações rodando (separado do app)
- [ ] `JWT_SECRET` forte e único
- [ ] `DEFAULT_PASSWORD` alterado após primeiro login
- [ ] `NEXT_PUBLIC_APP_URL` apontando para o domínio de produção
- [ ] S3 (ou compatible) configurado no painel (uploads)
- [ ] SES ou SMTP configurado no painel (emails)
- [ ] `ENCRYPTION_KEY` definida (criptografia de dados sensíveis)
- [ ] Gateways de pagamento (Cielo/Bradesco) configurados, se necessário

---

## Porta Padrão

A aplicação roda na porta **9002** por padrão (`next dev -p 9002`).
