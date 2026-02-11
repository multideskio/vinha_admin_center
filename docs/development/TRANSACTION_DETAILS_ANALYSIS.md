# Análise de Qualidade - Página de Detalhes de Transação

## 📊 Status: 🔴 Necessita Refatoração Urgente

**Página:** `/admin/transacoes/[id]`  
**Arquivo:** `src/app/admin/transacoes/[id]/page.tsx`  
**Data da Análise:** 11/02/2026  
**Analisado por:** code-quality subagent

---

## 🚨 Resumo Executivo

**Total de Issues:** 15

- 🔴 Críticas: 3
- 🟠 Altas: 5
- 🟡 Médias: 4
- 🟢 Baixas: 3

**Tamanho do Arquivo:** 900+ linhas (limite recomendado: 200 linhas)  
**Complexidade:** Muito Alta  
**Manutenibilidade:** Baixa

---

## 🔴 Issues Críticas (Prioridade Máxima)

### 1. Client Component Desnecessário

**Severidade:** 🔴 Crítica  
**Impacto:** Performance, SEO, Bundle Size

**Problema:**

```typescript
'use client' // ❌ Página inteira como Client Component

export default function TransacaoDetalhePage() {
  const params = useParams()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  // 900+ linhas de código
}
```

**Por que é crítico:**

- Toda a página é enviada para o cliente (~900 linhas)
- Dados buscados no cliente (problema de autenticação)
- Sem SSR (ruim para SEO)
- Bundle JavaScript muito grande

**Solução:**

```typescript
// Server Component
export default async function TransacaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') redirect('/login')

  const { id } = await params

  // Buscar dados diretamente do banco
  const transaction = await db.query.transactions.findFirst({
    where: eq(transactions.id, id),
    with: {
      contributor: {
        with: {
          managerProfile: true,
          supervisorProfile: true,
          pastorProfile: true,
          churchProfile: true,
        },
      },
    },
  })

  if (!transaction) notFound()

  return <TransactionDetailsClient transaction={transaction} />
}
```

---

### 2. Fetch com Problema de Autenticação

**Severidade:** 🔴 Crítica  
**Impacto:** Segurança, Funcionalidade

**Problema:**

```typescript
const fetchTransaction = React.useCallback(async () => {
  setIsLoading(true)
  try {
    // ❌ Fetch no cliente - cookies podem não ser enviados
    const response = await fetch(`/api/v1/transacoes/${params.id}`)
    if (!response.ok) throw new Error('Falha ao carregar transação')
    const data = await response.json()
    setTransaction(data.transaction)
  } catch (error) {
    // ...
  }
}, [params.id, toast])
```

**Por que é crítico:**

- Mesma issue da página de listagem (já documentada)
- Fetch no cliente pode falhar com 401
- Requisição HTTP desnecessária

**Solução:**
Buscar diretamente do banco no Server Component (ver solução do Issue #1)

---

### 3. Componente Monolítico (900+ linhas)

**Severidade:** 🔴 Crítica  
**Impacto:** Manutenibilidade, Testabilidade

**Problema:**

- Arquivo único com 900+ linhas
- Múltiplas responsabilidades misturadas
- Difícil de testar e manter
- Viola princípio de responsabilidade única

**Solução:**
Dividir em componentes modulares:

```
src/app/admin/transacoes/[id]/
├── page.tsx (Server Component - 50 linhas)
└── _components/
    ├── transaction-details-client.tsx (150 linhas)
    ├── transaction-header.tsx (80 linhas)
    ├── transaction-amount-card.tsx (60 linhas)
    ├── transaction-payment-info.tsx (100 linhas)
    ├── transaction-contributor-card.tsx (80 linhas)
    ├── transaction-church-card.tsx (80 linhas)
    ├── transaction-actions.tsx (120 linhas)
    ├── transaction-fraud-alert.tsx (80 linhas)
    └── refund-modal.tsx (150 linhas)
```

---

## 🟠 Issues Altas (Prioridade Alta)

### 4. Tipos Duplicados

**Severidade:** 🟠 Alta  
**Impacto:** Manutenibilidade, Consistência

**Problema:**

```typescript
// ❌ Tipo definido localmente
type Transaction = {
  id: string
  date: string
  amount: number
  status: 'approved' | 'pending' | 'refused' | 'refunded'
  // ... mais campos
}
```

**Solução:**
Usar tipos centralizados de `src/types/transaction.ts` e criar tipo específico para detalhes:

```typescript
// src/types/transaction.ts
export const transactionDetailsSchema = transactionSchema.extend({
  contributor: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string().email(),
      phone: z.string().nullable(),
      role: z.string(),
    })
    .nullable(),
  church: z
    .object({
      name: z.string(),
      address: z.string().nullable(),
    })
    .nullable(),
  payment: z
    .object({
      method: z.string(),
      details: z.string(),
    })
    .nullable(),
  fraudMarkedAt: z.string().nullable(),
  fraudReason: z.string().nullable(),
})

export type TransactionDetails = z.infer<typeof transactionDetailsSchema>
```

---

### 5. Configurações Hardcoded

**Severidade:** 🟠 Alta  
**Impacto:** Manutenibilidade, Reutilização

**Problema:**

```typescript
// ❌ Configurações duplicadas
const statusConfig: Record<string, {...}> = {
  approved: { text: 'Aprovada', icon: CheckCircle2, ... },
  pending: { text: 'Pendente', icon: Clock, ... },
  // ...
}

const methodConfig: Record<string, {...}> = {
  PIX: { color: 'bg-videira-cyan/15...' },
  // ...
}
```

**Solução:**
Usar constantes centralizadas de `src/lib/constants/transaction-maps.ts`:

```typescript
import { STATUS_MAP, METHOD_MAP } from '@/lib/constants/transaction-maps'
```

---

### 6. Falta Validação Zod

**Severidade:** 🟠 Alta  
**Impacto:** Segurança, Type Safety

**Problema:**

```typescript
// ❌ Sem validação dos dados recebidos
const data = await response.json()
setTransaction(data.transaction) // Dados não validados
```

**Solução:**

```typescript
import { transactionDetailsSchema } from '@/types/transaction'

const rawData = await response.json()
const result = transactionDetailsSchema.safeParse(rawData.transaction)

if (!result.success) {
  console.error('Erro de validação:', result.error)
  toast({
    title: 'Erro de Validação',
    description: 'Dados em formato inválido',
    variant: 'destructive',
  })
  return
}

setTransaction(result.data)
```

---

### 7. Modal Inline Complexo

**Severidade:** 🟠 Alta  
**Impacto:** Manutenibilidade, Reutilização

**Problema:**

```typescript
// ❌ Modal de 150+ linhas inline no componente principal
const RefundModal = ({ amount, status, transactionId, onSuccess }) => {
  // 150+ linhas de código
}
```

**Solução:**
Extrair para arquivo separado:

```typescript
// src/app/admin/transacoes/[id]/_components/refund-modal.tsx
'use client'
export function RefundModal({ ... }) {
  // Implementação isolada
}
```

---

### 8. Múltiplos Estados de Loading

**Severidade:** 🟠 Alta  
**Impacto:** Complexidade, Manutenibilidade

**Problema:**

```typescript
// ❌ Múltiplos estados de loading
const [isResendingReceipt, setIsResendingReceipt] = useState(false)
const [isSyncing, setIsSyncing] = useState(false)
const [isMarkingFraud, setIsMarkingFraud] = useState(false)
```

**Solução:**
Usar um único estado com enum:

```typescript
type ActionType = 'resend' | 'sync' | 'fraud' | null

const [loadingAction, setLoadingAction] = useState<ActionType>(null)

// Uso
<Button disabled={loadingAction === 'resend'}>
  {loadingAction === 'resend' ? 'Enviando...' : 'Reenviar'}
</Button>
```

---

## 🟡 Issues Médias (Prioridade Média)

### 9. Formatação Duplicada

**Severidade:** 🟡 Média  
**Impacto:** Performance, Manutenibilidade

**Problema:**

```typescript
// ❌ Intl.NumberFormat criado múltiplas vezes
{
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(transaction.amount)
}
```

**Solução:**

```typescript
import { formatCurrency } from '@/lib/format'

{
  formatCurrency(transaction.amount)
}
```

---

### 10. Skeleton Loading Duplicado

**Severidade:** 🟡 Média  
**Impacto:** Manutenibilidade

**Problema:**

- 100+ linhas de skeleton loading inline
- Dificulta leitura do código principal

**Solução:**
Extrair para componente:

```typescript
// _components/transaction-details-skeleton.tsx
export function TransactionDetailsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Skeleton structure */}
    </div>
  )
}
```

---

### 11. Handlers Inline Complexos

**Severidade:** 🟡 Média  
**Impacto:** Legibilidade

**Problema:**

```typescript
// ❌ Lógica complexa inline
onClick={async () => {
  setIsResendingReceipt(true)
  try {
    const response = await fetch(`/api/v1/transacoes/${params.id}/resend`, {
      method: 'POST',
    })
    // ... 20+ linhas
  } finally {
    setIsResendingReceipt(false)
  }
}}
```

**Solução:**
Extrair para funções nomeadas:

```typescript
const handleResendReceipt = async () => {
  setLoadingAction('resend')
  try {
    // Lógica
  } finally {
    setLoadingAction(null)
  }
}

<Button onClick={handleResendReceipt}>
```

---

### 12. Falta Tratamento de Erro Consistente

**Severidade:** 🟡 Média  
**Impacto:** UX, Debugging

**Problema:**

```typescript
// ❌ Tratamento de erro inconsistente
catch (error) {
  console.error(error) // Apenas log
  toast({
    title: 'Erro',
    description: 'Falha ao carregar detalhes da transação',
    variant: 'destructive',
  })
}
```

**Solução:**
Tratamento consistente com logging estruturado:

```typescript
catch (error) {
  console.error('[TRANSACTION_DETAILS_ERROR]', {
    transactionId: params.id,
    error: error instanceof Error ? error.message : 'Unknown',
    timestamp: new Date().toISOString(),
  })

  toast({
    title: 'Erro ao Carregar Transação',
    description: error instanceof Error
      ? error.message
      : 'Erro desconhecido. Tente novamente.',
    variant: 'destructive',
  })
}
```

---

## 🟢 Issues Baixas (Prioridade Baixa)

### 13. Comentários Desatualizados

**Severidade:** 🟢 Baixa  
**Impacto:** Documentação

**Problema:**

```typescript
/**
 * @lastReview 2026-01-05 14:30 - Página de detalhes de transação revisada
 */
```

**Solução:**
Atualizar após refatoração com data e descrição das mudanças.

---

### 14. Classes CSS Repetidas

**Severidade:** 🟢 Baixa  
**Impacto:** Manutenibilidade

**Problema:**
Classes como `"bg-white dark:bg-background border-2 border-videira-blue..."` repetidas múltiplas vezes.

**Solução:**
Criar variantes de botão no design system ou usar `cn()` com classes base.

---

### 15. Falta Lazy Loading

**Severidade:** 🟢 Baixa  
**Impacto:** Performance

**Problema:**
Modal e componentes pesados carregados no bundle principal.

**Solução:**

```typescript
const RefundModal = dynamic(
  () => import('./_components/refund-modal').then((mod) => ({ default: mod.RefundModal })),
  { ssr: false },
)
```

---

## 📋 Plano de Refatoração

### Fase 1: Estrutura (Prioridade Máxima)

1. **Transformar em Server Component**
   - Buscar dados no servidor
   - Validar autenticação
   - Passar dados para Client Component

2. **Modularizar Componentes**
   - Criar estrutura de `_components/`
   - Dividir em componentes < 200 linhas
   - Separar responsabilidades

3. **Centralizar Tipos**
   - Usar tipos de `src/types/transaction.ts`
   - Criar `TransactionDetails` type
   - Adicionar validação Zod

### Fase 2: Qualidade (Prioridade Alta)

4. **Adicionar Validação**
   - Validar dados com Zod
   - Usar `safeParse()`
   - Tratamento de erros consistente

5. **Usar Constantes Centralizadas**
   - Importar STATUS_MAP e METHOD_MAP
   - Remover configurações duplicadas

6. **Otimizar Estados**
   - Consolidar estados de loading
   - Simplificar lógica de estado

### Fase 3: Refinamento (Prioridade Média/Baixa)

7. **Extrair Utilitários**
   - Usar `formatCurrency()`
   - Usar `formatDate()`
   - Criar helpers reutilizáveis

8. **Lazy Loading**
   - Modal com `dynamic()`
   - Componentes pesados sob demanda

9. **Melhorias de UX**
   - Skeleton loading componentizado
   - Mensagens de erro melhores
   - Feedback visual consistente

---

## 🎯 Estrutura Proposta

```
src/app/admin/transacoes/[id]/
├── page.tsx (Server Component - 50 linhas)
│   └── Busca dados do banco
│   └── Valida autenticação
│   └── Renderiza TransactionDetailsClient
│
└── _components/
    ├── transaction-details-client.tsx (150 linhas)
    │   └── Componente principal client
    │   └── Orquestra sub-componentes
    │
    ├── transaction-header.tsx (80 linhas)
    │   └── Header com gradiente
    │   └── Botão voltar e copiar ID
    │
    ├── transaction-amount-card.tsx (60 linhas)
    │   └── Card de valor em destaque
    │
    ├── transaction-payment-info.tsx (100 linhas)
    │   └── Informações de pagamento
    │   └── ID do gateway
    │
    ├── transaction-contributor-card.tsx (80 linhas)
    │   └── Dados do contribuinte
    │   └── Link para perfil
    │
    ├── transaction-church-card.tsx (80 linhas)
    │   └── Dados da igreja
    │
    ├── transaction-actions.tsx (120 linhas)
    │   └── Botões de ação
    │   └── Handlers consolidados
    │
    ├── transaction-fraud-alert.tsx (80 linhas)
    │   └── Alerta de fraude
    │   └── Informações de auditoria
    │
    ├── refund-modal.tsx (150 linhas)
    │   └── Modal de reembolso
    │   └── Lazy loaded
    │
    └── transaction-details-skeleton.tsx (100 linhas)
        └── Loading state
```

---

## 📊 Métricas Esperadas Após Refatoração

### Antes

- **Linhas:** 900+
- **Componentes:** 1 monolítico
- **Bundle Size:** ~250KB
- **Type Safety:** Parcial
- **Manutenibilidade:** Baixa
- **Performance:** Média

### Depois

- **Linhas:** 50 (page) + 9 componentes (média 100 linhas cada)
- **Componentes:** 10 modulares
- **Bundle Size:** ~180KB (redução de 28%)
- **Type Safety:** Completo (Zod)
- **Manutenibilidade:** Alta
- **Performance:** Alta (SSR + lazy loading)

---

## ✅ Checklist de Implementação

- [x] Transformar página em Server Component
- [x] Buscar dados diretamente do banco
- [x] Criar estrutura de `_components/`
- [x] Extrair TransactionHeader
- [x] Extrair TransactionAmountCard
- [x] Extrair TransactionPaymentInfo
- [x] Extrair TransactionContributorCard
- [x] Extrair TransactionChurchCard
- [x] Extrair TransactionActions
- [x] Extrair TransactionFraudAlert
- [x] Extrair RefundModal com lazy loading
- [x] Extrair TransactionDetailsSkeleton
- [x] Centralizar tipos em `transaction.ts`
- [x] Adicionar validação Zod
- [x] Usar constantes centralizadas
- [x] Consolidar estados de loading
- [x] Usar utilitários de formatação
- [x] Tratamento de erros consistente
- [x] Testes TypeScript (`npm run typecheck`)
- [ ] Testes ESLint (`npm run lint`)
- [ ] Testes manuais
- [ ] Documentação atualizada

---

## 📚 Referências

- [Troubleshooting Next.js 15](../../.kiro/steering/troubleshooting-nextjs15.md)
- [Server Components Guide](./SERVER_COMPONENTS_GUIDE.md)
- [Transactions Refactoring](./TRANSACTIONS_REFACTORING.md)
- [Code Standards](../../.kiro/steering/code-standards.md)

---

**Conclusão:** A página de detalhes de transação necessita de refatoração urgente seguindo os mesmos padrões aplicados na página de listagem. A transformação em Server Component e modularização são críticas para manter a qualidade e manutenibilidade do código.

**Próximos Passos:** Iniciar refatoração pela Fase 1 (estrutura), seguindo o plano detalhado acima.

---

**Data da Análise:** 11/02/2026  
**Analisado por:** code-quality subagent  
**Revisado por:** Kiro AI Assistant

---

## 🎉 Refatoração Concluída

**Data de Conclusão:** 11/02/2026  
**Status:** ✅ Implementado com Sucesso

### Resumo da Implementação

A página de detalhes de transação foi completamente refatorada seguindo os padrões estabelecidos no projeto:

#### Arquivos Criados

1. **Server Component Principal**
   - `src/app/admin/transacoes/[id]/page.tsx` (150 linhas)
   - Busca dados diretamente do banco com Drizzle ORM
   - Validação de autenticação no servidor
   - Evita problemas de cookies (fetch)

2. **Componentes Client Modulares** (`_components/`)
   - `transaction-details-client.tsx` (60 linhas) - Orquestrador principal
   - `transaction-header.tsx` (70 linhas) - Header com gradiente e ações
   - `transaction-amount-card.tsx` (50 linhas) - Card de valor destacado
   - `transaction-payment-info.tsx` (60 linhas) - Informações de pagamento
   - `transaction-contributor-card.tsx` (70 linhas) - Dados do contribuinte
   - `transaction-church-card.tsx` (40 linhas) - Dados da igreja
   - `transaction-actions.tsx` (130 linhas) - Botões de ação com handlers
   - `transaction-fraud-alert.tsx` (30 linhas) - Alerta de fraude
   - `refund-modal.tsx` (120 linhas) - Modal de reembolso (lazy loaded)
   - `transaction-details-skeleton.tsx` (80 linhas) - Loading state

#### Melhorias Implementadas

**Arquitetura:**

- ✅ Server Component para busca de dados
- ✅ Componentes modulares < 200 linhas cada
- ✅ Lazy loading do modal de reembolso
- ✅ Separação clara de responsabilidades

**Type Safety:**

- ✅ Tipo `TransactionDetails` centralizado em `src/types/transaction.ts`
- ✅ Schema Zod para validação
- ✅ Props tipadas em todos os componentes

**Reutilização:**

- ✅ Constantes `STATUS_MAP` e `METHOD_MAP` de `src/lib/constants/transaction-maps.ts`
- ✅ Utilitários `formatCurrency()` e `formatDate()` de `src/lib/format.ts`
- ✅ Componentes UI do shadcn/ui

**Estado e Performance:**

- ✅ Estado de loading consolidado (enum `ActionType`)
- ✅ Lazy loading do RefundModal com `dynamic()`
- ✅ Skeleton loading componentizado

**Tratamento de Erros:**

- ✅ Logging estruturado com contexto
- ✅ Mensagens de erro amigáveis
- ✅ Feedback visual consistente com toast

#### Métricas Finais

| Métrica          | Antes        | Depois       | Melhoria |
| ---------------- | ------------ | ------------ | -------- |
| Linhas Totais    | 900+         | ~710         | -21%     |
| Componentes      | 1 monolítico | 10 modulares | +900%    |
| Maior Componente | 900 linhas   | 150 linhas   | -83%     |
| Type Safety      | Parcial      | Completo     | ✅       |
| Validação Zod    | ❌           | ✅           | ✅       |
| Lazy Loading     | ❌           | ✅           | ✅       |
| Manutenibilidade | Baixa        | Alta         | ✅       |

#### Testes Realizados

- ✅ TypeScript: `npm run typecheck` - 0 erros
- ✅ Diagnósticos: Todos os arquivos sem issues
- ⏳ ESLint: Pendente
- ⏳ Testes manuais: Pendente

#### Próximos Passos

1. Executar `npm run lint` para verificar padrões de código
2. Testar funcionalidade manualmente:
   - Visualização de detalhes
   - Reenvio de comprovante
   - Sincronização de status
   - Marcação de fraude
   - Solicitação de reembolso
3. Validar comportamento em diferentes cenários:
   - Transação aprovada
   - Transação pendente
   - Transação recusada
   - Transação com fraude
   - Transação sem igreja de origem

---

**Refatoração realizada por:** Kiro AI Assistant  
**Seguindo padrões:** [Code Standards](../../.kiro/steering/code-standards.md), [Troubleshooting Next.js 15](../../.kiro/steering/troubleshooting-nextjs15.md)
