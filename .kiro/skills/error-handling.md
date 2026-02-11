---
inclusion: manual
---

# Skill: Tratamento de Erros

## Objetivo

Implementar tratamento de erros robusto e consistente em todo o sistema.

## Padrões de Tratamento

### 1. Server Actions

```typescript
'use server'

import { z } from 'zod'

export async function createUser(formData: FormData) {
  try {
    // Validação
    const schema = z.object({
      name: z.string().min(3),
      email: z.string().email(),
    })

    const data = schema.parse({
      name: formData.get('name'),
      email: formData.get('email'),
    })

    // Lógica de negócio
    const user = await db.insert(users).values(data).returning()

    return {
      success: true,
      data: user[0],
    }
  } catch (error) {
    // Erro de validação Zod
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Dados inválidos',
        details: error.errors,
      }
    }

    // Erro de banco de dados
    if (error.code === '23505') {
      // Unique violation
      return {
        success: false,
        error: 'Email já cadastrado',
      }
    }

    // Erro genérico
    console.error('Erro ao criar usuário:', error)
    return {
      success: false,
      error: 'Erro ao criar usuário. Tente novamente.',
    }
  }
}
```

### 2. API Routes

```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Processar
    const result = await processData(body)

    return Response.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Erro na API:', error)

    // Retornar erro apropriado
    if (error instanceof ValidationError) {
      return Response.json({ error: error.message }, { status: 400 })
    }

    if (error instanceof UnauthorizedError) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 })
    }

    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
```

### 3. Componentes Client

```typescript
'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export function UserForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);

    try {
      const result = await createUser(formData);

      if (result.success) {
        toast.success('Usuário criado com sucesso!');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Erro inesperado. Tente novamente.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit}>
      {/* Campos */}
    </form>
  );
}
```

### 4. Erros Customizados

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Não autorizado') {
    super(message, 'UNAUTHORIZED', 401)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso não encontrado') {
    super(message, 'NOT_FOUND', 404)
  }
}
```

### 5. Error Boundaries

```typescript
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Algo deu errado!</h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Tentar novamente
      </button>
    </div>
  );
}
```

### 6. Logging Estruturado

```typescript
// lib/logger.ts
export const logger = {
  error: (message: string, error: unknown, context?: object) => {
    console.error({
      level: 'error',
      message,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      ...context,
    })
  },

  warn: (message: string, context?: object) => {
    console.warn({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...context,
    })
  },

  info: (message: string, context?: object) => {
    console.log({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...context,
    })
  },
}

// Uso
logger.error('Falha ao processar pagamento', error, {
  userId,
  amount,
  method: 'credit_card',
})
```

### 7. Retry Logic

```typescript
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
): Promise<T> {
  let lastError: Error

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }

  throw lastError!
}

// Uso
const result = await retryOperation(() => fetchExternalAPI(), 3, 1000)
```

## Checklist de Tratamento de Erros

- [ ] Try-catch em todas as operações assíncronas
- [ ] Mensagens de erro amigáveis para o usuário
- [ ] Logs detalhados para debugging
- [ ] Validação de entrada com Zod
- [ ] Status HTTP apropriados em API Routes
- [ ] Error boundaries em componentes críticos
- [ ] Retry logic para operações externas
- [ ] Não expor detalhes sensíveis em erros
- [ ] Toast/notificações para feedback visual
- [ ] Tratamento específico por tipo de erro
