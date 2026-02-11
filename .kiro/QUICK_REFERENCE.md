# 🚀 Referência Rápida - Kiro Configuration

## 📌 Comandos Essenciais

### Ativar Skills no Chat

```
#nextjs-best-practices - Melhores práticas Next.js 15
#database-optimization - Otimização de queries
#api-integration - Integração com APIs externas
#error-handling - Tratamento de erros
#ui-ux-patterns - Padrões de interface
#form-validation - Validação de formulários
#comunicacao-ptbr - Comunicação em português
```

### Referenciar Steering Rules Manuais

```
#git-commit-standards - Padrões de commit
#documentation-standards - Padrões de documentação
```

## 🎯 Quando Usar Cada Skill

| Situação                       | Skill Recomendada          |
| ------------------------------ | -------------------------- |
| Criar nova página Next.js      | `#nextjs-best-practices`   |
| Otimizar queries lentas        | `#database-optimization`   |
| Integrar API externa           | `#api-integration`         |
| Implementar tratamento de erro | `#error-handling`          |
| Criar formulário               | `#form-validation`         |
| Melhorar UI/UX                 | `#ui-ux-patterns`          |
| Fazer commit                   | `#git-commit-standards`    |
| Documentar código              | `#documentation-standards` |

## ⚡ Atalhos de Desenvolvimento

### Criar Componente Server

```typescript
// app/admin/users/page.tsx
import { db } from '@/lib/db';

export default async function UsersPage() {
  const users = await db.query.users.findMany({
    with: { profile: true }
  });

  return <UserList users={users} />;
}
```

### Criar Server Action

```typescript
'use server'

import { z } from 'zod'

const schema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
})

export async function createUser(formData: FormData) {
  try {
    const data = schema.parse({
      name: formData.get('name'),
      email: formData.get('email'),
    })

    const user = await db.insert(users).values(data).returning()
    return { success: true, data: user[0] }
  } catch (error) {
    return { success: false, error: 'Erro ao criar usuário' }
  }
}
```

### Criar Client Component

```typescript
'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export function UserForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await createUser(formData);

    if (result.success) {
      toast.success('Usuário criado!');
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return <form action={handleSubmit}>{/* campos */}</form>;
}
```

## 🔒 Checklist de Segurança Rápido

- [ ] Validação com Zod
- [ ] Autenticação verificada
- [ ] Dados sensíveis não logados
- [ ] Secrets em variáveis de ambiente
- [ ] Upload de arquivo validado
- [ ] Rate limiting implementado
- [ ] Cookies httpOnly e secure
- [ ] Queries usando ORM

## 🎨 Padrões de UI Rápidos

### Loading State

```typescript
<Suspense fallback={<Skeleton />}>
  <AsyncComponent />
</Suspense>
```

### Empty State

```typescript
<EmptyState
  title="Nenhum usuário encontrado"
  description="Comece criando seu primeiro usuário"
  action={{ label: "Criar usuário", onClick: handleCreate }}
/>
```

### Toast Notification

```typescript
toast.success('Sucesso!')
toast.error('Erro!')
toast.loading('Processando...')
```

## 📊 Performance Checklist

- [ ] Server Components por padrão
- [ ] Queries otimizadas (sem N+1)
- [ ] Imagens com next/image
- [ ] Dynamic imports para componentes pesados
- [ ] Paginação em listas grandes
- [ ] Cache configurado
- [ ] Bundle analisado

## 🗄️ Database Patterns

### Query Otimizada

```typescript
// ✅ Bom - Uma query com join
const users = await db.query.users.findMany({
  with: { profile: true, contributions: true },
})

// ❌ Ruim - N+1 queries
const users = await db.query.users.findMany()
for (const user of users) {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, user.id),
  })
}
```

### Paginação

```typescript
const PAGE_SIZE = 20
const offset = (page - 1) * PAGE_SIZE

const users = await db.query.users.findMany({
  limit: PAGE_SIZE,
  offset: offset,
  orderBy: desc(users.createdAt),
})
```

## 🧪 Testing Pattern

```typescript
describe('UserService', () => {
  it('deve criar usuário com dados válidos', async () => {
    // Arrange
    const userData = { name: 'João', email: 'joao@example.com' }

    // Act
    const result = await createUser(userData)

    // Assert
    expect(result.success).toBe(true)
  })
})
```

## 📝 Commit Pattern

```bash
feat(auth): adicionar autenticação JWT

Implementa sistema de autenticação com JWT
- Cookies httpOnly e secure
- Middleware de proteção de rotas

Closes #123
```

## 🔗 Links Úteis

- [README Principal](../README.md)
- [Documentação Completa](../docs/)
- [Changelog](../docs/CHANGELOG.md)
- [Roadmap](../docs/ROADMAP.md)

---

💡 **Dica:** Use `#` no chat do Kiro para ativar skills e melhorar as respostas!
