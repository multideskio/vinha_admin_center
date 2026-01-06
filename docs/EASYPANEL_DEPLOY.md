# Deploy no EasyPanel - Vinha Admin Center

## Pré-requisitos

1. **Conta no EasyPanel** configurada
2. **Repositório Git** com o código
3. **Variáveis de ambiente** preparadas

## Configuração das Variáveis de Ambiente

No painel do EasyPanel, configure estas variáveis obrigatórias:

### Aplicação

```
NODE_ENV=production
PORT=9002
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

### Banco de Dados

```
DATABASE_URL=postgresql://usuario:senha@host:5432/database
```

### Autenticação

```
JWT_SECRET=seu-jwt-secret-super-seguro
COMPANY_INIT=uuid-da-empresa-inicial
```

### AWS (S3 + SES)

```
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET_NAME=seu-bucket
AWS_S3_ACCESS_KEY_ID=sua-access-key
AWS_S3_SECRET_ACCESS_KEY=sua-secret-key
AWS_S3_CLOUDFRONT_URL=https://seu-cloudfront.net

AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY_ID=sua-ses-key
AWS_SES_SECRET_ACCESS_KEY=sua-ses-secret
AWS_SES_FROM_EMAIL=noreply@seudominio.com
```

### Cielo (Pagamentos)

```
CIELO_MERCHANT_ID=seu-merchant-id
CIELO_MERCHANT_KEY=sua-merchant-key
CIELO_ENVIRONMENT=production
```

### WhatsApp (Evolution API)

```
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-api-key
EVOLUTION_API_INSTANCE=sua-instancia
```

## Passos para Deploy

### 1. Criar Aplicação no EasyPanel

1. Acesse seu painel EasyPanel
2. Clique em "New Project"
3. Selecione "From Git Repository"
4. Configure:
   - **Repository**: `https://github.com/seu-usuario/vinha-admin-center`
   - **Branch**: `main`
   - **Build Type**: `Dockerfile`
   - **Port**: `9002`

### 2. Configurar Build

O EasyPanel detectará automaticamente o `Dockerfile` otimizado. Configurações:

- **Build Context**: `/` (raiz do projeto)
- **Dockerfile Path**: `./Dockerfile`
- **Target Stage**: `runner` (automático)

### 3. Configurar Domínio

1. Vá em "Domains"
2. Adicione seu domínio personalizado
3. Configure SSL automático
4. Atualize `NEXT_PUBLIC_APP_URL` com o domínio final

### 4. Configurar Health Check

O health check já está configurado no Dockerfile:

- **Endpoint**: `/api/health`
- **Interval**: 30s
- **Timeout**: 10s
- **Retries**: 3

### 5. Deploy

1. Clique em "Deploy"
2. Aguarde o build (5-10 minutos)
3. Verifique os logs para erros
4. Teste a aplicação no domínio configurado

## Otimizações para EasyPanel

### Build Otimizado

- **Multi-stage build** reduz tamanho da imagem
- **Standalone output** do Next.js para máxima eficiência
- **Cache de layers** para builds mais rápidos

### Recursos Recomendados

- **CPU**: 0.5-1 vCPU
- **RAM**: 512MB-1GB
- **Storage**: 10GB

### Monitoramento

- Health check automático em `/api/health`
- Logs centralizados no painel
- Métricas de performance disponíveis

## Troubleshooting

### Build Falha

```bash
# Verifique se todas as dependências estão no package.json
npm install

# Teste o build localmente
npm run build
```

### Aplicação não inicia

1. Verifique as variáveis de ambiente
2. Confirme se `DATABASE_URL` está acessível
3. Verifique os logs no painel EasyPanel

### Problemas de Conectividade

1. Confirme se a porta 9002 está exposta
2. Verifique se o health check está respondendo
3. Teste conectividade com banco de dados

### Performance

1. Monitore uso de CPU/RAM no painel
2. Ajuste recursos se necessário
3. Considere usar Redis para cache (opcional)

## Comandos Úteis

### Logs em Tempo Real

```bash
# No painel EasyPanel, vá em "Logs" para ver em tempo real
```

### Restart da Aplicação

```bash
# Use o botão "Restart" no painel
```

### Rollback

```bash
# Use "Deployments" > "Rollback" para versão anterior
```

## Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados acessível
- [ ] Domínio configurado com SSL
- [ ] Health check funcionando
- [ ] Logs sem erros críticos
- [ ] Funcionalidades principais testadas
- [ ] Backup do banco configurado
- [ ] Monitoramento ativo

## Suporte

Para problemas específicos do EasyPanel:

1. Consulte a documentação oficial
2. Verifique os logs detalhados
3. Entre em contato com o suporte se necessário

O Dockerfile está otimizado especificamente para o EasyPanel com:

- Compatibilidade total com a plataforma
- Build eficiente e rápido
- Segurança aprimorada
- Monitoramento integrado
