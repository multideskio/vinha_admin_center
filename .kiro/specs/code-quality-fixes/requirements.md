# Requisitos: Correção de Problemas Críticos de Qualidade de Código

## Visão Geral

Este documento especifica os requisitos para correção de problemas críticos identificados na revisão de código do sistema Vinha Admin Center. Os problemas foram categorizados por severidade e impacto em produção.

## 1. Problemas Críticos de Segurança (ALTA PRIORIDADE)

### 1.1 Uso de Tipos `any` em Código Crítico

**Problema**: Múltiplas rotas de API usam `let sessionUser: any = null`, violando type safety e podendo causar erros em runtime.

**Arquivos Afetados**:

- `src/app/api/v1/supervisor/transacoes/route.ts`
- `src/app/api/v1/supervisor/transacoes/[id]/resend-receipt/route.ts`
- `src/app/api/v1/supervisor/transacoes/[id]/route.ts`
- `src/app/api/v1/supervisor/transacoes/[id]/sync/route.ts`
- `src/app/api/v1/supervisor/igrejas/route.ts`
- `src/app/api/v1/supervisor/igrejas/[id]/route.ts`
- `src/app/api/v1/pastor/perfil/route.ts`
- `src/app/api/v1/pastor/transacoes/route.ts`
- `src/app/api/v1/pastor/dashboard/route.ts`
- `src/app/api/v1/igreja/transacoes/route.ts`
- `src/app/api/v1/igreja/perfil/route.ts`
- `src/app/api/v1/igreja/dashboard/route.ts`
- `src/lib/notifications.ts` (smtpTransporter)

**Impacto**: Alto - Pode causar erros de runtime não detectados em desenvolvimento, comprometendo estabilidade em produção.

**Critério de Aceitação**:

- Todos os tipos `any` devem ser substituídos por tipos explícitos
- Código deve compilar sem erros TypeScript
- Nenhum warning de tipo `any` no build

### 1.2 Queries sem `.limit()` em Operações de Registro Único

**Problema**: Várias queries buscam um único registro mas não usam `.limit(1)`, violando as regras do projeto e podendo causar problemas de performance.

**Arquivos Afetados**:

- `src/app/api/v1/supervisor/pastores/[id]/route.ts` (linha 29)
- `src/app/api/v1/supervisor/igrejas/[id]/route.ts` (linha 28)
- `src/app/api/v1/manager/igrejas/[id]/route.ts` (linha 32)
- `src/app/api/v1/manager/pastores/[id]/route.ts` (linha 34)
- `scripts/complete-migration.ts` (linhas 96, 318-319)
- `scripts/migrate-legacy-data.ts` (linha 192)

**Impacto**: Médio - Performance degradada e violação de padrões do projeto.

**Critério de Aceitação**:

- Todas as queries que buscam registro único devem usar `.limit(1)`
- Código deve seguir o padrão: `const [record] = await db.select()...limit(1)`
- Verificação de `!record` após a query

### 1.3 Variáveis de Ambiente Não Validadas

**Problema**: Múltiplas variáveis de ambiente são usadas sem validação adequada, podendo causar crashes em produção.

**Arquivos Críticos**:

- `src/lib/cielo.ts` - `COMPANY_INIT` usado sem validação
- `src/app/api/v1/transacoes/route.ts` - `COMPANY_INIT` com fallback vazio
- `src/app/api/v1/webhooks/cielo/route.ts` - `COMPANY_INIT` com fallback vazio
- `src/lib/email.ts` - `COMPANY_INIT` com fallback vazio
- Múltiplas rotas usando `DEFAULT_PASSWORD` sem validação

**Impacto**: Crítico - Pode causar falhas silenciosas ou comportamento inesperado em produção.

**Critério de Aceitação**:

- Todas as variáveis de ambiente críticas devem ser validadas no início do módulo
- Erro descritivo deve ser lançado se variável obrigatória estiver ausente
- Fallbacks só devem ser usados para variáveis opcionais

## 2. Problemas de Idempotência e Race Conditions (ALTA PRIORIDADE)

### 2.1 Falta de Verificação de Duplicação em Pagamentos

**Problema**: Sistema não verifica se já existe transação pendente antes de criar nova cobrança na Cielo, violando regra crítica de negócio.

**Arquivo**: `src/app/api/v1/transacoes/route.ts`

**Impacto**: Crítico - Pode causar cobranças duplicadas, violando regras de negócio e causando problemas financeiros.

**Critério de Aceitação**:

- Antes de criar pagamento, verificar se existe transação pendente/aprovada para o mesmo usuário
- Implementar janela de tempo (ex: últimos 5 minutos) para evitar duplicação
- Retornar erro claro se tentativa de duplicação for detectada
- Adicionar testes para verificar comportamento

### 2.2 Race Condition em Webhooks vs Redirect

**Problema**: Webhook da Cielo pode chegar antes do redirect do usuário, mas não há tratamento adequado para este cenário.

**Arquivo**: `src/app/api/v1/webhooks/cielo/route.ts`

**Impacto**: Médio - Pode causar inconsistência de estado se webhook processar antes do redirect.

**Critério de Aceitação**:

- Webhook deve verificar se transação já existe antes de processar
- Implementar lógica de reconciliação se estados divergirem
- Adicionar logs estruturados para debug de race conditions

### 2.3 Falta de Idempotência em Notificações

**Problema**: Sistema de notificações não verifica se mensagem já foi enviada, podendo causar spam.

**Arquivo**: `src/lib/notification-hooks.ts`

**Impacto**: Médio - Pode enviar notificações duplicadas, irritando usuários.

**Critério de Aceitação**:

- Verificar em `notificationLogs` se notificação já foi enviada
- Implementar janela de deduplicação (ex: não enviar mesma notificação em 24h)
- Adicionar flag de "já processado" para eventos

## 3. Problemas de Tratamento de Erros (MÉDIA PRIORIDADE)

### 3.1 Logging Inadequado de Erros

**Problema**: Muitos erros são logados sem contexto suficiente para debug em produção.

**Arquivos Afetados**: Múltiplos arquivos de API

**Impacto**: Médio - Dificulta troubleshooting em produção.

**Critério de Aceitação**:

- Todos os logs de erro devem incluir: userId, timestamp, operação, contexto
- Usar formato estruturado (JSON) para facilitar parsing
- Separar erros esperados (warning) de erros inesperados (error)

### 3.2 Mensagens de Erro Genéricas

**Problema**: Muitas rotas retornam "Internal server error" sem detalhes úteis.

**Impacto**: Baixo - Dificulta debug mas não afeta funcionalidade.

**Critério de Aceitação**:

- Mensagens de erro devem ser descritivas mas não expor detalhes internos
- Erros de validação devem retornar campos específicos
- Erros de negócio devem ter códigos de erro únicos

## 4. Problemas de Performance (MÉDIA PRIORIDADE)

### 4.1 N+1 Queries em Listagens

**Problema**: Rota GET `/api/v1/transacoes` faz query separada para cada transação para buscar nome do contribuinte.

**Arquivo**: `src/app/api/v1/transacoes/route.ts`

**Impacto**: Alto - Performance degradada com muitas transações.

**Critério de Aceitação**:

- Usar JOIN ou buscar todos os perfis de uma vez
- Reduzir queries de O(n) para O(1) ou O(log n)
- Adicionar índices no banco se necessário

### 4.2 Falta de Cache em Configurações

**Problema**: Configurações da empresa são buscadas do banco em toda requisição.

**Arquivos**: `src/lib/cielo.ts`, `src/lib/notifications.ts`

**Impacto**: Médio - Queries desnecessárias aumentam latência.

**Critério de Aceitação**:

- Implementar cache em memória para configurações
- TTL de 5 minutos para configurações
- Invalidar cache quando configurações forem atualizadas

## 5. Problemas de Segurança (MÉDIA PRIORIDADE)

### 5.1 Rate Limiting Inconsistente

**Problema**: Rate limiting implementado apenas em algumas rotas, não em todas as rotas públicas.

**Impacto**: Médio - Vulnerável a ataques de força bruta e DDoS.

**Critério de Aceitação**:

- Todas as rotas públicas devem ter rate limiting
- Rotas de autenticação devem ter limites mais restritivos
- Rate limiting deve usar Redis em produção (não memória)

### 5.2 Validação de Upload Incompleta

**Problema**: Sistema S3 não valida tipo e tamanho de arquivo antes do upload.

**Arquivo**: `src/lib/s3-client.ts`

**Impacto**: Médio - Pode permitir upload de arquivos maliciosos ou muito grandes.

**Critério de Aceitação**:

- Validar tipo MIME do arquivo
- Limitar tamanho máximo (10MB)
- Validar extensão do arquivo
- Sanitizar nome do arquivo

### 5.3 Exposição de Informações Sensíveis em Logs

**Problema**: Logs podem conter dados sensíveis (senhas, tokens, dados de cartão).

**Impacto**: Alto - Violação de segurança e compliance.

**Critério de Aceitação**:

- Implementar função de sanitização de logs
- Nunca logar: senhas, tokens, dados de cartão, CPF completo
- Mascarar dados sensíveis em logs (ex: CPF: **_._**.123-45)

## 6. Problemas de Arquitetura (BAIXA PRIORIDADE)

### 6.1 Duplicação de Código em Rotas de Perfil

**Problema**: Lógica de busca de perfil duplicada em múltiplas rotas.

**Impacto**: Baixo - Dificulta manutenção mas não afeta funcionalidade.

**Critério de Aceitação**:

- Criar função utilitária `getUserProfile(userId, role)`
- Refatorar rotas para usar função centralizada
- Reduzir duplicação de código em 80%

### 6.2 Falta de Transações em Operações Críticas

**Problema**: Operações que modificam múltiplas tabelas não usam transações do banco.

**Impacto**: Médio - Pode causar inconsistência de dados em caso de falha.

**Critério de Aceitação**:

- Identificar operações que modificam múltiplas tabelas
- Envolver em transação do Drizzle
- Adicionar rollback em caso de erro

## 7. Problemas de Observabilidade (BAIXA PRIORIDADE)

### 7.1 Falta de Métricas de Performance

**Problema**: Sistema não coleta métricas de performance de APIs.

**Impacto**: Baixo - Dificulta identificação de gargalos.

**Critério de Aceitação**:

- Adicionar middleware para medir tempo de resposta
- Logar queries lentas (> 1s)
- Adicionar métricas de taxa de erro

## Priorização

### Fase 1 - Crítico (Semana 1)

1. Correção de tipos `any` (1.1)
2. Validação de variáveis de ambiente (1.3)
3. Verificação de duplicação em pagamentos (2.1)
4. Sanitização de logs sensíveis (5.3)

### Fase 2 - Alta (Semana 2)

1. Queries sem `.limit()` (1.2)
2. Race condition em webhooks (2.2)
3. N+1 queries (4.1)
4. Rate limiting completo (5.1)

### Fase 3 - Média (Semana 3)

1. Idempotência em notificações (2.3)
2. Logging estruturado (3.1)
3. Cache de configurações (4.2)
4. Validação de uploads (5.2)

### Fase 4 - Baixa (Semana 4)

1. Mensagens de erro descritivas (3.2)
2. Refatoração de código duplicado (6.1)
3. Transações em operações críticas (6.2)
4. Métricas de performance (7.1)

## Métricas de Sucesso

- Zero tipos `any` no código de produção
- 100% das variáveis de ambiente críticas validadas
- Zero duplicações de pagamento em testes
- Tempo de resposta médio < 200ms
- Taxa de erro < 0.1%
- Cobertura de rate limiting em 100% das rotas públicas
