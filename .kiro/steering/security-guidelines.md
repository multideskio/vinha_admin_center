---
inclusion: always
---

# Diretrizes de Segurança - Vinha Admin Center

## Princípios de Segurança

### 1. Autenticação e Autorização

#### JWT e Cookies Seguros

```typescript
// Sempre usar cookies httpOnly e secure
import { cookies } from 'next/headers'

export async function setAuthCookie(token: string) {
  cookies().set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  })
}
```

#### Verificação de Roles

```typescript
// Sempre verificar permissões no servidor
export async function adminOnlyAction() {
  const user = await getCurrentUser()

  if (user.role !== 'admin') {
    throw new Error('Acesso negado')
  }

  // Lógica protegida
}
```

### 2. Validação de Entrada

#### Sanitização de Dados

```typescript
import { z } from 'zod'

// Validar TODOS os inputs do usuário
const inputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().email().toLowerCase(),
  // Remover caracteres perigosos
  description: z
    .string()
    .max(500)
    .transform((str) => str.replace(/<script>/gi, '')),
})

// Nunca confiar em dados do cliente
export async function processUserInput(data: unknown) {
  const validated = inputSchema.parse(data)
  // Usar dados validados
}
```

#### Proteção contra SQL Injection

```typescript
// ✅ Usar Drizzle ORM (protegido por padrão)
const users = await db.query.users.findMany({
  where: eq(users.email, userEmail),
})

// ❌ NUNCA usar SQL raw com interpolação direta
// const users = await db.execute(`SELECT * FROM users WHERE email = '${userEmail}'`);
```

### 3. Proteção de Dados Sensíveis

#### Variáveis de Ambiente

```typescript
// Nunca expor secrets no cliente
// ✅ Usar apenas no servidor
const apiKey = process.env.CIELO_API_KEY

// ❌ Não fazer isso
// const apiKey = 'hardcoded-key';
```

#### Logs Seguros

```typescript
// ✅ Não logar dados sensíveis
console.log('Processando pagamento para usuário:', userId)

// ❌ Nunca logar
// console.log('Dados do cartão:', cardData);
// console.log('Senha:', password);
// console.log('Token:', authToken);
```

### 4. Upload de Arquivos

#### Validação de Tipo e Tamanho

```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function validateUpload(file: File) {
  // Verificar tamanho
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Arquivo muito grande')
  }

  // Verificar tipo MIME
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Tipo de arquivo não permitido')
  }

  // Verificar extensão
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
    throw new Error('Extensão não permitida')
  }

  return true
}
```

### 5. Rate Limiting

```typescript
// Implementar rate limiting em endpoints críticos
import { ratelimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'

  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return Response.json(
      { error: 'Muitas requisições. Tente novamente mais tarde.' },
      { status: 429 },
    )
  }

  // Processar requisição
}
```

### 6. Proteção contra XSS

```typescript
// Usar React (escapa automaticamente)
// ✅ Seguro
<div>{userInput}</div>

// ❌ Perigoso - evitar dangerouslySetInnerHTML
// <div dangerouslySetInnerHTML={{ __html: userInput }} />

// Se necessário usar HTML, sanitizar primeiro
import DOMPurify from 'isomorphic-dompurify';

const cleanHTML = DOMPurify.sanitize(userInput);
<div dangerouslySetInnerHTML={{ __html: cleanHTML }} />
```

### 7. CSRF Protection

```typescript
// Next.js protege automaticamente Server Actions
// Para API Routes, usar tokens CSRF

import { csrf } from '@/lib/csrf'

export async function POST(request: Request) {
  const token = request.headers.get('x-csrf-token')

  if (!csrf.verify(token)) {
    return Response.json({ error: 'Token CSRF inválido' }, { status: 403 })
  }

  // Processar requisição
}
```

### 8. Webhooks Seguros

```typescript
// Sempre validar assinatura de webhooks
import crypto from 'crypto'

export async function validateWebhookSignature(payload: string, signature: string, secret: string) {
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex')

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
}
```

### 9. Headers de Segurança

```typescript
// next.config.ts
export default {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}
```

### 10. Auditoria e Logs

```typescript
// Registrar ações importantes
export async function auditLog(action: string, userId: string, details: object) {
  await db.insert(auditLogs).values({
    action,
    userId,
    details: JSON.stringify(details),
    timestamp: new Date(),
    ip: getClientIP(),
  })
}

// Usar em operações críticas
await auditLog('user_deleted', adminId, { deletedUserId })
await auditLog('payment_processed', userId, { amount, method })
```

## Checklist de Segurança

Antes de fazer deploy ou merge:

- [ ] Todas as entradas de usuário são validadas com Zod
- [ ] Dados sensíveis não são logados
- [ ] Secrets estão em variáveis de ambiente
- [ ] Autenticação e autorização implementadas
- [ ] Rate limiting em endpoints públicos
- [ ] Upload de arquivos validado (tipo, tamanho, extensão)
- [ ] Queries SQL usam ORM (proteção contra injection)
- [ ] Headers de segurança configurados
- [ ] Webhooks validam assinatura
- [ ] Ações críticas são auditadas
- [ ] Cookies usam httpOnly e secure
- [ ] CORS configurado corretamente
- [ ] Sem hardcoded credentials no código

## Reportar Vulnerabilidades

Se encontrar uma vulnerabilidade de segurança:

1. **NÃO** criar issue público
2. Enviar email para: security@multidesk.io
3. Incluir descrição detalhada e steps para reproduzir
4. Aguardar resposta da equipe de segurança
