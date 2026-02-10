# Plano de Implementação: Melhorias no Sistema de Relatórios Financeiros

## Visão Geral

Implementação incremental das melhorias nos 6 endpoints de relatórios existentes. Cada tarefa constrói sobre a anterior, começando pela infraestrutura compartilhada (schemas, tipos, utilitários) e depois refatorando cada relatório individualmente.

## Tarefas

- [x] 1. Criar schemas Zod e utilitários de paginação
  - [x] 1.1 Criar `src/lib/schemas/report-schemas.ts` com schemas de validação para todos os 6 relatórios
    - Incluir `periodSchema` com refinements para data inicial < final e limite de 365 dias
    - Incluir `paginationSchema` com page >= 1, limit entre 1 e 100, defaults (page=1, limit=20)
    - Incluir schemas específicos: `financialReportSchema`, `contributionsReportSchema`, `membershipReportSchema`, `defaultersReportSchema`, `churchesReportSchema`, `generalReportSchema`
    - Mensagens de erro customizadas em pt-BR para cada validação
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 1.2 Criar `src/lib/report-services/types.ts` com interfaces compartilhadas
    - Interfaces: `PaginationParams`, `PaginationMeta`, `PaginatedResult<T>`
    - Função utilitária `buildPaginationMeta(page, limit, total)` que calcula totalPages, hasNext, hasPrev
    - _Requirements: 2.4, 2.5_

  - [ ]\* 1.3 Escrever testes de propriedade para schemas Zod
    - **Property 1: Validação de datas rejeita períodos inválidos**
    - **Validates: Requirements 1.2, 1.3**
    - **Property 2: Validação de paginação rejeita valores fora do intervalo**
    - **Validates: Requirements 1.4**
    - **Property 3: Validação de filtros rejeita valores não reconhecidos**
    - **Validates: Requirements 1.5**

  - [ ]\* 1.4 Escrever testes de propriedade para utilitários de paginação
    - **Property 4: Paginação respeita o limite de itens**
    - **Validates: Requirements 2.1, 2.2, 2.3**
    - **Property 5: Metadados de paginação são matematicamente consistentes**
    - **Validates: Requirements 2.4**

- [x] 2. Checkpoint - Validar infraestrutura base
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Refatorar relatório financeiro para camada de serviço
  - [x] 3.1 Criar `src/lib/report-services/financial-report.ts`
    - Extrair lógica de `src/app/api/v1/relatorios/financeiro/route.ts` para função `generateFinancialReport(companyId, params)`
    - Aplicar paginação server-side com LIMIT/OFFSET na query de transações
    - Manter query de summary (agregações por status e método) sem paginação
    - Retornar `FinancialReportResponse` tipado
    - _Requirements: 2.1, 3.3, 7.1, 7.2_

  - [x] 3.2 Refatorar `src/app/api/v1/relatorios/financeiro/route.ts`
    - Adicionar validação Zod com `financialReportSchema`
    - Adicionar rate limiting com `rateLimit('relatorio-financeiro', ip, 30, 60)`
    - Delegar ao serviço `generateFinancialReport()`
    - Adicionar audit log assíncrono com `logUserAction()`
    - Tratar erros Zod com mensagens em pt-BR
    - _Requirements: 1.1, 5.1, 6.1, 7.3, 8.1, 8.2_

- [x] 4. Refatorar relatório de contribuições para camada de serviço
  - [x] 4.1 Criar `src/lib/report-services/contributions-report.ts`
    - Extrair lógica de `src/app/api/v1/relatorios/contribuicoes/route.ts` para função `generateContributionsReport(companyId, params)`
    - Aplicar paginação server-side na lista de contribuintes
    - Manter top 10 e summaries sem paginação
    - _Requirements: 2.3, 7.1, 7.2_

  - [x] 4.2 Refatorar `src/app/api/v1/relatorios/contribuicoes/route.ts`
    - Adicionar validação Zod, rate limiting, audit log e tratamento de erros
    - _Requirements: 1.1, 5.1, 6.1, 7.3, 8.1, 8.2_

- [x] 5. Refatorar relatório de membresia para camada de serviço
  - [x] 5.1 Criar `src/lib/report-services/membership-report.ts`
    - Extrair lógica de `src/app/api/v1/relatorios/membresia/route.ts` para função `generateMembershipReport(companyId, params)`
    - Aplicar paginação server-side na lista de membros
    - Otimizar cálculo de crescimento mensal com GROUP BY SQL em vez de filtro em memória
    - _Requirements: 2.2, 3.2, 7.1, 7.2_

  - [x] 5.2 Refatorar `src/app/api/v1/relatorios/membresia/route.ts`
    - Adicionar validação Zod, rate limiting, audit log e tratamento de erros
    - _Requirements: 1.1, 5.1, 6.1, 7.3, 8.1, 8.2_

- [x] 6. Checkpoint - Validar relatórios refatorados
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Refatorar relatório de inadimplentes para camada de serviço
  - [x] 7.1 Criar `src/lib/report-services/defaulters-report.ts`
    - Extrair lógica de `src/app/api/v1/relatorios/inadimplentes/route.ts` para função `generateDefaultersReport(companyId, params)`
    - Otimizar cálculo de dias de atraso com SQL (EXTRACT DAY FROM) em vez de getDaysSince() em loop
    - Manter paginação existente (já funciona)
    - _Requirements: 3.1, 7.1, 7.2_

  - [x] 7.2 Refatorar `src/app/api/v1/relatorios/inadimplentes/route.ts`
    - Adicionar validação Zod com `defaultersReportSchema`, rate limiting, audit log e tratamento de erros
    - _Requirements: 1.1, 5.1, 6.1, 7.3, 8.1, 8.2_

- [x] 8. Refatorar relatório de igrejas para camada de serviço
  - [x] 8.1 Criar `src/lib/report-services/churches-report.ts`
    - Extrair lógica de `src/app/api/v1/relatorios/igrejas/route.ts` para função `generateChurchesReport(companyId, params)`
    - _Requirements: 7.1, 7.2_

  - [x] 8.2 Refatorar `src/app/api/v1/relatorios/igrejas/route.ts`
    - Adicionar validação Zod com `churchesReportSchema`, rate limiting, audit log e tratamento de erros
    - _Requirements: 1.1, 5.1, 6.1, 7.3, 8.1, 8.2_

- [x] 9. Refatorar relatório geral para camada de serviço
  - [x] 9.1 Criar `src/lib/report-services/general-report.ts`
    - Extrair lógica de `src/app/api/v1/relatorios/route.ts` para funções individuais por sub-tipo
    - Otimizar cálculos com agregações SQL em vez de reduce/filter em arrays
    - _Requirements: 3.3, 7.1, 7.2_

  - [x] 9.2 Refatorar `src/app/api/v1/relatorios/route.ts`
    - Adicionar validação Zod com `generalReportSchema`, rate limiting, audit log e tratamento de erros
    - _Requirements: 1.1, 5.1, 6.1, 7.3, 8.1, 8.2_

- [x] 10. Checkpoint - Validar todos os relatórios refatorados
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Garantir invalidação de cache completa
  - [x] 11.1 Verificar e completar invalidação de cache em `src/app/api/v1/transacoes/route.ts`
    - Confirmar que `invalidateCache('relatorio:*')` é chamado após criação de transação (já existe)
    - Adicionar invalidação de `relatorio:membresia:*` quando status de usuário muda (se não existir)
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]\* 11.2 Escrever teste de propriedade para invalidação de cache
    - **Property 6: Cache é invalidado após mutações de dados**
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [x] 12. Adicionar testes de rate limiting e auditoria
  - [ ]\* 12.1 Escrever teste de propriedade para rate limiting
    - **Property 7: Rate limiter respeita o threshold**
    - **Validates: Requirements 5.1**

  - [ ]\* 12.2 Escrever teste de propriedade para audit log
    - **Property 8: Audit log registra dados completos**
    - **Validates: Requirements 6.1, 6.2**

  - [ ]\* 12.3 Escrever teste de propriedade para mensagens de erro
    - **Property 9: Erros de validação retornam mensagens em pt-BR**
    - **Validates: Requirements 8.1**

- [x] 13. Checkpoint final - Validar tudo
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Revisar se os relátorios estão integrados com o frontend.

## Notas

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada tarefa referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Testes de propriedade validam propriedades universais de corretude
- Testes unitários validam exemplos específicos e edge cases
