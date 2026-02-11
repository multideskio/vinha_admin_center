# Componentes Modulares - Pastores

Esta pasta contém os componentes modulares para a página de gerenciamento de pastores do painel administrativo.

## Estrutura de Componentes

### 1. `pastores-client.tsx`

**Componente principal client-side**

- Gerencia estado: search, pagination, viewMode
- Handlers: delete, refresh
- Props: `initialPastors` (Pastor[]), `supervisors` (Supervisor[])
- Integra todos os sub-componentes

### 2. `pastor-form-modal.tsx`

**Modal de cadastro de pastor**

- Validação Zod com `pastorProfileSchema`
- Integração ViaCEP para busca automática de endereço
- Campos: firstName, lastName, cpf, email, phone, birthDate, titheDay, supervisorId, endereço completo
- Senha padrão: 123456 (com alerta visual)
- Formatação automática: CPF, CEP

### 3. `pastor-table-view.tsx`

**Visualização em tabela**

- Colunas: Avatar+Nome, Email, Celular, Supervisor, Status, Ações
- Skeleton loading states
- Responsivo (colunas ocultas em mobile)
- Link para edição: `/admin/pastores/[id]`

### 4. `pastor-card-view.tsx`

**Visualização em cards**

- Grid responsivo (3 colunas desktop, 2 tablet, 1 mobile)
- Mostra: Avatar, Nome, CPF, Email, Celular, Supervisor, Status
- Botão de editar e menu de ações
- Skeleton loading states
- Bordas coloridas alternadas (videira-cyan, videira-blue, videira-purple)

### 5. `delete-pastor-dialog.tsx`

**Dialog de confirmação de exclusão**

- AlertDialog com campo obrigatório: motivo da exclusão
- Validação: motivo não pode estar vazio
- Design com destaque visual (borda vermelha, ícone de alerta)
- Mensagem de auditoria

### 6. `index.ts`

**Exportações centralizadas**

- Exporta todos os componentes
- Exporta tipos: Pastor, Supervisor

## Tipos

```typescript
export type Pastor = {
  id: string
  email: string
  status: 'active' | 'inactive'
  phone: string | null
  avatarUrl: string | null
  firstName: string
  lastName: string
  cpf: string
  birthDate: Date | null
  cep: string
  state: string
  city: string
  neighborhood: string
  address: string
  titheDay: number | null
  supervisorId: string | null
  supervisorName?: string
}

export type Supervisor = {
  id: string
  firstName: string
  lastName: string
}
```

## Uso na Página Principal

```typescript
// src/app/admin/pastores/page.tsx
import { db } from '@/lib/db'
import { PastoresClient } from './_components'

export default async function PastoresPage() {
  // Buscar dados no servidor
  const pastors = await db.query.users.findMany({
    where: eq(users.role, 'pastor'),
    // ... incluir joins necessários
  })

  const supervisors = await db.query.users.findMany({
    where: eq(users.role, 'supervisor'),
    // ... campos necessários
  })

  return <PastoresClient initialPastors={pastors} supervisors={supervisors} />
}
```

## API Endpoints Utilizados

- `POST /api/v1/admin/pastores` - Criar pastor
- `GET /api/v1/admin/pastores` - Listar pastores
- `DELETE /api/v1/admin/pastores/[id]` - Deletar pastor (com deletionReason)

## Design System Videira

### Cores Utilizadas

- `videira-blue` - Cor primária (botões, bordas, ícones)
- `videira-cyan` - Cor secundária (cards, badges)
- `videira-purple` - Cor terciária (cards, badges)

### Padrões Visuais

- Bordas de destaque: `border-l-4 border-l-videira-blue`
- Botões primários: `bg-videira-blue hover:bg-videira-blue/90`
- Ícones com fundo: `bg-videira-blue/15 ring-2 ring-videira-blue/30`
- Gradientes: `from-videira-cyan/5 via-videira-blue/5 to-videira-purple/5`

## Formatação de Dados

- **CPF**: `000.000.000-00`
- **CEP**: `00000-000`
- **Phone**: `(00) 00000-0000`
- **Data**: `dd/MM/yyyy` (locale pt-BR)

## Acessibilidade

- Labels em todos os inputs
- Atributos ARIA quando necessário
- Navegação por teclado
- Estados de loading visíveis
- Mensagens de erro claras

## Responsividade

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Grid adaptativo: 1 coluna (mobile) → 2 colunas (tablet) → 3 colunas (desktop)
- Tabela com colunas ocultas em telas menores

## Performance

- Server Components por padrão (apenas PastoresClient é 'use client')
- Skeleton loading states
- Paginação implementada (20 itens tabela, 12 itens cards)
- Busca client-side (filtro rápido)
- Refresh manual (evita polling desnecessário)
