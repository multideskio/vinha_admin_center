# Guia de Integração: API E-commerce Cielo

Este documento serve como um guia técnico completo para a integração com a API E-commerce Cielo. Ele aborda os endpoints, exemplos de requisição para os principais métodos de pagamento e a lógica de tratamento de retornos para a conciliação automática ("baixa automática").

## 1. Ambientes e Endpoints (URLs)

A Cielo oferece dois ambientes distintos: um para testes (Sandbox) e outro para transações reais (Produção).

| Ambiente                      | URL Transações                                   | URL Consultas                                         |
| ----------------------------- | ------------------------------------------------ | ----------------------------------------------------- |
| **Sandbox (Desenvolvimento)** | `https://apisandbox.cieloecommerce.cielo.com.br` | `https://apiquerysandbox.cieloecommerce.cielo.com.br` |
| **Produção**                  | `https://api.cieloecommerce.cielo.com.br`        | `https://apiquery.cieloecommerce.cielo.com.br`        |

**Autenticação:** Todas as requisições devem conter as suas credenciais no cabeçalho (header):

- **MerchantId:** Sua identificação única na Cielo.
- **MerchantKey:** Sua chave de acesso transacional.

**Header:**

```
Content-Type: application/json
MerchantId: SEU_MERCHANT_ID
MerchantKey: SEU_MERCHANT_KEY
```

---

## 2. Exemplos de Pagamento (cURL)

Abaixo estão exemplos práticos usando `cURL` para cada tipo de pagamento.

### a) Cartão de Crédito

Este é o fluxo mais comum, geralmente feito em duas etapas: autorização e captura.

#### Passo 1: Criar a Transação (Autorizar)

```bash
curl -X POST \
  https://apisandbox.cieloecommerce.cielo.com.br/1/sales/ \
  -H 'Content-Type: application/json' \
  -H 'MerchantId: SEU_MERCHANT_ID' \
  -H 'MerchantKey: SEU_MERCHANT_KEY' \
  -d '{
    "MerchantOrderId":"2024072801",
    "Customer":{
       "Name":"Comprador Teste"
    },
    "Payment":{
       "Type":"CreditCard",
       "Amount":15700,
       "Installments":1,
       "SoftDescriptor":"SuaLoja",
       "CreditCard":{
          "CardNumber":"4551870000000181",
          "Holder":"Comprador Teste",
          "ExpirationDate":"12/2030",
          "SecurityCode":"123",
          "Brand":"Visa"
       }
    }
 }'
```

- **`Amount`:** O valor é enviado em centavos (ex: R$ 157,00 = 15700).

#### Passo 2: Capturar a Transação

```bash
curl -X PUT \
  https://apisandbox.cieloecommerce.cielo.com.br/1/sales/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/capture \
  -H 'Content-Type: application/json' \
  -H 'MerchantId: SEU_MERCHANT_ID' \
  -H 'MerchantKey: SEU_MERCHANT_KEY'
```

### b) Boleto Bancário

```bash
curl -X POST \
  https://apisandbox.cieloecommerce.cielo.com.br/1/sales/ \
  -H 'Content-Type: application/json' \
  -H 'MerchantId: SEU_MERCHANT_ID' \
  -H 'MerchantKey: SEU_MERCHANT_KEY' \
  -d '{
    "MerchantOrderId":"2024072802",
    "Customer":{
       "Name":"Comprador Boleto Teste",
       "Identity":"12345678901",
       "IdentityType":"CPF",
       "Address":{
          "Street":"Rua Teste",
          "Number":"123",
          "ZipCode":"12345987",
          "City":"Cidade Teste",
          "State":"SP",
          "Country":"BRA"
       }
    },
    "Payment":{
       "Type":"Boleto",
       "Amount":10000,
       "Provider":"Bradesco2",
       "Address":"Rua Teste, 123",
       "BoletoNumber":"12345",
       "Assignor":"Sua Loja",
       "Demonstrative":"Referente ao pedido 2024072802",
       "ExpirationDate":"2025-12-31",
       "Identification":"12345678901",
       "Instructions":"Não receber após o vencimento."
    }
 }'
```

### c) PIX

```bash
curl -X POST \
  https://apisandbox.cieloecommerce.cielo.com.br/1/sales/ \
  -H 'Content-Type: application/json' \
  -H 'MerchantId: SEU_MERCHANT_ID' \
  -H 'MerchantKey: SEU_MERCHANT_KEY' \
  -d '{
    "MerchantOrderId":"2024072803",
    "Customer":{
       "Name":"Comprador PIX Teste"
    },
    "Payment":{
       "Type":"Pix",
       "Amount":15700
    }
 }'
```

---

## 3. Tratamento de Retorno e Conciliação

### a) Webhook de Notificação (Recomendado)

1. No portal da Cielo, cadastre uma URL do seu sistema
2. A Cielo enviará um `POST` com o `PaymentId` quando o status mudar
3. Seu sistema consulta a API da Cielo com o `PaymentId` para obter o status final

#### Consultar Status

```bash
curl -X GET \
  https://apiquerysandbox.cieloecommerce.cielo.com.br/1/sales/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
  -H 'Content-Type: application/json' \
  -H 'MerchantId: SEU_MERCHANT_ID' \
  -H 'MerchantKey: SEU_MERCHANT_KEY'
```

**IMPORTANTE**: Use a URL de **consultas** (`apiquery`), não a URL de transações.

#### Tabela de Status

| Status         | Código | Significado                                     | Ação Recomendada                                      |
| -------------- | ------ | ----------------------------------------------- | ----------------------------------------------------- |
| Pendente       | 12     | O PIX/Boleto foi gerado, aguardando pagamento.  | Aguardar.                                             |
| Autorizada     | 1      | A transação de crédito foi autorizada.          | Capturar a transação para efetivar a cobrança.        |
| **Pago**       | **2**  | **Pagamento confirmado.**                       | **Dar baixa no pedido. Marcar como pago no sistema.** |
| Negada         | 3      | A transação de crédito foi negada pelo emissor. | Informar o usuário e cancelar o pedido.               |
| Cancelada      | 10     | A transação foi cancelada.                      | Cancelar o pedido no sistema.                         |
| Não Finalizada | 0      | A transação não foi finalizada.                 | Tratar como abandonada ou falha inicial.              |

### b) Consulta por ID do Pedido

```bash
curl -X GET \
  https://apiquerysandbox.cieloecommerce.cielo.com.br/1/sales?merchantOrderId=2024072801 \
  -H 'Content-Type: application/json' \
  -H 'MerchantId: SEU_MERCHANT_ID' \
  -H 'MerchantKey: SEU_MERCHANT_KEY'
```

---

## 4. Cancelamento de Transação (Estorno)

```bash
curl -X PUT \
  https://apisandbox.cieloecommerce.cielo.com.br/1/sales/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/void?amount=15700 \
  -H 'Content-Type: application/json' \
  -H 'MerchantId: SEU_MERCHANT_ID' \
  -H 'MerchantKey: SEU_MERCHANT_KEY'
```

- **`amount` (opcional):** Se não for especificado, o valor total será cancelado.

---

## 5. Estrutura de Erros

```json
[
  {
    "Code": 105,
    "Message": "CreditCardNumber is required"
  },
  {
    "Code": 121,
    "Message": "Customer name is required"
  }
]
```
