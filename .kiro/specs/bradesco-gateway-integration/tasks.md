# Plano de Implementação: Integração Gateway Bradesco (PIX + Boleto)

## Visão Geral

Implementação incremental do gateway Bradesco seguindo o padrão da integração Cielo existente. Cada task constrói sobre a anterior, começando pela infraestrutura (schema, logger, cache) e avançando para os serviços de pagamento, roteamento e webhooks.

## Tasks

- [x] 1. Schema do banco e infraestrutura base
  - [x] 1.1 Adicionar tabela `bradesco_logs` ao schema Drizzle em `src/db/schema.ts`
    - Criar `bradescoLogs` pgTable com campos: id, operationType, type, method, endpoint, paymentId, requestBody, responseBody, statusCode, errorMessage, createdAt
    - Rodar `npm run db:push` para aplicar a migration
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 1.2 Adicionar campo `gateway` à tabela `transactions` se não existir
    - Verificar se o campo já existe no schema
    - Se não existir, adicionar `gateway: varchar('gateway', { length: 20 })` com default null
    - Rodar `npm run db:push`
    - _Requirements: 7.2, 7.3, 7.4_

  - [x] 1.3 Adicionar cache keys do Bradesco em `src/lib/config-cache.ts`
    - Adicionar `BRADESCO_CONFIG` e `BRADESCO_TOKEN` ao objeto `CACHE_KEYS`
    - _Requirements: 9.1, 9.2_

- [x] 2. Bradesco Logger
  - [x] 2.1 Criar `src/lib/bradesco-logger.ts`
    - Implementar `logBradescoRequest()`, `logBradescoResponse()`, `logBradescoWebhook()`
    - Usar `sanitizeLog()` do `log-sanitizer.ts` existente para sanitizar dados sensíveis
    - Seguir o mesmo padrão do `cielo-logger.ts`
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]\* 2.2 Escrever teste de propriedade para sanitização do logger
    - **Property 9: Logger sanitiza dados sensíveis**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [x] 3. Módulo principal Bradesco — OAuth e utilitários
  - [x] 3.1 Criar `src/lib/bradesco.ts` com tipos, interfaces e funções utilitárias
    - Definir interfaces: `BradescoConfig`, `BradescoOAuthToken`, `BradescoPixResponse`, `BradescoPixQueryResponse`, `BradescoBoletoResponse`, `BradescoBoletoQueryResponse`
    - Implementar `getBradescoConfig()` com cache via `configCache`
    - Implementar `getBradescoApiUrl()` e `getBradescoAuthUrl()` para mapeamento de ambiente
    - Implementar `bradescoFetch()` wrapper com AbortController e timeout de 15s
    - Implementar `generateTxid()` para gerar txid único (26-35 chars alfanuméricos)
    - Implementar `generateNossoNumero()` para gerar nosso número único
    - _Requirements: 1.1, 1.6, 1.7, 2.3, 2.5, 4.3, 4.5, 9.1, 9.2_

  - [x] 3.2 Implementar OAuth Client com mTLS em `src/lib/bradesco.ts`
    - Implementar `getBradescoToken()` com autenticação OAuth2 client_credentials
    - Usar `https.Agent` com certificado .pfx/.pem para mTLS
    - Cachear token em memória com TTL baseado em `expires_in`
    - Tratar erros de autenticação com mensagens pt-BR
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]\* 3.3 Escrever teste de propriedade para cache de token OAuth
    - **Property 1: Cache de token OAuth respeita TTL**
    - **Validates: Requirements 1.2, 1.3, 1.4**

  - [ ]\* 3.4 Escrever teste de propriedade para geração de txid/nossoNumero
    - **Property 2: Geração de txid/nossoNumero é única e válida**
    - **Validates: Requirements 2.3, 4.3**

- [x] 4. Checkpoint — Verificar infraestrutura base
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

- [x] 5. Serviço PIX Bradesco
  - [x] 5.1 Implementar `createBradescoPixPayment()` em `src/lib/bradesco.ts`
    - Montar payload conforme especificação BACEN (valor.original, chave, devedor)
    - Gerar txid via `generateTxid()`
    - Fazer PUT em `/cob/{txid}` com token OAuth
    - Logar request/response via `bradesco-logger.ts`
    - Retornar `BradescoPixResponse` com txid, location, qrCode, qrCodeBase64Image
    - Tratar erros com mensagens pt-BR
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 5.2 Implementar `queryBradescoPixPayment()` em `src/lib/bradesco.ts`
    - Fazer GET em `/cob/{txid}` com token OAuth
    - Retornar `BradescoPixQueryResponse` com status e dados de pagamento
    - Em caso de erro, retornar status pendente
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]\* 5.3 Escrever teste de propriedade para payload PIX
    - **Property 3: Payload PIX contém campos obrigatórios**
    - **Validates: Requirements 2.1**

  - [ ]\* 5.4 Escrever teste de propriedade para extração de resposta PIX
    - **Property 4: Extração de resposta PIX preserva dados**
    - **Validates: Requirements 2.2**

- [x] 6. Serviço Boleto Bradesco
  - [x] 6.1 Implementar `createBradescoBoletoPayment()` em `src/lib/bradesco.ts`
    - Montar payload com dados do pagador, valor em centavos, data de vencimento
    - Gerar nossoNumero via `generateNossoNumero()`
    - Fazer POST em endpoint de registro com token OAuth
    - Logar request/response via `bradesco-logger.ts`
    - Retornar `BradescoBoletoResponse` com nossoNumero, linhaDigitavel, codigoBarras, url
    - Tratar erros com mensagens pt-BR
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 6.2 Implementar `queryBradescoBoletoPayment()` em `src/lib/bradesco.ts`
    - Consultar status do boleto por nossoNumero
    - Retornar `BradescoBoletoQueryResponse` com status
    - Em caso de erro, retornar status pendente
    - _Requirements: 5.1, 5.2_

  - [ ]\* 6.3 Escrever teste de propriedade para payload Boleto
    - **Property 5: Payload Boleto contém campos obrigatórios**
    - **Validates: Requirements 4.1**

  - [ ]\* 6.4 Escrever teste de propriedade para extração de resposta Boleto
    - **Property 6: Extração de resposta Boleto preserva dados**
    - **Validates: Requirements 4.2**

- [x] 7. Checkpoint — Verificar serviços PIX e Boleto
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

- [x] 8. Payment Router e integração com transações
  - [x] 8.1 Implementar `getActiveGateway()` em `src/lib/bradesco.ts` ou utilitário separado
    - Buscar gateway ativo na tabela `gateway_configurations`
    - Retornar 'Cielo' ou 'Bradesco' ou lançar erro se nenhum ativo
    - _Requirements: 7.1, 7.5_

  - [x] 8.2 Modificar rota `POST /api/v1/transacoes` para suportar roteamento de gateway
    - Chamar `getActiveGateway()` antes de processar pagamento
    - Se Bradesco + PIX → `createBradescoPixPayment()`
    - Se Bradesco + boleto → `createBradescoBoletoPayment()`
    - Se Bradesco + cartão → retornar erro "Cartão de crédito não suportado pelo Bradesco"
    - Se Cielo → manter fluxo existente
    - Salvar campo `gateway` na transação criada
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]\* 8.3 Escrever teste de propriedade para roteamento de pagamento
    - **Property 8: Roteamento de pagamento é correto**
    - **Validates: Requirements 7.2, 7.3, 7.4, 7.5, 7.6**

- [x] 9. Webhook Handler Bradesco
  - [x] 9.1 Criar `src/app/api/v1/webhooks/bradesco/route.ts`
    - Implementar POST handler para receber webhooks PIX e Boleto
    - Validar payload com schemas Zod (PIX: array `pix` com txid, valor, horario; Boleto: nossoNumero, status)
    - Buscar transação por `gatewayTransactionId` (txid ou nossoNumero)
    - Usar `reconcileTransactionState()` existente para tratar race conditions
    - Atualizar status da transação
    - Invalidar caches de dashboard/relatórios quando aprovado
    - Logar webhook via `bradesco-logger.ts`
    - Retornar HTTP 200 para payloads inválidos, HTTP 500 para erros de processamento
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]\* 9.2 Escrever teste de propriedade para tratamento de erros
    - **Property 7: Erros de API geram exceções com mensagem pt-BR**
    - **Validates: Requirements 1.5, 2.4, 3.3, 4.4, 5.2**

  - [ ]\* 9.3 Escrever teste de propriedade para webhook com payload válido
    - **Property 10: Webhook com payload válido atualiza status corretamente**
    - **Validates: Requirements 8.1, 8.2**

  - [ ]\* 9.4 Escrever teste de propriedade para webhook com payload inválido
    - **Property 11: Webhook com payload inválido retorna HTTP 200**
    - **Validates: Requirements 8.4**

- [x] 10. Invalidação de cache na configuração
  - [x] 10.1 Atualizar rota `PUT /api/v1/gateways/bradesco` para invalidar cache
    - Após salvar configuração, invalidar `BRADESCO_CONFIG` e `BRADESCO_TOKEN` no cache
    - _Requirements: 9.3_

- [x] 11. Checkpoint final — Verificar integração completa
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

## Notas

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada task referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Testes de propriedade usam `fast-check` com mínimo 100 iterações
- Testes unitários cobrem exemplos específicos e edge cases
