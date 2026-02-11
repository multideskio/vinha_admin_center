---
inclusion: always
---

# Troubleshooting - Next.js 15 & Server Components

## 🎯 Propósito

Este documento centraliza soluções para problemas comuns encontrados no desenvolvimento com Next.js 15, Server Components e o stack do Vinha Admin Center. Consulte este guia ANTES de implementar soluções alternativas.

---

## 🚨 Problemas Críticos e Soluções

### 1. Erro 401 em Fetch de Server Components

**Sintoma:**

```
GET /api/v1/endpoint 401 Unauthorized
Error: Falha ao carregar dados
```

**Causa Raiz:**
Fetch em Server Components não envia cookies de autenticação automaticamente.

**❌ NUNCA FAZER:**

```typescript
// Server Component
export default async function Page() {
  // Cookies não são enviados!
  const response = await fetch('http://localhost:9002/api/v1/data')
  const data = await response.json()
  return <Component data={data} />
}
```

**✅ SOLUÇÃO RECOMENDADA: Buscar Diretamente do Banco**

```typescript
import { db } from '@/db/drizzle'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export default async function Page() {
  // Busca direta no banco - SEMPRE preferir
  const data = await db.query.users.findMany({
    where: eq(users.role, 'admin'),
  })
  return <Component data={data} />
}
```

**✅ SOLUÇÃO ALTERNATIVA: Usar cookies() do Next.js**

```typescript
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = cookies()
  const token = cookieStore.get('auth-token')

  const response = await fetch('http://localhost:9002/api/v1/data', {
    headers: {
      Cookie: `auth-token=${token?.value}`,
    },
    cache: 'no-store',
  })
  const data = await response.json()
  return <Component data={data} />
}
```

**Por que a solução do banco é melhor:**

- Melhor performance (sem requisição HTTP interna)
- Mais seguro (dados buscados diretamente)
- Evita problemas de autenticação
- Código mais limpo e direto

---

### 2. Erro de Serialização de Componentes

**Sintoma:**

```
Error: Only plain objects can be passed to Client Components from Server Components.
Classes or other objects with methods are not supported.
<Component icon={LucideIcon} />
```

**Causa Raiz:**
Componentes Lucide (e outras classes) não podem ser serializados entre Server e Client Components.

**❌ NUNCA FAZER:**

```typescript
import { ArrowRight } from 'lucide-react'
import { ClientHeader } from './client-header'

// Server Component
export default async function Page() {
  return (
    <ClientHeader
      icon={ArrowRight} // ❌ Erro de serialização
      onClick={() => {}} // ❌ Funções também não podem
    />
  )
}
```

**✅ SOLUÇÃO 1: Renderizar no Server Component**

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

**✅ SOLUÇÃO 2: Passar String e Mapear**

```typescript
// Server Component
export default async function Page() {
  return <ClientHeader iconName="arrow-right" />
}

// Client Component
'use client'
import { ArrowRight, User, Settings } from 'lucide-react'

const ICON_MAP = {
  'arrow-right': ArrowRight,
  'user': User,
  'settings': Settings,
} as const

export function ClientHeader({ iconName }: { iconName: keyof typeof ICON_MAP }) {
  const Icon = ICON_MAP[iconName]
  return <Icon className="h-6 w-6" />
}
```

**Regra Geral:**
Apenas dados serializáveis podem ser passados entre Server e Client Components:

- ✅ Strings, números, booleanos
- ✅ Arrays e objetos simples
- ✅ Null e undefined
- ❌ Funções
- ❌ Classes
- ❌ Componentes React
- ❌ Instâncias de Date (converter para string)

---

### 3. Erro de Validação Zod com Dados Vazios

**Sintoma:**

```
Erro de Validação
Dados recebidos da API estão em formato inválido
```

**Causa Raiz:**
Schema Zod muito rígido, não aceita arrays vazios ou campos opcionais.

**❌ SCHEMA RÍGIDO:**

```typescript
const schema = z.object({
  data: z.array(itemSchema).min(1), // ❌ Requer pelo menos 1 item
  pagination: z.object({
    page: z.number(),
    total: z.number(), // ❌ Sempre obrigatório
  }), // ❌ Objeto sempre obrigatório
})
```

**✅ SCHEMA FLEXÍVEL:**

```typescript
const schema = z.object({
  data: z.array(itemSchema), // ✅ Aceita array vazio
  pagination: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number().optional(), // ✅ Campo opcional
    })
    .optional(), // ✅ Objeto inteiro opcional
})
```

**✅ SEMPRE USAR safeParse():**

```typescript
const result = schema.safeParse(data)

if (!result.success) {
  console.error('Erro de validação Zod:')
  console.error('Dados recebidos:', JSON.stringify(data, null, 2))
  console.error('Erros:', result.error.errors)

  toast({
    title: 'Erro de Validação',
    description: 'Dados em formato inválido',
    variant: 'destructive',
  })
  return
}

const validData = result.data // Type-safe
```

**Regras para Schemas Zod:**

1. Sempre considere arrays vazios
2. Marque campos opcionais com `.optional()`
3. Use `safeParse()` ao invés de `parse()`
4. Trate erros adequadamente
5. Teste com dados vazios e casos extremos

---

### 4. Hooks em Server Components

**Sintoma:**

```
Error: useState can only be used in Client Components
Error: useEffect can only be used in Client Components
```

**Causa Raiz:**
Tentativa de usar hooks do React em Server Components.

**❌ NUNCA FAZER:**

```typescript
// Server Component (sem 'use client')
export default async function Page() {
  const [count, setCount] = useState(0) // ❌ Erro
  useEffect(() => {}, []) // ❌ Erro
  return <div>{count}</div>
}
```

**✅ SOLUÇÃO:**

```typescript
// Server Component
export default async function Page() {
  const data = await db.query.users.findMany()
  return <ClientCounter initialCount={data.length} />
}

// Client Component
'use client'
import { useState, useEffect } from 'react'

export function ClientCounter({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount) // ✅ OK

  useEffect(() => {
    // ✅ OK
  }, [])

  return <div>{count}</div>
}
```

**Quando usar Client Components:**

- Interatividade (onClick, onChange, etc.)
- Hooks do React (useState, useEffect, etc.)
- APIs do navegador (localStorage, window, etc.)
- Bibliotecas que dependem do navegador

---

### 5. Erro de Hidratação (Hydration Mismatch)

**Sintoma:**

```
Error: Hydration failed because the server rendered text didn't match the client.
Text content does not match: "11/02/2026, 16:03:17" vs "11/02/2026, 16:03:16"
```

**Causa Raiz:**
Valores que mudam entre servidor e cliente (Date.now(), Math.random(), etc.)

**❌ NUNCA FAZER:**

```typescript
'use client'
export function Component() {
  const [time, setTime] = useState(new Date().toLocaleString()) // ❌ Erro
  return <div>{time}</div>
}
```

**✅ SOLUÇÃO 1: Inicializar como null**

```typescript
'use client'
export function Component() {
  const [time, setTime] = useState<string | null>(null)

  useEffect(() => {
    setTime(new Date().toLocaleString())
  }, [])

  return <div>{time || 'Carregando...'}</div>
}
```

**✅ SOLUÇÃO 2: Passar do Server Component**

```typescript
// Server Component
export default async function Page() {
  const serverTime = new Date().toISOString()
  return <ClientComponent time={serverTime} />
}

// Client Component
'use client'
export function ClientComponent({ time }: { time: string }) {
  return <div>{new Date(time).toLocaleString()}</div>
}
```

---

## 📋 Checklist de Implementação

### Ao Criar Server Component com Dados

- [ ] Buscar dados diretamente do banco (não usar fetch interno)
- [ ] Validar autenticação antes de buscar dados
- [ ] Formatar dados no servidor
- [ ] Passar apenas dados serializáveis como props
- [ ] Renderizar ícones Lucide no Server Component
- [ ] Não usar hooks do React

### Ao Criar Client Component

- [ ] Marcar com `'use client'` no topo
- [ ] Receber apenas dados serializáveis como props
- [ ] Não fazer busca de dados (receber via props)
- [ ] Usar hooks apenas quando necessário
- [ ] Lazy loading se componente for pesado
- [ ] Evitar valores dinâmicos na renderização inicial

### Ao Criar Schemas Zod

- [ ] Campos opcionais marcados com `.optional()`
- [ ] Arrays aceitam valores vazios
- [ ] Objetos aninhados opcionais quando apropriado
- [ ] Usar `safeParse()` ao invés de `parse()`
- [ ] Implementar tratamento de erros
- [ ] Testar com dados vazios

---

## 🔍 Como Debugar

### Identificar Server vs Client Component

```typescript
export default function MyComponent() {
  console.log('Onde isso aparece?')
  // Terminal = Server Component
  // Navegador = Client Component
  return <div>Teste</div>
}
```

### Debugar Erros de Serialização

Verifique:

1. Props passadas para Client Components
2. Tipos de dados (funções, classes, componentes)
3. Instâncias de Date (converter para string)
4. Componentes Lucide (renderizar no Server)

### Debugar Validação Zod

```typescript
const result = schema.safeParse(data)
if (!result.success) {
  console.error('Dados recebidos:', JSON.stringify(data, null, 2))
  console.error('Erros:', result.error.errors)
  result.error.errors.forEach((err) => {
    console.error(`Campo: ${err.path.join('.')} - Erro: ${err.message}`)
  })
}
```

---

## 🎯 Regras de Ouro

1. **Server Components por padrão** - Use `'use client'` apenas quando necessário
2. **Buscar do banco** - Evite fetch para APIs internas em Server Components
3. **Dados serializáveis** - Apenas objetos simples entre Server e Client
4. **Schemas flexíveis** - Zod deve aceitar casos extremos
5. **safeParse sempre** - Nunca use `parse()` diretamente
6. **Renderizar ícones no Server** - Não passe componentes Lucide como props
7. **Evitar valores dinâmicos** - Date.now(), Math.random() causam hidratação

---

## 📚 Documentação Relacionada

- [Server Components Guide](../../docs/development/SERVER_COMPONENTS_GUIDE.md)
- [Transactions Refactoring](../../docs/development/TRANSACTIONS_REFACTORING.md)
- [Dashboard Refactoring](../../docs/development/DASHBOARD_REFACTORING.md)

---

**Última Atualização:** 11/02/2026  
**Versão:** 1.0  
**Autor:** Kiro AI Assistant

**IMPORTANTE:** Este documento deve ser consultado SEMPRE que encontrar erros relacionados a Server Components, autenticação, serialização ou validação Zod.
