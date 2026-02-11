---
inclusion: manual
---

# Skill: Next.js 15 Best Practices

## Objetivo

Garantir uso correto e otimizado do Next.js 15 com App Router no projeto Vinha Admin Center.

## Server Components vs Client Components

### Server Components (Padrão)

Use por padrão para melhor performance:

```typescript
// app/admin/dashboard/page.tsx
import { db } from '@/lib/db';

// Componente assíncrono - busca dados no servidor
export default async function DashboardPage() {
  const stats = await db.query.contributions.findMany();

  return (
    <div>
      <h1>Dashboard</h1>
      <StatsDisplay data={stats} />
    </div>
  );
}
```

### Client Components

Use apenas quando necessário:

```typescript
'use client';

import { useState } from 'react';

// Necessário para interatividade
export function InteractiveForm() {
  const [value, setValue] = useState('');

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
```

### Quando usar Client Components:

- Hooks do React (useState, useEffect, useContext)
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, window)
- Bibliotecas que dependem do cliente

## Data Fetching

### Server Components (Recomendado)

```typescript
// Busca dados diretamente no componente
export default async function UsersPage() {
  const users = await db.query.users.findMany();

  return <UserList users={users} />;
}
```

### Server Actions

```typescript
// app/actions/user.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function createUser(formData: FormData) {
  const name = formData.get('name') as string;

  await db.insert(users).values({ name });

  // Revalidar cache
  revalidatePath('/admin/users');

  return { success: true };
}

// Usar no componente
'use client';

export function UserForm() {
  return (
    <form action={createUser}>
      <input name="name" />
      <button type="submit">Criar</button>
    </form>
  );
}
```

## Layouts e Templates

### Layout Compartilhado

```typescript
// app/admin/layout.tsx
import { Sidebar } from '@/components/sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

### Loading States

```typescript
// app/admin/dashboard/loading.tsx
export default function Loading() {
  return <div>Carregando dashboard...</div>;
}
```

### Error Boundaries

```typescript
// app/admin/dashboard/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Algo deu errado!</h2>
      <button onClick={reset}>Tentar novamente</button>
    </div>
  );
}
```

## Metadata e SEO

```typescript
// app/admin/dashboard/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - Vinha Admin',
  description: 'Painel administrativo do sistema',
}

// Ou dinâmico
export async function generateMetadata({ params }): Promise<Metadata> {
  const user = await getUser(params.id)

  return {
    title: `${user.name} - Vinha Admin`,
  }
}
```

## Caching e Revalidação

### Revalidar após mutação

```typescript
'use server'

import { revalidatePath, revalidateTag } from 'next/cache'

export async function updateUser(id: string, data: UserData) {
  await db.update(users).set(data).where(eq(users.id, id))

  // Revalidar página específica
  revalidatePath(`/admin/users/${id}`)

  // Ou revalidar por tag
  revalidateTag('users')
}
```

### Configurar cache em fetch

```typescript
// Revalidar a cada 1 hora
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 3600 },
})

// Sem cache
const data = await fetch('https://api.example.com/data', {
  cache: 'no-store',
})
```

## Route Handlers (API Routes)

```typescript
// app/api/users/route.ts
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')

  const users = await db.query.users.findMany()

  return Response.json(users)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Validar e processar

  return Response.json({ success: true })
}
```

## Parallel Routes e Intercepting Routes

### Parallel Routes

```typescript
// app/admin/@modal/(..)photo/[id]/page.tsx
// Mostra modal interceptando a rota
export default function PhotoModal({ params }) {
  return <Modal><Photo id={params.id} /></Modal>;
}
```

## Streaming e Suspense

```typescript
import { Suspense } from 'react';

export default function Page() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Componente lento com fallback */}
      <Suspense fallback={<LoadingSkeleton />}>
        <SlowComponent />
      </Suspense>

      {/* Resto da página carrega normalmente */}
      <FastComponent />
    </div>
  );
}
```

## Otimizações de Performance

### Dynamic Imports

```typescript
import dynamic from 'next/dynamic';

// Carregar componente apenas no cliente
const HeavyChart = dynamic(() => import('@/components/chart'), {
  ssr: false,
  loading: () => <p>Carregando gráfico...</p>,
});
```

### Image Optimization

```typescript
import Image from 'next/image';

export function UserAvatar({ src }: { src: string }) {
  return (
    <Image
      src={src}
      alt="Avatar"
      width={40}
      height={40}
      className="rounded-full"
      priority={false} // Lazy load
    />
  );
}
```

### Font Optimization

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

## Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Verificar autenticação
  const token = request.cookies.get('auth-token')

  if (!token && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/gerente/:path*'],
}
```

## Boas Práticas Gerais

1. **Preferir Server Components** - Melhor performance e SEO
2. **Usar Server Actions** - Simplifica mutações de dados
3. **Implementar Loading States** - Melhor UX
4. **Configurar Error Boundaries** - Tratamento de erros robusto
5. **Otimizar Imagens** - Usar next/image
6. **Lazy Load quando possível** - Dynamic imports
7. **Revalidar cache apropriadamente** - Dados sempre atualizados
8. **Usar Suspense para streaming** - Carregamento progressivo
9. **Implementar Metadata** - SEO e compartilhamento social
10. **Proteger rotas com Middleware** - Segurança centralizada

## Checklist Next.js

- [ ] Server Components usados por padrão
- [ ] Client Components apenas quando necessário
- [ ] Server Actions para mutações
- [ ] Loading states implementados
- [ ] Error boundaries configurados
- [ ] Metadata definida
- [ ] Imagens otimizadas com next/image
- [ ] Cache revalidado após mutações
- [ ] Middleware protegendo rotas privadas
- [ ] Dynamic imports para componentes pesados
