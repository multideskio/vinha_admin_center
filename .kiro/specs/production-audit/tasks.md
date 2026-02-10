# Plano de Implementação: Auditoria de Produção

## Visão Geral

Auditoria completa do Vinha Admin Center cobrindo bugs, segurança, custos e resiliência. A primeira fase é a análise e geração do relatório, seguida de correções dos problemas mais críticos encontrados.

## Tasks

- [x] 1. Análise de segurança — rotas API sem autenticação JWT
  - [x] 1.1 Analisar todas as rotas em `src/app/api/` e identificar quais não usam `validateRequest()` ou `validateJWTRequest()`
    - Listar rotas públicas legítimas (health, auth/login, auth/register, webhooks, cep, maintenance-check, company/public)
    - Todas as demais rotas devem ter autenticação
    - Registrar cada rota sem auth com arquivo e linha
    - _Requisitos: 2.1_
  - [x] 1.2 Analisar rotas API sem validação Zod em endpoints que recebem dados (POST/PUT/PATCH)
    - Verificar presença de `z.object`, `.parse(`, `.safeParse(` nos handlers
    - Registrar cada rota sem validação
    - _Requisitos: 2.3_
  - [x] 1.3 Analisar endpoints públicos sem rate limiting
    - Verificar presença de `rateLimit(` em rotas públicas
    - _Requisitos: 2.4_
  - [ ]\* 1.4 Escrever teste de propriedade para autenticação em rotas
    - **Propriedade 1: Rotas protegidas devem ter autenticação JWT**
    - **Valida: Requisitos 2.1**

- [x] 2. Análise de segurança — dados sensíveis e configuração
  - [x] 2.1 Identificar dados sensíveis expostos em logs (senhas, tokens, chaves API em console.log/console.error)
    - Verificar se `safeLog`/`safeError` é usado em vez de `console.log` direto quando dados de usuário estão envolvidos
    - _Requisitos: 2.2_
  - [x] 2.2 Identificar secrets hardcoded no código (chaves API, senhas, tokens em strings literais)
    - Buscar padrões como JWT_SECRET com fallback hardcoded, strings longas hexadecimais
    - _Requisitos: 2.6_
  - [x] 2.3 Identificar usos de `process.env` fora de `src/lib/env.ts` sem validação
    - _Requisitos: 2.7_
  - [x] 2.4 Verificar headers de segurança no middleware
    - Confirmar presença de X-Content-Type-Options, X-Frame-Options, Referrer-Policy, X-XSS-Protection, Content-Security-Policy
    - _Requisitos: 2.8_
  - [ ]\* 2.5 Escrever teste de propriedade para validação de process.env
    - **Propriedade 4: Uso de process.env deve ser validado**
    - **Valida: Requisitos 2.7**

- [x] 3. Checkpoint — Revisão de segurança
  - Garantir que todos os achados de segurança estão documentados, perguntar ao usuário se há dúvidas.

- [x] 4. Análise de bugs e erros no código
  - [x] 4.1 Identificar catch blocks vazios em todo o código-fonte
    - Buscar padrões `catch {}`, `catch (e) {}`, `catch { }` etc.
    - _Requisitos: 1.1_
  - [x] 4.2 Identificar usos de tipo `any` no TypeScript
    - Buscar `: any`, `as any`, `<any>` em arquivos .ts/.tsx
    - _Requisitos: 1.2_
  - [x] 4.3 Identificar Promises sem await e imports quebrados
    - Rodar `tsc --noEmit` para verificar erros de compilação
    - _Requisitos: 1.4, 1.5_
  - [ ]\* 4.4 Escrever teste de propriedade para catch blocks vazios
    - **Propriedade 9: Catch blocks não devem ser vazios**
    - **Valida: Requisitos 1.1**

- [x] 5. Análise de custos
  - [x] 5.1 Identificar queries `db.select()` sem `.limit()` que podem retornar conjuntos grandes
    - Excluir queries que filtram por ID único com destructuring
    - _Requisitos: 3.1_
  - [x] 5.2 Identificar chamadas à Cielo API sem controle de idempotência
    - Verificar se `checkDuplicatePayment` é chamado antes de `createPixPayment`, `createCreditCardPayment`, `createBoletoPayment`
    - _Requisitos: 3.2_
  - [x] 5.3 Identificar loops com chamadas HTTP ou queries ao banco (N+1)
    - Buscar padrões `for...of` + `await fetch` ou `await db.`
    - _Requisitos: 3.3_
  - [x] 5.4 Identificar envio de notificações sem deduplicação e cron jobs sem proteção de execução paralela
    - _Requisitos: 3.4, 3.5_
  - [ ]\* 5.5 Escrever teste de propriedade para queries sem limit
    - **Propriedade 5: Queries SELECT devem ter limite**
    - **Valida: Requisitos 3.1**

- [x] 6. Análise de resiliência
  - [x] 6.1 Identificar chamadas `fetch()` sem timeout (sem AbortController ou signal)
    - _Requisitos: 4.1_
  - [x] 6.2 Identificar usos de `AbortSignal.timeout()` incompatíveis com Edge Runtime
    - _Requisitos: 4.2_
  - [x] 6.3 Identificar operações multi-step sem transação atômica e dependências de serviços externos sem fallback
    - Verificar uso de Redis sem `if (!redis)`, S3 sem try/catch
    - _Requisitos: 4.3, 4.4_
  - [x] 6.4 Verificar tratamento de erros no middleware
    - _Requisitos: 4.5_
  - [ ]\* 6.5 Escrever teste de propriedade para fetch sem timeout
    - **Propriedade 6: Chamadas fetch devem ter timeout**
    - **Valida: Requisitos 4.1**
  - [ ]\* 6.6 Escrever teste de propriedade para AbortSignal.timeout
    - **Propriedade 7: Ausência de AbortSignal.timeout()**
    - **Valida: Requisitos 4.2**

- [x] 7. Checkpoint — Revisão completa da análise
  - Garantir que todas as categorias foram analisadas, perguntar ao usuário se há dúvidas.

- [x] 8. Gerar relatório de auditoria consolidado
  - [x] 8.1 Criar arquivo `AUDIT_REPORT.md` na raiz do projeto
    - Consolidar todos os achados das tasks 1-6
    - Classificar cada problema como 🔴 CRÍTICO, 🟡 ATENÇÃO ou 🟢 SUGESTÃO
    - Incluir arquivo, linha, descrição, impacto e sugestão de correção para cada achado
    - Agrupar por categoria (Bugs, Segurança, Custos, Resiliência)
    - Calcular nota de prontidão de 0-10
    - Listar as 5 ações mais urgentes
    - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 9. Corrigir problemas críticos de segurança
  - [x] 9.1 Corrigir o fallback hardcoded do JWT_SECRET em `src/lib/jwt.ts`
    - Remover o fallback `'your-super-secret-jwt-key-change-this-in-production'` e usar `env.JWT_SECRET` de `@/lib/env`
    - _Requisitos: 6.2, 2.6_
  - [x] 9.2 Adicionar `validateRequest()` nas rotas protegidas que estão sem autenticação
    - Aplicar o padrão de auth em cada rota identificada na task 1.1
    - _Requisitos: 6.2_
  - [x] 9.3 Adicionar validação Zod nas rotas que recebem dados sem validação
    - Criar schemas Zod apropriados para cada rota identificada na task 1.2
    - _Requisitos: 6.3_

- [x] 10. Corrigir problemas críticos de resiliência
  - [x] 10.1 Adicionar timeout (AbortController) nas chamadas fetch sem timeout
    - Aplicar o padrão AbortController em cada fetch identificado na task 6.1
    - Priorizar chamadas à Cielo API e Evolution API
    - _Requisitos: 6.6_
  - [x] 10.2 Corrigir catch blocks vazios adicionando logging com contexto
    - Aplicar `console.error('[CONTEXTO]', error)` em cada catch vazio identificado na task 4.1
    - _Requisitos: 6.1_

- [x] 11. Corrigir problemas de custos
  - [x] 11.1 Adicionar `.limit()` nas queries sem limite identificadas na task 5.1
    - Usar limites apropriados ao contexto (100 para listagens, 1 para registros únicos)
    - _Requisitos: 6.4_

- [x] 12. Checkpoint final — Verificar que correções não introduziram erros
  - Rodar `getDiagnostics` nos arquivos modificados
  - Garantir que todas as correções compilam sem erros
  - Perguntar ao usuário se há dúvidas.

## Notas

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada task referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Testes de propriedade validam propriedades universais de corretude
- Testes unitários validam exemplos específicos e edge cases
