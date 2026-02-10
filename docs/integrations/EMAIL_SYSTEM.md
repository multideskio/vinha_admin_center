# Sistema de Email - Vinha Admin Center

## Visão Geral

Sistema completo de envio de emails com AWS SES, incluindo:

- ✅ Logs detalhados com email completo
- ✅ Blacklist automática de emails com problema
- ✅ Verificação antes do envio
- ✅ Captura de erros específicos do SES

## Estrutura

### Tabelas do Banco de Dados

#### notification_logs

Logs completos de todas as notificações enviadas:

```sql
- id: UUID
- companyId: UUID
- userId: UUID
- notificationType: VARCHAR(50)
- channel: VARCHAR(20) -- 'email' ou 'whatsapp'
- status: VARCHAR(20) -- 'sent' ou 'failed'
- recipient: VARCHAR(255) -- Email ou telefone do destinatário
- subject: VARCHAR(500) -- Assunto do email
- messageContent: TEXT -- Conteúdo completo
- errorMessage: TEXT -- Mensagem de erro se falhou
- errorCode: VARCHAR(50) -- Código do erro (ex: MessageRejected)
- sentAt: TIMESTAMP
```

#### email_blacklist

Emails bloqueados automaticamente:

```sql
- id: UUID
- companyId: UUID
- email: VARCHAR(255) -- Email bloqueado
- reason: VARCHAR(50) -- 'bounce', 'complaint', 'error'
- errorCode: VARCHAR(50) -- Código do erro SES
- errorMessage: TEXT -- Detalhes do erro
- firstFailedAt: TIMESTAMP -- Primeira falha
- lastAttemptAt: TIMESTAMP -- Última tentativa
- attemptCount: INTEGER -- Número de tentativas
- isActive: BOOLEAN -- Se está ativo na blacklist
```

## Fluxo de Envio

### 1. Verificação de Blacklist

Antes de enviar, o sistema verifica se o email está na blacklist:

```typescript
const [blacklisted] = await db
  .select()
  .from(emailBlacklist)
  .where(
    and(
      eq(emailBlacklist.companyId, COMPANY_ID),
      eq(emailBlacklist.email, to),
      eq(emailBlacklist.isActive, true),
    ),
  )
```

### 2. Envio via SES

Se não estiver bloqueado, envia via AWS SES:

```typescript
const command = new SendEmailCommand({
  Source: fromAddress,
  Destination: { ToAddresses: [to] },
  Message: {
    Subject: { Data: subject },
    Body: { Html: { Data: html } },
  },
})
await sesClient.send(command)
```

### 3. Log Completo

Registra todos os detalhes do envio:

```typescript
await db.insert(notificationLogs).values({
  companyId: COMPANY_ID,
  userId,
  notificationType: 'payment_reminder',
  channel: 'email',
  status: 'sent',
  recipient: to,
  subject: subject,
  messageContent: html,
  errorMessage: null,
  errorCode: null,
})
```

### 4. Tratamento de Erros

Se falhar, adiciona à blacklist se for erro permanente:

```typescript
const errorCode = error.name || error.Code
const errorMessage = error.message

if (shouldBlacklist(errorCode)) {
  await addToBlacklist(to, errorCode, errorMessage)
}
```

## Erros que Acionam Blacklist

### Erros Permanentes (Blacklist Automática)

- `MessageRejected` - Email rejeitado pelo servidor
- `MailFromDomainNotVerified` - Domínio não verificado
- `InvalidParameterValue` - Email inválido
- `AccountSendingPausedException` - Conta pausada
- Qualquer erro com `Bounce` - Email não existe
- Qualquer erro com `Complaint` - Usuário marcou como spam

### Erros Temporários (Não Blacklist)

- `Throttling` - Rate limit
- `ServiceUnavailable` - Serviço indisponível
- `RequestTimeout` - Timeout

## API de Gerenciamento

### GET /api/v1/email-blacklist

Lista emails na blacklist:

```bash
# Todos
GET /api/v1/email-blacklist

# Apenas ativos
GET /api/v1/email-blacklist?active=true

# Apenas inativos
GET /api/v1/email-blacklist?active=false
```

Resposta:

```json
{
  "blacklist": [
    {
      "id": "uuid",
      "email": "usuario@exemplo.com",
      "reason": "bounce",
      "errorCode": "MessageRejected",
      "errorMessage": "Email address does not exist",
      "firstFailedAt": "2024-01-01T10:00:00Z",
      "lastAttemptAt": "2024-01-01T10:00:00Z",
      "attemptCount": 1,
      "isActive": true
    }
  ]
}
```

### DELETE /api/v1/email-blacklist?email=usuario@exemplo.com

Remove email da blacklist (marca como inativo):

```bash
DELETE /api/v1/email-blacklist?email=usuario@exemplo.com
```

Resposta:

```json
{
  "success": true
}
```

## Uso nos Serviços

### email.ts (Simples)

```typescript
import { sendEmail } from '@/lib/email'

await sendEmail({
  to: 'usuario@exemplo.com',
  subject: 'Bem-vindo',
  html: '<h1>Olá!</h1>',
  userId: 'user-uuid',
  notificationType: 'welcome',
})
```

### notifications.ts (Completo)

```typescript
import { NotificationService } from '@/lib/notifications'

const notificationService = new NotificationService({
  companyId: COMPANY_ID,
  sesRegion: 'us-east-1',
  sesAccessKeyId: 'xxx',
  sesSecretAccessKey: 'xxx',
  fromEmail: 'contato@igreja.com',
})

await notificationService.sendWelcome(
  userId,
  'João Silva',
  'Igreja Vinha',
  undefined, // phone
  'joao@exemplo.com',
)
```

## Monitoramento

### Consultar Logs

```sql
-- Emails falhados nas últimas 24h
SELECT
  recipient,
  subject,
  errorCode,
  errorMessage,
  sentAt
FROM notification_logs
WHERE
  channel = 'email'
  AND status = 'failed'
  AND sentAt > NOW() - INTERVAL '24 hours'
ORDER BY sentAt DESC;

-- Taxa de sucesso por tipo
SELECT
  notificationType,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as success,
  ROUND(100.0 * SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM notification_logs
WHERE channel = 'email'
GROUP BY notificationType;
```

### Consultar Blacklist

```sql
-- Emails bloqueados ativos
SELECT
  email,
  reason,
  errorCode,
  attemptCount,
  firstFailedAt,
  lastAttemptAt
FROM email_blacklist
WHERE isActive = true
ORDER BY lastAttemptAt DESC;

-- Emails com mais tentativas
SELECT
  email,
  attemptCount,
  reason,
  lastAttemptAt
FROM email_blacklist
WHERE isActive = true
ORDER BY attemptCount DESC
LIMIT 10;
```

## Migração do Banco

Execute para criar as novas colunas e tabela:

```bash
npm run db:generate
npm run db:push
```

## Boas Práticas

1. **Sempre passe userId** nos envios para ter logs completos
2. **Monitore a blacklist** regularmente
3. **Investigue emails bloqueados** antes de remover da blacklist
4. **Configure SNS do SES** para receber notificações de bounce/complaint
5. **Valide emails** antes de adicionar usuários
6. **Use templates** para mensagens consistentes
7. **Teste em sandbox** antes de produção

## Configuração AWS SES

### 1. Verificar Domínio

```bash
# No console AWS SES
1. Verified identities > Create identity
2. Domain > seu-dominio.com
3. Adicionar registros DNS (DKIM, SPF, DMARC)
```

### 2. Sair do Sandbox

```bash
# Solicitar aumento de limite
1. Account dashboard > Request production access
2. Preencher formulário com caso de uso
3. Aguardar aprovação (24-48h)
```

### 3. Configurar SNS (Opcional)

```bash
# Para receber notificações de bounce/complaint
1. SNS > Create topic > email-bounces
2. SES > Configuration sets > Create
3. Event destinations > Add destination
4. Bounce/Complaint > SNS topic
```

## Troubleshooting

### Email não está sendo enviado

1. Verificar se está na blacklist
2. Verificar credenciais SES
3. Verificar se domínio está verificado
4. Verificar logs em notification_logs

### Email vai para spam

1. Configurar SPF, DKIM, DMARC
2. Usar domínio verificado
3. Evitar palavras de spam
4. Incluir link de unsubscribe

### Taxa de bounce alta

1. Validar emails antes de enviar
2. Limpar lista regularmente
3. Usar double opt-in
4. Monitorar blacklist

## Próximos Passos

- [ ] Dashboard de métricas de email
- [ ] Webhook para processar bounces do SES
- [ ] Retry automático para erros temporários
- [ ] Validação de email em tempo real
- [ ] Templates visuais de email
- [ ] A/B testing de assuntos
