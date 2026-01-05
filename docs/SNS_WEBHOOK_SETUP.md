# Configuração do Webhook SNS para Monitoramento de Emails

## 📋 Visão Geral

Este documento descreve como configurar o Amazon SNS para receber notificações de bounces e complaints do Amazon SES, integrando com o sistema de monitoramento de emails do Vinha Admin Center.

**Status:** ✅ Implementado com validação de assinatura e segurança completa

---

## 🔐 Melhorias de Segurança Implementadas

### ✅ 1. Validação de Assinatura SNS

- **Biblioteca:** `sns-validator`
- **Função:** Valida que mensagens SNS são autênticas
- **Proteção:** Previne ataques de falsificação de mensagens

### ✅ 2. Autenticação JWT

- **APIs Protegidas:** `/api/v1/notification-logs` e `/api/v1/email-blacklist`
- **Função:** Apenas usuários autenticados podem consultar logs e gerenciar blacklist
- **Middleware:** `validateRequest` de `@/lib/jwt`

### ✅ 3. Validação de Input (Zod)

- **Endpoint:** POST `/api/v1/email-blacklist`
- **Schema:** Valida email, reason e errorMessage
- **Proteção:** Previne dados inválidos no banco

### ✅ 4. Validação de Environment Variables

- **Variável:** `COMPANY_INIT`
- **Validação:** Erro lançado se não configurada
- **Proteção:** Garante que sistema não rode sem configuração

### ✅ 5. Error Handling Aprimorado

- **Logging detalhado:** Stack traces, timestamps e contexto
- **Respostas estruturadas:** Mensagens de erro claras
- **Isolamento de erros:** Bounces/complaints não afetam uns aos outros

---

## 🚀 Configuração Passo a Passo

### 1️⃣ Criar Tópico SNS na AWS

```bash
# Criar tópico SNS
aws sns create-topic --name vinha-ses-notifications

# Copiar o ARN retornado (exemplo):
# arn:aws:sns:us-east-1:123456789012:vinha-ses-notifications
```

### 2️⃣ Configurar SES para Enviar Notificações

```bash
# Substituir YOUR_EMAIL_OR_DOMAIN e TOPIC_ARN

# Configurar notificações de Bounce
aws ses set-identity-notification-topic \
  --identity YOUR_EMAIL_OR_DOMAIN \
  --notification-type Bounce \
  --sns-topic TOPIC_ARN

# Configurar notificações de Complaint
aws ses set-identity-notification-topic \
  --identity YOUR_EMAIL_OR_DOMAIN \
  --notification-type Complaint \
  --sns-topic TOPIC_ARN

# (Opcional) Configurar notificações de Delivery
aws ses set-identity-notification-topic \
  --identity YOUR_EMAIL_OR_DOMAIN \
  --notification-type Delivery \
  --sns-topic TOPIC_ARN
```

### 3️⃣ Subscrever o Webhook ao Tópico SNS

```bash
# Substituir TOPIC_ARN e sua URL de produção
aws sns subscribe \
  --topic-arn TOPIC_ARN \
  --protocol https \
  --notification-endpoint https://seu-dominio.com/api/v1/sns/webhook
```

**Importante:** Após executar este comando:

1. O SNS enviará uma mensagem de confirmação ao endpoint
2. O webhook **automaticamente** confirmará a subscrição
3. Verifique os logs da aplicação para confirmar

### 4️⃣ Verificar Subscrição

```bash
# Listar subscrições do tópico
aws sns list-subscriptions-by-topic --topic-arn TOPIC_ARN
```

Você deve ver sua subscrição com status `Confirmed`.

---

## 🔧 Configuração de Ambiente

Certifique-se de que a variável de ambiente está configurada:

```env
# .env.local
COMPANY_INIT=sua-company-uuid-aqui
```

**⚠️ CRÍTICO:** O sistema não iniciará sem esta variável.

---

## 📊 Funcionamento do Sistema

### Fluxo de Notificações

```
┌─────────────┐
│   AWS SES   │  (Envia email)
└──────┬──────┘
       │
       ├─ ✅ Email entregue
       │
       ├─ ❌ Bounce (permanente)
       │    │
       │    ▼
       │  ┌──────────────┐
       │  │   AWS SNS    │
       │  └──────┬───────┘
       │         │
       │         ▼
       │  ┌─────────────────────────┐
       │  │  Webhook SNS            │
       │  │  /api/v1/sns/webhook    │
       │  └──────┬──────────────────┘
       │         │
       │         ├─ Validar assinatura SNS ✅
       │         ├─ Processar bounce
       │         ├─ Adicionar à blacklist
       │         └─ Registrar em notification_logs
       │
       └─ 📧 Complaint (spam)
            │
            (mesmo fluxo acima)
```

### Tipos de Bounce

| Tipo             | Blacklist? | Descrição                                          |
| ---------------- | ---------- | -------------------------------------------------- |
| **Permanent**    | ✅ Sim     | Email não existe, domínio inválido                 |
| **Transient**    | ❌ Não     | Caixa cheia, servidor temporariamente indisponível |
| **Undetermined** | ❌ Não     | Causa desconhecida                                 |

### Tipos de Complaint

| Tipo      | Blacklist? | Descrição               |
| --------- | ---------- | ----------------------- |
| **abuse** | ✅ Sim     | Marcado como spam/abuse |
| **fraud** | ✅ Sim     | Reportado como fraude   |
| **virus** | ✅ Sim     | Conteúdo malicioso      |
| **other** | ✅ Sim     | Outras reclamações      |

---

## 🧪 Testes

### 1. Testar Confirmação de Subscrição

Após configurar a subscrição, verifique os logs:

```bash
# Logs da aplicação devem mostrar:
SNS subscription confirmed successfully
```

### 2. Simular Bounce

Use o simulador de bounce da AWS:

```javascript
// Enviar email para:
bounce@simulator.amazonses.com
```

Após alguns segundos:

- ✅ Email aparece na aba **Bloqueados** (`/admin/configuracoes/smtp`)
- ✅ Log registrado em **Histórico**

### 3. Simular Complaint

Use o simulador de complaint da AWS:

```javascript
// Enviar email para:
complaint@simulator.amazonses.com
```

Após alguns segundos:

- ✅ Email aparece na aba **Bloqueados**
- ✅ Motivo: "Spam" ou "User complaint"

---

## 📝 Endpoints da API

### 🔒 `/api/v1/notification-logs` (Protegido)

**Autenticação:** JWT obrigatório

```bash
GET /api/v1/notification-logs?channel=email&page=1&limit=20
```

**Query Params:**

- `channel` (opcional): `email`, `sms`, `whatsapp`, `push`
- `page` (opcional): número da página (default: 1)
- `limit` (opcional): itens por página (default: 20)

**Resposta:**

```json
{
  "logs": [
    {
      "id": "uuid",
      "recipient": "user@example.com",
      "subject": "Assunto do email",
      "status": "sent" | "failed",
      "sentAt": "2025-11-06T12:00:00Z",
      "errorMessage": null
    }
  ],
  "total": 100
}
```

---

### 🔒 `/api/v1/email-blacklist` (Protegido)

**Autenticação:** JWT obrigatório

#### GET - Listar Blacklist

```bash
GET /api/v1/email-blacklist?active=true&page=1&limit=20
```

**Query Params:**

- `active` (opcional): `true` | `false`
- `page` (opcional): número da página
- `limit` (opcional): itens por página

**Resposta:**

```json
{
  "blacklist": [
    {
      "id": "uuid",
      "email": "blocked@example.com",
      "reason": "bounce" | "complaint" | "manual",
      "attemptCount": 3,
      "lastAttemptAt": "2025-11-06T12:00:00Z",
      "isActive": true
    }
  ],
  "total": 50
}
```

#### POST - Adicionar à Blacklist

```bash
POST /api/v1/email-blacklist
Content-Type: application/json

{
  "email": "spam@example.com",
  "reason": "manual",
  "errorMessage": "Usuário solicitou bloqueio"
}
```

**Validação Zod:**

- `email`: Obrigatório, formato de email válido
- `reason`: Opcional, valores permitidos: `bounce`, `complaint`, `manual`
- `errorMessage`: Opcional, string

#### DELETE - Remover da Blacklist

```bash
DELETE /api/v1/email-blacklist?email=unblock@example.com
```

---

### 🌐 `/api/v1/sns/webhook` (Público)

**Autenticação:** Validação de assinatura SNS

**⚠️ IMPORTANTE:** Endpoint PÚBLICO, mas protegido por validação de assinatura AWS SNS.

```bash
POST /api/v1/sns/webhook
Content-Type: application/json

# Corpo da mensagem SNS (enviado automaticamente pela AWS)
```

**Processamento:**

1. ✅ Valida assinatura SNS (rejeita se inválida)
2. ✅ Confirma subscrição (se `SubscriptionConfirmation`)
3. ✅ Processa Bounce/Complaint (se `Notification`)
4. ✅ Registra em `notification_logs`
5. ✅ Atualiza `email_blacklist` se necessário

---

## 🔍 Monitoramento e Logs

### Logs do Sistema

```typescript
// Sucesso na validação SNS
console.log('SNS message validated successfully')

// Falha na validação SNS
console.error('SNS signature validation failed:', {
  error: 'Invalid signature',
  messageId: 'abc123',
})

// Bounce processado
console.log('Bounce processed:', {
  email: 'user@example.com',
  bounceType: 'Permanent',
})

// Complaint processado
console.log('Complaint processed:', {
  email: 'user@example.com',
  complaintType: 'abuse',
})
```

### Verificar Status no Dashboard

1. Acesse `/admin/configuracoes/smtp`
2. Navegue até a aba **Histórico**
3. Verifique logs de envio em tempo real
4. Aba **Bloqueados** mostra emails na blacklist

---

## 🐛 Troubleshooting

### Problema: Subscrição não confirma automaticamente

**Causa:** Webhook não está acessível ou validação SNS está falhando

**Solução:**

```bash
# Verificar logs da aplicação
# Deve aparecer: "Subscription confirmed"

# Se não aparecer, confirmar manualmente:
aws sns confirm-subscription \
  --topic-arn TOPIC_ARN \
  --token TOKEN_FROM_SNS_MESSAGE
```

### Problema: Bounces não aparecem na blacklist

**Causa possível:** Bounce é do tipo `Transient` (temporário)

**Solução:** Apenas bounces **Permanent** vão para blacklist. Verifique o tipo:

```bash
# Logs devem mostrar:
Bounce processed: { bounceType: 'Permanent' }
```

### Problema: Erro 403 "Assinatura SNS inválida"

**Causa:** Mensagem não vem do SNS ou certificado expirado

**Solução:**

1. Verificar que o endpoint está recebendo mensagens do SNS real
2. Biblioteca `sns-validator` valida automaticamente certificados
3. Verificar logs para detalhes do erro

### Problema: Erro 401 "Não autorizado" nas APIs

**Causa:** Falta de autenticação JWT

**Solução:**

```bash
# Incluir header de autorização
Authorization: Bearer SEU_JWT_TOKEN
```

---

## 📚 Referências

- [AWS SES Bounce Handling](https://docs.aws.amazon.com/ses/latest/dg/notification-contents.html)
- [AWS SNS Message Validation](https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html)
- [Biblioteca sns-validator](https://www.npmjs.com/package/sns-validator)

---

## ✅ Checklist de Deploy

- [ ] Tópico SNS criado na AWS
- [ ] SES configurado para enviar notificações ao SNS
- [ ] Webhook subscrito ao tópico SNS
- [ ] Subscrição confirmada automaticamente
- [ ] `COMPANY_INIT` configurado no `.env`
- [ ] Testes de bounce realizados
- [ ] Testes de complaint realizados
- [ ] Dashboard `/admin/configuracoes/smtp` acessível
- [ ] Logs de sistema funcionando corretamente

---

**Última atualização:** 2025-11-06  
**Versão:** 1.0.0  
**Mantido por:** Time de Desenvolvimento Vinha Admin
