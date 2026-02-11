---
inclusion: always
---

# Padrões de Código - Vinha Admin Center

## Princípios Fundamentais

### 1. TypeScript Estrito

- Sempre usar tipos explícitos
- Evitar `any` - usar `unknown` quando necessário
- Criar interfaces/types para objetos complexos
- Usar Zod para validação em runtime

### 2. Componentes React

#### Server Components (Padrão)

```typescript
// app/admin/dashboard/page.tsx
import { db } from '@/lib/db';

export default async function DashboardPage() {
  const data = await db.query.users.findMany();

  return (
    <div>
      {/* Renderização */}
    </div>
  );
}
```

#### Client Components (Quando Necessário)

```typescript
'use client'

import { useState } from 'react'

export function InteractiveComponent() {
  const [state, setState] = useState()
  // ...
}
```

### 3. Estrutura de Arquivos

#### Páginas (App Router)

```
app/
├── admin/
│   ├── dashboard/
│   │   ├── page.tsx           # Página principal
│   │   └── _components/       # Componentes específicos
│   │       └── stats-card.tsx
│   └── layout.tsx             # Layout compartilhado
```

#### Componentes Reutilizáveis

```
components/
├── ui/                        # Componentes base (shadcn/ui)
│   ├── button.tsx
│   └── card.tsx
└── shared/                    # Componentes compartilhados
    ├── header.tsx
    └── sidebar.tsx
```

### 4. Nomenclatura

#### Arquivos

- Componentes: `kebab-case.tsx` (ex: `user-profile.tsx`)
- Utilitários: `kebab-case.ts` (ex: `format-date.ts`)
- Types: `kebab-case.ts` (ex: `user-types.ts`)

#### Variáveis e Funções

```typescript
// camelCase para variáveis e funções
const userName = 'João'
function getUserData() {}

// PascalCase para componentes e classes
function UserProfile() {}
class UserService {}

// UPPER_SNAKE_CASE para constantes
const MAX_RETRY_ATTEMPTS = 3
const API_BASE_URL = process.env.API_URL
```

### 5. Banco de Dados (Drizzle ORM)

#### Definição de Schema

```typescript
// lib/db/schema/users.ts
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
})
```

#### Queries

```typescript
// Preferir queries otimizadas
const users = await db.query.users.findMany({
  with: {
    profile: true,
  },
  where: eq(users.role, 'admin'),
})

// Evitar N+1 queries
// ❌ Ruim
for (const user of users) {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, user.id),
  })
}

// ✅ Bom
const users = await db.query.users.findMany({
  with: { profile: true },
})
```

### 6. Validação com Zod

```typescript
import { z } from 'zod'

// Definir schema
const userSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  role: z.enum(['admin', 'manager', 'supervisor', 'pastor', 'igreja']),
})

// Usar em Server Actions
export async function createUser(formData: FormData) {
  const data = userSchema.parse({
    name: formData.get('name'),
    email: formData.get('email'),
    role: formData.get('role'),
  })

  // Processar dados validados
}
```

### 7. Tratamento de Erros

```typescript
// Server Actions
export async function serverAction() {
  try {
    // Lógica
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao processar:', error)
    return {
      success: false,
      error: 'Mensagem amigável para o usuário',
    }
  }
}

// API Routes
export async function POST(request: Request) {
  try {
    // Lógica
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: 'Erro ao processar requisição' }, { status: 500 })
  }
}
```

### 8. Estilização (Tailwind CSS)

```typescript
// Usar classes do Tailwind de forma organizada
<div className="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-md">
  <h2 className="text-2xl font-bold text-gray-900">Título</h2>
  <p className="text-gray-600">Descrição</p>
</div>

// Para estilos complexos, usar cn() helper
import { cn } from '@/lib/utils';

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  isDisabled && "disabled-classes"
)}>
```

### 9. Comentários e Documentação

```typescript
/**
 * Busca usuários com filtros aplicados
 *
 * @param filters - Filtros de busca
 * @param filters.role - Papel do usuário
 * @param filters.status - Status ativo/inativo
 * @returns Lista de usuários filtrados
 */
export async function getUsers(filters: UserFilters) {
  // Implementação
}

// Comentários inline em português
// Buscar apenas usuários ativos
const activeUsers = users.filter((u) => u.status === 'active')
```

### 10. Performance

```typescript
// Usar React.memo para componentes pesados
import { memo } from 'react';

export const HeavyComponent = memo(function HeavyComponent({ data }) {
  // Renderização complexa
});

// Usar dynamic imports para code splitting
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/heavy-chart'), {
  loading: () => <p>Carregando...</p>,
});
```

## Checklist de Code Review

- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Código formatado (`npm run format`)
- [ ] Sem warnings do ESLint (`npm run lint`)
- [ ] Componentes com nomes descritivos
- [ ] Validação de dados com Zod
- [ ] Tratamento adequado de erros
- [ ] Queries otimizadas (sem N+1)
- [ ] Comentários em português
- [ ] Testes de funcionalidade manual
- [ ] Documentação atualizada se necessário
