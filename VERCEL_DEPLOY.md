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

Ou configure um script de build que execute as migrações automaticamente.

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

### Next.js Config

- ✅ Removido `output: 'standalone'` (específico para Docker)
- ✅ `optimizePackageImports` para reduzir bundle size
- ✅ Otimização de imagens habilitada
- ✅ TypeScript validation no build

### Vercel Config

- ✅ Região `gru1` (São Paulo) para menor latência
- ✅ Timeout de 30s para APIs
- ✅ Cron job configurado para notificações (9h diariamente)

### Build Optimization

- ✅ `.vercelignore` para excluir arquivos desnecessários
- ✅ Package imports otimizados
- ✅ Tree-shaking automático

## Limitações da Vercel

### Function Timeout

- **Hobby Plan**: 10 segundos
- **Pro Plan**: 60 segundos (configurado para 30s)

Se você tem operações longas, considere:

- Mover para background jobs
- Usar Vercel Edge Functions
- Implementar streaming responses

### Serverless Functions

- Cada rota API é uma função serverless
- Cold starts podem ocorrer
- Não mantém estado entre requisições

### Cron Jobs

- Disponível apenas no Pro Plan
- Máximo de 1 execução por minuto
- Timeout padrão de 10s (Pro: 60s)

## Monitoramento

### Logs

Acesse os logs em tempo real:

```bash
vercel logs [deployment-url]
```

### Analytics

- Ative o Vercel Analytics no painel
- Configure o Vercel Speed Insights

### Alertas

Configure alertas para:

- Erros de build
- Timeouts de função
- Uso de recursos

## Troubleshooting

### Build Falha

1. Verifique os logs de build no painel da Vercel
2. Teste localmente: `npm run build`
3. Verifique variáveis de ambiente

### Database Connection

1. Verifique se o `DATABASE_URL` está correto
2. Certifique-se que o banco aceita conexões externas
3. Verifique SSL/TLS requirements

### Cold Starts

- Considere usar Vercel Edge Functions para rotas críticas
- Implemente cache agressivo
- Use ISR (Incremental Static Regeneration) onde possível

## Deploy Manual

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

## CI/CD Automático

O deploy automático está configurado:

- ✅ Push para `main` → Deploy em produção
- ✅ Pull requests → Preview deployments
- ✅ Quality checks antes do deploy

## Custos Estimados

### Hobby Plan (Grátis)

- 100GB bandwidth
- 100 horas de execução
- Sem cron jobs
- Timeout de 10s

### Pro Plan ($20/mês)

- 1TB bandwidth
- 1000 horas de execução
- Cron jobs incluídos
- Timeout de 60s
- Analytics avançado

## Próximos Passos

1. ✅ Configure todas as variáveis de ambiente
2. ✅ Execute as migrações do banco
3. ✅ Configure o Redis (se usar notificações)
4. ✅ Teste o deploy em preview
5. ✅ Configure domínio customizado
6. ✅ Ative SSL/HTTPS
7. ✅ Configure monitoramento
