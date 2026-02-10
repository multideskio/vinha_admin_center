# Documento de Requisitos — Auditoria de Produção

## Introdução

Auditoria completa do sistema Vinha Admin Center para preparação e manutenção de produção. O sistema é uma aplicação Next.js 15 com App Router, React 18, TypeScript 5, PostgreSQL via Drizzle ORM, integrações com Cielo API (pagamentos), AWS S3/SES, Evolution API v2 (WhatsApp), ViaCEP, e BullMQ/Redis para filas. O sistema possui 5 roles (Admin, Manager, Supervisor, Pastor, Igreja) com rotas e permissões isoladas. A auditoria cobre bugs, segurança, custos e resiliência.

## Glossário

- **Sistema_Auditoria**: Conjunto de scripts e processos que analisam o código-fonte do Vinha Admin Center em busca de problemas
- **Relatório_Auditoria**: Documento gerado contendo todos os problemas encontrados, classificados por severidade
- **Rota_API**: Endpoint HTTP definido em `src/app/api/` que processa requisições
- **Rota_Protegida**: Rota API que requer autenticação JWT via `validateRequest()`
- **Validação_Zod**: Validação de entrada usando a biblioteca Zod antes de processar dados
- **Rate_Limiter**: Mecanismo que limita o número de requisições por período de tempo
- **Idempotência**: Propriedade de uma operação que produz o mesmo resultado quando executada múltiplas vezes
- **Edge_Runtime**: Ambiente de execução do Next.js com APIs limitadas comparado ao Node.js
- **Problema_Crítico**: Problema classificado como 🔴 que pode causar perda de dados, falha de segurança ou cobrança duplicada
- **Problema_Atenção**: Problema classificado como 🟡 que pode causar degradação de performance ou comportamento inesperado
- **Problema_Sugestão**: Problema classificado como 🟢 que representa uma melhoria de qualidade de código

## Requisitos

### Requisito 1: Detecção de Bugs e Erros no Código

**User Story:** Como desenvolvedor, quero identificar bugs e erros no código-fonte, para que eu possa corrigi-los antes que causem falhas em produção.

#### Critérios de Aceitação

1. WHEN o Sistema_Auditoria analisa o código-fonte, THE Sistema_Auditoria SHALL identificar todos os catch blocks vazios (sem tratamento de erro) e registrar arquivo e linha no Relatório_Auditoria
2. WHEN o Sistema_Auditoria analisa o código-fonte, THE Sistema_Auditoria SHALL identificar todos os usos de tipo `any` no TypeScript e registrar arquivo e linha no Relatório_Auditoria
3. WHEN o Sistema_Auditoria analisa o código-fonte, THE Sistema_Auditoria SHALL identificar variáveis que podem ser null ou undefined sem verificação prévia e registrar no Relatório_Auditoria
4. WHEN o Sistema_Auditoria analisa o código-fonte, THE Sistema_Auditoria SHALL identificar Promises sem await ou sem .catch() e registrar no Relatório_Auditoria
5. WHEN o Sistema_Auditoria analisa o código-fonte, THE Sistema_Auditoria SHALL identificar imports quebrados ou dependências circulares e registrar no Relatório_Auditoria

### Requisito 2: Detecção de Riscos de Segurança

**User Story:** Como desenvolvedor, quero identificar vulnerabilidades de segurança no sistema, para que eu possa proteger dados sensíveis e prevenir acessos não autorizados.

#### Critérios de Aceitação

1. WHEN o Sistema_Auditoria analisa as Rotas_API, THE Sistema_Auditoria SHALL identificar todas as Rotas_Protegidas que não utilizam `validateRequest()` do JWT e registrar no Relatório_Auditoria como Problema_Crítico
2. WHEN o Sistema_Auditoria analisa o código-fonte, THE Sistema_Auditoria SHALL identificar dados sensíveis (senhas, tokens, chaves API) expostos em logs e registrar no Relatório_Auditoria como Problema_Crítico
3. WHEN o Sistema_Auditoria analisa as Rotas_API, THE Sistema_Auditoria SHALL identificar endpoints que recebem dados de entrada sem Validação_Zod e registrar no Relatório_Auditoria
4. WHEN o Sistema_Auditoria analisa as Rotas_API, THE Sistema_Auditoria SHALL identificar endpoints públicos sem Rate_Limiter e registrar no Relatório_Auditoria
5. WHEN o Sistema_Auditoria analisa o código-fonte, THE Sistema_Auditoria SHALL identificar uploads ao S3 sem validação de tipo e tamanho e registrar no Relatório_Auditoria
6. WHEN o Sistema_Auditoria analisa o código-fonte, THE Sistema_Auditoria SHALL identificar secrets hardcoded (chaves API, senhas, tokens) no código e registrar no Relatório_Auditoria como Problema_Crítico
7. WHEN o Sistema_Auditoria analisa o código-fonte, THE Sistema_Auditoria SHALL identificar variáveis de ambiente críticas sem validação na inicialização e registrar no Relatório_Auditoria
8. WHEN o Sistema_Auditoria analisa o middleware, THE Sistema_Auditoria SHALL verificar se headers de segurança estão configurados corretamente e registrar ausências no Relatório_Auditoria

### Requisito 3: Detecção de Riscos de Custos Altos

**User Story:** Como desenvolvedor, quero identificar padrões de código que podem gerar custos excessivos, para que eu possa otimizar o uso de recursos e evitar cobranças inesperadas.

#### Critérios de Aceitação

1. WHEN o Sistema_Auditoria analisa queries ao banco, THE Sistema_Auditoria SHALL identificar queries SELECT sem .limit() que podem retornar conjuntos grandes de dados e registrar no Relatório_Auditoria
2. WHEN o Sistema_Auditoria analisa integrações com a Cielo API, THE Sistema_Auditoria SHALL identificar chamadas de criação de cobrança sem controle de Idempotência e registrar no Relatório_Auditoria como Problema_Crítico
3. WHEN o Sistema_Auditoria analisa o código-fonte, THE Sistema_Auditoria SHALL identificar loops que fazem chamadas HTTP ou queries ao banco (problema N+1) e registrar no Relatório_Auditoria
4. WHEN o Sistema_Auditoria analisa o código-fonte, THE Sistema_Auditoria SHALL identificar envio de emails ou mensagens WhatsApp sem deduplicação e registrar no Relatório_Auditoria
5. WHEN o Sistema_Auditoria analisa cron jobs, THE Sistema_Auditoria SHALL identificar jobs que podem executar em paralelo causando duplicação e registrar no Relatório_Auditoria

### Requisito 4: Detecção de Riscos de Quebra do Sistema

**User Story:** Como desenvolvedor, quero identificar pontos frágeis que podem causar falhas no sistema, para que eu possa implementar mecanismos de resiliência.

#### Critérios de Aceitação

1. WHEN o Sistema_Auditoria analisa chamadas a serviços externos, THE Sistema_Auditoria SHALL identificar operações fetch sem timeout configurado e registrar no Relatório_Auditoria
2. WHEN o Sistema_Auditoria analisa o código-fonte, THE Sistema_Auditoria SHALL identificar usos de `AbortSignal.timeout()` incompatíveis com Edge_Runtime e registrar no Relatório_Auditoria como Problema_Crítico
3. WHEN o Sistema_Auditoria analisa operações de banco de dados, THE Sistema_Auditoria SHALL identificar operações multi-step que deveriam usar transações atômicas e registrar no Relatório_Auditoria
4. WHEN o Sistema_Auditoria analisa o código-fonte, THE Sistema_Auditoria SHALL identificar dependências de serviços externos (Redis, S3, Cielo, Evolution API) sem fallback ou tratamento de falha e registrar no Relatório_Auditoria
5. WHEN o Sistema_Auditoria analisa o middleware, THE Sistema_Auditoria SHALL verificar se erros são tratados corretamente sem causar crash do sistema e registrar problemas no Relatório_Auditoria

### Requisito 5: Geração do Relatório de Auditoria

**User Story:** Como desenvolvedor, quero um relatório estruturado com todos os problemas encontrados, para que eu possa priorizar e executar as correções.

#### Critérios de Aceitação

1. THE Relatório_Auditoria SHALL classificar cada problema encontrado como Problema_Crítico (🔴), Problema_Atenção (🟡) ou Problema_Sugestão (🟢)
2. THE Relatório_Auditoria SHALL incluir para cada problema: arquivo, linha, descrição, impacto potencial e sugestão de correção
3. THE Relatório_Auditoria SHALL incluir uma nota de 0 a 10 para a prontidão de produção do sistema
4. THE Relatório_Auditoria SHALL listar as 5 ações mais urgentes ao final do documento
5. THE Relatório_Auditoria SHALL agrupar os problemas por categoria (Bugs, Segurança, Custos, Resiliência)

### Requisito 6: Correção de Problemas Críticos

**User Story:** Como desenvolvedor, quero que os problemas críticos sejam corrigidos, para que o sistema opere de forma segura e confiável em produção.

#### Critérios de Aceitação

1. WHEN um catch block vazio é identificado, THE Sistema_Auditoria SHALL sugerir correção com logging adequado usando `console.error()` com contexto
2. WHEN uma Rota_Protegida sem autenticação JWT é identificada, THE Sistema_Auditoria SHALL sugerir correção adicionando `validateRequest()` no início da rota
3. WHEN uma Rota_API sem Validação_Zod é identificada, THE Sistema_Auditoria SHALL sugerir correção com schema Zod apropriado para os dados de entrada
4. WHEN uma query sem .limit() é identificada, THE Sistema_Auditoria SHALL sugerir correção adicionando .limit() com valor apropriado ao contexto
5. WHEN um uso de `AbortSignal.timeout()` é identificado, THE Sistema_Auditoria SHALL sugerir correção usando `AbortController` com setTimeout manual
6. WHEN uma operação fetch sem timeout é identificada, THE Sistema_Auditoria SHALL sugerir correção adicionando AbortController com timeout apropriado
7. WHEN dados sensíveis são encontrados em logs, THE Sistema_Auditoria SHALL sugerir correção removendo ou mascarando os dados sensíveis
