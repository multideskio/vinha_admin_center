# Sistema de Monitoramento de Fraudes - Vinha Admin Center

## Visão Geral

Sistema completo de detecção, marcação e monitoramento de transações fraudulentas implementado no Vinha Admin Center.

## O que acontece quando uma transação é marcada como fraude?

### 1. Alterações na Transação

- **Status**: Muda para `'refused'`
- **Motivo de Reembolso**: Definido como "Marcada como fraude pelo administrador"
- **Marcação de Fraude**: `isFraud` = `true`
- **Data da Marcação**: `fraudMarkedAt` = timestamp atual
- **Responsável**: `fraudMarkedBy` = ID do admin que marcou
- **Motivo da Fraude**: `fraudReason` = "Transação identificada como fraudulenta pela administração"

### 2. Registro de Auditoria

- Todas as marcações de fraude são registradas permanentemente
- Incluem timestamp, responsável e motivo
- Não podem ser revertidas (ação irreversível)

## Funcionalidades Implementadas

### 1. **Estrutura de Banco de Dados**

```sql
-- Novos campos na tabela transactions
ALTER TABLE transactions
ADD COLUMN is_fraud BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN fraud_marked_at TIMESTAMP,
ADD COLUMN fraud_marked_by UUID REFERENCES users(id),
ADD COLUMN fraud_reason TEXT;

-- Índice para consultas de fraude
CREATE INDEX idx_transactions_fraud ON transactions(is_fraud, contributor_id) WHERE is_fraud = TRUE;
```

### 2. **API de Estatísticas de Fraude**

- **Endpoint**: `GET /api/v1/users/[id]/fraud-stats`
- **Funcionalidade**: Retorna estatísticas completas de fraude de um usuário
- **Dados Retornados**:
  - Total de transações fraudulentas
  - Valor total das fraudes
  - Percentual de fraude
  - Primeira e última data de fraude
  - Lista das transações fraudulentas

### 3. **Componente de Alerta de Fraude**

- **Arquivo**: `src/components/ui/fraud-alert.tsx`
- **Funcionalidade**: Exibe alertas visuais nos perfis dos usuários
- **Características**:
  - Níveis de risco (Alto, Médio, Baixo) baseados no percentual de fraude
  - Cores diferenciadas por nível de risco
  - Estatísticas resumidas
  - Lista de transações fraudulentas recentes
  - Links diretos para detalhes das transações

### 4. **Integração nos Perfis de Usuários**

Alertas de fraude adicionados em todas as páginas de perfil:

- **Pastores**: `src/app/admin/pastores/[id]/page.tsx`
- **Gerentes**: `src/app/admin/gerentes/[id]/page.tsx`
- **Supervisores**: `src/app/admin/supervisores/[id]/page.tsx`
- **Igrejas**: `src/app/admin/igrejas/[id]/page.tsx`
- **Administradores**: `src/app/admin/administradores/[id]/page.tsx`

### 5. **Melhorias na Página de Transações**

- **Seção de Alerta de Fraude**: Exibida quando uma transação é marcada como fraude
- **Botão Desabilitado**: "Marcar como Fraude" fica desabilitado se já foi marcada
- **Informações Detalhadas**: Data da marcação, responsável e motivo
- **API Atualizada**: `src/app/api/v1/transacoes/[id]/route.ts` inclui campos de fraude

## Níveis de Risco

### Alto Risco (≥50% de fraudes)

- **Cor**: Vermelho
- **Ação**: Monitoramento rigoroso, verificações adicionais obrigatórias

### Risco Médio (20-49% de fraudes)

- **Cor**: Laranja
- **Ação**: Monitoramento aumentado, verificações recomendadas

### Baixo Risco (<20% de fraudes)

- **Cor**: Amarelo
- **Ação**: Monitoramento padrão

## Como Monitorar Fraudes

### 1. **No Perfil do Contribuinte**

- Acesse qualquer perfil de usuário (pastor, gerente, supervisor, igreja, admin)
- O alerta de fraude aparece automaticamente se houver transações fraudulentas
- Visualize estatísticas resumidas e transações recentes

### 2. **Na Página da Transação**

- Acesse `/admin/transacoes/[id]`
- Veja se a transação foi marcada como fraude
- Visualize detalhes da marcação (data, responsável, motivo)

### 3. **Através da API**

```javascript
// Buscar estatísticas de fraude de um usuário
GET / api / v1 / users / [userId] / fraud - stats

// Buscar detalhes de uma transação (inclui dados de fraude)
GET / api / v1 / transacoes / [transactionId]
```

## Segurança e Auditoria

### Controle de Acesso

- Apenas **administradores** podem marcar transações como fraude
- **Administradores, gerentes e supervisores** podem visualizar estatísticas de fraude

### Registro de Auditoria

- Todas as marcações são registradas com:
  - Timestamp exato
  - ID do administrador responsável
  - Motivo da marcação
  - Dados da transação original

### Irreversibilidade

- Marcações de fraude são **permanentes**
- Não há funcionalidade para "desmarcar" uma fraude
- Garante integridade dos dados de auditoria

## Benefícios do Sistema

1. **Detecção Proativa**: Identificação rápida de padrões fraudulentos
2. **Monitoramento Contínuo**: Alertas visuais em todos os perfis
3. **Prevenção**: Identificação de usuários de alto risco
4. **Auditoria Completa**: Rastreabilidade total das marcações
5. **Interface Intuitiva**: Alertas visuais claros e informativos
6. **Integração Completa**: Funciona em todo o sistema sem impactar performance

## Próximos Passos Recomendados

1. **Dashboard de Fraudes**: Página dedicada com estatísticas gerais
2. **Alertas Automáticos**: Notificações quando padrões suspeitos são detectados
3. **Relatórios de Fraude**: Exportação de dados para análise externa
4. **Machine Learning**: Detecção automática baseada em padrões
5. **Integração com Gateway**: Marcação automática baseada em resposta da Cielo

## Arquivos Modificados/Criados

### Novos Arquivos

- `drizzle/0001_add_fraud_tracking.sql` - Migration do banco
- `src/app/api/v1/users/[id]/fraud-stats/route.ts` - API de estatísticas
- `src/app/api/v1/transacoes/[id]/route.ts` - API de transação individual
- `src/components/ui/fraud-alert.tsx` - Componente de alerta
- `docs/FRAUD_MONITORING_SYSTEM.md` - Esta documentação

### Arquivos Modificados

- `src/db/schema.ts` - Adicionados campos de fraude
- `src/app/api/v1/transacoes/[id]/fraud/route.ts` - Atualizada para novos campos
- `src/app/admin/transacoes/[id]/page.tsx` - Adicionada seção de fraude
- `src/app/admin/pastores/[id]/page.tsx` - Adicionado alerta de fraude
- `src/app/admin/gerentes/[id]/page.tsx` - Adicionado alerta de fraude
- `src/app/admin/supervisores/[id]/page.tsx` - Adicionado alerta de fraude
- `src/app/admin/igrejas/[id]/page.tsx` - Adicionado alerta de fraude
- `src/app/admin/administradores/[id]/page.tsx` - Adicionado alerta de fraude

## Conclusão

O sistema de monitoramento de fraudes está completamente implementado e integrado ao Vinha Admin Center. Ele fornece uma solução robusta para detecção, marcação e monitoramento de transações fraudulentas, com foco em segurança, auditoria e facilidade de uso.
