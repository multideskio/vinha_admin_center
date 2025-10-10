# ✅ Validação de Métodos de Pagamento

## 📋 Checklist de Validação

### 1. PIX ✅
**Implementação:** `src/lib/cielo.ts` - `createPixPayment()`

**Fluxo:**
1. ✅ Gera QR Code Base64
2. ✅ Retorna string PIX Copia e Cola
3. ✅ Polling automático de status (8s)
4. ✅ Confirmação visual quando pago

**Testar:**
- [ ] Gerar QR Code
- [ ] Copiar chave PIX
- [ ] Verificar expiração (30 min)
- [ ] Confirmar status após pagamento

**Endpoint:** `POST /api/v1/transacoes`
```json
{
  "amount": 10.00,
  "paymentMethod": "pix",
  "contributionType": "dizimo"
}
```

---

### 2. Cartão de Crédito ✅
**Implementação:** `src/lib/cielo.ts` - `createCreditCardPayment()`

**Fluxo:**
1. ✅ Validação visual do cartão (react-credit-cards-2)
2. ✅ Formatação automática (número, validade, CVV)
3. ✅ Envio para Cielo
4. ✅ Resposta imediata (aprovado/recusado)

**Testar:**
- [ ] Inserir dados do cartão
- [ ] Validar formatação
- [ ] Testar aprovação
- [ ] Testar recusa

**Cartões de Teste Cielo Sandbox:**
- **Aprovado:** 4024 0071 5376 3191
- **Recusado:** 4024 0071 5376 3183
- **Validade:** 12/30
- **CVV:** 123

**Endpoint:** `POST /api/v1/transacoes`
```json
{
  "amount": 10.00,
  "paymentMethod": "credit_card",
  "contributionType": "dizimo",
  "card": {
    "number": "4024007153763191",
    "holder": "TESTE HOLDER",
    "expirationDate": "12/30",
    "securityCode": "123",
    "brand": "Visa"
  }
}
```

---

### 3. Boleto ✅
**Implementação:** `src/lib/cielo.ts` - `createBoletoPayment()`

**Fluxo:**
1. ✅ Valida perfil completo (CPF, endereço)
2. ✅ Gera boleto Bradesco
3. ✅ Retorna linha digitável
4. ✅ Link para download PDF
5. ✅ Vencimento em 7 dias

**Testar:**
- [ ] Verificar validação de perfil
- [ ] Gerar boleto
- [ ] Copiar linha digitável
- [ ] Baixar PDF

**Endpoint:** `POST /api/v1/transacoes`
```json
{
  "amount": 10.00,
  "paymentMethod": "boleto",
  "contributionType": "dizimo"
}
```

---

## 🔧 Configuração Necessária

### 1. Gateway Cielo
Acesse: `/admin/gateways/cielo`

**Sandbox (Desenvolvimento):**
- MerchantId: `seu-merchant-id-sandbox`
- MerchantKey: `sua-merchant-key-sandbox`
- Environment: `development`

**Produção:**
- MerchantId: `seu-merchant-id-prod`
- MerchantKey: `sua-merchant-key-prod`
- Environment: `production`

### 2. Métodos Habilitados
Acesse: `/admin/gateways/cielo`
- [x] PIX
- [x] Cartão de Crédito
- [x] Boleto

---

## 🧪 Roteiro de Testes

### Teste 1: PIX
1. Acesse `/manager/contribuicoes`
2. Preencha valor: R$ 10,00
3. Selecione tipo: Dízimo
4. Escolha método: PIX
5. Clique "Gerar QR Code Pix"
6. ✅ Verifique QR Code exibido
7. ✅ Copie chave PIX
8. Simule pagamento no sandbox Cielo
9. ✅ Aguarde confirmação automática (8s)

### Teste 2: Cartão de Crédito
1. Acesse `/manager/contribuicoes`
2. Preencha valor: R$ 10,00
3. Selecione tipo: Oferta
4. Escolha método: Crédito
5. Clique "Ir para o Cartão de Crédito"
6. Preencha dados:
   - Número: `4024 0071 5376 3191`
   - Nome: `TESTE HOLDER`
   - Validade: `12/30`
   - CVV: `123`
7. ✅ Verifique preview do cartão
8. Clique "Pagar R$ 10,00"
9. ✅ Aguarde aprovação

### Teste 3: Boleto
1. Complete seu perfil em `/manager/perfil`:
   - CPF
   - CEP
   - Endereço completo
2. Acesse `/manager/contribuicoes`
3. Preencha valor: R$ 10,00
4. Selecione tipo: Dízimo
5. Escolha método: Boleto
6. Clique "Gerar Boleto"
7. ✅ Verifique linha digitável
8. ✅ Copie código
9. ✅ Baixe PDF

---

## 🐛 Problemas Conhecidos

### PIX
- ⚠️ Polling pode não detectar pagamento instantâneo
- **Solução:** Implementar webhook Cielo

### Cartão
- ⚠️ Apenas Visa testado
- **Solução:** Adicionar detecção de bandeira

### Boleto
- ⚠️ Requer perfil completo
- **Solução:** Validação implementada com mensagem clara

---

## 📊 Status Atual

| Método | Implementado | Testado | Produção |
|--------|--------------|---------|----------|
| PIX | ✅ | ⏳ | ⏳ |
| Crédito | ✅ | ⏳ | ⏳ |
| Boleto | ✅ | ⏳ | ⏳ |

**Legenda:**
- ✅ Completo
- ⏳ Pendente
- ❌ Não implementado

---

## 🚀 Próximos Passos

1. **Testar em Sandbox:**
   - [ ] PIX
   - [ ] Cartão de Crédito
   - [ ] Boleto

2. **Implementar Melhorias:**
   - [ ] Webhook Cielo para PIX
   - [ ] Detecção automática de bandeira
   - [ ] Histórico de transações

3. **Produção:**
   - [ ] Configurar credenciais produção
   - [ ] Testar com valores reais
   - [ ] Monitorar transações

---

## 📞 Suporte

**Documentação Cielo:**
- [API Reference](https://developercielo.github.io/manual/cielo-ecommerce)
- [Sandbox](https://sandbox.cieloecommerce.cielo.com.br/)

**Contato:**
- Equipe de Desenvolvimento
