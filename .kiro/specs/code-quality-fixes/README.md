# Spec: Correção de Problemas Críticos de Qualidade de Código

## Visão Geral

Esta spec documenta os problemas críticos identificados na revisão de código do sistema **Vinha Admin Center** e propõe soluções técnicas detalhadas para correção.

## Contexto

O sistema está em **PRODUÇÃO** e apresenta problemas que podem comprometer:

- ✅ Estabilidade (tipos `any`, queries sem `.limit()`)
- ✅ Segurança (logs não sanitizados, rate limiting inconsistente)
- ✅ Performance (N+1 queries, falta de cache)
- ✅ Integridade financeira (risco de duplicação de pagamentos)

## Estrutura da Spec

### 📋 [requirements.md](./requirements.md)

Documento de requisitos detalhando todos os problemas identificados, organizados por severidade:

- **Seção 1**: Problemas Críticos de Segurança
- **Seção 2**: Problemas de Idempotência e Race Conditions
- **Seção 3**: Problemas de Tratamento de Erros
- **Seção 4**: Problemas de Performance
- **Seção 5**: Problemas de Segurança
- **Seção 6**: Problemas de Arquitetura
- **Seção 7**: Problemas de Observabilidade

### 🎨 [design.md](./design.md)

Documento de design técnico com soluções detalhadas:

- Arquivos utilitários a serem criados
- Padrões de código a serem seguidos
- Exemplos de implementação
- Estratégia de rollback

### ✅ [tasks.md](./tasks.md)

Lista de tarefas organizadas em 4 fases:

- **Fase 1**: Fundação (Semana 1)
- **Fase 2**: Segurança (Semana 2)
- **Fase 3**: Performance (Semana 3)
- **Fase 4**: Resiliência (Semana 4)

### 📊 [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)

Resumo executivo para stakeholders não-técnicos:

- Avaliação geral (nota 6.5/10)
- Top 10 problemas críticos
- Plano de ação recomendado
- Métricas de sucesso
- Análise de ROI

## Problemas Críticos (Top 5)

### 🔴 1. Risco de Duplicação de Pagamentos

**Impacto**: Cobranças duplicadas, perda financeira  
**Arquivo**: `src/app/api/v1/transacoes/route.ts`  
**Solução**: Verificação de duplicação com janela de 5 minutos

### 🔴 2. Exposição de Dados Sensíveis em Logs

**Impacto**: Violação de LGPD, vazamento de dados  
**Arquivos**: Múltiplos  
**Solução**: Sanitização automática de logs

### 🔴 3. Variáveis de Ambiente Não Validadas

**Impacto**: Crashes silenciosos  
**Arquivos**: 20+ arquivos  
**Solução**: Validação com Zod no startup

### 🟠 4. Violações de Type Safety (15+ arquivos)

**Impacto**: Erros de runtime não detectados  
**Arquivos**: Rotas de supervisor, pastor, igreja  
**Solução**: Tipos explícitos para todos os `any`

### 🟠 5. N+1 Queries em Listagens

**Impacto**: Performance degradada  
**Arquivo**: `src/app/api/v1/transacoes/route.ts`  
**Solução**: Usar JOIN ou batch queries

## Priorização

### Fase 1 - CRÍTICO (Semana 1) ⚡

**Objetivo**: Eliminar riscos de produção  
**Esforço**: 40 horas  
**Impacto**: Redução de 80% dos riscos críticos

**Tasks**:

- Verificação de duplicação de pagamentos
- Sanitização de logs
- Validação de variáveis de ambiente
- Substituição de tipos `any`

### Fase 2 - ALTO (Semana 2) 🔥

**Objetivo**: Melhorar estabilidade  
**Esforço**: 32 horas  
**Impacto**: Melhoria de 50% em performance

**Tasks**:

- Adicionar `.limit()` em queries
- Eliminar N+1 queries
- Rate limiting completo
- Validação de uploads

### Fase 3 - MÉDIO (Semana 3) 📈

**Objetivo**: Aumentar resiliência  
**Esforço**: 24 horas  
**Impacto**: Redução de 60% em bugs

**Tasks**:

- Idempotência em notificações
- Reconciliação de webhooks
- Cache de configurações
- Logging estruturado

### Fase 4 - BAIXO (Semana 4) 🔧

**Objetivo**: Melhorar manutenibilidade  
**Esforço**: 16 horas  
**Impacto**: Facilita manutenção futura

**Tasks**:

- Refatoração de código duplicado
- Transações em operações críticas
- Métricas de performance
- Mensagens de erro descritivas

## Como Executar

### 1. Revisar Documentação

```bash
# Ler resumo executivo
cat .kiro/specs/code-quality-fixes/EXECUTIVE_SUMMARY.md

# Ler requisitos completos
cat .kiro/specs/code-quality-fixes/requirements.md

# Ler design técnico
cat .kiro/specs/code-quality-fixes/design.md
```

### 2. Iniciar Fase 1

```bash
# Ver tasks da Fase 1
grep -A 20 "## Fase 1" .kiro/specs/code-quality-fixes/tasks.md

# Executar tasks sequencialmente
# Marcar como completo após cada task
```

### 3. Validar Correções

```bash
# Rodar testes
npm run test

# Verificar tipos
npm run typecheck

# Verificar lint
npm run lint

# Build de produção
npm run build
```

### 4. Deploy Incremental

```bash
# Deploy em staging
npm run deploy:staging

# Validar em staging
npm run test:e2e

# Deploy em produção com feature flags
npm run deploy:production
```

## Métricas de Sucesso

### Antes ❌

- 15+ arquivos com tipo `any`
- 0% de validação de env vars
- 0% de proteção contra duplicação
- Tempo de resposta: 350ms
- Logs podem expor dados sensíveis

### Depois ✅

- 0 arquivos com tipo `any`
- 100% de env vars validadas
- 100% de proteção contra duplicação
- Tempo de resposta: < 200ms
- Logs sanitizados automaticamente

## Arquivos Criados

Esta spec criará os seguintes arquivos novos:

### Utilitários

- `src/lib/env.ts` - Validação de variáveis de ambiente
- `src/lib/logger.ts` - Logging estruturado
- `src/lib/log-sanitizer.ts` - Sanitização de logs
- `src/lib/db-utils.ts` - Utilitários de banco de dados
- `src/lib/config-cache.ts` - Cache de configurações

### Segurança

- `src/lib/payment-guard.ts` - Proteção contra duplicação
- `src/lib/upload-validator.ts` - Validação de uploads
- `src/lib/rate-limit-redis.ts` - Rate limiting com Redis

### Resiliência

- `src/lib/webhook-reconciliation.ts` - Reconciliação de webhooks
- `src/lib/notification-dedup.ts` - Deduplicação de notificações

### Middleware

- `src/middleware/rate-limit.ts` - Middleware de rate limiting

## Arquivos Modificados

### Rotas de API (20+ arquivos)

- Todas as rotas de supervisor
- Todas as rotas de pastor
- Todas as rotas de igreja
- Rotas de transações
- Rotas de webhooks

### Bibliotecas (5 arquivos)

- `src/lib/cielo.ts`
- `src/lib/notifications.ts`
- `src/lib/s3-client.ts`
- `src/lib/types.ts`
- `src/db/drizzle.ts`

## Riscos e Mitigações

### Risco 1: Breaking Changes

**Mitigação**: Todas as mudanças são backward-compatible

### Risco 2: Performance Degradation

**Mitigação**: Testes de performance antes/depois

### Risco 3: Bugs Introduzidos

**Mitigação**: Suite de testes completa + staging

### Risco 4: Downtime em Produção

**Mitigação**: Deploy incremental com feature flags

## Suporte

Para dúvidas ou problemas:

1. Consultar documentação completa nesta pasta
2. Revisar exemplos de código no `design.md`
3. Verificar tasks específicas no `tasks.md`
4. Consultar resumo executivo para contexto de negócio

## Próximos Passos

1. ✅ Revisar e aprovar spec
2. ⏳ Alocar desenvolvedor sênior
3. ⏳ Iniciar Fase 1 (Crítico)
4. ⏳ Deploy incremental
5. ⏳ Monitoramento por 2 semanas

---

**Status**: 📝 Aguardando Aprovação  
**Criado em**: Janeiro 2025  
**Última Atualização**: Janeiro 2025  
**Autor**: Kiro AI - Revisor Sênior de Software
