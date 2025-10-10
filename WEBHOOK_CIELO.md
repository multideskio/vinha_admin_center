# 🔔 Webhook Cielo - Configuração

## 📍 Endpoint

```
POST https://seu-dominio.com/api/v1/webhooks/cielo
```

## 🔧 Configuração no Painel Cielo

1. Acesse o [Painel Cielo](https://minhaconta2.cielo.com.br/)
2. Vá em **Configurações** → **Webhooks**
3. Adicione a URL: `https://seu-dominio.com/api/v1/webhooks/cielo`
4. Selecione os eventos:
   - ✅ Mudança de status de pagamento
   - ✅ Mudança de status de boleto
   - ✅ Recorrência criada

## 📥 Eventos Suportados

| ChangeType | Descrição | Ação |
|------------|-----------|------|
| 1 | Mudança de status de pagamento | Consulta Cielo e atualiza |
| 2 | Mudança de status de boleto | Marca como aprovado |
| 3 | Recorrência criada | Consulta Cielo e atualiza |
| 4 | Mudança de status antifraude | Ignora |
| 5 | Recorrência desativada | Ignora |

## 🔄 Mapeamento de Status

### Status Cielo → Status Interno

| Cielo | Código | Nosso Status |
|-------|--------|--------------|
| NotFinished | 0 | pending |
| Authorized | 1 | pending |
| **PaymentConfirmed** | **2** | **approved** |
| **Denied** | **3** | **refused** |
| Voided | 10 | refunded |
| Refunded | 11 | refunded |
| Pending | 12 | pending |
| Aborted | 13 | refused |

## 📋 Payload Exemplo

```json
{
  "RecurrentPaymentId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "PaymentId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "ChangeType": 2
}
```

## 🧪 Testar Webhook

### Usando cURL:

```bash
curl -X POST https://seu-dominio.com/api/v1/webhooks/cielo \
  -H "Content-Type: application/json" \
  -d '{
    "PaymentId": "seu-payment-id",
    "ChangeType": 2
  }'
```

### Usando Postman:

1. Method: `POST`
2. URL: `http://localhost:9002/api/v1/webhooks/cielo`
3. Body (JSON):
```json
{
  "PaymentId": "payment-id-da-transacao",
  "ChangeType": 2
}
```

## 🔒 Segurança (Recomendado)

Adicione validação de IP ou token:

```typescript
// Adicionar no início do POST handler
const allowedIPs = ['200.155.0.0/16'] // IPs Cielo
const clientIP = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip')

if (!isIPAllowed(clientIP, allowedIPs)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

## 📊 Logs

O webhook registra automaticamente:
- ✅ Payload recebido
- ✅ Transação encontrada/não encontrada
- ✅ Status anterior → novo status
- ✅ Erros de processamento

Verifique os logs em:
```bash
# Desenvolvimento
npm run dev

# Produção
pm2 logs
```

## ⚡ Fluxo Automático

1. **Cliente paga PIX/Boleto** → Cielo detecta
2. **Cielo envia webhook** → `POST /api/v1/webhooks/cielo`
3. **Sistema consulta status** → `queryPayment(PaymentId)`
4. **Atualiza transação** → `status: 'approved'`
5. **Cliente vê confirmação** → Dashboard atualizado

## 🚨 Troubleshooting

### Webhook não recebe notificações:
- ✅ Verifique URL configurada no painel Cielo
- ✅ Certifique-se que a URL é HTTPS em produção
- ✅ Teste manualmente com cURL

### Transação não atualiza:
- ✅ Verifique logs: `console.log('Cielo Webhook received')`
- ✅ Confirme que `PaymentId` corresponde ao `gatewayTransactionId`
- ✅ Verifique se transação existe no banco

### Erro 404:
- ✅ Transação não encontrada no banco
- ✅ Verifique se `PaymentId` está correto

## 📞 Suporte

**Documentação Cielo:**
- [Webhooks](https://developercielo.github.io/manual/cielo-ecommerce#post-de-notifica%C3%A7%C3%A3o)

**Contato:**
- Equipe de Desenvolvimento
