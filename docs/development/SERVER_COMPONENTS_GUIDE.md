# Guia de Server Components - Next.js 15

## 📚 Visão Geral

Este guia documenta as melhores práticas, armadilhas comuns e soluções para trabalhar com Server Components no Next.js 15 no projeto Vinha Admin Center.

---

## 🎯 Princípios Fundamentais

### 1. Server Components por Padrão

No Next.js 15, todos os componentes são Server Components por padrão, a menos que marcados com `'use client'`.

```typescript
// Server Component (padrão)
export default async function Page() {
  const data = await db.query.users.findMany()
  return <div>{data.length} usuários</div>
}

// Client Component (explícito)
'use client'
export function InteractiveButton() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

### 2. Quando Usar Cada Tipo

**Server Components (Padrão):**

- Busca de dados
- Acesso direto ao banco
- Renderização de conteúdo estático
- SEO importante
- Reduzir bundle JavaScript

**Client Components (`'use client'`):**

- Interatividade (onClick, onChange, etc.)
- Hooks do React (useState, useEffect, etc.)
- APIs do navegador (localStorage, window, etc.)
- Bibliotecas que dependem do navegador

---

## ⚠️ Problemas Comuns e Soluções

### Problema 1: Fetch em Server Components Não Envia Cookies

**Sintoma:**

```
GET /api/v1/endpoint 401 Unauthorized
```

**Causa:**
Fetch em Server Components não envia cookies automaticamente.

**❌ Incorreto:**

```typescript
export default async function Page() {
  // Cookies não são enviados
  const response = await fetch('http://localhost:9002/api/v1/data')
  const data = await response.json()
  return <div>{data}</div>
}
```

**✅ Solução 1: Buscar Diretamente do Banco**

```typescript
import { db } from '@/db/drizzle'
import { users } from '@/db/schema'

export default async function Page() {
  // Melhor: busca direta no banco
  const data = await db.query.users.findMany()
  return <div>{data.length} usuários</div>
}
```

**✅ Solução 2: Usar cookies() do Next.js**

```typescript
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = cookies()
  const token = cookieStore.get('auth-token')

  const response = await fetch('http://localhost:9002/api/v1/data', {
    headers: {
      Cookie: `auth-token=${token?.value}`,
    },
  })
  const data = await response.json()
  return <div>{data}</div>
}
```

**Recomendação:** Sempre prefira buscar diretamente do banco em Server Components.

---

### Problema 2: Componentes Não Serializáveis

**Sintoma:**

```
Error: Only plain objects can be passed to Client Components from Server Components.
Classes or other objects with methods are not supported.
```

**Causa:**
Tentativa de passar componentes, funções ou classes como props.

**❌ Incorreto:**

```typescript
import { ArrowRight } from 'lucide-react'

// Server Component
export default async function Page() {
  return (
    <ClientHeader
      icon={ArrowRight} // ❌ Classe não pode ser serializada
      onClick={() => {}} // ❌ Função não pode ser serializada
    />
  )
}
```

**✅ Solução 1: Renderizar no Server Component**

```typescript
import { ArrowRight } from 'lucide-react'

export default async function Page() {
  return (
    <div>
      <h1>
        <ArrowRight className="h-6 w-6" /> {/* ✅ OK */}
        Título
      </h1>
      <ClientContent data={data} />
    </div>
  )
}
```

**✅ Solução 2: Passar String e Mapear**

```typescript
// Server Component
export default async function Page() {
  return <ClientHeader iconName="arrow-right" />
}

// Client Component
'use client'
import { ArrowRight, User, Settings } from 'lucide-react'

const iconMap = {
  'arrow-right': ArrowRight,
  'user': User,
  'settings': Settings,
}

export function ClientHeader({ iconName }) {
  const Icon = iconMap[iconName]
  return <Icon className="h-6 w-6" />
}
```

---

### Problema 3: Hooks em Server Components

**Sintoma:**

```
Error: useState can only be used in Client Components
```

**Causa:**
Tentativa de usar hooks do React em Server Components.

**❌ Incorreto:**

```typescript
// Server Component (sem 'use client')
export default async function Page() {
  const [count, setCount] = useState(0) // ❌ Erro
  return <div>{count}</div>
}
```

**✅ Solução:**

```typescript
// Server Component
export default async function Page() {
  const data = await db.query.users.findMany()
  return <ClientCounter initialCount={data.length} />
}

// Client Component
'use client'
export function ClientCounter({ initialCount }) {
  const [count, setCount] = useState(initialCount) // ✅ OK
  return <div>{count}</div>
}
```

---

### Problema 4: Validação Zod Falhando

**Sintoma:**

```
Erro de Validação - Dados recebidos da API estão em formato inválido
```

**Causa:**
Schema Zod muito rígido, não aceita casos extremos.

**❌ Incorreto:**

```typescript
const schema = z.object({
  data: z.array(itemSchema).min(1), // ❌ Requer pelo menos 1 item
  pagination: z.object({
    total: z.number(), // ❌ Sempre obrigatório
  }),
})
```

**✅ Solução:**

```typescript
const schema = z.object({
  data: z.array(itemSchema), // ✅ Aceita array vazio
  pagination: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number().optional(), // ✅ Opcional
    })
    .optional(), // ✅ Objeto inteiro opcional
})

// Usar safeParse
const result = schema.safeParse(data)
if (!result.success) {
  console.error('Erro de validação:', result.error)
  // Tratar erro adequadamente
  return
}
const validData = result.data
```

---

## 📋 Checklist de Implementação

### Ao Criar uma Nova Página

- [ ] Página é Server Component por padrão (sem `'use client'`)
- [ ] Validação de autenticação no servidor
- [ ] Busca de dados diretamente do banco (não fetch interno)
- [ ] Dados formatados no servidor
- [ ] Apenas dados serializáveis passados como props
- [ ] Ícones/componentes Lucide renderizados no Server Component
- [ ] Client Components apenas onde necessário (interatividade)

### Ao Criar um Client Component

- [ ] Marcado com `'use client'` no topo
- [ ] Recebe apenas dados serializáveis como props
- [ ] Não faz busca de dados (recebe via props)
- [ ] Usa hooks apenas quando necessário
- [ ] Lazy loading se componente for pesado

### Ao Criar Schemas Zod

- [ ] Campos opcionais marcados com `.optional()`
- [ ] Arrays aceitam valores vazios
- [ ] Objetos aninhados opcionais quando apropriado
- [ ] Usa `safeParse()` ao invés de `parse()`
- [ ] Tratamento de erros implementado
- [ ] Testado com dados vazios e casos extremos

---

## 🔍 Debugging

### Como Identificar se é Server ou Client Component

```typescript
// Adicione console.log
export default function MyComponent() {
  console.log('Onde isso aparece?')
  // Se aparecer no terminal = Server Component
  // Se aparecer no navegador = Client Component
  return <div>Teste</div>
}
```

### Como Ver Erros de Serialização

Erros de serialização aparecem no navegador com mensagem clara:

```
Error: Only plain objects can be passed to Client Components
```

Verifique:

1. Props passadas para Client Components
2. Tipos de dados (funções, classes, componentes)
3. Instâncias de Date (converter para string)

### Como Debugar Validação Zod

```typescript
const result = schema.safeParse(data)
if (!result.success) {
  console.error('Erro de validação Zod:')
  console.error('Dados recebidos:', JSON.stringify(data, null, 2))
  console.error('Erros:', result.error.errors)
  result.error.errors.forEach((err) => {
    console.error(`Campo: ${err.path.join('.')}`)
    console.error(`Erro: ${err.message}`)
  })
}
```

---

## 📚 Referências

- [Next.js 15 Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js 15 Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [Zod Documentation](https://zod.dev/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

---

**Última Atualização:** 11/02/2026  
**Versão:** 1.0  
**Autor:** Kiro AI Assistant
