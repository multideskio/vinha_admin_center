# Tasks: Correção de Problemas Críticos de Qualidade de Código

## Fase 1 - Fundação (Semana 1)

### 1. Criar Arquivos Utilitários Base

- [ ] 1.1 Criar `src/lib/env.ts` com validação Zod de variáveis de ambiente
  - [ ] 1.1.1 Definir schema Zod com todas as variáveis obrigatórias
  - [ ] 1.1.2 Adicionar variáveis opcionais com defaults seguros
  - [ ] 1.1.3 Exportar objeto `env` tipado
  - [ ] 1.1.4 Adicionar testes unitários para validação

- [ ] 1.2 Criar tipos explícitos em `src/lib/types.ts`
  - [ ] 1.2.1 Adicionar interface `SessionUser`
  - [ ] 1.2.2 Adicionar interface `SmtpTransporter`
  - [ ] 1.2.3 Exportar tipos para uso em todo projeto

- [ ] 1.3 Criar `src/lib/logger.ts` com logging estruturado
  - [ ] 1.3.1 Implementar classe `Logger` com métodos error/warn/info
  - [ ] 1.3.2 Adicionar suporte a contexto (userId, operation, etc)
  - [ ] 1.3.3 Integrar com `log-sanitizer.ts`
  - [ ] 1.3.4 Exportar instância singleton

### 2. Substituir Tipos `any`

- [ ] 2.1 Substituir `any` em rotas de supervisor
  - [ ] 2.1.1 Atualizar `src/app/api/v1/supervisor/transacoes/route.ts`
  - [ ] 2.1.2 Atualizar `src/app/api/v1/supervisor/transacoes/[id]/resend-receipt/route.ts`
  - [ ] 2.1.3 Atualizar `src/app/api/v1/supervisor/transacoes/[id]/route.ts`
  - [ ] 2.1.4 Atualizar `src/app/api/v1/supervisor/transacoes/[id]/sync/route.ts`
  - [ ] 2.1.5 Atualizar `src/app/api/v1/supervisor/igrejas/route.ts`
  - [ ] 2.1.6 Atualizar `src/app/api/v1/supervisor/igrejas/[id]/route.ts`

- [ ] 2.2 Substituir `any` em rotas de pastor
  - [ ] 2.2.1 Atualizar `src/app/api/v1/pastor/perfil/route.ts`
  - [ ] 2.2.2 Atualizar `src/app/api/v1/pastor/transacoes/route.ts`
  - [ ] 2.2.3 Atualizar `src/app/api/v1/pastor/dashboard/route.ts`
  - [ ] 2.2.4 Atualizar `src/app/api/v1/pastor/transacoes/[id]/route.ts`

- [ ] 2.3 Substituir `any` em rotas de igreja
  - [ ] 2.3.1 Atualizar `src/app/api/v1/igreja/transacoes/route.ts`
  - [ ] 2.3.2 Atualizar `src/app/api/v1/igreja/perfil/route.ts`
  - [ ] 2.3.3 Atualizar `src/app/api/v1/igreja/dashboard/route.ts`
  - [ ] 2.3.4 Atualizar `src/app/api/v1/igreja/transacoes/[id]/route.ts`

- [ ] 2.4 Substituir `any` em `src/lib/notifications.ts`
  - [ ] 2.4.1 Atualizar tipo de `smtpTransporter`
  - [ ] 2.4.2 Adicionar tipos para métodos do transporter

### 3. Validar Variáveis de Ambiente

- [ ] 3.1 Substituir `process.env` por `env` em arquivos críticos
  - [ ] 3.1.1 Atualizar `src/lib/cielo.ts`
  - [ ] 3.1.2 Atualizar `src/lib/email.ts`
  - [ ] 3.1.3 Atualizar `src/app/api/v1/transacoes/route.ts`
  - [ ] 3.1.4 Atualizar `src/app/api/v1/webhooks/cielo/route.ts`
  - [ ] 3.1.5 Atualizar todas as rotas que usam `COMPANY_INIT`
  - [ ] 3.1.6 Atualizar todas as rotas que usam `DEFAULT_PASSWORD`

- [ ] 3.2 Adicionar validação no startup
  - [ ] 3.2.1 Importar `env` em `src/app/layout.tsx`
  - [ ] 3.2.2 Adicionar error boundary para erros de validação
  - [ ] 3.2.3 Exibir mensagem clara se variável estiver faltando

## Fase 2 - Segurança (Semana 2)

### 4. Implementar Verificação de Duplicação de Pagamentos

- [ ] 4.1 Criar `src/lib/payment-guard.ts`
  - [ ] 4.1.1 Implementar função `checkDuplicatePayment()`
  - [ ] 4.1.2 Adicionar configuração de janela de tempo
  - [ ] 4.1.3 Adicionar testes unitários

- [ ] 4.2 Integrar em rota de transações
  - [ ] 4.2.1 Adicionar verificação em `POST /api/v1/transacoes`
  - [ ] 4.2.2 Retornar erro 409 se duplicação detectada
  - [ ] 4.2.3 Incluir ID da transação existente na resposta
  - [ ] 4.2.4 Adicionar logs estruturados

- [ ] 4.3 Adicionar testes de integração
  - [ ] 4.3.1 Testar criação de transação duplicada
  - [ ] 4.3.2 Testar janela de tempo
  - [ ] 4.3.3 Testar diferentes valores e usuários

### 5. Implementar Sanitização de Logs

- [ ] 5.1 Criar `src/lib/log-sanitizer.ts`
  - [ ] 5.1.1 Implementar função `sanitizeLog()`
  - [ ] 5.1.2 Adicionar padrões para CPF, cartão, CVV, senha, token
  - [ ] 5.1.3 Implementar função `safeLog()`
  - [ ] 5.1.4 Adicionar testes unitários

- [ ] 5.2 Integrar em código crítico
  - [ ] 5.2.1 Atualizar logs em `src/lib/cielo.ts`
  - [ ] 5.2.2 Atualizar logs em `src/app/api/v1/transacoes/route.ts`
  - [ ] 5.2.3 Atualizar logs em `src/lib/notifications.ts`
  - [ ] 5.2.4 Revisar todos os `console.log()` em rotas de API

### 6. Implementar Validação de Uploads

- [ ] 6.1 Criar `src/lib/upload-validator.ts`
  - [ ] 6.1.1 Implementar função `validateUpload()`
  - [ ] 6.1.2 Definir tipos MIME permitidos
  - [ ] 6.1.3 Definir tamanho máximo (10MB)
  - [ ] 6.1.4 Adicionar validação de extensão
  - [ ] 6.1.5 Adicionar testes unitários

- [ ] 6.2 Integrar em `src/lib/s3-client.ts`
  - [ ] 6.2.1 Adicionar validação em `uploadFile()`
  - [ ] 6.2.2 Retornar erro descritivo se validação falhar
  - [ ] 6.2.3 Adicionar sanitização de nome de arquivo

- [ ] 6.3 Atualizar rotas de upload
  - [ ] 6.3.1 Adicionar validação em rota de upload de avatar
  - [ ] 6.3.2 Retornar erro 400 com mensagem clara

## Fase 3 - Performance (Semana 3)

### 7. Adicionar `.limit()` em Queries

- [ ] 7.1 Criar `src/lib/db-utils.ts`
  - [ ] 7.1.1 Implementar função `findOne()`
  - [ ] 7.1.2 Adicionar tipos genéricos
  - [ ] 7.1.3 Adicionar testes unitários

- [ ] 7.2 Refatorar queries sem `.limit()`
  - [ ] 7.2.1 Atualizar `src/app/api/v1/supervisor/pastores/[id]/route.ts`
  - [ ] 7.2.2 Atualizar `src/app/api/v1/supervisor/igrejas/[id]/route.ts`
  - [ ] 7.2.3 Atualizar `src/app/api/v1/manager/igrejas/[id]/route.ts`
  - [ ] 7.2.4 Atualizar `src/app/api/v1/manager/pastores/[id]/route.ts`
  - [ ] 7.2.5 Atualizar scripts de migração

### 8. Eliminar N+1 Queries

- [ ] 8.1 Refatorar `GET /api/v1/transacoes`
  - [ ] 8.1.1 Substituir loop de queries por JOIN
  - [ ] 8.1.2 Criar query otimizada com todos os perfis
  - [ ] 8.1.3 Testar performance antes/depois
  - [ ] 8.1.4 Adicionar índices se necessário

- [ ] 8.2 Identificar outras rotas com N+1
  - [ ] 8.2.1 Analisar rotas de listagem
  - [ ] 8.2.2 Refatorar queries identificadas
  - [ ] 8.2.3 Adicionar testes de performance

### 9. Implementar Cache de Configurações

- [ ] 9.1 Criar `src/lib/config-cache.ts`
  - [ ] 9.1.1 Implementar classe `ConfigCache`
  - [ ] 9.1.2 Adicionar métodos get/set/invalidate
  - [ ] 9.1.3 Configurar TTL de 5 minutos
  - [ ] 9.1.4 Adicionar testes unitários

- [ ] 9.2 Integrar em `src/lib/cielo.ts`
  - [ ] 9.2.1 Adicionar cache em `getCieloConfig()`
  - [ ] 9.2.2 Invalidar cache quando configuração for atualizada

- [ ] 9.3 Integrar em `src/lib/notifications.ts`
  - [ ] 9.3.1 Adicionar cache em `createFromDatabase()`
  - [ ] 9.3.2 Invalidar cache quando configuração for atualizada

## Fase 4 - Resiliência (Semana 4)

### 10. Implementar Reconciliação de Webhooks

- [ ] 10.1 Criar `src/lib/webhook-reconciliation.ts`
  - [ ] 10.1.1 Implementar função `reconcileTransactionState()`
  - [ ] 10.1.2 Adicionar lógica de retry com backoff
  - [ ] 10.1.3 Adicionar logs estruturados
  - [ ] 10.1.4 Adicionar testes unitários

- [ ] 10.2 Integrar em webhook handler
  - [ ] 10.2.1 Atualizar `src/app/api/v1/webhooks/cielo/route.ts`
  - [ ] 10.2.2 Adicionar tratamento de webhook early arrival
  - [ ] 10.2.3 Adicionar testes de integração

### 11. Implementar Deduplicação de Notificações

- [ ] 11.1 Criar `src/lib/notification-dedup.ts`
  - [ ] 11.1.1 Implementar função `shouldSendNotification()`
  - [ ] 11.1.2 Configurar janela de deduplicação
  - [ ] 11.1.3 Adicionar testes unitários

- [ ] 11.2 Integrar em sistema de notificações
  - [ ] 11.2.1 Adicionar verificação em `src/lib/notification-hooks.ts`
  - [ ] 11.2.2 Logar tentativas de duplicação
  - [ ] 11.2.3 Adicionar testes de integração

### 12. Migrar Rate Limiting para Redis

- [ ] 12.1 Criar `src/lib/rate-limit-redis.ts`
  - [ ] 12.1.1 Implementar função `rateLimitRedis()`
  - [ ] 12.1.2 Adicionar fallback para memória se Redis indisponível
  - [ ] 12.1.3 Adicionar testes unitários

- [ ] 12.2 Criar middleware de rate limiting
  - [ ] 12.2.1 Criar `src/middleware/rate-limit.ts`
  - [ ] 12.2.2 Configurar limites por tipo de rota
  - [ ] 12.2.3 Adicionar headers de rate limit na resposta

- [ ] 12.3 Aplicar em todas as rotas públicas
  - [ ] 12.3.1 Adicionar em rotas de autenticação
  - [ ] 12.3.2 Adicionar em rotas de transações
  - [ ] 12.3.3 Adicionar em rotas de upload
  - [ ] 12.3.4 Testar limites em ambiente de staging

## Tarefas de Validação e Deploy

### 13. Testes e Validação

- [ ] 13.1 Executar suite de testes completa
  - [ ] 13.1.1 Rodar testes unitários
  - [ ] 13.1.2 Rodar testes de integração
  - [ ] 13.1.3 Rodar testes de performance

- [ ] 13.2 Validar em ambiente de staging
  - [ ] 13.2.1 Deploy em staging
  - [ ] 13.2.2 Testar fluxo completo de pagamento
  - [ ] 13.2.3 Testar webhooks
  - [ ] 13.2.4 Testar notificações
  - [ ] 13.2.5 Validar logs estruturados

- [ ] 13.3 Revisar métricas
  - [ ] 13.3.1 Verificar zero tipos `any`
  - [ ] 13.3.2 Verificar 100% variáveis validadas
  - [ ] 13.3.3 Medir tempo de resposta
  - [ ] 13.3.4 Medir hit rate do cache

### 14. Documentação e Deploy

- [ ] 14.1 Atualizar documentação
  - [ ] 14.1.1 Documentar novas funções utilitárias
  - [ ] 14.1.2 Atualizar guia de desenvolvimento
  - [ ] 14.1.3 Documentar mudanças em variáveis de ambiente

- [ ] 14.2 Deploy em produção
  - [ ] 14.2.1 Criar backup do banco de dados
  - [ ] 14.2.2 Deploy com feature flags
  - [ ] 14.2.3 Monitorar logs por 24h
  - [ ] 14.2.4 Validar métricas de sucesso
