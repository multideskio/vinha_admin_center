# Exemplo de Integração - Página de Supervisores

Este documento mostra como converter a página atual de supervisores para usar os componentes modulares criados.

## 📝 Antes (Client Component Monolítico)

```typescript
// src/app/admin/supervisores/page.tsx (ANTIGO - ~1000 linhas)
'use client'

export default function SupervisoresPage() {
  const [supervisors, setSupervisors] = React.useState<Supervisor[]>([])
  const [managers, setManagers] = React.useState<Manager[]>([])
  const [regions, setRegions] = React.useState<Region[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  // ... 950+ linhas de código
}
```

## ✅ Depois (Server Component + Componentes Modulares)

```typescript
// src/app/admin/supervisores/page.tsx (NOVO - ~30 linhas)
import { db } from '@/db/drizzle'
import { users, supervisorProfiles, managerProfiles, regions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { SupervisoresClient } from './_components'

/**
 * Página de gerenciamento de supervisores (Server Component)
 * Busca dados diretamente do banco e passa para o componente client
 */
export default async function SupervisoresPage() {
  // Buscar supervisores com relacionamentos
  const supervisorsData = await db.query.users.findMany({
    where: eq(users.role, 'supervisor'),
    with: {
      supervisorProfile: true,
    },
  })

  // Buscar gerentes para o formulário
  const managersData = await db.query.users.findMany({
    where: eq(users.role, 'manager'),
    with: {
      managerProfile: true,
    },
  })

  // Buscar regiões
  const regionsData = await db.query.regions.findMany()

  // Transformar dados para o formato esperado
  const supervisors = supervisorsData.map((user) => ({
    id: user.id,
    email: user.email,
    status: user.status,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    firstName: user.supervisorProfile?.firstName || '',
    lastName: user.supervisorProfile?.lastName || '',
    cpf: user.supervisorProfile?.cpf || '',
    cep: user.supervisorProfile?.cep || '',
    state: user.supervisorProfile?.state || '',
    city: user.supervisorProfile?.city || '',
    neighborhood: user.supervisorProfile?.neighborhood || '',
    address: user.supervisorProfile?.address || '',
    managerId: user.supervisorProfile?.managerId || null,
    managerName: user.supervisorProfile?.manager
      ? `${user.supervisorProfile.manager.firstName} ${user.supervisorProfile.manager.lastName}`
      : undefined,
    regionId: user.supervisorProfile?.regionId || null,
    regionName: user.supervisorProfile?.region?.name || undefined,
  }))

  const managers = managersData.map((user) => ({
    id: user.id,
    firstName: user.managerProfile?.firstName || '',
    lastName: user.managerProfile?.lastName || '',
  }))

  const regions = regionsData.map((region) => ({
    id: region.id,
    name: region.name,
  }))

  return (
    <SupervisoresClient
      initialSupervisors={supervisors}
      managers={managers}
      regions={regions}
    />
  )
}
```

## 🎯 Benefícios da Refatoração

### 1. Separação de Responsabilidades

- **Server Component (page.tsx):** Busca dados do banco
- **Client Component (supervisores-client.tsx):** Gerencia interatividade
- **Componentes específicos:** Cada um com sua responsabilidade única

### 2. Performance

- Dados buscados no servidor (sem fetch HTTP interno)
- Menos JavaScript enviado ao cliente
- Server Components renderizados no servidor

### 3. Manutenibilidade

- Código modular e reutilizável
- Fácil de testar individualmente
- Fácil de entender e modificar

### 4. Segurança

- Dados buscados diretamente do banco (sem problemas de autenticação)
- Sem exposição de lógica sensível no cliente

## 📊 Comparação de Tamanho

| Arquivo                      | Antes           | Depois          |
| ---------------------------- | --------------- | --------------- |
| page.tsx                     | ~1000 linhas    | ~30 linhas      |
| supervisores-client.tsx      | -               | ~200 linhas     |
| supervisor-form-modal.tsx    | -               | ~350 linhas     |
| supervisor-table-view.tsx    | -               | ~150 linhas     |
| supervisor-card-view.tsx     | -               | ~200 linhas     |
| delete-supervisor-dialog.tsx | -               | ~80 linhas      |
| **Total**                    | **1000 linhas** | **1010 linhas** |

**Resultado:** Mesmo tamanho total, mas código muito mais organizado e manutenível!

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│ page.tsx (Server Component)                                 │
│ - Busca supervisores do banco                               │
│ - Busca gerentes do banco                                   │
│ - Busca regiões do banco                                    │
│ - Transforma dados para formato esperado                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ SupervisoresClient (Client Component)                       │
│ - Gerencia estado (search, pagination, viewMode)            │
│ - Handlers de delete e refresh                              │
│ - Renderiza PageHeader                                      │
│ - Renderiza Card com controles                              │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│ SupervisorTable  │    │ SupervisorCard   │
│ View             │    │ View             │
│ - Lista tabela   │    │ - Grid de cards  │
│ - Skeleton       │    │ - Skeleton       │
│ - Empty state    │    │ - Empty state    │
└──────────────────┘    └──────────────────┘
```

## 🚀 Passos para Implementação

### 1. Backup da Página Atual

```bash
cp src/app/admin/supervisores/page.tsx src/app/admin/supervisores/page.tsx.backup
```

### 2. Substituir Conteúdo da Página

Copiar o código do exemplo acima para `page.tsx`

### 3. Ajustar Imports do Schema

Verificar se os imports do schema estão corretos:

```typescript
import { db } from '@/db/drizzle'
import { users, supervisorProfiles, managerProfiles, regions } from '@/db/schema'
```

### 4. Testar Funcionalidades

- [ ] Listagem de supervisores
- [ ] Busca e filtros
- [ ] Alternância tabela/cards
- [ ] Paginação
- [ ] Cadastro de novo supervisor
- [ ] Edição de supervisor
- [ ] Exclusão de supervisor
- [ ] Responsividade mobile

### 5. Remover Backup (se tudo funcionar)

```bash
rm src/app/admin/supervisores/page.tsx.backup
```

## ⚠️ Pontos de Atenção

### 1. Schema do Banco

Certifique-se de que o schema tem os relacionamentos corretos:

```typescript
// supervisorProfiles deve ter:
export const supervisorProfiles = pgTable('supervisor_profiles', {
  // ...
  managerId: text('manager_id').references(() => users.id),
  regionId: text('region_id').references(() => regions.id),
})
```

### 2. API Endpoints

Verifique se os endpoints existem e funcionam:

- `GET /api/v1/admin/supervisores`
- `POST /api/v1/admin/supervisores`
- `DELETE /api/v1/admin/supervisores/[id]`

### 3. Validação Zod

Certifique-se de que `supervisorProfileSchema` está em `@/lib/types`:

```typescript
export const supervisorProfileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  cpf: z.string().min(11),
  email: z.string().email(),
  phone: z.string().min(10),
  cep: z.string().min(8),
  state: z.string().min(2),
  city: z.string().min(1),
  neighborhood: z.string().min(1),
  address: z.string().min(1),
  titheDay: z.number().min(1).max(31).optional(),
  managerId: z.string().optional(),
  regionId: z.string().optional(),
})
```

## 📚 Referências

- [Next.js 15 Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Drizzle ORM Queries](https://orm.drizzle.team/docs/rqb)
- [React Hook Form + Zod](https://react-hook-form.com/get-started#SchemaValidation)
- [Troubleshooting Next.js 15](../../docs/development/troubleshooting-nextjs15.md)

---

**Versão:** 1.0  
**Data:** 2024-08-07  
**Autor:** Kiro AI Assistant
