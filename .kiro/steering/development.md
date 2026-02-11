---
inclusion: always
---

# Development Guidelines - Vinha Admin Center

**CRITICAL:** Always respond to users in Portuguese (pt-BR). This is a production system - prioritize stability, data integrity, and security.

## Core Development Rules

### TypeScript

- NEVER use `any` - always define explicit types/interfaces
- Use strict mode - all types must be correct before commit
- Prefer interfaces for object shapes, types for unions/primitives

### Authentication Pattern

- ONLY use JWT via `@/lib/jwt` - `validateRequest()` function
- DO NOT introduce Lucia, NextAuth, or other auth systems
- All protected API routes MUST validate JWT first:

```typescript
import { validateRequest } from '@/lib/jwt'

export async function GET() {
  const { user } = await validateRequest()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ... implementation
}
```

### Error Handling

- NEVER use empty catch blocks - always log errors with context
- Use `console.error()` for errors, `console.warn()` for warnings
- Remove `console.log()` debug statements before commit
- Return structured error responses with appropriate HTTP status codes

### Database Queries (Drizzle ORM)

- ALWAYS use `.limit(1)` for single-record queries
- Use array destructuring for single results: `const [user] = await db.select()...`
- Check for null/undefined after queries before accessing properties
- Use transactions for multi-step operations that must be atomic

### Environment Variables

- ALWAYS validate required env vars at module initialization
- Throw descriptive errors if required vars are missing
- Never use fallback empty strings for required configuration

### Edge Runtime Compatibility

- NEVER use `AbortSignal.timeout()` - not compatible with Edge Runtime
- Use `AbortController` with manual timeout instead:

```typescript
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 1000)
try {
  const response = await fetch(url, { signal: controller.signal })
  clearTimeout(timeoutId)
} catch (error) {
  clearTimeout(timeoutId)
  throw error
}
```

### Security Requirements

- Add security headers to all middleware responses
- Validate file uploads: type, size (max 10MB), and extension
- Use Zod schemas to validate all API inputs
- Never expose sensitive data in error messages or logs
- Apply rate limiting to public endpoints

## Standard API Route Structure

```typescript
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Input validation (Zod)
    const validatedData = schema.parse(data)

    // 3. Database query
    const result = await db.select().from(table).where(...)

    // 4. Success response
    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    // 5. Error handling
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

## Naming Conventions

**Files:**

- React components: `PascalCase.tsx` (e.g., `ContributionForm.tsx`)
- API routes: `route.ts` (in folder named after route)
- Hooks: `use-kebab-case.ts` (e.g., `use-upload.ts`)
- Utilities/libs: `kebab-case.ts` (e.g., `s3-client.ts`)

**Code:**

- Variables/functions: `camelCase`
- Components/classes: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Database tables: `snake_case` (SQL), `camelCase` (TypeScript)

## Role-Based Access Control

This system has 5 distinct roles with isolated routes and permissions:

- **Admin** (`/admin/*`) - Full system access
- **Manager** (`/manager/*`) - Multi-region supervision, filtered by assigned regions
- **Supervisor** (`/supervisor/*`) - Regional management, filtered by assigned region
- **Pastor** (`/pastor/*`) - Personal account only
- **Igreja** (`/igreja/*`) - Church account only

When implementing features:

- Verify role permissions in API routes
- Filter database queries by user's scope (region, church, etc.)
- Never expose data outside user's permission scope

## Payment Integration

### Cielo API

- Transactions MUST be idempotent - check status before creating charges
- Use integers for monetary values (centavos) - NEVER floats
- Webhooks may arrive before user redirect - handle async state properly
- Payment failures require manual review - DO NOT auto-retry
- See `/docs/integrations/CIELO_API_GUIDE.md` for detailed integration patterns

### Bradesco API (REST)

- **PIX**: Use `createBradescoPixPayment()` from `@/lib/bradesco`
- **Boleto**: Use `createBradescoBoletoPayment()` from `@/lib/bradesco`
- **Query**: Use `queryBradescoPixPayment()` and `queryBradescoBoletoPayment()`
- **Authentication**: OAuth 2.0 with mTLS certificate (automatic via `getBradescoToken()`)
- **CRITICAL**: DO NOT implement CNAB file generation - system uses REST API only
- **Certificate**: Digital certificate (.pfx/.pem) required for mTLS authentication
- **Webhooks**: `/api/v1/webhooks/bradesco` handles PIX and Boleto notifications
- All monetary values in centavos (integers)
- Idempotency via unique txid (PIX) and nossoNumero (Boleto)

## Pre-Commit Checklist

Before committing code, verify:

- No `any` types - all types are explicit
- No empty catch blocks - all errors are logged
- Zod validation on all API inputs
- Authentication on protected routes
- Environment variables validated
- Database queries use `.limit()` appropriately
- Security headers added where needed
- No debug `console.log()` statements

## Key Documentation

- `/docs/development/DB_DOCS.md` - Database schema reference
- `/docs/integrations/EMAIL_SYSTEM.md` - Email/notification system
- `/docs/integrations/CIELO_API_GUIDE.md` - Payment integration
- `/docs/development/FRAUD_MONITORING_SYSTEM.md` - Fraud detection
- `/docs/deploy/VERCEL_DEPLOY.md` - Deployment guide
