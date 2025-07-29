# Guia de Integração: API E-commerce Cielo

Este documento serve como um guia técnico completo para a integração com a API E-commerce Cielo. Ele aborda os endpoints, exemplos de requisição para os principais métodos de pagamento e a lógica de tratamento de retornos para a conciliação automática ("baixa automática").

## 1. Ambientes e Endpoints (URLs)

A Cielo oferece dois ambientes distintos: um para testes (Sandbox) e outro para transações reais (Produção).

| Ambiente                  | URL Base da API                               |
| ------------------------- | --------------------------------------------- |
| **Sandbox (Desenvolvimento)** | `https://apisandbox.cieloecommerce.cielo.com.br` |
| **Produção**                | `https://api.cieloecommerce.cielo.com.br`     |

**Autenticação:** Todas as requisições devem conter as suas credenciais no cabeçalho (header):

-   **MerchantId:** Sua identificação única na Cielo.
-   **MerchantKey:** Sua chave de acesso transacional.

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

Esta requisição apenas verifica o limite do cartão e reserva o valor, sem efetivar a cobrança.

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

-   **`"Capture": false` (implícito):** Se você quiser autorizar e capturar no mesmo passo, adicione `"Capture": true` dentro do objeto `Payment`.
-   **`Amount`:** O valor é enviado em centavos (ex: R$ 157,00 = 15700).

**Resposta (Sucesso):**
Você receberá um `PaymentId` e o `Status` **1** (Autorizada). Guarde o `PaymentId`.

```json
{
  "Payment": {
    "PaymentId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "Status": 1,
    "...": "..."
  }
}
```

#### Passo 2: Capturar a Transação

Após a autorização, você deve capturar a transação para que a cobrança seja efetivada.

```bash
curl -X PUT \
  https://apisandbox.cieloecommerce.cielo.com.br/1/sales/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/capture \
  -H 'Content-Type: application/json' \
  -H 'MerchantId: SEU_MERCHANT_ID' \
  -H 'MerchantKey: SEU_MERCHANT_KEY'
```

O status da transação mudará para **2** (Pagamento Confirmado).

### b) Boleto Bancário

Gera um boleto que o cliente pode pagar.

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

**Resposta (Sucesso):**
A resposta conterá os dados do boleto. O `Status` inicial será **0** ou **12**.

```json
{
  "Payment": {
    "Url": "https://...", // Link para a versão imprimível do boleto
    "DigitableLine": "34191.76... ", // Linha digitável
    "BarCodeNumber": "3419... ",
    "Status": 0,
    "...": "..."
  }
}
```

### c) PIX

Gera um QR Code para pagamento instantâneo.

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

**Resposta (Sucesso):**
A resposta conterá o QR Code em dois formatos. O `Status` inicial será **12** (Pendente).

```json
{
  "Payment": {
    "ProofOfSale": "...",
    "QrCodeBase64Image": "data:image/png;base64,iVBORw0KGgo...", // Imagem para exibir na tela
    "QrCodeString": "0002012658...", // PIX Copia e Cola
    "Status": 12,
    "...": "..."
  }
}
```

---

## 3. Tratamento de Retorno e Conciliação

### a) Webhook de Notificação (Recomendado)

A forma mais eficiente de saber se um pagamento foi confirmado (especialmente para Boleto e PIX) é através do **Webhook de Notificação** (Notificação Post).

**Como Funciona:**

1.  **Configuração:** No portal da Cielo, você cadastra uma URL do seu sistema que receberá as atualizações de status.
2.  **Notificação:** Sempre que o status de uma transação mudar (ex: um boleto for pago), a Cielo enviará uma requisição `POST` para a sua URL com o `PaymentId`.
3.  **Consulta:** Ao receber a notificação, seu sistema deve usar o `PaymentId` recebido para fazer uma consulta (`GET`) na API da Cielo e obter o status final e confiável da transação.

#### Fluxo do Webhook:

**Passo 1: Receber a Notificação**
A Cielo enviará um `POST` para sua URL com o `PaymentId`.

**Passo 2: Consultar o Status da Transação**
Use o `PaymentId` para fazer uma requisição `GET`.

```bash
curl -X GET \
  https://apisandbox.cieloecommerce.cielo.com.br/1/sales/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
  -H 'Content-Type: application/json' \
  -H 'MerchantId: SEU_MERCHANT_ID' \
  -H 'MerchantKey: SEU_MERCHANT_KEY'
```

**Passo 3: Interpretar o Status**
Analise o campo `Status` na resposta para dar a baixa no seu sistema.

| Status          | Código | Significado                                          | Ação Recomendada                                  |
| --------------- | ------ | ---------------------------------------------------- | ------------------------------------------------- |
| Pendente        | 12     | O PIX/Boleto foi gerado, aguardando pagamento.       | Aguardar.                                         |
| Autorizada      | 1      | A transação de crédito foi autorizada.               | Capturar a transação para efetivar a cobrança.    |
| **Pago**        | **2**  | **Pagamento confirmado.**                            | **Dar baixa no pedido. Marcar como pago no sistema.** |
| Negada          | 3      | A transação de crédito foi negada pelo emissor.      | Informar o usuário e cancelar o pedido.           |
| Cancelada       | 10     | A transação foi cancelada.                           | Cancelar o pedido no sistema.                     |
| Não Finalizada  | 0      | A transação não foi finalizada.                      | Tratar como abandonada ou falha inicial.          |

**Exemplo de Fluxo de Baixa Automática:**
> Notificação da Cielo chega na sua URL -> Seu sistema pega o `PaymentId` -> Seu sistema faz um `GET` na API da Cielo -> Seu sistema lê o campo `"Status"` -> Se `Status == 2` -> `UPDATE pedidos SET status = 'PAGO' WHERE id_pedido = ...`

Este método garante que você sempre trabalhe com a informação mais recente e segura, automatizando completamente o processo de conciliação financeira.

### b) Consulta por ID do Pedido

Alternativamente, você pode consultar o status de uma transação usando o seu próprio ID de pedido (`MerchantOrderId`).

```bash
curl -X GET \
  https://apisandbox.cieloecommerce.cielo.com.br/1/sales?merchantOrderId=2024072801 \
  -H 'Content-Type: application/json' \
  -H 'MerchantId: SEU_MERCHANT_ID' \
  -H 'MerchantKey: SEU_MERCHANT_KEY'
```

---

## 4. Cancelamento de Transação (Estorno)

Para cancelar uma transação, você deve fazer uma requisição `PUT` para o endpoint de cancelamento.

-   **Se a transação ainda não foi capturada:** A operação é um `void` (anulação).
-   **Se a transação já foi capturada:** A operação é um `refund` (reembolso/estorno).

O endpoint é o mesmo para ambos os casos. Você pode cancelar o valor total ou parcial.

```bash
curl -X PUT \
  https://apisandbox.cieloecommerce.cielo.com.br/1/sales/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/void?amount=15700 \
  -H 'Content-Type: application/json' \
  -H 'MerchantId: SEU_MERCHANT_ID' \
  -H 'MerchantKey: SEU_MERCHANT_KEY'
```
-   **`amount` (opcional):** Se não for especificado, o valor total será cancelado. Se for especificado, será um cancelamento parcial. O valor deve ser em centavos.

**Resposta (Sucesso):**
O `Status` da transação mudará para **10** (Cancelada).

---

## 5. Estrutura de Erros

Quando uma requisição falha, a API da Cielo retorna um array de erros em formato JSON, o que permite um tratamento detalhado de cada problema.

**Exemplo de Resposta de Erro:**
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

Seu código deve ser capaz de interpretar este array para exibir mensagens de erro adequadas para o usuário ou para registrar logs de depuração.
