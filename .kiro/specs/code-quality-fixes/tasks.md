# Tasks: Correção de Problemas Críticos de Qualidade de Código

## Fase 1 - Fundação (Semana 1)

- [x] 1. Criar `src/lib/env.ts` com validação Zod de variáveis de ambiente (CONCLUÍDO)

- [x] 2. Criar tipos explícitos em `src/lib/types.ts` (CONCLUÍDO)

- [x] 3. Criar `src/lib/logger.ts` com logging estruturado
  - Implementar classe `Logger` com métodos error/warn/info
  - Adicionar suporte a contexto (userId, operation, etc)
  - Integrar com `log-sanitizer.ts` (criar depois)
  - Exportar instância singleton

- [x] 4. Substituir `any` em rotas de supervisor (6 arquivos)
  - `src/app/api/v1/supervisor/transacoes/route.ts`
  - `src/app/api/v1/supervisor/transacoes/[id]/resend-receipt/route.ts`
  - `src/app/api/v1/supervisor/transacoes/[id]/route.ts`
  - `src/app/api/v1/supervisor/transacoes/[id]/sync/route.ts`
  - `src/app/api/v1/supervisor/igrejas/route.ts`
  - `src/app/api/v1/supervisor/igrejas/[id]/route.ts`

- [x] 5. Substituir `any` em rotas de pastor (4 arquivos)
  - `src/app/api/v1/pastor/perfil/route.ts`
  - `src/app/api/v1/pastor/transacoes/route.ts`
  - `src/app/api/v1/pastor/dashboard/route.ts`
  - `src/app/api/v1/pastor/transacoes/[id]/route.ts`

- [x] 6. Substituir `any` em rotas de igreja (4 arquivos)
  - `src/app/api/v1/igreja/transacoes/route.ts`
  - `src/app/api/v1/igreja/perfil/route.ts`
  - `src/app/api/v1/igreja/dashboard/route.ts`
  - `src/app/api/v1/igreja/transacoes/[id]/route.ts`

- [x] 7. Substituir `any` em `src/lib/notifications.ts`
  - Atualizar tipo de `smtpTransporter` para `SmtpTransporter`
  - Importar tipo de `@/lib/types`

- [x] 8. Substituir `process.env` por `env` em arquivos críticos
  - `src/lib/cielo.ts`
  - `src/lib/email.ts`
  - `src/app/api/v1/transacoes/route.ts`
  - `src/app/api/v1/webhooks/cielo/route.ts`
  - Buscar e atualizar todas as rotas que usam `COMPANY_INIT`
  - Buscar e atualizar todas as rotas que usam `DEFAULT_PASSWORD`

- [x] 9. Adicionar validação de env no startup
  - Importar `env` em `src/app/layout.tsx`
  - Adicionar error boundary para erros de validação
  - Exibir mensagem clara se variável estiver faltando

## Fase 2 - Segurança (Semana 2)

- [x] 10. Criar `src/lib/payment-guard.ts` para verificação de duplicação
  - Implementar função `checkDuplicatePayment(userId, amount, windowMinutes)`
  - Verificar transações pendentes/aprovadas nos últimos N minutos
  - Retornar objeto com `isDuplicate` e `existingTransaction`

- [x] 11. Integrar verificação de duplicação em `POST /api/v1/transacoes`
  - Adicionar verificação antes de criar pagamento
  - Retornar erro 409 (Conflict) se duplicação detectada
  - Incluir ID da transação existente na resposta de erro
  - Adicionar logs estruturados para tentativas de duplicação

- [x] 12. Criar `src/lib/log-sanitizer.ts` para sanitização de logs
  - Implementar função `sanitizeLog(data)` que mascara dados sensíveis
  - Adicionar padrões regex para CPF, cartão, CVV, senha, token
  - Implementar função `safeLog(message, data)` como wrapper

- [x] 13. Integrar sanitização em código crítico
  - Atualizar logs em `src/lib/cielo.ts` (nunca logar dados de cartão)
  - Atualizar logs em `src/app/api/v1/transacoes/route.ts`
  - Atualizar logs em `src/lib/notifications.ts`
  - Revisar todos os `console.log()` em rotas de API

- [x] 14. Criar `src/lib/upload-validator.ts` para validação de uploads
  - Implementar função `validateUpload(file, filename, mimeType)`
  - Definir tipos MIME permitidos (image/jpeg, image/png, image/webp, application/pdf)
  - Definir tamanho máximo (10MB = 10 _ 1024 _ 1024 bytes)
  - Adicionar validação de extensão (jpg, jpeg, png, webp, pdf)
  - Retornar objeto com `valid` e `error` opcional

- [x] 15. Integrar validação de uploads em `src/lib/s3-client.ts`
  - Importar `validateUpload` em método `uploadFile()`
  - Adicionar validação antes de enviar ao S3
  - Lançar erro descritivo se validação falhar
  - Adicionar sanitização de nome de arquivo (remover caracteres especiais)

## Fase 3 - Performance (Semana 3)

- [x] 16. Refatorar queries sem `.limit()` identificadas
  - `src/app/api/v1/supervisor/pastores/[id]/route.ts` (linha 29)
  - `src/app/api/v1/supervisor/igrejas/[id]/route.ts` (linha 28)
  - `src/app/api/v1/manager/igrejas/[id]/route.ts` (linha 32)
  - `src/app/api/v1/manager/pastores/[id]/route.ts` (linha 34)

- [x] 17. Refatorar `GET /api/v1/transacoes` para eliminar N+1 queries
  - Analisar query atual que busca perfis em loop (N+1)
  - Criar query otimizada usando LEFT JOIN para todos os perfis
  - Testar performance antes/depois com dataset grande
  - Adicionar índices no banco se necessário (foreign keys)

- [x] 18. Identificar e refatorar outras rotas com N+1 queries
  - Buscar padrões de `Promise.all` com queries em loop
  - Analisar rotas de listagem (GET com múltiplos registros)
  - Refatorar queries identificadas para usar JOIN

- [x] 19. Criar `src/lib/config-cache.ts` para cache de configurações
  - Implementar classe `ConfigCache` com Map interno
  - Adicionar métodos `get<T>(key)`, `set<T>(key, data)`, `invalidate(key)`
  - Configurar TTL de 5 minutos (300000ms)
  - Exportar instância singleton `configCache`

- [x] 20. Integrar cache em `src/lib/cielo.ts`
  - Importar `configCache` em função `getCieloConfig()`
  - Verificar cache antes de buscar no banco
  - Armazenar resultado no cache após busca
  - Invalidar cache quando configuração for atualizada (rota de update)

- [x] 21. Integrar cache em `src/lib/notifications.ts`
  - Adicionar cache em `NotificationService.createFromDatabase()`
  - Verificar cache antes de buscar configurações SMTP/WhatsApp
  - Invalidar cache quando configuração for atualizada

## Fase 4 - Resiliência (Semana 4)

- [x] 22. Criar `src/lib/webhook-reconciliation.ts` para reconciliação de webhooks
  - Implementar função `reconcileTransactionState(transactionId, webhookStatus)`
  - Verificar se transação existe antes de processar
  - Implementar lógica de reconciliação se estados divergirem
  - Adicionar lógica de retry com backoff exponencial
  - Adicionar logs estruturados para debug

- [x] 23. Integrar reconciliação em `src/app/api/v1/webhooks/cielo/route.ts`
  - Importar função de reconciliação
  - Adicionar tratamento de webhook early arrival (chegou antes da transação)
  - Implementar retry se transação não existir ainda

- [-] 24. Criar `src/lib/notification-dedup.ts` para deduplicação de notificações
  - Implementar função `shouldSendNotification(userId, notificationType, windowHours)`
  - Verificar em `notificationLogs` se notificação já foi enviada
  - Configurar janela de deduplicação (24h padrão)
  - Retornar boolean indicando se deve enviar

- [~] 25. Integrar deduplicação em `src/lib/notification-hooks.ts`
  - Adicionar verificação antes de enviar notificações
  - Aplicar em `onTransactionCreated` e `processNotificationEvent`
  - Logar tentativas de duplicação (warning level)

- [~] 26. Aplicar rate limiting em todas as rotas públicas
  - Verificar rotas de autenticação (login, registro, reset password)
  - Verificar rotas de transações (já tem rate limiting)
  - Verificar rotas de upload
  - Testar limites em ambiente de staging

## Tarefas de Validação e Deploy

- [~] 27. Executar suite de testes completa
  - Rodar testes unitários (`npm test`)
  - Rodar testes de integração
  - Rodar testes de performance (comparar antes/depois)

- [~] 28. Validar em ambiente de staging
  - Deploy em staging
  - Testar fluxo completo de pagamento (PIX, cartão, boleto)
  - Testar webhooks da Cielo
  - Testar notificações (email e WhatsApp)
  - Validar logs estruturados (verificar se dados sensíveis estão mascarados)

- [~] 29. Revisar métricas de sucesso
  - Verificar zero tipos `any` no código (`npm run build` sem warnings)
  - Verificar 100% variáveis validadas (todas usando `env`)
  - Medir tempo de resposta médio das APIs (< 200ms)
  - Medir hit rate do cache de configurações (> 80%)

- [~] 30. Atualizar documentação
  - Documentar novas funções utilitárias em README ou docs/
  - Atualizar guia de desenvolvimento com novos padrões
  - Documentar mudanças em variáveis de ambiente (.env.example)
  - Criar CHANGELOG.md com todas as mudanças

- [~] 31. Deploy em produção
  - Criar backup do banco de dados
  - Deploy com feature flags (se aplicável)
  - Monitorar logs por 24h após deploy
  - Validar métricas de sucesso em produção
  - Preparar plano de rollback se necessário

## Resumo de Progresso

### ✅ Concluído

- Arquivo `src/lib/env.ts` com validação Zod
- Tipos `SessionUser` e `SmtpTransporter` em `src/lib/types.ts`
- Rate limiting com Redis em `src/lib/rate-limit.ts`

### 🚧 Em Progresso

- Nenhuma tarefa em progresso no momento

### ⏳ Pendente

- Substituir todos os tipos `any` (14 arquivos identificados)
- Criar logger estruturado com sanitização
- Implementar verificação de duplicação de pagamentos
- Implementar validação de uploads
- Otimizar queries N+1
- Implementar cache de configurações
- Implementar reconciliação de webhooks
- Implementar deduplicação de notificações

### 📊 Métricas de Sucesso

- **Tipos `any`**: 14 ocorrências → Meta: 0
- **Variáveis validadas**: ~30% → Meta: 100%
- **Queries otimizadas**: 0 → Meta: 100% das queries críticas
- **Cache hit rate**: 0% → Meta: > 80%
- **Tempo de resposta**: ~300ms → Meta: < 200ms
