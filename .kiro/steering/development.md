# Development Guidelines - Vinha Admin Center

## Status do Projeto

**Versão:** 0.3.0 (Production Ready)  
**Qualidade:** 100% estável - todos os bugs críticos resolvidos  
**Última Atualização:** 2026-01-20

## Regras Críticas de Desenvolvimento

### 1. TypeScript Strict Mode

**SEMPRE** usar tipos explícitos, nunca `any`:

```typescript
// ❌ EVITAR
const data: any = await fetch()

// ✅ CORRETO
interface ApiResponse {
  success: boolean
  data: UserData
}
const data: ApiResponse = await fetch()
```

### 2. Autenticação

**Sistema Único:** JWT stateless apenas (`@/lib/jwt`)

```typescript
// ✅ PADRÃO para todas as API routes protegidas
import { validateRequest } from '@/lib/jwt'

export async function GET() {
  const { user } = await validateRequest()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ... resto do código
}
```

**IMPORTANTE:** Não usar Lucia ou outros sistemas de autenticação.

### 3. Error Handling

**NUNCA** silenciar erros sem logging:

```typescript
// ✅ SEMPRE capturar e logar
try {
  await operation()
} catch (error) {
  console.error('Context:', error)
  throw error // ou retornar erro formatado
}

// ❌ NUNCA fazer isso
try {
  await operation()
} catch {}  // RUIM!
```

### 4. Consultas ao Banco (Drizzle)

**SEMPRE** usar `.limit(1)` para queries únicas:

```typescript
// ✅ CORRETO
const [user] = await db
  .select()
  .from(users)
  .where(eq(users.id, userId))
  .limit(1)  // IMPORTANTE!

if (!user) {
  // Handle not found
}
```

### 5. Environment Variables

**SEMPRE** validar no início:

```typescript
// ✅ CORRETO
const REQUIRED_VAR = process.env.REQUIRED_VAR
if (!REQUIRED_VAR) {
  throw new Error('REQUIRED_VAR is required')
}

// ❌ PERIGOSO
const VAR = process.env.VAR || ''
```

### 6. Middleware e Edge Runtime

**NUNCA** usar `AbortSignal.timeout()` - não é compatível com Edge Runtime:

```typescript
// ✅ CORRETO (compatível com Edge)
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 1000)
try {
  const response = await fetch(url, { signal: controller.signal })
  clearTimeout(timeoutId)
} catch (error) {
  clearTimeout(timeoutId)
}

// ❌ EVITAR (não funciona em Edge Runtime)
const response = await fetch(url, { 
  signal: AbortSignal.timeout(1000) 
})
```

### 7. Security Headers

**SEMPRE** adicionar em responses do middleware:

```typescript
res.headers.set('X-Content-Type-Options', 'nosniff')
res.headers.set('X-Frame-Options', 'SAMEORIGIN')
res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
res.headers.set('X-XSS-Protection', '1; mode=block')
```

### 8. Upload de Arquivos

**SEMPRE** validar tamanho e tipo:

```typescript
const MAX_SIZE = 10 * 1024 * 1024 // 10MB
if (file.size > MAX_SIZE) {
  return NextResponse.json({ error: 'File too large' }, { status: 413 })
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
if (!ALLOWED_TYPES.includes(file.type)) {
  return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
}
```

## Estrutura Padrão de API Routes

```typescript
export async function GET(request: NextRequest) {
  try {
    // 1. Validar autenticação
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validar input (Zod)
    const validatedData = schema.parse(data)

    // 3. Buscar dados
    const result = await db.select()...

    // 4. Retornar resposta
    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    // 5. Error handling específico
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## Convenções de Nomenclatura

### Arquivos
- **Componentes React:** `PascalCase.tsx` (ex: `ContributionForm.tsx`)
- **API Routes:** `route.ts` (dentro de pasta com nome da rota)
- **Hooks:** `use-kebab-case.ts` (ex: `use-upload.ts`)
- **Libs/Utils:** `kebab-case.ts` (ex: `s3-client.ts`)

### Variáveis e Funções
```typescript
// ✅ camelCase para variáveis e funções
const userData = await fetchUser()
async function handleSubmit() {}

// ✅ PascalCase para componentes e classes
class S3Service {}
function UserProfile() {}

// ✅ SCREAMING_SNAKE_CASE para constantes
const MAX_FILE_SIZE = 10 * 1024 * 1024
const API_BASE_URL = 'https://api.example.com'
```

## Checklist Pré-Commit

- [ ] Todos os tipos estão corretos (sem `any`)
- [ ] Error handling adequado (sem `catch {}` vazio)
- [ ] Validação de input (Zod para APIs)
- [ ] Logs informativos (não silenciar erros)
- [ ] Autenticação em rotas protegidas
- [ ] Environment variables validadas
- [ ] Queries usam `.limit()` quando apropriado
- [ ] Headers de segurança adicionados
- [ ] Sem `console.log` de debug (usar console.error/warn)

## Checklist Pré-Deploy

### CRÍTICO
- [x] `next.config.ts` com `ignoreBuildErrors: false` ✅
- [ ] `next.config.ts` com `ignoreDuringBuilds: false` (⚠️ temporariamente true)
- [x] Sistema de autenticação unificado (JWT apenas) ✅
- [x] Middleware sem `AbortSignal.timeout()` ✅
- [x] API maintenance-check funcionando ✅

### IMPORTANTE
- [ ] Todas env vars de produção configuradas
- [ ] Redis URL configurado (para notificações)
- [ ] S3/SES credenciais separadas e corretas
- [ ] CRON_SECRET configurado
- [ ] JWT_SECRET forte e único

### RECOMENDADO
- [ ] Backup do banco configurado
- [ ] Monitoring/logging (Sentry, etc)
- [ ] Rate limiting em APIs públicas
- [ ] Cleanup de sessões agendado

## Correções Aplicadas (Histórico)

### Bug #1: Build Configuration ✅
- **Status:** RESOLVIDO
- **Fix:** `ignoreBuildErrors: false` em `next.config.ts`
- **Nota:** `ignoreDuringBuilds` ainda está `true` temporariamente

### Bug #2: Autenticação Duplicada ✅
- **Status:** RESOLVIDO
- **Fix:** Removido Lucia, mantido apenas JWT
- **Arquivo:** `src/lib/jwt.ts` (único sistema)

### Bug #3: Middleware AbortSignal ✅
- **Status:** RESOLVIDO
- **Fix:** Usando `AbortController` compatível com Edge Runtime
- **Arquivo:** `src/middleware.ts`

### Bug #4: API Maintenance Check ✅
- **Status:** RESOLVIDO
- **Fix:** Implementado consulta ao banco
- **Arquivo:** `src/app/api/v1/maintenance-check/route.ts`

## Melhorias Pendentes

### Alta Prioridade
1. Validação de upload de arquivos (tamanho e tipo)
2. Cron job para cleanup de sessões expiradas
3. Rate limiting em APIs públicas

### Média Prioridade
4. Testes automatizados (unit + integration)
5. Monitoring/observability (Sentry, DataDog)
6. Documentação de APIs (OpenAPI/Swagger)

### Baixa Prioridade
7. Otimização de performance e caching
8. Melhorias de UX baseadas em feedback

## Recursos Úteis

### Documentação Interna
- `/docs/DB_DOCS.md` - Schema do banco
- `/docs/EMAIL_SYSTEM.md` - Sistema de emails
- `/docs/CIELO_API_GUIDE.md` - Integração Cielo
- `/VERCEL_DEPLOY.md` - Deploy na Vercel

### Documentação Externa
- [Next.js 15](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview)
- [Zod](https://zod.dev/)
- [JWT](https://jwt.io/introduction)
