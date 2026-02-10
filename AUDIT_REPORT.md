# 🔍 Relatório de Auditoria — Vinha Admin Center

**Data:** 2025-01-28
**Versão:** 1.0
**Escopo:** Análise completa de bugs, segurança, custos e resiliência do código-fonte

---

## 📊 Nota de Prontidão de Produção: 5.5 / 10

**Justificativa:** O sistema possui boa base de código (zero tipos `any`, zero erros de compilação, autenticação JWT na maioria das rotas, sanitizador de logs implementado). Porém, foram encontrados **29 problemas críticos** incluindo: rotas legado sem autenticação que expõem dados financeiros, secrets hardcoded que permitem forjar tokens JWT, headers de segurança ausentes (CSP, HSTS), ~47 chamadas fetch sem timeout a serviços externos, cron jobs sem proteção contra execução paralela, e dados PCI potencialmente armazenados sem sanitização. As boas práticas existentes mostram maturidade, mas a quantidade de problemas críticos — especialmente em segurança e resiliência — impedem uma nota mais alta.

### Pontos Positivos Identificados

- ✅ Zero usos de tipo `any` em 373 arquivos TypeScript
- ✅ Zero erros de compilação (`tsc --noEmit` limpo)
- ✅ Zero usos de `AbortSignal.timeout()` (compatível com Edge Runtime)
- ✅ Sanitizador de logs (`log-sanitizer.ts`) bem implementado
- ✅ Redis com fallback gracioso em `cache.ts` e `rate-limit.ts`
- ✅ S3, Cielo, WhatsApp e Email com tratamento de erros adequado
- ✅ Middleware com degradação graciosa e timeout no maintenance-check
- ✅ Guard de idempotência (`checkDuplicatePayment`) presente antes de pagamentos
- ✅ Validação Zod em ~80% das rotas com entrada de dados
- ✅ Rate limiting em rotas críticas de autenticação

---

## 📋 Resumo Executivo

| Severidade  | Quantidade | Descrição                                                 |
| ----------- | ---------- | --------------------------------------------------------- |
| 🔴 CRÍTICO  | 29         | Falhas de segurança, perda de dados ou cobrança duplicada |
| 🟡 ATENÇÃO  | 82         | Degradação de performance, comportamento inesperado       |
| 🟢 SUGESTÃO | 40         | Melhorias de qualidade e boas práticas                    |
| **Total**   | **151**    |

| Categoria    | 🔴  | 🟡  | 🟢  | Total |
| ------------ | --- | --- | --- | ----- |
| Bugs e Erros | 1   | 7   | 9   | 17    |
| Segurança    | 16  | 28  | 16  | 60    |
| Custos       | 7   | 24  | 6   | 37    |
| Resiliência  | 5   | 23  | 9   | 37    |

---

## 1. 🐛 Bugs e Erros

> Fontes: Tasks 4.1 (catch blocks vazios), 4.2 (tipo any), 4.3 (promises/imports)

### 1.1 Catch Blocks Vazios ou Sem Tratamento Adequado

| #   | Sev. | Arquivo                                        | Linha | Descrição                                                                                                                                                                        | Impacto                                                                                          | Correção Sugerida                                                                                                                                         |
| --- | ---- | ---------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | 🔴   | `src/lib/jwt.ts`                               | ~71   | `catch (error) { return null }` na função `verifyJWT()` — erros de infraestrutura JWT (secret inválido, erro de importação do `jose`) são silenciados junto com tokens expirados | Erros de configuração JWT mascarados; impossível diagnosticar falhas de autenticação em produção | Diferenciar erros esperados (token expirado) de inesperados: logar com `console.error('[JWT_VERIFY_ERROR]', error)` para erros que não sejam de expiração |
| B2  | 🟡   | `src/lib/cielo.ts`                             | ~127  | `catch { // Ignore JSON parse errors }` — parse de `paymentId` da resposta PIX silenciado                                                                                        | Log de resposta Cielo perde rastreabilidade do `paymentId` em operações financeiras              | Adicionar `console.warn('[CIELO_PARSE]', responseText?.substring(0, 200))`                                                                                |
| B3  | 🟡   | `src/lib/cielo.ts`                             | ~225  | Mesmo padrão do B2 para pagamento com cartão de crédito                                                                                                                          | Idem B2                                                                                          | Idem B2                                                                                                                                                   |
| B4  | 🟡   | `src/lib/cielo.ts`                             | ~327  | Mesmo padrão do B2 para pagamento com boleto                                                                                                                                     | Idem B2                                                                                          | Idem B2                                                                                                                                                   |
| B5  | 🟡   | `src/app/api/v1/test/smoke/route.ts`           | ~91   | `catch (e) { return response }` sem logging — rota de diagnóstico silencia erros                                                                                                 | Rota de smoke test (que deveria diagnosticar problemas) não registra falhas                      | Adicionar `console.error('[SMOKE_TEST_ERROR]', e)`                                                                                                        |
| B6  | 🟡   | `src/app/api/v1/templates/ai-suggest/route.ts` | ~85   | `catch (e) { return response }` sem logging — falhas na integração OpenAI silenciadas                                                                                            | Timeout, rate limit ou API key inválida da OpenAI não são diagnosticáveis                        | Adicionar `console.error('[AI_SUGGEST_ERROR]', e)`                                                                                                        |
| B7  | 🟡   | `src/app/api/v1/settings/openai/route.ts`      | ~25   | `catch (e) { return response }` sem logging no GET                                                                                                                               | Erros de banco ao ler configurações OpenAI silenciados                                           | Adicionar `console.error('[OPENAI_SETTINGS_ERROR]', e)`                                                                                                   |
| B8  | 🟡   | `src/app/api/v1/settings/openai/route.ts`      | ~54   | `catch (e) { return response }` sem logging no PUT                                                                                                                               | Erros de banco ao salvar configurações OpenAI silenciados                                        | Adicionar `console.error('[OPENAI_SETTINGS_ERROR]', e)`                                                                                                   |
| B9  | 🟢   | `src/lib/cielo.ts`                             | ~146  | `catch { errorMessage = ... }` — parse de erro Cielo com tratamento funcional mas sem logging (4 ocorrências: ~146, ~244, ~346, ~414)                                            | Diagnóstico dificultado quando resposta da Cielo não é JSON válido                               | Adicionar `console.warn('[CIELO_ERROR_PARSE]')` antes do fallback                                                                                         |
| B10 | 🟢   | `src/lib/cielo.ts`                             | ~244  | Idem B9 para cartão de crédito                                                                                                                                                   | Idem B9                                                                                          | Idem B9                                                                                                                                                   |
| B11 | 🟢   | `src/lib/cielo.ts`                             | ~346  | Idem B9 para boleto                                                                                                                                                              | Idem B9                                                                                          | Idem B9                                                                                                                                                   |
| B12 | 🟢   | `src/lib/cielo.ts`                             | ~414  | Idem B9 para cancelamento                                                                                                                                                        | Idem B9                                                                                          | Idem B9                                                                                                                                                   |
| B13 | 🟢   | `src/app/api/v1/relatorios/route.ts`           | ~42   | `catch { return 400 }` — parse de JSON do body sem logging                                                                                                                       | Aceitável (erro do cliente), mas sem monitoramento de payloads malformados                       | Considerar `console.warn` para monitoramento                                                                                                              |
| B14 | 🟢   | `src/components/dynamic-seo.tsx`               | ~145  | `catch (error) { console.debug(...) }` — `console.debug` filtrado em produção                                                                                                    | Erros de atualização de meta tags invisíveis em produção                                         | Trocar `console.debug` por `console.warn`                                                                                                                 |
| B15 | 🟢   | `src/components/dynamic-seo.tsx`               | ~203  | `catch (error) { console.debug(...) }` — atualização de favicon                                                                                                                  | Idem B14                                                                                         | Idem B14                                                                                                                                                  |
| B16 | 🟢   | `src/components/ui/file-upload.tsx`            | ~76   | `catch (error) { onError?.(...) }` — erro passado ao callback mas não logado                                                                                                     | Se `onError` não estiver definido, erro é silenciado completamente                               | Adicionar `console.error('[FILE_UPLOAD_ERROR]', error)` como fallback                                                                                     |

### 1.2 Tipos `any` no TypeScript

✅ **Nenhuma ocorrência encontrada.** O codebase está 100% limpo de usos do tipo `any` em 373 arquivos analisados.

### 1.3 Promises sem await e Imports Quebrados

✅ **Nenhum erro de compilação.** `tsc --noEmit` retornou exit code 0. Nenhum import quebrado ou promise sem tratamento detectado.

| #   | Sev. | Descrição                                                                                                       | Impacto                          | Correção Sugerida                                          |
| --- | ---- | --------------------------------------------------------------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------- |
| B17 | 🟢   | 4 diretórios vazios: `api/v1/admin/clear-notification-logs/`, `api/debug/auth/`, `lib/audit/`, `api/templates/` | Poluição de estrutura do projeto | Remover diretórios vazios ou adicionar arquivos planejados |

---

## 2. 🔒 Segurança

> Fontes: Tasks 1.1 (auth), 1.2 (Zod), 1.3 (rate limit), 2.1 (logs), 2.2 (secrets), 2.3 (env), 2.4 (headers)

### 2.1 Rotas Protegidas sem Autenticação JWT

| #   | Sev. | Arquivo                                     | Linha | Descrição                                                                                                            | Impacto                                                                                                              | Correção Sugerida                                                                |
| --- | ---- | ------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| S1  | 🔴   | `src/app/api/v1/gerente/dashboard/route.ts` | ~21   | Rota legado do gerente **sem `validateRequest()`**. Usa `process.env.GERENTE_INIT` como ID fixo em vez de autenticar | Qualquer pessoa pode acessar KPIs, transações recentes, receita total e dados de membros da rede sem autenticação    | Adicionar `validateRequest()` + verificar role `manager`, ou remover rota legado |
| S2  | 🔴   | `src/app/api/v1/gerente/perfil/route.ts`    | ~16   | Rota legado do gerente **sem `validateRequest()`** (GET + PUT). Usa `process.env.GERENTE_INIT` como ID fixo          | Qualquer pessoa pode ler e **modificar** o perfil do gerente (incluindo trocar senha via PUT) sem autenticação       | Adicionar `validateRequest()` + verificar role `manager`, ou remover rota legado |
| S3  | 🟡   | `src/app/api/v1/payment-methods/route.ts`   | —     | Rota sem `validateRequest()`. Retorna apenas lista de métodos de pagamento aceitos. Tem rate limiting                | Baixo risco — expõe apenas quais métodos estão habilitados. Pode ser pública por design (formulário de contribuição) | Avaliar se deve ser pública; se sim, documentar como tal                         |

### 2.2 Rotas sem Validação Zod (POST/PUT/PATCH)

| #   | Sev. | Arquivo                                                | Métodos | Descrição                                                                               | Impacto                                                                                                  | Correção Sugerida                                                                        |
| --- | ---- | ------------------------------------------------------ | ------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| S4  | 🔴   | `src/app/api/v1/webhooks/cielo/route.ts`               | POST    | Webhook financeiro da Cielo recebe `PaymentId` e `ChangeType` sem validação Zod         | Payload malformado pode causar estados inconsistentes em transações financeiras; vetor de ataque crítico | `z.object({ PaymentId: z.string().uuid(), ChangeType: z.number().int().min(1).max(6) })` |
| S5  | 🟡   | `src/app/api/v1/igreja/perfil/route.ts`                | PUT     | Body extenso com spread `...profileData` sem validação — aceita campos arbitrários      | Injeção de campos inesperados no `db.update()`, possível atualização de colunas não editáveis            | `z.object({...}).strict()` com todos os campos esperados                                 |
| S6  | 🟡   | `src/app/api/v1/pastor/perfil/route.ts`                | PUT     | Mesmo problema do S5 — spread `...profileData` sem validação                            | Idem S5                                                                                                  | Idem S5                                                                                  |
| S7  | 🟡   | `src/app/api/v1/templates/ai-suggest/route.ts`         | POST    | Dados usados para construir prompt OpenAI sem validação — risco de prompt injection     | `eventTrigger` e `tone` podem conter instruções maliciosas para o modelo                                 | `z.object({ eventTrigger: z.enum([...]), tone: z.string().optional() })`                 |
| S8  | 🟡   | `src/app/api/evolution/webhook/route.ts`               | POST    | Webhook Evolution API faz cast direto para `EvolutionWebhookData` sem validação runtime | Dados malformados de serviço externo podem causar erros silenciosos                                      | Adicionar schema Zod para estrutura mínima do webhook                                    |
| S9  | 🟡   | `src/app/api/v1/settings/openai/route.ts`              | PUT     | Recebe `{ openaiApiKey }` com validação manual (`typeof`) em vez de Zod                 | Dado sensível (API key) sem validação rigorosa de formato                                                | `z.object({ openaiApiKey: z.string().min(1) })`                                          |
| S10 | 🟡   | `src/app/api/auth/forgot-password/route.ts`            | POST    | Recebe `{ email }` com validação manual (`if (!email)`) sem validar formato             | Email com formato inválido chega ao banco antes de ser rejeitado                                         | `z.object({ email: z.string().email() })`                                                |
| S11 | 🟡   | `src/app/api/auth/reset-password/route.ts`             | POST    | Recebe `{ token, password }` com validação manual sem Zod                               | Mensagens de erro inconsistentes com o padrão do sistema                                                 | `z.object({ token: z.string().min(1), password: z.string().min(8) })`                    |
| S12 | 🟢   | `src/app/api/cron/notifications/route.ts`              | POST    | POST é alias para GET — não recebe body                                                 | Sem risco real                                                                                           | Considerar remover export POST                                                           |
| S13 | 🟢   | `src/app/api/v1/admin/send-reminders/route.ts`         | POST    | POST não recebe body — é trigger sem parâmetros                                         | Sem risco real                                                                                           | Nenhuma ação necessária                                                                  |
| S14 | 🟢   | `src/app/api/v1/manager/gerentes/route.ts`             | POST    | Rota deprecada — retorna 410 Gone                                                       | Sem risco real                                                                                           | Considerar remover export POST                                                           |
| S15 | 🟢   | `src/app/api/v1/notification-rules/bootstrap/route.ts` | POST    | POST não recebe body — bootstrap automático                                             | Sem risco real                                                                                           | Nenhuma ação necessária                                                                  |

### 2.3 Endpoints Públicos sem Rate Limiting

| #   | Sev. | Arquivo                                     | Descrição                                                          | Impacto                                                                         | Correção Sugerida                                           |
| --- | ---- | ------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| S16 | 🔴   | `src/app/api/v1/gerente/dashboard/route.ts` | Rota legado **sem auth E sem rate limit**                          | Requisições ilimitadas a dados financeiros sem qualquer proteção                | Adicionar `validateRequest()` + rate limit, ou remover rota |
| S17 | 🔴   | `src/app/api/v1/gerente/perfil/route.ts`    | Rota legado **sem auth E sem rate limit** (GET + PUT)              | Leitura e modificação ilimitada do perfil do gerente                            | Adicionar `validateRequest()` + rate limit, ou remover rota |
| S18 | 🟡   | `src/app/api/auth/verify-token/route.ts`    | Verificação de token de reset sem rate limit                       | Possível brute-force de tokens; DoS no banco a cada requisição                  | Rate limit: 10 req/min por IP                               |
| S19 | 🟡   | `src/app/api/v1/cep/route.ts`               | Proxy ViaCEP sem rate limit                                        | Pode ser usado como proxy aberto, causando bloqueio do IP do servidor na ViaCEP | Rate limit: 30 req/min por IP                               |
| S20 | 🟡   | `src/app/api/v1/company/public/route.ts`    | Dados públicos da empresa sem rate limit                           | Alvo de DoS; faz query ao banco a cada requisição                               | Rate limit: 60 req/min por IP + cache                       |
| S21 | 🟡   | `src/app/api/v1/maintenance-check/route.ts` | Verificação de manutenção sem rate limit                           | Alvo de DoS; faz query ao banco a cada requisição                               | Rate limit: 60 req/min por IP + cache                       |
| S22 | 🟡   | `src/app/api/evolution/webhook/route.ts`    | Webhook Evolution API sem rate limit **e sem validação de origem** | Qualquer pessoa pode enviar payloads falsos ilimitadamente                      | Rate limit + validação de origem (IP whitelist ou secret)   |
| S23 | 🟢   | `src/app/api/health/route.ts`               | Health check sem rate limit                                        | Baixo risco — não faz query ao banco                                            | Rate limit leve (120 req/min) opcional                      |
| S24 | 🟢   | `src/app/api/v1/sns/webhook/route.ts`       | Webhook SNS sem rate limit (mas valida assinatura SNS)             | Baixo risco — assinatura SNS já protege contra abuso                            | Rate limit opcional (100 req/min)                           |
| S25 | 🟢   | `src/app/api/v1/webhooks/cielo/route.ts`    | Webhook Cielo sem rate limit                                       | Rate limit agressivo pode causar perda de webhooks legítimos                    | Considerar validação de origem (IP whitelist Cielo)         |

### 2.4 Secrets Hardcoded no Código

| #   | Sev. | Arquivo                                        | Linha | Descrição                                                                                                  | Impacto                                                                                                                                 | Correção Sugerida                                                                                |
| --- | ---- | ---------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| S26 | 🔴   | `src/lib/jwt.ts`                               | 10    | `JWT_SECRET` com fallback hardcoded: `'your-super-secret-jwt-key-change-this-in-production'`               | Se `process.env.JWT_SECRET` não estiver definido, **qualquer pessoa pode forjar tokens JWT** de qualquer usuário (admin, manager, etc.) | Remover fallback; usar `env.JWT_SECRET` de `@/lib/env` que já valida existência e tamanho mínimo |
| S27 | 🔴   | `src/app/api/v1/cron/notifications/route.ts`   | 8     | `CRON_SECRET` com fallback hardcoded: `'change-me-in-production'`. Variável **ausente do schema `env.ts`** | Qualquer pessoa pode executar o cron de notificações com `Bearer change-me-in-production`, causando spam de emails/WhatsApp             | Adicionar `CRON_SECRET` ao `env.ts` como obrigatória; usar `env.CRON_SECRET` sem fallback        |
| S28 | 🟡   | `src/lib/redis.ts`                             | 11    | `REDIS_URL` com fallback `'redis://localhost:6379'` via `process.env` direto                               | Em produção, se variável ausente, tenta conectar ao Redis local inexistente                                                             | Usar `env.REDIS_URL` de `@/lib/env`                                                              |
| S29 | 🟡   | `src/lib/queues.ts`                            | 5     | `REDIS_URL` com fallback `'redis://localhost:6379'` — duplicação do S28                                    | Idem S28                                                                                                                                | Usar `env.REDIS_URL` de `@/lib/env`                                                              |
| S30 | 🟡   | `src/workers/notification-worker.ts`           | 7     | `REDIS_URL` com fallback `'redis://localhost:6379'` — duplicação do S28                                    | Idem S28                                                                                                                                | Usar `env.REDIS_URL` de `@/lib/env`                                                              |
| S31 | 🟢   | `src/app/api/v1/auth/register/pastor/route.ts` | 77    | Senha temporária gerada com `Math.random().toString(36)` — **não criptograficamente seguro**               | Senhas temporárias potencialmente adivinháveis (PRNG previsível)                                                                        | Usar `crypto.randomBytes(16).toString('hex')`                                                    |
| S32 | 🟢   | `src/app/api/v1/auth/register/church/route.ts` | 73    | Mesmo problema do S31 — `Math.random()` para senha temporária                                              | Idem S31                                                                                                                                | Idem S31                                                                                         |

### 2.5 Variáveis de Ambiente sem Validação Centralizada

| #   | Sev. | Arquivo                                        | Linha   | Variável              | Descrição                                                                                         | Correção Sugerida                                             |
| --- | ---- | ---------------------------------------------- | ------- | --------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| S33 | 🔴   | `src/app/api/v1/gerente/dashboard/route.ts`    | 21      | `GERENTE_INIT`        | Usada diretamente sem check de existência — `undefined` passado para queries                      | Adicionar `GERENTE_INIT` ao `env.ts` como `z.string().uuid()` |
| S34 | 🟡   | `src/app/api/v1/gerente/perfil/route.ts`       | 16      | `GERENTE_INIT`        | Tem validação local com `throw`, mas ausente do `env.ts`                                          | Centralizar no `env.ts`                                       |
| S35 | 🟡   | `src/app/api/auth/forgot-password/route.ts`    | 60      | `NEXT_PUBLIC_APP_URL` | Ausente do `env.ts`; tem check local (retorna 500)                                                | Adicionar ao `env.ts` como `z.string().url()`                 |
| S36 | 🟡   | `src/app/api/v1/cron/notifications/route.ts`   | 92+     | `NEXT_PUBLIC_APP_URL` | Fallback para string vazia `''` — gera links quebrados em emails                                  | Usar `env.NEXT_PUBLIC_APP_URL` sem fallback vazio             |
| S37 | 🟡   | `src/app/api/v1/admin/send-reminders/route.ts` | 80+     | `NEXT_PUBLIC_APP_URL` | Fallback para `'http://localhost:9002/'` — emails em produção com links localhost                 | Usar `env.NEXT_PUBLIC_APP_URL`                                |
| S38 | 🟡   | `src/lib/notifications.ts`                     | 431-434 | `AWS_SES_*` (4 vars)  | Variáveis já validadas em `env.ts` mas acessadas via `process.env` direto — podem ser `undefined` | Usar `env.AWS_SES_REGION`, `env.AWS_SES_ACCESS_KEY_ID`, etc.  |
| S39 | 🟡   | `src/app/api/cron/notifications/route.ts`      | 12      | `CRON_SECRET`         | Tem validação local (retorna 500), mas ausente do `env.ts`                                        | Centralizar no `env.ts`                                       |
| S40 | 🟢   | `src/lib/jwt.ts`                               | 84, 99  | `NODE_ENV`            | Acessada via `process.env` em vez de `env.NODE_ENV` — funcional mas inconsistente                 | Usar `env.NODE_ENV`                                           |
| S41 | 🟢   | `src/middleware.ts`                            | 6       | `NODE_ENV`            | Idem S40 (verificar compatibilidade Edge Runtime)                                                 | Verificar se `env.ts` é compatível com Edge Runtime           |
| S42 | 🟢   | `src/db/seed.ts`                               | 10-84   | Múltiplas             | Script standalone com validação manual — aceitável para seed                                      | Considerar importar `env` para consistência                   |

### 2.6 Dados Sensíveis Expostos em Logs

| #   | Sev. | Arquivo                                                 | Linha    | Descrição                                                                                                    | Impacto                                                                                           | Correção Sugerida                                                     |
| --- | ---- | ------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| S43 | 🔴   | `src/lib/cielo-logger.ts`                               | 17-18    | `requestBody: JSON.stringify(data.requestBody)` armazena body completo da Cielo **no banco** sem sanitização | Dados PCI (número de cartão, CVV, data de expiração) armazenados em texto plano no banco de dados | Sanitizar `requestBody` removendo campos de cartão antes de armazenar |
| S44 | 🔴   | `src/lib/api-error-handler.ts`                          | 18       | `console.error('API Error:', error)` — handler centralizado loga objeto `error` completo sem sanitização     | Erros podem conter dados de request body, tokens ou contexto sensível em logs de servidor         | Usar `safeError` do `log-sanitizer.ts`                                |
| S45 | 🔴   | `src/lib/api-auth.ts`                                   | 42       | `console.error('API Key authentication error:', error)` sem sanitização                                      | Possível exposição de API Keys no contexto do erro                                                | Usar `safeError`; logar apenas `error.message`                        |
| S46 | 🔴   | `src/components/contributions/hooks/useContribution.ts` | 177      | `devLog('Card payment started:', { holder: cardData.holder })` — loga nome do titular do cartão              | Exposição de dados PCI no console do navegador (verificação `isDevelopment()` pode falhar)        | Remover logging de dados de cartão completamente                      |
| S47 | 🔴   | `src/components/contributions/hooks/useContribution.ts` | 101      | `devLog('Form submission started:', data)` — loga `ContributionData` completo                                | Exposição de dados pessoais do contribuinte no console                                            | Logar apenas campos não-sensíveis (tipo de pagamento, step)           |
| S48 | 🔴   | `src/components/contributions/hooks/usePaymentSync.ts`  | 39       | `devLog('Payment status response:', data)` — loga resposta completa da API de transações                     | Exposição de dados de transação no console do navegador                                           | Logar apenas o status do pagamento                                    |
| S49 | 🟡   | `src/lib/jwt.ts`                                        | 159, 220 | `console.error('Erro ao validar usuário:', error)` sem sanitização                                           | Possível exposição de detalhes internos de autenticação                                           | Usar `safeError`                                                      |
| S50 | 🟡   | `src/lib/notification-scheduler.ts`                     | 104, 145 | `console.error('Error sending notification to user ${user.id}:', error)`                                     | Exposição de IDs de usuário e possíveis credenciais de serviços no erro                           | Usar `safeError`; não interpolar `user.id`                            |
| S51 | 🟡   | `src/workers/notification-worker.ts`                    | 53       | `console.error('Falha ao processar notificação:', job?.id, err)` sem sanitização                             | Dados de notificação (email, telefone, conteúdo) podem estar no erro                              | Usar `safeError`                                                      |
| S52 | 🟡   | `src/db/drizzle.ts`                                     | 21       | `console.error('Unexpected database pool error:', err)` sem sanitização                                      | Possível exposição de connection string com credenciais                                           | Logar apenas `err.message`                                            |
| S53 | 🟡   | `src/lib/cache.ts`                                      | 13-54    | `console.error('[CACHE_*_ERROR]', key, error)` — loga chave do cache + erro completo (4 ocorrências)         | Chaves de cache podem conter IDs de usuário ou dados de sessão                                    | Usar `safeError`                                                      |
| S54 | 🟢   | `src/lib/notification-hooks.ts`                         | 604-622  | Função de teste com `console.log('Welcome result:', ...)` em código de produção                              | Debug statements em produção                                                                      | Remover função de teste ou proteger com flag                          |
| S55 | 🟢   | `src/workers/notification-worker.ts`                    | 28, 32   | `console.log('Redis connected/ready')` — logs informativos sem dados sensíveis                               | Ruído em logs de produção                                                                         | Usar `logger.info()`                                                  |
| S56 | 🟢   | `src/lib/queues.ts`                                     | 21, 25   | `console.log('Redis connected/ready')` — duplicação do S55                                                   | Ruído em logs de produção                                                                         | Usar `logger.info()`                                                  |

### 2.7 Headers de Segurança Ausentes no Middleware

| #   | Sev. | Arquivo             | Descrição                                             | Impacto                                                                                                                                | Correção Sugerida                                                                                    |
| --- | ---- | ------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| S57 | 🔴   | `src/middleware.ts` | Header `Content-Security-Policy` (CSP) **ausente**    | Vulnerável a XSS — scripts maliciosos podem ser injetados e executados no contexto do navegador, roubando tokens JWT e dados de sessão | Adicionar CSP restritiva (iniciar com `Content-Security-Policy-Report-Only` para monitorar)          |
| S58 | 🔴   | `src/middleware.ts` | Header `Strict-Transport-Security` (HSTS) **ausente** | Primeira requisição pode ser via HTTP, criando janela para ataques man-in-the-middle                                                   | `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`                            |
| S59 | 🟡   | `src/middleware.ts` | Header `Permissions-Policy` **ausente**               | APIs sensíveis do navegador (câmera, microfone, geolocalização) habilitadas desnecessariamente                                         | `Permissions-Policy: camera=(), microphone=(), geolocation=()`                                       |
| S60 | 🟢   | `src/middleware.ts` | 30-33, 67-70                                          | Blocos de headers de segurança **duplicados** em dois pontos do middleware                                                             | Risco de inconsistência na manutenção — se um header for adicionado em um bloco e esquecido no outro | Extrair para função `addSecurityHeaders(response)` |

> **Nota:** Os headers `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` e `X-XSS-Protection` estão corretamente configurados ✅

---

## 3. 💰 Custos

> Fontes: Tasks 5.1 (queries sem limit), 5.2 (idempotência Cielo), 5.3 (N+1), 5.4 (dedup/cron)

### 3.1 Queries `db.select()` sem `.limit()`

#### 🔴 CRÍTICO — Queries de exportação/relatório sem limite

| #   | Sev. | Arquivo                                     | Linha | Tabela                 | Descrição                                                                                        | Correção Sugerida                      |
| --- | ---- | ------------------------------------------- | ----- | ---------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------- |
| C1  | 🔴   | `src/app/api/v1/transacoes/export/route.ts` | ~37   | `transactions` + JOINs | Exportação sem limite pode retornar **TODAS** as transações do sistema                           | `.limit(10000)` como teto de segurança |
| C2  | 🔴   | `src/lib/report-services/general-report.ts` | ~171  | `transactions`         | `fetchFinancialTransactions` busca TODAS as transações do período sem paginação                  | `.limit(5000)`                         |
| C3  | 🔴   | `src/lib/report-services/general-report.ts` | ~626  | `transactions`         | `fetchPaymentsByContributorMonth` busca TODOS os pagamentos de TODOS os contribuintes no período | `.limit(50000)`                        |

#### 🟡 ATENÇÃO — Listagens de entidades sem paginação

| #   | Sev. | Arquivo                                          | Linha      | Tabela                   | Descrição                                                                                        | Correção Sugerida                            |
| --- | ---- | ------------------------------------------------ | ---------- | ------------------------ | ------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| C4  | 🟡   | `src/app/api/v1/pastores/route.ts`               | ~48-162    | `pastorProfiles`/`users` | 6 queries de listagem de pastores sem paginação (admin, manager, supervisor × minimal, completo) | `.limit(500)` em cada query                  |
| C5  | 🟡   | `src/app/api/v1/igrejas/route.ts`                | ~59-135    | `churchProfiles`/`users` | 4 queries de listagem de igrejas sem paginação (minimal, admin, manager, supervisor)             | `.limit(500)` em cada query                  |
| C6  | 🟡   | `src/app/api/v1/supervisores/route.ts`           | ~100       | `users` + JOINs          | Listagem completa de supervisores sem paginação                                                  | `.limit(200)`                                |
| C7  | 🟡   | `src/app/api/v1/dashboard/admin/route.ts`        | ~340, ~353 | `users` + perfis         | Busca TODOS os pastores e igrejas para verificar inadimplência                                   | `.limit(1000)`                               |
| C8  | 🟡   | `src/app/api/v1/webhooks/route.ts`               | ~35        | `webhooks`               | Webhooks por empresa sem limite                                                                  | `.limit(100)`                                |
| C9  | 🟡   | `src/app/api/v1/templates/route.ts`              | ~42-53     | `messageTemplates`       | Templates por empresa sem limite                                                                 | `.limit(100)`                                |
| C10 | 🟡   | `src/app/api/v1/notification-rules/route.ts`     | ~37        | `notificationRules`      | Regras de notificação sem limite                                                                 | `.limit(100)`                                |
| C11 | 🟡   | `src/app/api/v1/api-keys/route.ts`               | ~35        | `apiKeys`                | API keys por empresa sem limite                                                                  | `.limit(50)`                                 |
| C12 | 🟡   | `src/app/api/v1/users/[id]/fraud-stats/route.ts` | ~37, ~55   | `transactions`           | Transações de fraude de um usuário sem limite; query de contagem poderia usar `count()`          | `.limit(100)` e usar `count()` para contagem |
| C13 | 🟡   | `src/app/api/v1/send-message/route.ts`           | ~31        | `users`                  | Busca por ID único sem `.limit(1)`                                                               | `.limit(1)`                                  |
| C14 | 🟢   | `src/app/api/v1/regioes/route.ts`                | ~39-78     | `regions`                | Regiões por empresa — geralmente poucas                                                          | `.limit(100)`                                |
| C15 | 🟢   | `src/app/api/v1/administradores/route.ts`        | ~50        | `users`                  | Admins — geralmente poucos                                                                       | `.limit(50)`                                 |
| C16 | 🟢   | `src/app/api/v1/gateways/route.ts`               | ~34        | `gatewayConfigurations`  | Gateways por empresa — geralmente 1-3                                                            | `.limit(10)`                                 |

### 3.2 Idempotência na Cielo API

> **Nota:** O guard de idempotência (`checkDuplicatePayment`) **está presente e corretamente posicionado** antes de toda criação de pagamento. Os achados abaixo são fragilidades no mecanismo, não ausência dele.

| #   | Sev. | Arquivo                              | Linha        | Descrição                                                                                                        | Impacto                                                                                                                    | Correção Sugerida                                                                         |
| --- | ---- | ------------------------------------ | ------------ | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| C17 | 🟡   | `src/lib/cielo.ts`                   | 86, 182, 276 | `MerchantOrderId` baseado em `Date.now()` (ex: `PIX-1706000000000`) — não é idempotent key vinculada à transação | Se `checkDuplicatePayment` falhar (race condition), a Cielo não detecta duplicação; colisão possível no mesmo milissegundo | Usar ID da transação: `PIX-${transactionId}`                                              |
| C18 | 🟡   | `src/app/api/v1/transacoes/route.ts` | ~195-310     | Race condition entre `checkDuplicatePayment` e `createXxxPayment` — janela sem atomicidade                       | Duas requisições simultâneas podem ambas passar na verificação e criar pagamentos duplicados na Cielo                      | Inserir transação com status `processing` ANTES de chamar Cielo; usar `SELECT FOR UPDATE` |
| C19 | 🟡   | `src/lib/cielo.ts`                   | 93, 193, 283 | `Amount: Math.round(amount * 100)` — recebe float e converte para centavos                                       | Imprecisão de ponto flutuante (ex: `19.99 * 100 = 1998.999...`). `Math.round()` mitiga, mas ideal é receber inteiros       | Receber valores já em centavos (inteiros) desde o frontend                                |

### 3.3 Padrões N+1 (Loops com queries/HTTP)

| #   | Sev. | Arquivo                                                | Linha   | Descrição                                                                                                                       | Impacto                                                                          | Correção Sugerida                                                                          |
| --- | ---- | ------------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| C20 | 🔴   | `src/app/api/v1/admin/send-reminders/route.ts`         | 50-159  | Loop duplo (regras × usuários): para CADA usuário faz query dedup + criação NotificationService + email + WhatsApp + insert log | Com 500 usuários × 2 regras = **5.000+ queries/chamadas HTTP** por execução      | Buscar logs de dedup em batch com `inArray()`; criar NotificationService uma vez por regra |
| C21 | 🔴   | `src/app/api/v1/transacoes/export/route.ts`            | 54-82   | `Promise.all(data.map(async t => await db.select()...))` — query individual por transação para buscar nome do contribuinte      | 1.000 transações = **1.000 queries** paralelas, sobrecarregando pool de conexões | Fazer JOINs na query principal ou buscar perfis em batch com `inArray()`                   |
| C22 | 🟡   | `src/app/api/v1/cron/notifications/route.ts`           | 83-120  | Para cada novo usuário (até 50): cria `NotificationService` + email + WhatsApp + update + insert                                | Até 250 operações assíncronas por execução do cron                               | Agrupar por `companyId`; criar NotificationService uma vez por empresa                     |
| C23 | 🟡   | `src/lib/notification-scheduler.ts`                    | 33-36   | Para cada novo usuário: `getCompanySettings()` (query) + `sendWelcome()` (HTTP) + `db.update()`                                 | Query de settings repetida para cada usuário da mesma empresa                    | Agrupar por `companyId`; cachear settings                                                  |
| C24 | 🟡   | `src/lib/notification-scheduler.ts`                    | 61-64   | Para cada usuário a lembrar: `getCompanySettings()` + `sendPaymentReminder()`                                                   | Idem C23                                                                         | Idem C23                                                                                   |
| C25 | 🟡   | `src/lib/notification-hooks.ts`                        | 515-555 | Para cada regra ativa: cria nova instância de `NotificationService` (com mesmos parâmetros) + email + WhatsApp                  | NotificationService recriado desnecessariamente a cada iteração                  | Criar NotificationService uma vez fora do loop                                             |
| C26 | 🟡   | `src/app/api/v1/sns/webhook/route.ts`                  | 129-230 | Para cada recipient em bounce/complaint: SELECT + UPDATE/INSERT blacklist + INSERT log                                          | 3 queries por destinatário (geralmente 1-3 recipients)                           | Buscar emails existentes em batch; batch insert/update                                     |
| C27 | 🟡   | `src/app/api/v1/notification-rules/bootstrap/route.ts` | 39-108  | Para cada template/regra padrão (5 iterações): SELECT existência + INSERT                                                       | 10 queries onde poderiam ser 2                                                   | `INSERT ... ON CONFLICT DO NOTHING` ou buscar todos com `inArray()`                        |

### 3.4 Deduplicação de Notificações e Proteção de Cron Jobs

| #   | Sev. | Arquivo                                      | Linha    | Descrição                                                                                                                                  | Impacto                                                                                | Correção Sugerida                                                       |
| --- | ---- | -------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| C28 | 🔴   | `src/app/api/cron/notifications/route.ts`    | ~10      | Cron job **sem distributed lock** via Redis — se disparado 2x simultaneamente, ambas execuções processam os mesmos usuários                | Envio duplicado de notificações de boas-vindas e lembretes                             | Implementar lock via `redis.set(key, 'locked', 'EX', 120, 'NX')`        |
| C29 | 🔴   | `src/app/api/v1/cron/notifications/route.ts` | ~9-25    | Cron job com rate limit (2 req/min) como "proteção" — **insuficiente** contra execução paralela (instâncias diferentes têm IPs diferentes) | Processamento duplicado de regras de notificação                                       | Implementar distributed lock via Redis SET NX                           |
| C30 | 🟡   | —                                            | —        | **Dois endpoints de cron duplicados** para notificações: `/api/cron/notifications` e `/api/v1/cron/notifications`                          | Se ambos estiverem ativos, duplicação de processamento para boas-vindas e lembretes    | Consolidar em um único endpoint                                         |
| C31 | 🟡   | `src/lib/notification-scheduler.ts`          | ~34      | `processWelcomeNotifications()` sem deduplicação via módulo `notification-dedup.ts` — usa apenas flag `welcomeSent`                        | Race condition: se cron executar 2x antes do update da flag, envia duplicado           | Adicionar `shouldSendNotificationWithConfig(user.id, 'welcome_email')`  |
| C32 | 🟡   | `src/lib/notification-scheduler.ts`          | ~50-65   | `processPaymentReminders()` **sem nenhuma verificação de deduplicação**                                                                    | Se cron executar múltiplas vezes no mesmo dia, cada usuário recebe múltiplos lembretes | Adicionar `shouldSendNotificationWithConfig(user.id, 'tithe_reminder')` |
| C33 | 🟡   | `src/app/api/v1/cron/notifications/route.ts` | ~72-120  | `processNewUsers()` usa apenas flag `welcomeSent` — não usa módulo de dedup                                                                | Idem C31                                                                               | Adicionar verificação via `shouldSendNotificationWithConfig()`          |
| C34 | 🟡   | `src/app/api/v1/webhooks/cielo/route.ts`     | ~190-220 | Email de comprovante de pagamento sem deduplicação — Cielo pode retentar webhooks                                                          | Envio duplicado de comprovantes se webhook chegar 2x antes da primeira atualização     | Verificar `notificationLogs` antes de enviar                            |
| C35 | 🟢   | `src/app/api/v1/cron/notifications/route.ts` | ~122-340 | `processPayments/Reminders/Overdue` implementam deduplicação própria (funcional) mas inconsistente com o módulo `notification-dedup.ts`    | Manutenção dificultada por dois sistemas de dedup paralelos                            | Migrar para usar `shouldSendNotificationWithConfig()`                   |
| C36 | 🟢   | `src/lib/email.ts`                           | ~10      | `sendEmail()` sem deduplicação embutida — depende do chamador                                                                              | Risco se chamador esquecer de verificar                                                | Considerar deduplicação opcional no nível da função                     |
| C37 | 🟢   | `src/app/api/v1/test/smoke/route.ts`         | ~70-87   | Rota de teste envia notificações reais sem deduplicação                                                                                    | Chamadas repetidas enviam múltiplas notificações ao mesmo usuário                      | Adicionar flag `dryRun` ou deduplicação                                 |

---

## 4. 🛡️ Resiliência

> Fontes: Tasks 6.1 (fetch sem timeout), 6.2 (AbortSignal.timeout), 6.3 (transações/fallback), 6.4 (middleware)

### 4.1 Chamadas `fetch()` sem Timeout

> **Total:** ~47 chamadas fetch sem timeout configurado (AbortController + signal)
> **Com timeout:** 8 chamadas (middleware + páginas de auth)

#### 🔴 CRÍTICO — Serviços externos (Cielo, Evolution API, OpenAI)

| #   | Sev. | Arquivo                                        | Linha | Serviço       | Descrição                                          | Timeout Recomendado |
| --- | ---- | ---------------------------------------------- | ----- | ------------- | -------------------------------------------------- | ------------------- |
| R1  | 🔴   | `src/lib/cielo.ts`                             | 110   | Cielo API     | `createPixPayment` — POST sem timeout              | 15s                 |
| R2  | 🔴   | `src/lib/cielo.ts`                             | 209   | Cielo API     | `createCreditCardPayment` — POST sem timeout       | 15s                 |
| R3  | 🔴   | `src/lib/cielo.ts`                             | 311   | Cielo API     | `createBoletoPayment` — POST sem timeout           | 15s                 |
| R4  | 🟡   | `src/lib/cielo.ts`                             | 388   | Cielo API     | `cancelPayment` — PUT sem timeout                  | 15s                 |
| R5  | 🟡   | `src/lib/cielo.ts`                             | 445   | Cielo API     | `queryPayment` — GET sem timeout                   | 10s                 |
| R6  | 🟡   | `src/lib/notifications.ts`                     | 68    | Evolution API | `sendMessage` WhatsApp — POST sem timeout          | 10s                 |
| R7  | 🟡   | `src/app/api/v1/templates/ai-suggest/route.ts` | 58    | OpenAI        | Sugestão IA — POST sem timeout (pode levar 10-30s) | 30s                 |
| R8  | 🟡   | `src/app/api/v1/dashboard/insights/route.ts`   | 130   | OpenAI        | Insights dashboard — POST sem timeout              | 30s                 |
| R9  | 🟡   | `src/app/api/v1/test/openai/route.ts`          | 36    | OpenAI        | Teste chave OpenAI — POST sem timeout              | 15s                 |

#### 🟡 ATENÇÃO — Rotas com consultas Cielo duplicadas

| #   | Sev. | Arquivo                                                   | Linha | Descrição                     | Timeout Recomendado |
| --- | ---- | --------------------------------------------------------- | ----- | ----------------------------- | ------------------- |
| R10 | 🟡   | `src/app/api/v1/supervisor/transacoes/[id]/sync/route.ts` | 175   | Sync status Cielo sem timeout | 10s                 |
| R11 | 🟡   | `src/app/api/v1/supervisor/transacoes/[id]/route.ts`      | 161   | Consulta Cielo sem timeout    | 10s                 |
| R12 | 🟡   | `src/app/api/v1/pastor/transacoes/[id]/route.ts`          | 165   | Consulta Cielo sem timeout    | 10s                 |
| R13 | 🟡   | `src/app/api/v1/igreja/transacoes/[id]/route.ts`          | 168   | Consulta Cielo sem timeout    | 10s                 |

#### 🟡 ATENÇÃO — Rotas WhatsApp (Evolution API)

| #   | Sev. | Arquivo                                            | Descrição                                                  | Timeout Recomendado |
| --- | ---- | -------------------------------------------------- | ---------------------------------------------------------- | ------------------- |
| R14 | 🟡   | `src/app/api/v1/whatsapp/status/route.ts`          | fetchInstances sem timeout                                 | 10s                 |
| R15 | 🟡   | `src/app/api/v1/whatsapp/restart/route.ts`         | restart sem timeout                                        | 10s                 |
| R16 | 🟡   | `src/app/api/v1/whatsapp/logout/route.ts`          | logout sem timeout                                         | 10s                 |
| R17 | 🟡   | `src/app/api/v1/whatsapp/info/route.ts`            | fetchInstances + whatsappProfile sem timeout (2 chamadas)  | 10s                 |
| R18 | 🟡   | `src/app/api/v1/whatsapp/connectionState/route.ts` | connectionState sem timeout                                | 10s                 |
| R19 | 🟡   | `src/app/api/v1/whatsapp/connect/route.ts`         | fetchInstances + create + connect sem timeout (3 chamadas) | 10s                 |
| R20 | 🟡   | `src/app/api/v1/whatsapp/instance/route.ts`        | CRUD instância sem timeout (3 chamadas)                    | 10s                 |
| R21 | 🟡   | `src/app/api/v1/settings/whatsapp/test/route.ts`   | Teste envio sem timeout                                    | 10s                 |

#### 🟢 SUGESTÃO — Serviços de menor risco

| #   | Sev. | Arquivo                               | Descrição                                                     | Timeout Recomendado |
| --- | ---- | ------------------------------------- | ------------------------------------------------------------- | ------------------- |
| R22 | 🟢   | `src/app/api/v1/cep/route.ts`         | Proxy ViaCEP sem timeout                                      | 5s                  |
| R23 | 🟢   | `src/app/supervisor/perfil/page.tsx`  | ViaCEP client-side sem timeout                                | 5s                  |
| R24 | 🟢   | `src/app/api/v1/sns/webhook/route.ts` | Confirmação subscrição SNS sem timeout                        | 5s                  |
| R25 | 🟢   | Hooks React (5 arquivos)              | Chamadas a APIs internas sem timeout (~5 hooks)               | 10-15s              |
| R26 | 🟢   | Componentes (10+ arquivos)            | Chamadas a APIs internas sem timeout (~15 componentes)        | 10-15s              |
| R27 | 🟢   | Páginas supervisor (3 arquivos)       | Múltiplas chamadas a APIs internas sem timeout (~20 chamadas) | 10-15s              |

### 4.2 Uso de `AbortSignal.timeout()`

✅ **Nenhuma ocorrência encontrada.** O codebase é 100% compatível com Edge Runtime neste aspecto.

### 4.3 Operações Multi-Step sem Transação Atômica

| #   | Sev. | Arquivo                                                | Linha    | Descrição                                                                                                                   | Impacto                                                                             | Correção Sugerida                                          |
| --- | ---- | ------------------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| R28 | 🟡   | `src/app/api/v1/pastor/perfil/route.ts`                | ~198-225 | PUT atualiza `users` e `pastorProfiles` em duas operações separadas sem `db.transaction()`                                  | Se update de `users` suceder mas `pastorProfiles` falhar, perfil fica inconsistente | Envolver ambos updates em `db.transaction()`               |
| R29 | 🟡   | `src/app/api/v1/igreja/perfil/route.ts`                | ~181-200 | PUT atualiza `users` e `churchProfiles` separadamente sem transação                                                         | Idem R28                                                                            | Envolver em `db.transaction()`                             |
| R30 | 🟡   | `src/app/api/v1/cron/notifications/route.ts`           | ~100-115 | Envia notificação e depois faz `db.update({ welcomeSent: true })` — se update falhar, notificação duplicada no próximo cron | Duplicação de notificações de boas-vindas                                           | Marcar como "em processamento" ANTES de enviar             |
| R31 | 🟡   | `src/app/api/v1/sns/webhook/route.ts`                  | ~130-230 | Para cada recipient: upsert blacklist + insert log sem transação                                                            | Se insert do log falhar, perde-se registro do bounce                                | Envolver operações de cada recipient em `db.transaction()` |
| R32 | 🟡   | `src/lib/notification-scheduler.ts`                    | ~30-38   | Envia notificação e depois marca `welcomeSent: true` sem transação                                                          | Duplicação se update falhar                                                         | Idem R30                                                   |
| R33 | 🟢   | `src/app/api/v1/notification-rules/bootstrap/route.ts` | ~40-100  | Cria templates e regras em loop sem transação                                                                               | Dados parciais se falhar no meio (mitigado por idempotência)                        | Envolver em `db.transaction()`                             |
| R34 | 🟢   | `src/db/seed.ts`                                       | ~41-65   | Deleta ~15 tabelas e insere dados sem transação                                                                             | Banco inconsistente se falhar no meio (script de seed, não produção)                | Envolver em `db.transaction()`                             |

### 4.4 Dependências de Serviços Externos sem Fallback

| #   | Sev. | Arquivo                              | Linha | Descrição                                                                                                   | Impacto                                                                                                    | Correção Sugerida                                                         |
| --- | ---- | ------------------------------------ | ----- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| R35 | 🔴   | `src/lib/queues.ts`                  | ~5-38 | Redis criado com `new IORedis()` **sem try/catch** na inicialização. Se Redis indisponível, módulo crasheia | Todo o sistema de filas de notificação para; qualquer módulo que importar `notificationQueue` pode crashar | Envolver em try/catch; retornar `null` se falhar; verificar antes de usar |
| R36 | 🔴   | `src/workers/notification-worker.ts` | ~6-37 | Mesmo padrão do R35 — Redis sem fallback na inicialização do worker                                         | Worker de background crasheia completamente se Redis indisponível                                          | Envolver em try/catch; log de erro; exit gracioso                         |
| R37 | 🟢   | `src/middleware.ts`                  | 30-70 | Headers de segurança duplicados em dois blocos                                                              | Risco de inconsistência (já reportado em S60)                                                              | Extrair para função auxiliar                                              |

> **Serviços com fallback adequado ✅:** Redis (`redis.ts`, `cache.ts`, `rate-limit.ts`), S3 (`s3-client.ts`), Cielo (`cielo.ts`), WhatsApp (`notifications.ts`), Email (`notifications.ts` com fallback SES→SMTP)

### 4.5 Tratamento de Erros no Middleware

✅ **Bem implementado.** O middleware possui try/catch, AbortController com timeout de 1s, clearTimeout em ambos os caminhos, logging do erro e degradação graciosa.

---

## 🚨 Top 5 Ações Mais Urgentes

### 1. 🔴 Corrigir/Remover Rotas Legado do Gerente (S1, S2, S16, S17)

**Arquivos:** `src/app/api/v1/gerente/dashboard/route.ts`, `src/app/api/v1/gerente/perfil/route.ts`
**Problema:** Rotas **sem autenticação E sem rate limit** que expõem dados financeiros e permitem modificação de perfil (incluindo senha) sem qualquer proteção.
**Ação:** Adicionar `validateRequest()` + verificação de role `manager` + rate limit, OU remover as rotas legado se já existem equivalentes autenticadas em `/v1/manager/`.

### 2. 🔴 Remover Fallbacks Hardcoded de Secrets (S26, S27)

**Arquivos:** `src/lib/jwt.ts` (linha 10), `src/app/api/v1/cron/notifications/route.ts` (linha 8)
**Problema:** `JWT_SECRET` com fallback `'your-super-secret-jwt-key-change-this-in-production'` permite forjar tokens de qualquer usuário. `CRON_SECRET` com fallback `'change-me-in-production'` permite executar cron jobs sem autorização.
**Ação:** Remover fallbacks; usar `env.JWT_SECRET` e `env.CRON_SECRET` de `@/lib/env`. Adicionar `CRON_SECRET` ao schema Zod do `env.ts`.

### 3. 🔴 Adicionar Headers CSP e HSTS no Middleware (S57, S58)

**Arquivo:** `src/middleware.ts`
**Problema:** Ausência de `Content-Security-Policy` deixa o sistema vulnerável a XSS. Ausência de `Strict-Transport-Security` permite ataques man-in-the-middle na primeira requisição.
**Ação:** Adicionar HSTS imediatamente. Iniciar CSP em modo `Report-Only` para monitorar antes de enforcement.

### 4. 🔴 Adicionar Timeout nas Chamadas Cielo API (R1, R2, R3)

**Arquivo:** `src/lib/cielo.ts`
**Problema:** Todas as 5 funções de pagamento (PIX, cartão, boleto, cancelamento, consulta) fazem `fetch()` sem timeout. Se a Cielo ficar lenta/indisponível, requests ficam pendurados indefinidamente.
**Ação:** Adicionar `AbortController` com timeout de 15s em todas as chamadas fetch da Cielo.

### 5. 🔴 Implementar Distributed Lock nos Cron Jobs (C28, C29)

**Arquivos:** `src/app/api/cron/notifications/route.ts`, `src/app/api/v1/cron/notifications/route.ts`
**Problema:** Nenhum cron job possui proteção contra execução paralela. Em ambiente serverless (Vercel), múltiplas instâncias podem executar simultaneamente, causando envio duplicado de notificações.
**Ação:** Implementar lock distribuído via Redis (`SET key 'locked' EX 120 NX`) antes de processar. Consolidar os dois endpoints de cron em um único.

---

## 📎 Apêndice: Variáveis que Devem ser Adicionadas ao `env.ts`

| Variável              | Tipo Zod             | Obrigatória | Justificativa                              |
| --------------------- | -------------------- | ----------- | ------------------------------------------ |
| `CRON_SECRET`         | `z.string().min(16)` | Sim         | Protege execução de cron jobs              |
| `GERENTE_INIT`        | `z.string().uuid()`  | Sim         | ID do gerente inicial do sistema           |
| `NEXT_PUBLIC_APP_URL` | `z.string().url()`   | Sim         | URL base para links em emails/notificações |

## 📎 Apêndice: Módulos de Rate Limiting Duplicados

O projeto possui **dois módulos diferentes** de rate limiting:

- `src/lib/rate-limiter.ts` — Rate limiter **síncrono** (in-memory) com presets
- `src/lib/rate-limit.ts` — Rate limiter **assíncrono** (baseado em Redis)

**Recomendação:** Unificar em um único módulo para consistência.

## 📎 Apêndice: Sistema de Deduplicação Existente mas Subutilizado

O módulo `src/lib/notification-dedup.ts` está bem implementado com `shouldSendNotification()` e `shouldSendNotificationWithConfig()`, mas **não é usado consistentemente** em todos os pontos de envio de notificações. O problema não é a falta de um sistema de deduplicação, mas sim a falta de uso consistente.

---

_Relatório gerado como parte da auditoria de produção do Vinha Admin Center._
_Para detalhes completos de cada análise, consulte as notas em `.kiro/specs/production-audit/notes/`._
