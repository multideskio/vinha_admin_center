# Deploy na Vercel - Vinha Admin Center

## Configuração Inicial

### 1. Variáveis de Ambiente

Configure as seguintes variáveis no painel da Vercel (Settings → Environment Variables):

#### Essenciais

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
COMPANY_INIT=your-company-uuid
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

#### AWS SES (Email)

```bash
AWS_SES_ACCESS_KEY_ID=your-aws-access-key
AWS_SES_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=contato@multidesk.io
```

#### AWS S3 (Upload de arquivos)

```bash
AWS_S3_ACCESS_KEY_ID=your-aws-access-key
AWS_S3_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=vinha-uploads
AWS_S3_REGION=us-east-1
AWS_S3_CLOUDFRONT_URL=https://your-cloudfront-url.cloudfront.net
```

#### Cielo (Pagamentos)

```bash
CIELO_MERCHANT_ID=your-merchant-id
CIELO_MERCHANT_KEY=your-merchant-key
CIELO_ENVIRONMENT=production
```

#### Evolution API (WhatsApp)

```bash
EVOLUTION_API_URL=https://your-evolution-api.com
EVOLUTION_API_KEY=your-api-key
EVOLUTION_API_INSTANCE=your-instance-name
```

### 2. Configuração do Banco de Dados

**Importante**: Use um banco PostgreSQL externo (não use o banco local).

Opções recomendadas:

- **Vercel Postgres** (integração nativa)
- **Neon** (serverless PostgreSQL)
- **Supabase** (PostgreSQL gerenciado)
- **Railway** (PostgreSQL gerenciado)

### 3. Migrações do Banco

Após configurar o `DATABASE_URL`, execute as migrações:

```bash
npm run db:push
```

### 4. Redis (BullMQ)

Para o sistema de notificações funcionar, você precisa de um Redis:

Opções:

- **Upstash Redis** (serverless, recomendado para Vercel)
- **Redis Cloud**
- **Railway Redis**

Configure a variável:

```bash
REDIS_URL=redis://default:password@host:port
```

## Otimizações Aplicadas

- `optimizePackageImports` para reduzir bundle size
- Região `gru1` (São Paulo) para menor latência
- Timeout de 30s para APIs
- Cron job configurado para notificações (9h diariamente)
- `.vercelignore` para excluir arquivos desnecessários

## Limitações da Vercel

| Recurso          | Hobby (Grátis) | Pro ($20/mês) |
| ---------------- | -------------- | ------------- |
| Bandwidth        | 100GB          | 1TB           |
| Function Timeout | 10s            | 60s           |
| Cron Jobs        | Não            | Sim           |
| Execução         | 100h           | 1000h         |

## Deploy Manual

```bash
npm i -g vercel
vercel login
vercel --prod
```

## CI/CD Automático

- Push para `main` → Deploy em produção
- Pull requests → Preview deployments

## Troubleshooting

- **Build falha**: Verifique logs no painel, teste com `npm run build` local
- **Database connection**: Verifique `DATABASE_URL`, SSL/TLS, e acesso externo
- **Cold starts**: Use cache agressivo e ISR onde possível
