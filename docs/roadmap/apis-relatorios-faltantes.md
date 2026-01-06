# APIs de Relatórios Faltantes - Roadmap v0.4.0

## Visão Geral

Durante a auditoria de segurança do sistema de relatórios, identificamos que **4 páginas de relatórios possuem frontend completo mas as APIs backend não foram implementadas**. Estas páginas estão atualmente não funcionais.

## Status Atual

### ✅ Implementado

- `/api/v1/relatorios` - Relatórios gerais (5 tipos)
- `/api/v1/relatorios/inadimplentes` - Relatório de inadimplentes
- `/api/v1/relatorios/contribuicoes` - Relatório de contribuições ✅ **CONCLUÍDO**
- `/api/v1/relatorios/financeiro` - Relatório financeiro ✅ **CONCLUÍDO**
- `/api/v1/relatorios/igrejas` - Relatório de igrejas ✅ **CONCLUÍDO**
- `/api/v1/relatorios/membresia` - Relatório de membresia ✅ **CONCLUÍDO**

### ❌ Não Implementado

**Nenhuma API pendente - Todas implementadas com sucesso!**

## Impacto no Usuário

**Severidade: RESOLVIDA** ✅ - Todas as páginas de relatórios estão funcionais e operacionais.

### Funcionalidades Implementadas

- ✅ Análise detalhada de contribuições por tipo
- ✅ Relatórios financeiros com filtros avançados
- ✅ Performance de igrejas por supervisor
- ✅ Dados demográficos de membresia

## Plano de Implementação

### Fase 1: APIs Críticas (Semana 1)

**Prioridade: CRÍTICA**

#### 1.1 API de Contribuições

- **Arquivo**: `src/app/api/v1/relatorios/contribuicoes/route.ts`
- **Funcionalidades**:
  - Filtros: período, tipo de contribuinte
  - Top 10 contribuintes
  - Resumo por método de pagamento
  - Resumo por tipo de contribuinte
  - Export CSV
- **Estimativa**: 6 horas

#### 1.2 API Financeira

- **Arquivo**: `src/app/api/v1/relatorios/financeiro/route.ts`
- **Funcionalidades**:
  - Filtros: período, método, status
  - KPIs por status (aprovado, pendente, recusado, reembolsado)
  - Agrupamento por método de pagamento
  - Paginação (50 itens por página)
  - Export CSV
- **Estimativa**: 6 horas

### Fase 2: APIs Complementares (Semana 2)

**Prioridade: ALTA**

#### 2.1 API de Igrejas

- **Arquivo**: `src/app/api/v1/relatorios/igrejas/route.ts`
- **Funcionalidades**:
  - Filtros: período, região
  - Agrupamento por região
  - Performance individual de igrejas
  - Última contribuição por igreja
  - Paginação (20 itens por página)
  - Export CSV
- **Estimativa**: 8 horas

#### 2.2 API de Membresia

- **Arquivo**: `src/app/api/v1/relatorios/membresia/route.ts`
- **Funcionalidades**:
  - Filtros: tipo de membro
  - Dados de crescimento (6 meses)
  - Distribuição por role
  - Membros recentes
  - Paginação (20 itens por página)
  - Export CSV
- **Estimativa**: 8 horas

## Especificações Técnicas

### Padrões de Implementação

#### Segurança

```typescript
// Validação admin obrigatória
const { user } = await validateRequest()
if (!user || (user.role as UserRole) !== 'admin') {
  return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
}
```

#### Filtros por Empresa

```typescript
// Todas as consultas devem filtrar por companyId
const whereClause = and(
  eq(table.companyId, user.companyId),
  // outros filtros...
)
```

#### Estrutura de Resposta

```typescript
type RelatorioResponse = {
  // Dados principais
  [dataKey]: DataType[]

  // Resumo/KPIs
  summary: {
    [key: string]: number | string
  }

  // Período aplicado
  period: {
    from: string
    to: string
  }

  // Dados adicionais (opcional)
  [additionalKey]?: AdditionalType[]
}
```

### Queries de Exemplo

#### Contribuições

```sql
SELECT
  u.id,
  COALESCE(pp.firstName || ' ' || pp.lastName, cp.nomeFantasia) as name,
  u.role as type,
  SUM(t.amount) as totalAmount,
  COUNT(t.id) as contributionCount,
  MAX(t.createdAt) as lastContribution
FROM users u
LEFT JOIN pastorProfiles pp ON u.id = pp.userId
LEFT JOIN churchProfiles cp ON u.id = cp.userId
LEFT JOIN transactions t ON u.id = t.contributorId AND t.status = 'approved'
WHERE u.companyId = ? AND u.deletedAt IS NULL
GROUP BY u.id
ORDER BY totalAmount DESC
```

#### Financeiro

```sql
SELECT
  t.id,
  COALESCE(pp.firstName || ' ' || pp.lastName, cp.nomeFantasia) as contributorName,
  u.role as contributorRole,
  t.amount,
  t.paymentMethod as method,
  t.status,
  t.createdAt as date
FROM transactions t
JOIN users u ON t.contributorId = u.id
LEFT JOIN pastorProfiles pp ON u.id = pp.userId
LEFT JOIN churchProfiles cp ON u.id = cp.userId
WHERE t.companyId = ?
ORDER BY t.createdAt DESC
```

## Critérios de Aceitação

### Funcionalidade

- [x] Todas as 4 APIs implementadas e funcionais
- [x] Filtros funcionando conforme frontend
- [x] Paginação implementada onde necessário
- [x] Export CSV funcional
- [x] Dados consistentes com outras APIs

### Segurança

- [x] Validação admin obrigatória
- [x] Filtros por companyId aplicados
- [x] Comentários de revisão adicionados
- [x] Rate limiting aplicado

### Qualidade

- [x] TypeScript: 0 erros
- [x] ESLint: 0 problemas
- [x] Testes unitários (opcional)
- [x] Documentação atualizada

## Cronograma

| Semana | Atividade                       | Responsável | Status       |
| ------ | ------------------------------- | ----------- | ------------ |
| 1      | APIs Contribuições + Financeiro | Dev Team    | ✅ Concluído |
| 2      | APIs Igrejas + Membresia        | Dev Team    | ✅ Concluído |
| 3      | Testes e Refinamentos           | QA Team     | ✅ Concluído |
| 4      | Deploy e Validação              | DevOps      | ✅ Concluído |

## Riscos e Mitigações

### Risco: Performance em Grandes Volumes

- **Mitigação**: Implementar paginação e índices adequados
- **Monitoramento**: Queries com mais de 2s devem ser otimizadas

### Risco: Inconsistência de Dados

- **Mitigação**: Usar mesmas queries base das APIs existentes
- **Validação**: Comparar totais com dashboard admin

### Risco: Sobrecarga do Banco

- **Mitigação**: Implementar cache Redis para relatórios pesados
- **Limite**: Máximo 1000 registros por consulta

## Métricas de Sucesso

### Técnicas

- **Tempo de resposta**: < 2s para consultas padrão
- **Disponibilidade**: 99.9% uptime
- **Erro rate**: < 0.1%

### Negócio

- **Uso**: 100% das páginas de relatórios funcionais
- **Satisfação**: Feedback positivo dos admins
- **Produtividade**: Redução de 80% em tickets de suporte

## Notas de Implementação

### Priorização

1. **Contribuições** - Mais usado pelos admins
2. **Financeiro** - Crítico para auditoria
3. **Igrejas** - Importante para gestão regional
4. **Membresia** - Útil para análise de crescimento

### Considerações Especiais

- Usar biblioteca `date-fns` para formatação de datas
- Implementar cache de 5 minutos para relatórios pesados
- Logs detalhados para debugging
- Validação de parâmetros com Zod

---

**Documento criado em**: 2026-01-05  
**Última atualização**: 2026-01-05  
**Versão**: 2.0  
**Status**: ✅ **IMPLEMENTAÇÃO CONCLUÍDA**

## Resumo da Implementação

Todas as 4 APIs de relatórios foram implementadas com sucesso:

1. **API de Contribuições** (`/api/v1/relatorios/contribuicoes`) - ✅ Funcional
   - Top 10 contribuintes, filtros por período/tipo, resumos por método
2. **API Financeira** (`/api/v1/relatorios/financeiro`) - ✅ Funcional
   - KPIs por status, filtros avançados, paginação
3. **API de Igrejas** (`/api/v1/relatorios/igrejas`) - ✅ Funcional
   - Agrupamento por supervisor, performance individual, filtros por região
4. **API de Membresia** (`/api/v1/relatorios/membresia`) - ✅ Funcional
   - Dados de crescimento, distribuição por role, membros recentes

**Resultado**: Sistema de relatórios 100% funcional e operacional.
