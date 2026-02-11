---
inclusion: manual
---

# Skill: Otimização de Banco de Dados

## Objetivo

Garantir queries eficientes e evitar problemas de performance no banco de dados PostgreSQL com Drizzle ORM.

## Princípios de Otimização

### 1. Evitar N+1 Queries

#### ❌ Problema

```typescript
// Busca usuários
const users = await db.query.users.findMany()

// Para cada usuário, busca o perfil (N+1 queries!)
for (const user of users) {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, user.id),
  })
}
```

#### ✅ Solução

```typescript
// Uma única query com join
const users = await db.query.users.findMany({
  with: {
    profile: true,
  },
})
```

### 2. Usar Relações do Drizzle

#### Definir Relações no Schema

```typescript
// lib/db/schema/users.ts
import { relations } from 'drizzle-orm'

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  contributions: many(contributions),
}))
```

#### Usar Relações nas Queries

```typescript
// Buscar com múltiplas relações
const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    profile: true,
    contributions: {
      limit: 10,
      orderBy: desc(contributions.createdAt),
    },
  },
})
```

### 3. Paginação Eficiente

```typescript
const PAGE_SIZE = 20

export async function getUsers(page: number = 1) {
  const offset = (page - 1) * PAGE_SIZE

  const users = await db.query.users.findMany({
    limit: PAGE_SIZE,
    offset: offset,
    orderBy: desc(users.createdAt),
  })

  return users
}
```

### 4. Agregações Otimizadas

```typescript
import { count, sum, avg } from 'drizzle-orm'

// Contar registros
const totalUsers = await db.select({ count: count() }).from(users)

// Somar valores
const totalContributions = await db
  .select({ total: sum(contributions.amount) })
  .from(contributions)
  .where(eq(contributions.status, 'paid'))
```

### 5. Índices Apropriados

```typescript
// Adicionar índices em colunas frequentemente consultadas
export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    role: text('role').notNull(),
  },
  (table) => ({
    // Índice para busca por role
    roleIdx: index('role_idx').on(table.role),
    // Índice composto para queries complexas
    roleStatusIdx: index('role_status_idx').on(table.role, table.status),
  }),
)
```

### 6. Selecionar Apenas Campos Necessários

```typescript
// ❌ Busca todos os campos
const users = await db.query.users.findMany()

// ✅ Busca apenas campos necessários
const users = await db
  .select({
    id: users.id,
    name: users.name,
    email: users.email,
  })
  .from(users)
```

### 7. Usar Transações

```typescript
export async function createUserWithProfile(userData, profileData) {
  return await db.transaction(async (tx) => {
    // Criar usuário
    const [user] = await tx.insert(users).values(userData).returning()

    // Criar perfil
    await tx.insert(profiles).values({
      ...profileData,
      userId: user.id,
    })

    return user
  })
}
```

### 8. Cache de Queries Frequentes

```typescript
import { unstable_cache } from 'next/cache'

// Cachear resultado por 1 hora
export const getStats = unstable_cache(
  async () => {
    return await db.query.stats.findFirst()
  },
  ['dashboard-stats'],
  { revalidate: 3600 },
)
```

### 9. Batch Operations

```typescript
// ❌ Inserir um por vez
for (const user of users) {
  await db.insert(users).values(user)
}

// ✅ Inserir em lote
await db.insert(users).values(users)
```

### 10. Monitorar Performance

```typescript
// Adicionar logging de queries lentas
export async function logSlowQuery(query: string, duration: number) {
  if (duration > 1000) {
    // Mais de 1 segundo
    console.warn(`Query lenta (${duration}ms):`, query)
  }
}
```

## Checklist de Performance

- [ ] Queries usam `with` para relações (evitar N+1)
- [ ] Paginação implementada em listas grandes
- [ ] Índices criados em colunas de busca
- [ ] Apenas campos necessários são selecionados
- [ ] Agregações feitas no banco, não em memória
- [ ] Transações usadas para operações múltiplas
- [ ] Cache implementado para dados estáticos
- [ ] Batch operations para inserções múltiplas
- [ ] Queries monitoradas para identificar lentidão
