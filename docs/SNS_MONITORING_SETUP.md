# AWS SNS Monitoring Setup - Vinha Admin Center

## 📋 Visão Geral

Sistema completo de monitoramento de emails via AWS SNS que detecta automaticamente:
- **Bounces** (emails que não foram entregues)
- **Complaints** (marcações como spam)
- **Blacklist automática** de emails problemáticos

## 🎯 Funcionalidades

### ✅ Implementado
- Endpoint webhook para receber notificações SNS
- Blacklist automática de bounces permanentes
- Blacklist automática de complaints (spam)
- Logs detalhados de todas as notificações
- API para gerenciar blacklist manualmente
- Verificação de blacklist antes de enviar emails

## 🚀 Setup AWS SNS

### 1. Criar Tópico SNS

```bash
# Via AWS CLI
aws sns create-topic --name vinha-ses-notifications --region us-east-1
```

Ou via Console AWS:
1. Acesse **SNS** > **Topics**
2. Clique em **Create topic**
3. Nome: `vinha-ses-notifications`
4. Type: **Standard**
5. Clique em **Create topic**

### 2. Configurar SES para Enviar Notificações

```bash
# Configurar notificações de Bounce
aws ses set-identity-notification-topic \
  --identity contato@multidesk.io \
  --notification-type Bounce \
  --sns-topic arn:aws:sns:us-east-1:ACCOUNT_ID:vinha-ses-notifications

# Configurar notificações de Complaint
aws ses set-identity-notification-topic \
  --identity contato@multidesk.io \
  --notification-type Complaint \
  --sns-topic arn:aws:sns:us-east-1:ACCOUNT_ID:vinha-ses-notifications

# Desabilitar notificações por email (opcional)
aws ses set-identity-headers-in-notifications-enabled \
  --identity contato@multidesk.io \
  --notification-type Bounce \
  --enabled

aws ses set-identity-headers-in-notifications-enabled \
  --identity contato@multidesk.io \
  --notification-type Complaint \
  --enabled
```

Ou via Console AWS:
1. Acesse **SES** > **Verified identities**
2. Selecione seu domínio/email
3. Aba **Notifications**
4. Clique em **Edit** em cada tipo:
   - **Bounce feedback**: Selecione o tópico SNS
   - **Complaint feedback**: Selecione o tópico SNS

### 3. Criar Subscription no SNS

```bash
# Criar subscription HTTPS
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:vinha-ses-notifications \
  --protocol https \
  --notification-endpoint https://seu-dominio.com/api/v1/sns/webhook
```

Ou via Console AWS:
1. Acesse **SNS** > **Topics** > `vinha-ses-notifications`
2. Clique em **Create subscription**
3. Protocol: **HTTPS**
4. Endpoint: `https://seu-dominio.com/api/v1/sns/webhook`
5. Clique em **Create subscription**

### 4. Confirmar Subscription

O endpoint `/api/v1/sns/webhook` confirmará automaticamente a subscription quando receber a primeira mensagem do tipo `SubscriptionConfirmation`.

## 📡 Endpoint Webhook

### URL
```
POST https://seu-dominio.com/api/v1/sns/webhook
```

### Tipos de Mensagens

#### 1. SubscriptionConfirmation
Primeira mensagem enviada pelo SNS para confirmar a subscription.

```json
{
  "Type": "SubscriptionConfirmation",
  "MessageId": "...",
  "Token": "...",
  "TopicArn": "arn:aws:sns:us-east-1:...",
  "SubscribeURL": "https://..."
}
```

**Resposta:** O endpoint acessa automaticamente o `SubscribeURL` para confirmar.

#### 2. Notification - Bounce

```json
{
  "Type": "Notification",
  "Message": "{
    \"notificationType\": \"Bounce\",
    \"bounce\": {
      \"bounceType\": \"Permanent\",
      \"bounceSubType\": \"General\",
      \"bouncedRecipients\": [
        {
          \"emailAddress\": \"usuario@exemplo.com\",
          \"diagnosticCode\": \"smtp; 550 5.1.1 user unknown\"
        }
      ]
    },
    \"mail\": {
      \"messageId\": \"...\",
      \"source\": \"contato@multidesk.io\",
      \"destination\": [\"usuario@exemplo.com\"]
    }
  }"
}
```

**Ação:** 
- Se `bounceType === 'Permanent'`: adiciona à blacklist
- Se `bounceType === 'Transient'`: apenas loga (não adiciona à blacklist)

#### 3. Notification - Complaint

```json
{
  "Type": "Notification",
  "Message": "{
    \"notificationType\": \"Complaint\",
    \"complaint\": {
      \"complainedRecipients\": [
        {
          \"emailAddress\": \"usuario@exemplo.com\"
        }
      ],
      \"complaintFeedbackType\": \"abuse\"
    },
    \"mail\": {
      \"messageId\": \"...\",
      \"source\": \"contato@multidesk.io\",
      \"destination\": [\"usuario@exemplo.com\"]
    }
  }"
}
```

**Ação:** Adiciona imediatamente à blacklist (usuário marcou como spam).

## 🔒 API de Blacklist

### GET - Listar Blacklist

```bash
# Todos os emails
GET /api/v1/email-blacklist

# Apenas ativos
GET /api/v1/email-blacklist?active=true

# Apenas inativos
GET /api/v1/email-blacklist?active=false
```

**Resposta:**
```json
{
  "blacklist": [
    {
      "id": "uuid",
      "email": "usuario@exemplo.com",
      "reason": "bounce",
      "errorCode": "General",
      "errorMessage": "smtp; 550 5.1.1 user unknown",
      "firstFailedAt": "2025-01-01T00:00:00Z",
      "lastAttemptAt": "2025-01-01T00:00:00Z",
      "attemptCount": 1,
      "isActive": true
    }
  ]
}
```

### POST - Adicionar à Blacklist

```bash
POST /api/v1/email-blacklist
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "reason": "manual",
  "errorMessage": "Usuário solicitou remoção"
}
```

### DELETE - Remover da Blacklist

```bash
DELETE /api/v1/email-blacklist?email=usuario@exemplo.com
```

## 📊 Tipos de Bounce

### Permanent (Adiciona à Blacklist)
- **General**: Email não existe
- **NoEmail**: Endereço inválido
- **Suppressed**: Email na lista de supressão da AWS

### Transient (Não Adiciona à Blacklist)
- **General**: Erro temporário
- **MailboxFull**: Caixa de entrada cheia
- **MessageTooLarge**: Mensagem muito grande
- **ContentRejected**: Conteúdo rejeitado

### Undetermined
- Bounce de tipo desconhecido (não adiciona à blacklist)

## 📝 Logs

Todas as notificações são registradas na tabela `notification_logs`:

```sql
SELECT * FROM notification_logs 
WHERE notification_type IN ('sns_bounce', 'sns_complaint')
ORDER BY sent_at DESC;
```

## 🔍 Monitoramento

### Verificar Bounces Recentes
```sql
SELECT 
  email,
  reason,
  error_code,
  error_message,
  attempt_count,
  last_attempt_at
FROM email_blacklist
WHERE reason = 'bounce'
  AND is_active = true
ORDER BY last_attempt_at DESC;
```

### Verificar Complaints Recentes
```sql
SELECT 
  email,
  reason,
  error_code,
  error_message,
  attempt_count,
  last_attempt_at
FROM email_blacklist
WHERE reason = 'complaint'
  AND is_active = true
ORDER BY last_attempt_at DESC;
```

### Taxa de Bounce
```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'sent') as enviados,
  COUNT(*) FILTER (WHERE status = 'failed') as falhas,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'failed')::numeric / 
    COUNT(*)::numeric * 100, 
    2
  ) as taxa_falha_pct
FROM notification_logs
WHERE channel = 'email'
  AND sent_at >= NOW() - INTERVAL '30 days';
```

## 🧪 Testar Sistema

### 1. Testar Bounce (AWS Mailbox Simulator)

```typescript
// Enviar para email de teste da AWS
await sendEmail({
  to: 'bounce@simulator.amazonses.com', // Simula bounce
  subject: 'Teste Bounce',
  html: '<p>Teste</p>',
  userId: 'user-id'
})
```

### 2. Testar Complaint

```typescript
await sendEmail({
  to: 'complaint@simulator.amazonses.com', // Simula complaint
  subject: 'Teste Complaint',
  html: '<p>Teste</p>',
  userId: 'user-id'
})
```

### 3. Verificar Webhook

```bash
# Ver logs do webhook
tail -f logs/sns-webhook.log

# Ou verificar no banco
SELECT * FROM notification_logs 
WHERE notification_type IN ('sns_bounce', 'sns_complaint')
ORDER BY sent_at DESC LIMIT 10;
```

## 🛡️ Segurança

### Validar Assinatura SNS (Recomendado para Produção)

```typescript
import { MessageValidator } from 'sns-validator'

const validator = new MessageValidator()

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  try {
    await validator.validate(body)
    // Processar mensagem...
  } catch (error) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }
}
```

Instalar dependência:
```bash
npm install sns-validator
```

## 📈 Métricas Importantes

### KPIs para Monitorar
- **Taxa de Bounce**: < 5% (ideal < 2%)
- **Taxa de Complaint**: < 0.1%
- **Emails na Blacklist**: Monitorar crescimento
- **Tentativas de envio para blacklist**: Deve ser 0

### Alertas Recomendados
- Taxa de bounce > 5% em 24h
- Taxa de complaint > 0.1% em 24h
- Mais de 10 emails adicionados à blacklist em 1h

## 🔧 Troubleshooting

### Webhook não recebe notificações
1. Verificar se o endpoint está acessível publicamente
2. Verificar se a subscription está confirmada no SNS
3. Verificar logs do CloudWatch no SNS

### Emails não vão para blacklist
1. Verificar se `bounceType === 'Permanent'`
2. Verificar logs da tabela `notification_logs`
3. Verificar se o webhook está processando corretamente

### Falso positivo na blacklist
1. Remover manualmente: `DELETE /api/v1/email-blacklist?email=...`
2. Investigar motivo do bounce/complaint
3. Considerar adicionar whitelist se necessário

## 📚 Referências

- [AWS SES Notifications](https://docs.aws.amazon.com/ses/latest/dg/monitor-sending-activity-using-notifications.html)
- [AWS SNS HTTPS Subscriptions](https://docs.aws.amazon.com/sns/latest/dg/sns-http-https-endpoint-as-subscriber.html)
- [SES Bounce Types](https://docs.aws.amazon.com/ses/latest/dg/notification-contents.html#bounce-types)

---

**Sistema implementado e pronto para uso!** 🚀
