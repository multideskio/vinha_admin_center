# 🚀 SNS Monitoring - Quick Start

## Setup em 5 Minutos

### 1. Execute o Script de Configuração

```bash
# Dar permissão de execução
chmod +x scripts/setup-sns.sh

# Executar (substitua pelos seus valores)
./scripts/setup-sns.sh contato@multidesk.io https://seu-dominio.com/api/v1/sns/webhook
```

### 2. Aguarde Confirmação

O endpoint `/api/v1/sns/webhook` confirmará automaticamente a subscription.

### 3. Teste o Sistema

```bash
# Executar script de teste
npm run test:sns
```

Ou adicione ao `package.json`:
```json
{
  "scripts": {
    "test:sns": "tsx scripts/test-sns-monitoring.ts"
  }
}
```

## ✅ Verificação Rápida

### Via API

```bash
# Listar blacklist
curl https://seu-dominio.com/api/v1/email-blacklist

# Adicionar email manualmente
curl -X POST https://seu-dominio.com/api/v1/email-blacklist \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","reason":"manual"}'

# Remover da blacklist
curl -X DELETE "https://seu-dominio.com/api/v1/email-blacklist?email=test@example.com"
```

### Via SQL

```sql
-- Ver blacklist
SELECT * FROM email_blacklist WHERE is_active = true;

-- Ver logs SNS
SELECT * FROM notification_logs 
WHERE notification_type IN ('sns_bounce', 'sns_complaint')
ORDER BY sent_at DESC LIMIT 10;
```

## 🧪 Emails de Teste AWS

```typescript
// Bounce permanente
await sendEmail({ to: 'bounce@simulator.amazonses.com', ... })

// Complaint (spam)
await sendEmail({ to: 'complaint@simulator.amazonses.com', ... })

// Sucesso
await sendEmail({ to: 'success@simulator.amazonses.com', ... })
```

## 📊 Dashboard Rápido

```sql
-- Estatísticas gerais
SELECT 
  reason,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_active = true) as ativos
FROM email_blacklist
GROUP BY reason;

-- Taxa de bounce (últimos 30 dias)
SELECT 
  DATE(sent_at) as dia,
  COUNT(*) FILTER (WHERE status = 'sent') as enviados,
  COUNT(*) FILTER (WHERE status = 'failed') as falhas,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'failed')::numeric / 
    COUNT(*)::numeric * 100, 
    2
  ) as taxa_falha_pct
FROM notification_logs
WHERE channel = 'email'
  AND sent_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(sent_at)
ORDER BY dia DESC;
```

## 🔧 Troubleshooting Rápido

### Webhook não recebe notificações?

1. **Verificar subscription:**
```bash
aws sns list-subscriptions-by-topic \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:vinha-ses-notifications
```

2. **Verificar endpoint público:**
```bash
curl -X POST https://seu-dominio.com/api/v1/sns/webhook \
  -H "Content-Type: application/json" \
  -d '{"Type":"test"}'
```

3. **Ver logs CloudWatch:**
```bash
aws logs tail /aws/sns/us-east-1/ACCOUNT_ID/vinha-ses-notifications --follow
```

### Email não vai para blacklist?

1. Verificar tipo de bounce (só `Permanent` vai para blacklist)
2. Ver logs: `SELECT * FROM notification_logs WHERE notification_type = 'sns_bounce'`
3. Verificar se webhook processou: buscar por `messageId` nos logs

## 📚 Documentação Completa

Ver: [SNS_MONITORING_SETUP.md](./SNS_MONITORING_SETUP.md)

---

**Sistema pronto! 🎉**
