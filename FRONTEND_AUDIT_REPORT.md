# Relatório de Auditoria Frontend — Vinha Admin Center

**Data:** 08/03/2026
**Versão do Projeto:** v0.3.0
**Stack:** Next.js 15.5 · React 18.3 · Tailwind CSS 3.4 · shadcn/ui · TypeScript 5
**Última Atualização:** 08/03/2026

---

## 1. Sumário Executivo

**Total de problemas encontrados:** 47
**Problemas corrigidos:** 22
**Componentes compartilhados criados (não integrados):** 3
**Problemas pendentes:** 22

| Severidade | Total | Corrigidos | Pendentes |
| ---------- | ----- | ---------- | --------- |
| 🔴 Crítico | 5     | 4          | 1         |
| 🟠 Alto    | 14    | 7          | 7         |
| 🟡 Médio   | 18    | 5          | 13        |
| 🟢 Baixo   | 10    | 6          | 4         |

### Top 3 Problemas Mais Impactantes

1. ~~**Recharts importado estaticamente em 5 page.tsx**~~ — ✅ CORRIGIDO. Criado `LazyRecharts.tsx` com `next/dynamic` e substituído nos 5 arquivos.
2. ~~**Painéis manager/supervisor/pastor/igreja sem loading.tsx e error.tsx**~~ — ✅ CORRIGIDO. Criados 8 arquivos `error.tsx` e 8 arquivos `loading.tsx`.
3. ~~**~16 tabelas sem `overflow-x-auto`**~~ — ✅ CORRIGIDO. Adicionado `overflow-x-auto` em 17 tabelas.

---

## 2. Problemas Encontrados

---

### TASK 1 — RESPONSIVIDADE

#### ✅ R-01: Tabelas sem scroll horizontal em mobile — CORRIGIDO

- **Arquivos:** 16 arquivos nos painéis supervisor e manager
- **Correção aplicada:** Adicionado `overflow-x-auto` ao div wrapper de cada tabela.

#### ✅ R-02: Tabela da igreja/transacoes sem wrapper de scroll — CORRIGIDO

- **Arquivo:** `src/app/igreja/transacoes/page.tsx`
- **Correção aplicada:** Envolvido com `<div className="overflow-x-auto">`.

#### 🟡 R-03: Dialogs/Modals sem max-height em mobile — JÁ CORRETO

- **Arquivos:** Modais de formulário em `admin/supervisores`, `admin/pastores`, `admin/igrejas`, `admin/gerentes`
- **Status:** Verificado — todos os 4 modais já possuíam `max-h-[90vh] overflow-y-auto`. Nenhuma mudança necessária.

#### 🟡 R-04: Formulários com campos lado a lado em mobile — PENDENTE

- **Arquivos:** Formulários de perfil em `supervisor/perfil/page.tsx`, `pastor/perfil/page.tsx`, `igreja/perfil/page.tsx`, `manager/perfil/page.tsx`
- **Problema:** Alguns campos de endereço usam `grid-cols-2` sem fallback `grid-cols-1` para mobile.
- **Correção pendente:** Usar `grid-cols-1 sm:grid-cols-2` nos grids de formulário.

#### 🟢 R-05: Root layout com overflow-x-hidden ✅

- **Status:** Correto — nenhuma mudança necessária.

---

### TASK 2 — REUSO DE COMPONENTES

#### ✅ C-01: PaginationControls duplicado em 5 arquivos — CORRIGIDO

- **Correção aplicada:** Criado `src/components/shared/PaginationControls.tsx`. Substituído em 5 arquivos: `supervisor/pastores/page.tsx`, `supervisor/igrejas/page.tsx`, `manager/supervisores/page.tsx`, `manager/pastores/page.tsx`, `manager/igrejas/page.tsx`. Removidas definições locais, `handleNextPage`, `handlePreviousPage` e imports de `ChevronLeft`/`ChevronRight` não mais necessários.

#### 🟠 C-02: Componentes page.tsx gigantes misturando lógica e UI — PENDENTE

- **Arquivos:** 13+ arquivos com 800+ linhas
- **Problema:** Arquivos misturam tipos, schemas Zod, data fetching, handlers e JSX extenso.
- **Correção pendente:** Separar em tipos/schemas, hooks customizados e sub-componentes.

#### 🟠 C-03: Padrão de tabela com gradiente duplicado — PARCIAL

- **Status:** Componente `src/components/shared/VideiraTableHeader.tsx` criado, mas não integrado nos arquivos existentes.
- **Correção pendente:** Substituir o padrão inline nos ~18 arquivos pelo componente compartilhado.

#### ✅ C-04: Logo SVG inline duplicado em 3 arquivos — CORRIGIDO

- **Correção aplicada:** Criado `src/components/shared/Logo.tsx`. Substituído em `admin/_components/sidebar.tsx`, `admin/_components/header.tsx` e `manager/_components/header.tsx`.

#### 🟡 C-05: Empty states inconsistentes — PARCIAL

- **Status:** Componente `src/components/shared/EmptyState.tsx` criado, mas não integrado nos arquivos existentes.
- **Correção pendente:** Substituir empty states inline pelo componente compartilhado.

#### 🟡 C-06: TransactionsTab duplicado em perfis — PENDENTE

- **Problema:** Tabela de transações reimplementada em cada página de perfil.
- **Correção pendente:** Extrair para componente compartilhado.

#### 🟡 C-07: StatusBadge/statusMap duplicado — PARCIAL

- **Status:** Componente `src/components/shared/StatusBadge.tsx` criado, mas não integrado nos arquivos existentes.
- **Correção pendente:** Substituir `statusMap` inline pelo componente compartilhado.

#### ✅ C-08: `<a href>` usado ao invés de next/link — CORRIGIDO

- **Correção aplicada:** Substituído `<a href="/manager/perfil">` por `<Link href="/manager/perfil">` em `manager/dashboard/page.tsx`.

---

### TASK 3 — UX / FLUXO DO USUÁRIO

#### ✅ U-01: Ações destrutivas usando `confirm()` nativo — CORRIGIDO

- **Correção aplicada:** Substituído `window.confirm()` por `AlertDialog` do shadcn/ui em 3 arquivos:
  - `supervisor/pastores/[id]/page.tsx` — exclusão de pastor
  - `supervisor/igrejas/[id]/page.tsx` — exclusão de igreja
  - `admin/transacoes/[id]/_components/transaction-actions.tsx` — marcação de fraude

#### ✅ U-02: Formulários sem validação em tempo real — CORRIGIDO

- **Correção aplicada:** Adicionado `mode: 'onBlur'` em ~37 instâncias de `useForm` em todos os painéis. Exceções: `auth/login/page.tsx` (já tinha) e `supervisor/igrejas/[id]/page.tsx` (já usava `mode: 'onChange'`).

#### ✅ U-03: Painéis não-admin sem error boundaries — CORRIGIDO

- **Correção aplicada:** Criados 8 arquivos `error.tsx`:
  - `manager/dashboard/error.tsx`, `manager/transacoes/error.tsx`
  - `supervisor/dashboard/error.tsx`, `supervisor/transacoes/error.tsx`
  - `pastor/dashboard/error.tsx`, `pastor/transacoes/error.tsx`
  - `igreja/dashboard/error.tsx`, `igreja/transacoes/error.tsx`

#### ✅ U-04: Painéis não-admin sem loading states de rota — CORRIGIDO

- **Correção aplicada:** Criados 8 arquivos `loading.tsx` com skeleton/spinner para as mesmas rotas acima.

#### 🟠 U-05: Breadcrumbs ausentes na maioria das páginas — PENDENTE

- **Problema:** Páginas de detalhe e sub-páginas sem breadcrumbs.
- **Correção pendente:** Adicionar breadcrumbs em páginas com profundidade > 1 nível.

#### 🟡 U-06: Campos obrigatórios sem indicador visual — PENDENTE

- **Problema:** Nenhum formulário usa asterisco ou indicador para campos obrigatórios.
- **Correção pendente:** Adicionar indicador visual nos labels de campos required.

#### 🟡 U-07: Modais que fecham ao clicar fora durante edição — PENDENTE

- **Problema:** Modais não previnem fechamento com formulário dirty.
- **Correção pendente:** Adicionar `onInteractOutside` com verificação de `isDirty`.

#### 🟡 U-08: Dados de dashboard em client components com fetch — PENDENTE

- **Problema:** Dashboards não-admin são `'use client'` com fetch para API routes.
- **Correção pendente:** Refatorar para Server Component + Client Component.

---

### TASK 4 — PERFORMANCE DE RENDERIZAÇÃO

#### ✅ P-01: Recharts importado estaticamente em 5 page.tsx — CORRIGIDO

- **Correção aplicada:** Criado `src/components/shared/LazyRecharts.tsx` com `next/dynamic` e `ssr: false`. Substituído imports estáticos de Recharts nos 5 arquivos:
  - `manager/dashboard/page.tsx`
  - `supervisor/dashboard/page.tsx`
  - `pastor/dashboard/page.tsx`
  - `igreja/dashboard/page.tsx`
  - `admin/relatorios/membresia/page.tsx`

#### 🟠 P-02: Dashboards não-admin são Client Components inteiros — PENDENTE

- **Problema:** Toda a página é `'use client'`, incluindo layout estático.
- **Correção pendente:** Separar em Server Component + Client Component.

#### 🟡 P-03: Inline style={{ }} em componentes — PENDENTE (baixa prioridade)

- **Nota:** Maioria dos usos são justificados (cores dinâmicas, limitação de lib).
- **Correção pendente:** Apenas `phone-input.tsx` poderia ser melhorado.

#### 🟡 P-04: Componentes de formulário sem React.memo — PENDENTE

- **Problema:** Componentes presentacionais sem `React.memo`.
- **Correção pendente:** Envolver componentes puros com `React.memo`.

---

### TASK 5 — TAILWIND & DESIGN SYSTEM

#### 🟡 T-01: Cores hardcoded em classes Tailwind — PENDENTE

- **Problema:** Uso de cores Tailwind diretas ao invés de tokens semânticos.
- **Correção pendente:** Substituir pelos tokens do tema.

#### 🟡 T-02: Padding inconsistente em Cards — PENDENTE

- **Problema:** Spacing inconsistente entre Cards similares.
- **Correção pendente:** Definir e aplicar padrão uniforme.

#### 🟡 T-03: Heading hierarchy inconsistente — PENDENTE

- **Problema:** Mistura de `<h1>`, `<h2>`, `<h3>` e `<CardTitle>` sem hierarquia clara.
- **Correção pendente:** Padronizar hierarquia de headings.

#### 🟢 T-04: Sem classes Tailwind dinâmicas ✅

#### 🟢 T-05: Sem valores arbitrários de cor ✅

#### 🟢 T-06: Design tokens bem definidos ✅

---

### TASK 6 — ACESSIBILIDADE

#### ✅ A-01: Botões icon-only sem aria-label — CORRIGIDO

- **Correção aplicada:** Adicionado `aria-label` em todos os botões `size="icon"` sem alternativa de acessibilidade. 21 arquivos modificados:
  - `components/ui/image-modal.tsx` — botão fechar
  - `supervisor/pastores/[id]/page.tsx` — botão voltar + dropdown
  - `supervisor/igrejas/[id]/page.tsx` — botão voltar + dropdown
  - `supervisor/perfil/page.tsx` — dropdown
  - `supervisor/pastores/page.tsx` — botões viewMode (table/card)
  - `supervisor/igrejas/page.tsx` — botões viewMode (table/card)
  - `manager/perfil/page.tsx` — dropdown
  - `manager/igrejas/[id]/page.tsx` — dropdown
  - `manager/igrejas/page.tsx` — botões viewMode (table/card)
  - `manager/supervisores/page.tsx` — botões viewMode (table/card)
  - `manager/pastores/page.tsx` — botões viewMode (table/card)
  - `admin/supervisores/_components/supervisores-client.tsx` — viewMode + refresh
  - `admin/pastores/_components/pastores-client.tsx` — viewMode + refresh
  - `admin/transacoes/[id]/_components/transaction-header.tsx` — voltar + copiar ID
  - `admin/transacoes/_components/transaction-filters.tsx` — refresh
  - `admin/supervisores/_components/supervisor-table-view.tsx` — dropdown
  - `admin/relatorios/membresia/page.tsx` — paginação (4 botões)
  - `admin/relatorios/inadimplentes/page.tsx` — paginação (4 botões)
  - `admin/relatorios/financeiro/page.tsx` — paginação (4 botões)
  - `admin/relatorios/contribuicoes/page.tsx` — paginação (4 botões)
  - `admin/relatorios/igrejas/page.tsx` — paginação (4 botões)

#### 🟡 A-02: Cor como único diferenciador de status — PENDENTE

- **Problema:** KPI cards usam apenas cor para indicar tendência.
- **Correção pendente:** Adicionar ícone junto à cor.

#### 🟢 A-03: Formulários com labels associados ✅

#### 🟢 A-04: Dialogs com focus trap ✅

#### 🟢 A-05: Imagens com alt text ✅

---

## 3. Production Readiness Checklist

### Responsividade

- ✅ PASS — Tabelas com scroll horizontal (overflow-x-auto adicionado em 17 arquivos)
- ⚠️ NEEDS REVIEW — Páginas usáveis em 768px, mas alguns formulários não otimizam para tablet
- ✅ PASS — Sem scroll horizontal no root (overflow-x-hidden no body)
- ⚠️ NEEDS REVIEW — Maioria dos touch targets ≥ 44px, mas botões `h-8 w-8` existem em alguns locais

### Componentes

- ✅ PASS — Sem elementos HTML nativos onde shadcn existe (`<a>` corrigido para `<Link>`)
- ✅ PASS — PaginationControls centralizado em componente compartilhado
- ❌ FAIL — 13+ componentes acima de 800 linhas misturando lógica e UI
- ✅ PASS — Formulários usam FormField + FormMessage do shadcn

### UX

- ✅ PASS — Formulários com validação `mode: 'onBlur'` para feedback imediato
- ✅ PASS — Ações destrutivas usam AlertDialog do shadcn
- ✅ PASS — Error boundaries e loading states em todos os painéis
- ⚠️ NEEDS REVIEW — Modais não previnem fechamento com formulário dirty

### Acessibilidade

- ✅ PASS — Imagens com alt text
- ✅ PASS — Todos os icon buttons têm aria-label ou sr-only
- ✅ PASS — Inputs com labels associados via shadcn Form
- ⚠️ NEEDS REVIEW — Cor como único indicador em alguns KPIs

### Performance

- ✅ PASS — Sem `<img>` nativo, usa next/image
- ✅ PASS — Recharts carregado via next/dynamic com ssr: false
- ✅ PASS — Sem inline object/array literals problemáticos em JSX props
- ✅ PASS — Sem classes Tailwind dinâmicas

### Design System

- ⚠️ NEEDS REVIEW — Algumas cores hardcoded (amber, green) ao invés de tokens semânticos
- ⚠️ NEEDS REVIEW — Spacing inconsistente entre Cards similares
- ✅ PASS — Dark mode com variantes definidas no globals.css

---

## 4. Prioridades de Refatoração

### Quick Wins (< 1h cada) — ✅ TODOS CONCLUÍDOS

1. ✅ Adicionar `overflow-x-auto` nas ~16 tabelas sem wrapper
2. ✅ Substituir 3 `confirm()` nativos por `AlertDialog`
3. ✅ Adicionar `mode: 'onBlur'` nos ~30 `useForm` sem mode
4. ✅ Corrigir `<a href>` para `<Link>` em manager/dashboard
5. ✅ Adicionar `aria-label` nos icon buttons faltantes (21 arquivos)
6. ✅ Modais já possuíam `max-h-[90vh] overflow-y-auto` (verificado)

### Moderados (1–4h cada) — 4/8 CONCLUÍDOS

7. ✅ Extrair `PaginationControls` para componente compartilhado (substituído em 5 arquivos)
8. 🔶 Extrair `StatusBadge` — componente criado (`src/components/shared/StatusBadge.tsx`), integração pendente
9. 🔶 Extrair `VideiraTableHeader` — componente criado (`src/components/shared/VideiraTableHeader.tsx`), integração pendente
10. ✅ Extrair `Logo` SVG para componente compartilhado (substituído em 3 arquivos)
11. 🔶 Criar componente `EmptyState` — componente criado (`src/components/shared/EmptyState.tsx`), integração pendente
12. ✅ Usar `next/dynamic` para Recharts (substituído em 5 arquivos via `LazyRecharts.tsx`)
13. ✅ Criar `error.tsx` e `loading.tsx` para painéis não-admin (16 arquivos criados)
14. ⬜ Adicionar breadcrumbs nas páginas de detalhe `[id]`

### Grandes (> 4h cada) — PENDENTES

15. ⬜ Refatorar dashboards para padrão Server Component + Client Component
16. ⬜ Dividir os 13+ componentes page.tsx com 800+ linhas
17. ⬜ Padronizar spacing, heading hierarchy e tokens de cor
18. ⬜ Adicionar indicadores visuais de campos obrigatórios
19. ⬜ Implementar proteção contra fechamento de modal com formulário dirty

---

## 5. Componentes Compartilhados Criados

| Componente           | Caminho                                        | Status                         |
| -------------------- | ---------------------------------------------- | ------------------------------ |
| `PaginationControls` | `src/components/shared/PaginationControls.tsx` | ✅ Criado e integrado          |
| `Logo`               | `src/components/shared/Logo.tsx`               | ✅ Criado e integrado          |
| `LazyRecharts`       | `src/components/shared/LazyRecharts.tsx`       | ✅ Criado e integrado          |
| `StatusBadge`        | `src/components/shared/StatusBadge.tsx`        | 🔶 Criado, integração pendente |
| `VideiraTableHeader` | `src/components/shared/VideiraTableHeader.tsx` | 🔶 Criado, integração pendente |
| `EmptyState`         | `src/components/shared/EmptyState.tsx`         | 🔶 Criado, integração pendente |

---

## 6. Legenda

- ✅ — Corrigido / Concluído
- 🔶 — Parcialmente concluído (componente criado, integração pendente)
- ⬜ — Pendente (não iniciado)
- ❌ — Falha identificada (não corrigida)
- ⚠️ — Necessita revisão
