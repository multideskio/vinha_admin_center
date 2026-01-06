# Docker Development Guide

Este guia explica como usar Docker para desenvolvimento do Vinha Admin Center.

## Arquivos Docker

- `Dockerfile` - Configurado para desenvolvimento com hot reload
- `docker-compose.yml` - Configuração padrão (desenvolvimento)
- `docker-compose.dev.yml` - Configuração específica para desenvolvimento
- `.dockerignore` - Arquivos excluídos do contexto Docker

## Comandos Rápidos

### Desenvolvimento Local

```bash
# Iniciar todos os serviços em desenvolvimento
docker-compose up -d

# Ou usar o arquivo específico de desenvolvimento
docker-compose -f docker-compose.dev.yml up -d

# Ver logs em tempo real
docker-compose logs -f app

# Parar todos os serviços
docker-compose down
```

### Rebuild da Aplicação

```bash
# Rebuild apenas a aplicação
docker-compose build app

# Rebuild e reiniciar
docker-compose up --build -d
```

## Serviços Incluídos

### Aplicação Principal (app)
- **Porta**: 9002
- **Hot Reload**: Habilitado via volumes
- **Ambiente**: development
- **Comando**: `npm run dev`

### PostgreSQL (db)
- **Porta**: 5432
- **Usuário**: vinha
- **Senha**: vinha123
- **Database**: vinha_admin
- **Volume**: Dados persistidos

### Redis (redis)
- **Porta**: 6379
- **Volume**: Dados persistidos
- **Configuração**: Append-only habilitado

### Adminer (adminer) - Apenas em dev
- **Porta**: 8080
- **Acesso**: http://localhost:8080
- **Servidor**: db
- **Usuário**: vinha
- **Senha**: vinha123

### Redis Commander (redis-commander) - Apenas em dev
- **Porta**: 8081
- **Acesso**: http://localhost:8081

## Volumes de Desenvolvimento

Os seguintes diretórios são montados para hot reload:

```
./src -> /app/src
./public -> /app/public
./drizzle -> /app/drizzle
./package.json -> /app/package.json
./next.config.ts -> /app/next.config.ts
./tailwind.config.ts -> /app/tailwind.config.ts
./tsconfig.json -> /app/tsconfig.json
./drizzle.config.ts -> /app/drizzle.config.ts
```

## Variáveis de Ambiente

### Padrão para Desenvolvimento

```env
NODE_ENV=development
DATABASE_URL=postgresql://vinha:vinha123@db:5432/vinha_admin
COMPANY_INIT=550e8400-e29b-41d4-a716-446655440000
DEFAULT_PASSWORD=123456
CRON_SECRET=dev-cron-secret
JWT_SECRET=dev-jwt-secret-key-very-long-and-secure
NEXT_PUBLIC_APP_URL=http://localhost:9002
REDIS_URL=redis://redis:6379
```

### Customização

Crie um arquivo `.env.local` na raiz do projeto para sobrescrever variáveis:

```env
# .env.local
COMPANY_INIT=seu-company-id-aqui
JWT_SECRET=sua-chave-jwt-super-secreta
```

## Comandos Úteis

### Database

```bash
# Executar migrações
docker-compose exec app npm run db:migrate

# Gerar schema
docker-compose exec app npm run db:generate

# Seed do banco
docker-compose exec app npm run db:seed

# Abrir Drizzle Studio
docker-compose exec app npm run db:studio
```

### Logs e Debug

```bash
# Ver logs da aplicação
docker-compose logs -f app

# Ver logs do banco
docker-compose logs -f db

# Ver logs de todos os serviços
docker-compose logs -f

# Entrar no container da aplicação
docker-compose exec app sh

# Entrar no container do banco
docker-compose exec db psql -U vinha -d vinha_admin
```

### Limpeza

```bash
# Parar e remover containers
docker-compose down

# Remover volumes (CUIDADO: apaga dados)
docker-compose down -v

# Limpar imagens não utilizadas
docker image prune

# Limpeza completa do Docker
docker system prune -a
```

## Troubleshooting

### Problema: Aplicação não inicia

1. Verifique se as portas estão livres:
   ```bash
   netstat -tulpn | grep :9002
   ```

2. Verifique os logs:
   ```bash
   docker-compose logs app
   ```

3. Rebuild a imagem:
   ```bash
   docker-compose build --no-cache app
   ```

### Problema: Banco não conecta

1. Verifique se o PostgreSQL está rodando:
   ```bash
   docker-compose ps db
   ```

2. Teste a conexão:
   ```bash
   docker-compose exec db pg_isready -U vinha
   ```

3. Verifique a URL de conexão no container:
   ```bash
   docker-compose exec app env | grep DATABASE_URL
   ```

### Problema: Hot reload não funciona

1. Verifique se os volumes estão montados:
   ```bash
   docker-compose exec app ls -la /app/src
   ```

2. Reinicie apenas a aplicação:
   ```bash
   docker-compose restart app
   ```

### Problema: Permissões no Windows

Se estiver usando Windows, certifique-se de que:

1. O Docker Desktop está configurado para usar WSL2
2. Os arquivos estão no sistema de arquivos do WSL2
3. As permissões estão corretas:
   ```bash
   docker-compose exec app whoami
   # Deve retornar: nextjs
   ```

## Performance

### Otimizações para Desenvolvimento

1. **Exclude node_modules**: O volume exclui `node_modules` para evitar conflitos
2. **Exclude .next**: Build artifacts são excluídos dos volumes
3. **Multi-stage build**: Não usado em desenvolvimento para velocidade
4. **Health checks**: Configurados para garantir que serviços estejam prontos

### Monitoramento

- **Aplicação**: http://localhost:9002
- **Database Admin**: http://localhost:8080
- **Redis Admin**: http://localhost:8081
- **Health Check**: http://localhost:9002/api/v1/maintenance-check

## Próximos Passos

Após configurar o ambiente Docker:

1. Acesse http://localhost:9002
2. Faça login com as credenciais padrão
3. Configure os gateways de pagamento em Admin > Configurações
4. Teste as funcionalidades principais

Para produção, consulte [DOCKER_DEPLOY.md](./DOCKER_DEPLOY.md).