# S3 Troubleshooting - Imagens Não Aparecem em Produção

## Problema Comum

Imagens funcionam em desenvolvimento mas dão erro em produção.

## Causas e Soluções

### 1. ✅ URL Incorreta (RESOLVIDO)

**Problema**: URL gerada estava incorreta para AWS S3.

**Solução**: Código atualizado em `s3-client.ts` para gerar URLs corretas:
- AWS S3: `https://bucket.s3.region.amazonaws.com/key`
- CloudFront: `https://cloudfront-url/key`
- MinIO: `https://endpoint/bucket/key`

### 2. 🔒 Bucket Não Público

**Problema**: Arquivos não têm permissão de leitura pública.

**Solução AWS S3**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::SEU-BUCKET/*"
    }
  ]
}
```

1. Acesse AWS Console → S3 → Seu Bucket
2. Vá em **Permissions** → **Bucket Policy**
3. Cole a policy acima (substitua `SEU-BUCKET`)
4. Desmarque **Block all public access**

**Solução MinIO**:

```bash
mc anonymous set download minio/SEU-BUCKET
```

### 3. 🌐 CORS Não Configurado

**Problema**: Browser bloqueia requisições cross-origin.

**Solução AWS S3**:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

1. AWS Console → S3 → Seu Bucket
2. **Permissions** → **CORS configuration**
3. Cole a configuração acima

**Solução MinIO**:

MinIO permite CORS por padrão para buckets públicos.

### 4. ☁️ CloudFront

**Problema**: CloudFront não configurado ou cache desatualizado.

**Solução**:

1. Configure CloudFront no painel: `/admin/configuracoes/s3`
2. URL deve ser: `https://d111111abcdef8.cloudfront.net` (sem barra final)
3. Invalidar cache se necessário:

```bash
aws cloudfront create-invalidation \
  --distribution-id SEU-DISTRIBUTION-ID \
  --paths "/*"
```

### 5. 🔑 Variáveis de Ambiente

**Problema**: `.env.local` não é carregado em produção.

**Solução Docker**:

Adicione no `docker-compose.yml`:

```yaml
environment:
  - DATABASE_URL=${DATABASE_URL}
  - JWT_SECRET=${JWT_SECRET}
  - COMPANY_INIT=${COMPANY_INIT}
  # Não precisa de variáveis S3 aqui - vem do banco
```

**Solução Vercel/Netlify**:

Configure no painel de variáveis de ambiente.

### 6. 🔐 IAM Permissions (AWS)

**Problema**: Credenciais sem permissão.

**Solução**: Policy mínima necessária:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::SEU-BUCKET/*"
    }
  ]
}
```

## Checklist de Produção

- [ ] Bucket configurado como público
- [ ] CORS configurado
- [ ] Policy de bucket permite leitura pública
- [ ] IAM user tem permissões corretas
- [ ] CloudFront configurado (se usar)
- [ ] URLs geradas estão corretas
- [ ] Testar upload no painel: `/admin/configuracoes/s3`

## Teste Rápido

### 1. Testar Conexão

Acesse: `/admin/configuracoes/s3` → **Testar Conexão**

### 2. Testar Upload

Acesse qualquer perfil → Trocar avatar

### 3. Verificar URL

Inspecione a imagem no browser:
- Clique direito → Inspecionar
- Veja a URL no atributo `src`
- Copie e abra em nova aba

**URL Correta AWS S3**:
```
https://meu-bucket.s3.us-east-1.amazonaws.com/avatars/1234567890-abc123.jpg
```

**URL Correta CloudFront**:
```
https://d111111abcdef8.cloudfront.net/avatars/1234567890-abc123.jpg
```

**URL Correta MinIO**:
```
https://minio.meudominio.com/meu-bucket/avatars/1234567890-abc123.jpg
```

## Logs de Debug

Adicione logs temporários em `s3-client.ts`:

```typescript
async uploadFile(...) {
  // ...
  const url = this.getPublicUrl(key)
  console.log('🔍 S3 Upload:', { key, url, config: this.config })
  return url
}
```

Verifique os logs do servidor em produção.

## Suporte

Se o problema persistir:

1. Verifique logs do servidor
2. Teste URL diretamente no browser
3. Verifique console do browser (F12)
4. Confirme que bucket está público
5. Teste com `curl`:

```bash
curl -I https://seu-bucket.s3.amazonaws.com/avatars/teste.jpg
```

Deve retornar `200 OK` e não `403 Forbidden`.
