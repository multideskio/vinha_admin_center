# Contratos de Payload das Integrações

Documento de referência dos contratos de request/response de todas as integrações do Vinha Admin Center. Use como fonte da verdade para validações, testes e alterações.

**Importante**: Alterações em payloads devem ser aditivas (novos campos opcionais) ou documentadas como breaking change explícita.

---

## Referências Oficiais

| Integração    | Documentação                                            |
| ------------- | ------------------------------------------------------- |
| Cielo         | https://developercielo.github.io/manual/cielo-ecommerce |
| Bradesco      | Documentação Open Banking e API Cobrança Bradesco       |
| Evolution API | https://github.com/EvolutionAPI/evolution-api           |

---

## 1. Cielo

### URLs (validadas em 2025)

| Ambiente | API Transações                                   | API Consultas                                         |
| -------- | ------------------------------------------------ | ----------------------------------------------------- |
| Produção | `https://api.cieloecommerce.cielo.com.br`        | `https://apiquery.cieloecommerce.cielo.com.br`        |
| Sandbox  | `https://apisandbox.cieloecommerce.cielo.com.br` | `https://apiquerysandbox.cieloecommerce.cielo.com.br` |

### Autenticação

Headers obrigatórios em todas as requisições:

```
Content-Type: application/json
MerchantId: <seu_merchant_id>
MerchantKey: <sua_merchant_key>
```

### Request - PIX (POST /1/sales/)

```json
{
  "MerchantOrderId": "PIX-{timestamp}[-{uuid8}]",
  "Customer": {
    "Name": "string",
    "Identity": "string (CPF/CNPJ sem formatação)",
    "IdentityType": "CPF | CNPJ"
  },
  "Payment": {
    "Type": "Pix",
    "Amount": 10000,
    "ExpirationDate": "2025-01-15T12:00:00.000Z"
  }
}
```

- `Amount`: valor em **centavos** (R$ 100,00 = 10000)
- `MerchantOrderId`: único por transação (evitar colisões)
- O sistema envia `amount` em reais e converte com `Math.round(amount * 100)`

### Request - Cartão (POST /1/sales/)

```json
{
  "MerchantOrderId": "ORDER-{timestamp}",
  "Customer": { "Name", "Email", "Identity?", "IdentityType?" },
  "Payment": {
    "Type": "CreditCard",
    "Amount": 10000,
    "Installments": 1,
    "Capture": true,
    "SoftDescriptor": "Contribuicao",
    "CreditCard": {
      "CardNumber": "string",
      "Holder": "string",
      "ExpirationDate": "MM/YYYY",
      "SecurityCode": "string",
      "Brand": "Visa|Master|..."
    }
  }
}
```

### Request - Boleto (POST /1/sales/)

```json
{
  "MerchantOrderId": "ORDER-{timestamp}",
  "Customer": {
    "Name": "string",
    "Identity": "CPF sem formatação",
    "IdentityType": "CPF",
    "Address": { "Street", "Number", "Complement", "ZipCode", "City", "State", "Country", "District" }
  },
  "Payment": {
    "Type": "Boleto",
    "Amount": 10000,
    "Provider": "Bradesco2",
    "Assignor": "string",
    "Demonstrative": "string",
    "ExpirationDate": "YYYY-MM-DD",
    "Identification": "CPF",
    "Instructions": "string"
  }
}
```

### Response - PIX

```json
{
  "Payment": {
    "PaymentId": "uuid",
    "QrCodeBase64Image": "base64",
    "QrCodeString": "string"
  }
}
```

### Cancelamento (PUT /1/sales/{paymentId}/void)

Query opcional: `?amount=10000` (centavos). Sem amount = cancelamento total.

### Consulta (GET /1/sales/{paymentId})

Usar URL de **consultas** (apiquery), não a de transações.

### Webhook (POST recebido da Cielo)

```json
{
  "PaymentId": "uuid",
  "ChangeType": 1
}
```

**ChangeType**: 1=status pagamento, 2=boleto pago, 3=recorrência criada, 4=antifraude, 5=recorrência desativada, 6=chargeback.

**Status Cielo → Sistema**: 0=pendente, 1=approved, 2=approved, 3/13=refused, 10/11=refunded, 12=pendente, 20=pendente.

---

## 2. Bradesco PIX

### URLs (validadas em 2025)

| Ambiente    | Auth OAuth                                                       | API PIX                                  |
| ----------- | ---------------------------------------------------------------- | ---------------------------------------- |
| Produção    | `https://qrpix.bradesco.com.br/auth/server/oauth/token`          | `https://qrpix.bradesco.com.br`          |
| Homologação | `https://proxy.api.prebanco.com.br/auth/server/oauth/token`      | `https://qrpix-h.bradesco.com.br`        |
| Sandbox     | `https://openapisandbox.prebanco.com.br/auth/server/oauth/token` | `https://openapisandbox.prebanco.com.br` |

### Request - Cob PIX (PUT /v2/cob/{txid})

Padrão BACEN. Sandbox usa `expiracao` como string; produção como número.

```json
{
  "calendario": { "expiracao": 3600 },
  "devedor": { "cpf": "12345678901", "nome": "Nome Completo" },
  "valor": { "original": "100.00" },
  "chave": "chave-pix-recebedor",
  "solicitacaoPagador": "Contribuição"
}
```

### Response - PIX

```json
{
  "txid": "string",
  "location": "url",
  "pixCopiaECola": "string",
  "qrcode": "base64"
}
```

### Webhook PIX (POST recebido)

```json
{
  "pix": [
    {
      "endToEndId": "string",
      "txid": "string",
      "valor": "string",
      "horario": "string",
      "infoPagador": "string?"
    }
  ]
}
```

---

## 3. Bradesco Boleto

### URLs

| Ambiente    | Auth Cobrança                                                      | API Boleto                               |
| ----------- | ------------------------------------------------------------------ | ---------------------------------------- |
| Produção    | `https://openapi.bradesco.com.br/auth/server-mtls/v2/token`        | `https://openapi.bradesco.com.br`        |
| Homologação | `https://proxy.api.prebanco.com.br/auth/server-mtls/v2/token`      | `https://proxy.api.prebanco.com.br`      |
| Sandbox     | `https://openapisandbox.prebanco.com.br/auth/server-mtls/v2/token` | `https://openapisandbox.prebanco.com.br` |

### Response Boleto

```json
{
  "nossoNumero": "string",
  "nuLinhaDigitavel": "string",
  "cdBarras": "string",
  "url": "string"
}
```

Nota: API pode retornar `linhaDigitavel`/`codigoBarras` ou `nuLinhaDigitavel`/`cdBarras`. Interface cobre ambos.

### Webhook Boleto

```json
{
  "nossoNumero": "string",
  "status": "string",
  "valorPago": 100.00?,
  "dataPagamento": "string?"
}
```

Status: `registrado`, `pago`, `vencido`, `cancelado`.

---

## 4. IPs de Webhook (produção)

### Cielo

- 209.134.48.\*
- 198.199.83.\*
- 52.8._, 54.183._, 107.23._, 54.224._

### Bradesco

- 170.84.\*
- 200.155.\*
- 200.219.\*

**Atualizar periodicamente** conforme documentação dos gateways.

---

## 5. Email (SES/SMTP)

### sendEmail Contract

```typescript
{ to: string, subject: string, html: string, userId?: string, notificationType?: string }
```

### EmailService.sendEmail Contract

```typescript
{ to: string, subject: string, html: string, text?: string }
// Retorna: { success: boolean; error?: string; errorCode?: string }
```

### Credenciais

- **Prioridade 1**: `other_settings` (smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom)
- **Prioridade 2**: `env` (AWS_SES_REGION, AWS_SES_ACCESS_KEY_ID, AWS_SES_SECRET_ACCESS_KEY, AWS_SES_FROM_EMAIL)

### SNS Webhook (bounce/complaint)

Interfaces: `SESBounce`, `SESComplaint`, `SESMessage`. Validação via `sns-validator`.

---

## 6. WhatsApp (Evolution API)

### sendText Request

```typescript
{
  number: string,      // "5511999999999"
  text: string,
  delay?: number,
  linkPreview?: boolean,
  mentionsEveryOne?: boolean,
  mentioned?: string[],
  quoted?: { key, message }
}
```

### Response

```typescript
{ key?: { id, remoteJid, fromMe }, message?, messageTimestamp?, status?, error? }
```

### Configuração

Via `other_settings`: whatsapp_api_url, whatsapp_api_key, whatsapp_api_instance.

---

## 7. S3 / Upload

### POST /api/v1/upload

FormData: `file`, `folder` (uploads|avatars|documents|receipts|certificates), `filename?`, `subfolder?`

### Tipos permitidos (rota)

- image/jpeg, image/jpg, image/png, image/webp, image/gif
- application/pdf
- application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document
- application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- application/x-pkcs12, application/x-pem-file

### upload-validator.ts (mais restritivo)

Apenas: JPEG, PNG, WebP, PDF. O validador é mais restritivo que a rota de upload. A rota `/api/v1/upload` é a fonte da verdade para tipos permitidos. Use o validador apenas em contextos que exigem restrição adicional.

### DELETE

Query: `?key=...`

---

## 8. OpenAI

### Chat Completions (ai-suggest)

- Model: `gpt-4o-mini`
- Temperature: 0.7
- max_tokens: 180

### ai-suggest POST

```typescript
{
  eventTrigger: 'user_registered' | 'payment_received' | 'payment_due_reminder' | 'payment_overdue',
  daysOffset?: number,
  variables?: string[],
  tone?: string
}
```

### insights

- model: gpt-4o-mini
- temperature: 0.5
- max_tokens: 600 (insights) ou 10 (outros)
- Retorno esperado: JSON `{ summary, cards[] }` com fallback para parse.

---

## 9. Transações - amount

**Contrato**: O campo `amount` em POST /api/v1/transacoes é **sempre em reais** (ex: 100.50).

Os gateways (Cielo, Bradesco) recebem o valor em reais e fazem a conversão internamente:

- Cielo: `Math.round(amount * 100)` para centavos
- Bradesco PIX: `formatPixAmount(amount)` para string "100.00"
