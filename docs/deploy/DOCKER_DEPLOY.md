# 🐳 Deploy com Docker

## 🚀 Deploy Rápido

### 1. Build da Imagem

```bash
docker build -t vinha-admin-center:0.1.0 .
```

### 2. Executar com Docker Compose

```bash
# Criar arquivo .env na raiz
cp .env.example .env

# Editar .env com suas configurações
# Importante: DATABASE_URL deve apontar para o serviço 'db'
# DATABASE_URL=postgresql://vinha:vinha123@db:5432/vinha_admin

# Subir os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Aplicar migrações
docker-compose exec app npm run db:push

# Popular banco de dados
docker-compose exec app npm run db:seed
```

### 3. Acessar Sistema

```
http://localhost:9002
```

---

## 🔧 Comandos Úteis

### Gerenciamento

```bash
# Parar serviços
docker-compose down

# Parar e remover volumes
docker-compose down -v

# Rebuild
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Executar comandos no container
docker-compose exec app npm run db:studio
```

### Backup do Banco

```bash
# Backup
docker-compose exec db pg_dump -U vinha vinha_admin > backup.sql

# Restore
docker-compose exec -T db psql -U vinha vinha_admin < backup.sql
```

---

## 🌐 Deploy em Produção

### Variáveis de Ambiente Obrigatórias

```env
DATABASE_URL=postgresql://user:pass@host:5432/db
COMPANY_INIT=uuid-da-empresa
DEFAULT_PASSWORD=senha-segura
CRON_SECRET=token-secreto-64-chars

# Cielo
CIELO_MERCHANT_ID=seu-merchant-id
CIELO_MERCHANT_KEY=sua-merchant-key
CIELO_ENVIRONMENT=production

# AWS S3 (opcional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=

# SMTP (opcional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# WhatsApp (opcional)
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
```

### Docker Hub

```bash
# Tag
docker tag vinha-admin-center:0.1.0 seu-usuario/vinha-admin-center:0.1.0

# Push
docker push seu-usuario/vinha-admin-center:0.1.0

# Pull e Run
docker pull seu-usuario/vinha-admin-center:0.1.0
docker run -d -p 9002:9002 --env-file .env seu-usuario/vinha-admin-center:0.1.0
```

---

## 📊 Monitoramento

### Health Check

```bash
curl http://localhost:9002/api/health
```

### Logs

```bash
# Últimas 100 linhas
docker-compose logs --tail=100 app

# Tempo real
docker-compose logs -f app

# Filtrar erros
docker-compose logs app | grep ERROR
```

---

## 🔒 Segurança

### Recomendações

- ✅ Use secrets do Docker Swarm/Kubernetes em produção
- ✅ Não commite o arquivo .env
- ✅ Use HTTPS com reverse proxy (Nginx/Traefik)
- ✅ Configure firewall para portas expostas
- ✅ Atualize imagens base regularmente

### Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:9002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🎯 Troubleshooting

### Container não inicia

```bash
# Ver logs detalhados
docker-compose logs app

# Verificar variáveis de ambiente
docker-compose exec app env

# Entrar no container
docker-compose exec app sh
```

### Banco de dados não conecta

```bash
# Verificar se o PostgreSQL está rodando
docker-compose ps

# Testar conexão
docker-compose exec app npm run db:studio

# Verificar DATABASE_URL
docker-compose exec app echo $DATABASE_URL
```

### Build falha

```bash
# Limpar cache
docker builder prune

# Build sem cache
docker-compose build --no-cache
```

---

**Última Atualização:** Janeiro 2025
