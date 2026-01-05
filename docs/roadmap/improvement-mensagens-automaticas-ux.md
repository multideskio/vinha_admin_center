# UX - Melhorias na Experiência do Usuário - Sistema de Mensagens Automáticas

## 🎯 Objetivo

Aprimorar a experiência do usuário (UX) no sistema de mensagens automáticas (`/admin/configuracoes/mensagens`), implementando funcionalidades avançadas, melhor visualização e recursos de produtividade para administradores.

## 📋 Escopo

- [ ] Implementar preview de mensagens em tempo real
- [ ] Adicionar validação inteligente de variáveis
- [ ] Criar histórico de execuções das regras
- [ ] Implementar sistema de duplicação de regras
- [ ] Adicionar filtros e ordenação na tabela
- [ ] Melhorar feedback visual e micro-interações
- [ ] Implementar templates pré-definidos por categoria

## 🔧 Implementação

### 1. Preview de Mensagens em Tempo Real

**Arquivos a modificar:**

- `src/app/admin/configuracoes/mensagens/page.tsx`

**Funcionalidade:**

```typescript
// Componente de preview que mostra a mensagem renderizada
const MessagePreview = ({ template, eventType }: { template: string; eventType: string }) => {
  const sampleData = {
    nome_usuario: 'João Silva',
    data_vencimento: '15/02/2024',
    link_pagamento: 'https://exemplo.com/pagar/123',
    nome_igreja: 'Igreja Exemplo',
    valor_transacao: 'R$ 150,00'
  }

  const renderedMessage = TemplateEngine.processTemplate(template, sampleData)

  return (
    <div className="bg-muted p-4 rounded-lg border-l-4 border-l-videira-blue">
      <h4 className="font-semibold mb-2">Preview da Mensagem:</h4>
      <p className="text-sm whitespace-pre-wrap">{renderedMessage}</p>
    </div>
  )
}
```

### 2. Validação Inteligente de Variáveis

**Funcionalidade:**

- Detectar variáveis não suportadas para cada tipo de evento
- Sugerir variáveis corretas automaticamente
- Highlight de variáveis válidas/inválidas no editor

```typescript
const validateVariables = (template: string, eventType: string) => {
  const allowedVariables = {
    payment_due_reminder: [
      '{nome_usuario}',
      '{data_vencimento}',
      '{link_pagamento}',
      '{nome_igreja}',
    ],
    payment_received: ['{nome_usuario}', '{valor_transacao}', '{data_pagamento}', '{nome_igreja}'],
    payment_overdue: ['{nome_usuario}', '{data_vencimento}', '{nome_igreja}'],
    user_registered: ['{nome_usuario}', '{nome_igreja}'],
  }

  // Lógica de validação e sugestões
}
```

### 3. Histórico de Execuções

**Arquivos a criar:**

- `src/app/api/v1/notification-rules/[id]/stats/route.ts`
- Componente `RuleStatsModal`

**Funcionalidade:**

```typescript
interface RuleStats {
  totalExecutions: number
  successfulSends: number
  failedSends: number
  lastExecution: Date
  executionHistory: Array<{
    date: Date
    recipientCount: number
    successCount: number
    failureCount: number
  }>
}
```

### 4. Sistema de Duplicação de Regras

**Funcionalidade:**

- Botão "Duplicar" na tabela de regras
- Modal de confirmação com possibilidade de editar nome
- Cópia completa da regra com novo ID

```typescript
const duplicateRule = async (originalRule: NotificationRule) => {
  const duplicatedRule = {
    ...originalRule,
    id: undefined, // Novo ID será gerado
    name: `${originalRule.name} (Cópia)`,
    isActive: false, // Inicia desativada por segurança
  }

  // Lógica de duplicação
}
```

### 5. Filtros e Ordenação na Tabela

**Funcionalidades:**

- Filtro por tipo de evento
- Filtro por status (ativa/inativa)
- Filtro por canal (email/whatsapp)
- Ordenação por nome, data de criação, última execução
- Busca por nome da regra

```typescript
const TableFilters = () => (
  <div className="flex gap-4 mb-4">
    <Select placeholder="Filtrar por evento">
      <SelectItem value="all">Todos os eventos</SelectItem>
      <SelectItem value="payment_due_reminder">Lembrete de Vencimento</SelectItem>
      {/* ... outros filtros */}
    </Select>

    <Select placeholder="Status">
      <SelectItem value="all">Todos</SelectItem>
      <SelectItem value="active">Ativas</SelectItem>
      <SelectItem value="inactive">Inativas</SelectItem>
    </Select>

    <Input placeholder="Buscar por nome..." />
  </div>
)
```

### 6. Templates Pré-definidos por Categoria

**Funcionalidade:**

- Biblioteca de templates prontos por categoria
- Templates para diferentes tons (formal, casual, urgente)
- Templates específicos por tipo de igreja/organização

```typescript
const predefinedTemplates = {
  payment_due_reminder: {
    formal:
      'Prezado(a) {nome_usuario}, informamos que sua contribuição de {valor_transacao} vence em {data_vencimento}.',
    casual: 'Oi {nome_usuario}! Só lembrando que sua contribuição vence em {data_vencimento} 😊',
    urgent:
      '⚠️ {nome_usuario}, sua contribuição vence HOJE ({data_vencimento}). Não perca o prazo!',
  },
  // ... outros tipos
}
```

### 7. Melhorias de Micro-interações

**Funcionalidades:**

- Animações suaves para modais e transições
- Loading states mais elaborados
- Confirmações visuais para ações
- Tooltips informativos
- Drag & drop para reordenar regras

## 📊 Métricas de Sucesso

### Quantitativas

- **Tempo de criação de regra**: Reduzir de 3min para 1min
- **Taxa de erro na criação**: Reduzir de 15% para 5%
- **Uso do preview**: 80% dos usuários utilizem o preview
- **Duplicação de regras**: 60% das novas regras sejam duplicadas

### Qualitativas

- **Satisfação do usuário**: Score NPS > 8
- **Facilidade de uso**: Redução de tickets de suporte
- **Adoção de funcionalidades**: 70% usem filtros e histórico

## 🗓️ Cronograma

### Fase 1 - Funcionalidades Core (Semana 1-2)

- [ ] Preview de mensagens em tempo real
- [ ] Validação inteligente de variáveis
- [ ] Sistema de duplicação de regras

### Fase 2 - Produtividade (Semana 3)

- [ ] Filtros e ordenação na tabela
- [ ] Histórico de execuções
- [ ] Templates pré-definidos

### Fase 3 - Polimento UX (Semana 4)

- [ ] Micro-interações e animações
- [ ] Tooltips e ajudas contextuais
- [ ] Testes de usabilidade e ajustes

## 🎨 Design System

Manter consistência com o **Design System Videira**:

- Cores: videira-blue, videira-cyan, videira-purple
- Componentes: shadcn/ui + customizações Videira
- Tipografia: Inter com pesos adequados
- Espaçamentos: Sistema de grid 4px
- Animações: Transições suaves (200-300ms)

## 🔍 Considerações Técnicas

### Performance

- Lazy loading para histórico de execuções
- Debounce para preview em tempo real (300ms)
- Virtualização para listas grandes de regras

### Acessibilidade

- ARIA labels para todos os controles
- Navegação por teclado completa
- Contraste adequado (WCAG 2.1 AA)
- Screen reader friendly

### Compatibilidade

- Responsivo para mobile/tablet
- Suporte a navegadores modernos
- Fallbacks para funcionalidades avançadas

## 📝 Notas de Implementação

1. **Prioridade Alta**: Preview e validação de variáveis (impacto direto na produtividade)
2. **Prioridade Média**: Filtros e duplicação (melhoria de workflow)
3. **Prioridade Baixa**: Micro-interações (polimento visual)

4. **Dependências**:
   - Sistema de logs já implementado
   - APIs de notification-rules funcionais
   - TemplateEngine para processamento

5. **Riscos**:
   - Preview em tempo real pode impactar performance
   - Histórico de execuções pode gerar volume de dados
   - Complexidade adicional no frontend

---

**Versão**: 0.4.0  
**Estimativa**: 4 semanas  
**Responsável**: Equipe Frontend  
**Status**: Planejado  
**Prioridade**: Média
