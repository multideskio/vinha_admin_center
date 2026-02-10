# Documento de Requisitos

## Introdução

Integração direta com as APIs do Bradesco para processamento de pagamentos via PIX (API PIX Recebimento V8) e Boleto Registrado. O Bradesco será um gateway independente da Cielo — o administrador escolhe qual gateway ativar. A integração segue o mesmo padrão de qualidade da Cielo existente (logging, cache, timeout, tratamento de erros).

## Glossário

- **Gateway_Bradesco**: Módulo de integração com as APIs do Bradesco para PIX e Boleto
- **OAuth_Client**: Componente responsável por obter e renovar tokens OAuth2 via client_credentials com mTLS
- **PIX_Service**: Componente que cria e consulta cobranças PIX imediatas via API PIX Recebimento V8 do Bradesco
- **Boleto_Service**: Componente que registra e consulta boletos via API de Registro de Boletos do Bradesco
- **Bradesco_Logger**: Componente de logging para requisições e respostas da API Bradesco, análogo ao cielo-logger
- **Config_Cache**: Cache em memória com TTL para configurações do gateway (já existente em `config-cache.ts`)
- **Payment_Router**: Componente que direciona pagamentos para o gateway ativo (Cielo ou Bradesco)
- **Webhook_Handler**: Endpoint que recebe notificações assíncronas do Bradesco sobre mudanças de status de pagamento
- **Admin**: Usuário com role admin que configura gateways em `/admin/gateways/`
- **Contribuinte**: Usuário que realiza pagamentos (dízimo/oferta) pelo sistema

## Requisitos

### Requisito 1: Autenticação OAuth2 com mTLS

**User Story:** Como desenvolvedor, quero que o sistema autentique com a API do Bradesco via OAuth2 client_credentials com certificado digital, para que as chamadas à API sejam autorizadas e seguras.

#### Critérios de Aceitação

1. WHEN o OAuth_Client solicita um token, THE OAuth_Client SHALL enviar client_id, client_secret e certificado digital (.pfx/.pem) ao endpoint de autenticação do Bradesco
2. WHEN o Bradesco retorna um access_token válido, THE OAuth_Client SHALL armazenar o token em cache com TTL baseado no campo expires_in da resposta
3. WHEN um token em cache ainda é válido, THE OAuth_Client SHALL reutilizar o token sem fazer nova requisição ao Bradesco
4. WHEN o token em cache expirou, THE OAuth_Client SHALL solicitar um novo token automaticamente antes de executar a chamada à API
5. IF a autenticação OAuth2 falha, THEN THE OAuth_Client SHALL registrar o erro com detalhes e lançar uma exceção descritiva em pt-BR
6. WHEN o ambiente configurado é "development", THE OAuth_Client SHALL usar os endpoints de sandbox do Bradesco
7. WHEN o ambiente configurado é "production", THE OAuth_Client SHALL usar os endpoints de produção do Bradesco

### Requisito 2: Criação de Cobrança PIX

**User Story:** Como contribuinte, quero pagar via PIX pelo Bradesco, para que eu tenha uma alternativa de gateway para pagamentos instantâneos.

#### Critérios de Aceitação

1. WHEN o PIX_Service recebe uma solicitação de cobrança PIX, THE PIX_Service SHALL criar uma cobrança imediata (cob) na API PIX V8 do Bradesco com valor em centavos e chave PIX do recebedor
2. WHEN o Bradesco retorna a cobrança criada com sucesso, THE PIX_Service SHALL retornar o QR Code (imagem base64 e copia-e-cola), txid e location da cobrança
3. WHEN o PIX_Service cria uma cobrança, THE PIX_Service SHALL gerar um txid único para garantir idempotência
4. IF a criação da cobrança PIX falha, THEN THE PIX_Service SHALL registrar o erro via Bradesco_Logger e lançar uma exceção com mensagem descritiva em pt-BR
5. WHEN o PIX_Service faz uma chamada à API, THE PIX_Service SHALL usar AbortController com timeout de 15 segundos

### Requisito 3: Consulta de Status PIX

**User Story:** Como sistema, quero consultar o status de cobranças PIX no Bradesco, para que eu possa atualizar o status da transação no banco de dados.

#### Critérios de Aceitação

1. WHEN o PIX_Service consulta uma cobrança por txid, THE PIX_Service SHALL retornar o status atual da cobrança (ATIVA, CONCLUIDA, REMOVIDA_PELO_USUARIO_RECEBEDOR, REMOVIDA_PELO_PSP)
2. WHEN a cobrança consultada tem status CONCLUIDA, THE PIX_Service SHALL retornar os dados do pagamento incluindo valor pago e horário
3. IF a consulta de cobrança falha, THEN THE PIX_Service SHALL registrar o erro e retornar status pendente para permitir nova tentativa

### Requisito 4: Registro de Boleto

**User Story:** Como contribuinte, quero pagar via boleto pelo Bradesco, para que eu tenha uma alternativa de gateway para pagamentos por boleto bancário.

#### Critérios de Aceitação

1. WHEN o Boleto_Service recebe uma solicitação de boleto, THE Boleto_Service SHALL registrar o boleto na API do Bradesco com dados do pagador (nome, CPF, endereço), valor em centavos e data de vencimento
2. WHEN o Bradesco retorna o boleto registrado com sucesso, THE Boleto_Service SHALL retornar a linha digitável, código de barras e URL do boleto para visualização
3. WHEN o Boleto_Service registra um boleto, THE Boleto_Service SHALL gerar um número de controle único (nosso número) para garantir idempotência
4. IF o registro do boleto falha, THEN THE Boleto_Service SHALL registrar o erro via Bradesco_Logger e lançar uma exceção com mensagem descritiva em pt-BR
5. WHEN o Boleto_Service faz uma chamada à API, THE Boleto_Service SHALL usar AbortController com timeout de 15 segundos

### Requisito 5: Consulta de Status de Boleto

**User Story:** Como sistema, quero consultar o status de boletos no Bradesco, para que eu possa atualizar o status da transação quando o boleto for pago.

#### Critérios de Aceitação

1. WHEN o Boleto_Service consulta um boleto por nosso número, THE Boleto_Service SHALL retornar o status atual do boleto (registrado, pago, vencido, cancelado)
2. IF a consulta de boleto falha, THEN THE Boleto_Service SHALL registrar o erro e retornar status pendente para permitir nova tentativa

### Requisito 6: Logging de Requisições e Respostas

**User Story:** Como administrador, quero que todas as interações com a API do Bradesco sejam registradas, para que eu possa auditar e diagnosticar problemas.

#### Critérios de Aceitação

1. WHEN o Gateway_Bradesco envia uma requisição à API, THE Bradesco_Logger SHALL registrar o tipo de operação, método HTTP, endpoint e corpo da requisição sanitizado
2. WHEN o Gateway_Bradesco recebe uma resposta da API, THE Bradesco_Logger SHALL registrar o status HTTP, corpo da resposta sanitizado e mensagem de erro quando aplicável
3. WHEN o Webhook_Handler recebe uma notificação, THE Bradesco_Logger SHALL registrar o payload do webhook sanitizado
4. THE Bradesco_Logger SHALL sanitizar dados sensíveis (tokens, certificados, senhas) antes de registrar no banco de dados

### Requisito 7: Roteamento de Pagamentos por Gateway

**User Story:** Como administrador, quero escolher qual gateway (Cielo ou Bradesco) processar pagamentos, para que eu possa alternar entre provedores conforme necessidade.

#### Critérios de Aceitação

1. WHEN o Payment_Router recebe uma solicitação de pagamento, THE Payment_Router SHALL verificar qual gateway está ativo na tabela gateway_configurations
2. WHEN o gateway ativo é "Bradesco" e o método é PIX, THE Payment_Router SHALL direcionar a solicitação para o PIX_Service do Bradesco
3. WHEN o gateway ativo é "Bradesco" e o método é boleto, THE Payment_Router SHALL direcionar a solicitação para o Boleto_Service do Bradesco
4. WHEN o gateway ativo é "Cielo", THE Payment_Router SHALL direcionar a solicitação para os serviços da Cielo existentes
5. IF nenhum gateway está ativo, THEN THE Payment_Router SHALL retornar erro informando que nenhum gateway está configurado
6. WHEN o gateway ativo é "Bradesco" e o método é cartão de crédito, THE Payment_Router SHALL retornar erro informando que cartão de crédito não é suportado pelo Bradesco

### Requisito 8: Recebimento de Webhooks do Bradesco

**User Story:** Como sistema, quero receber notificações do Bradesco sobre mudanças de status de pagamento, para que o status das transações seja atualizado automaticamente.

#### Critérios de Aceitação

1. WHEN o Webhook_Handler recebe uma notificação PIX do Bradesco, THE Webhook_Handler SHALL validar o payload com schema Zod e atualizar o status da transação correspondente
2. WHEN o Webhook_Handler recebe uma notificação de boleto do Bradesco, THE Webhook_Handler SHALL validar o payload e atualizar o status da transação correspondente
3. IF o webhook chega antes da transação ser criada no banco, THEN THE Webhook_Handler SHALL usar o sistema de reconciliação existente com retry exponencial
4. IF o payload do webhook é inválido, THEN THE Webhook_Handler SHALL retornar HTTP 200 para evitar retentativas desnecessárias e registrar o erro
5. WHEN o status da transação é atualizado para aprovado via webhook, THE Webhook_Handler SHALL invalidar caches de dashboard e relatórios

### Requisito 9: Cache de Configuração do Bradesco

**User Story:** Como desenvolvedor, quero que a configuração do gateway Bradesco seja cacheada, para que o sistema não faça queries desnecessárias ao banco a cada pagamento.

#### Critérios de Aceitação

1. WHEN o Gateway_Bradesco busca a configuração, THE Config_Cache SHALL retornar a configuração cacheada se o TTL de 5 minutos não expirou
2. WHEN o cache expirou ou está vazio, THE Gateway_Bradesco SHALL buscar a configuração do banco e armazená-la no cache
3. WHEN o Admin atualiza a configuração do Bradesco, THE Config_Cache SHALL invalidar a entrada correspondente
