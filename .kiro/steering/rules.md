---
inclusion: always
---

# Regras Gerais - Vinha Admin Center

## Idioma

**CRÍTICO:** SEMPRE responda ao usuário em português brasileiro (pt-BR).

| Contexto                    | Idioma |
| --------------------------- | ------ |
| Respostas ao usuário        | pt-BR  |
| Código (variáveis/funções)  | inglês |
| Strings visíveis ao usuário | pt-BR  |
| Mensagens de erro/validação | pt-BR  |

## Nomenclatura

```
PascalCase.tsx       → Componentes (ContributionForm.tsx)
route.ts             → Rotas API
use-kebab-case.ts    → Hooks (use-upload.ts)
kebab-case.ts        → Utilitários (s3-client.ts)
camelCase            → Variáveis/funções
PascalCase           → Classes/Componentes
SCREAMING_SNAKE_CASE → Constantes
```

## Regras Críticas

### TypeScript

```typescript
// ❌ PROIBIDO
const data: any = await fetch()

// ✅ OBRIGATÓRIO
interface UserData {
  id: string
}
const data: UserData = await fetch()
```

### Queries Drizzle

```typescript
// ✅ SEMPRE use .limit(1) para registro único
const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

if (!user) {
  return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
}
```

### Tratamento de Erros

```typescript
// ❌ PROIBIDO - catch vazio
try {
  await op()
} catch {}

// ✅ OBRIGATÓRIO - sempre logar
try {
  await op()
} catch (error) {
  console.error('Contexto:', error)
  return NextResponse.json({ error: 'Mensagem em pt-BR' }, { status: 500 })
}
```

### Variáveis de Ambiente

```typescript
// ✅ SEMPRE validar
const key = process.env.API_KEY
if (!key) throw new Error('API_KEY não configurada')
```

## Checklist Pré-Commit

- ✅ Sem tipos `any`
- ✅ Sem catch vazios
- ✅ Validação Zod em APIs
- ✅ Queries usam `.limit()`
- ✅ Sem `console.log()` de debug
- ✅ Mensagens em pt-BR
