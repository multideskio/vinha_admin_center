# 🐛 Relatório de Bugs - API Routes & Layouts

> **Data:** 2025-01-XX  
> **Escopo:** Análise completa de `/src/app/api` e layouts  
> **Status:** ✅ 7/8 bugs corrigidos (2025-11-06)  
> **Relatório de Correções:** `docs/API_BUGS_FIXES_2025-11-06.md`

---

## 📊 Resumo Executivo

| Categoria | Quantidade | Severidade | Status |
|-----------|------------|------------|--------|
| **Bugs Críticos** | 2 | 🔴 Alta | ✅ 2/2 Corrigidos |
| **Bugs Médios** | 4 | 🟡 Média | ✅ 3/4 Corrigidos |
| **Bugs Baixos** | 2 | 🟢 Baixa | ✅ 2/2 Corrigidos |
| **Total** | **8** | - | **✅ 7/8 (87.5%)** |

**Última Atualização:** 2025-11-06 - Bugs corrigidos por Cursor AI

---

## 🔴 BUGS CRÍTICOS (2)

### BUG #1: Hardcoded User ID em Notificações ✅ CORRIGIDO
**Arquivo:** `src/app/api/notifications/send/route.ts`  
**Linhas:** 56, 73  
**Severidade:** 🔴 CRÍTICA  
**Status:** ✅ CORRIGIDO em 2025-11-06

**Descrição:**
O endpoint de envio de notificações usa `'temp-user-id'` hardcoded ao invés do ID real do usuário.

**Código Problemático:**
```typescript
result = await notificationService.sendWelcome(
  'temp-user-id', // TODO: Get actual user ID ❌
  recipient.name,
  data?.churchName || 'Nossa Igreja',
  recipient.phone,
  recipient.email
)

result = await notificationService.sendPaymentReminder(
  'temp-user-id', // TODO: Get actual user ID ❌
  recipient.name,
  data.amount,
  data.dueDate,
  recipient.phone,
  recipient.email,
  data.paymentLink
)
```

**Impacto:**
- ❌ Logs de notificação não vinculados ao usuário correto
- ❌ Impossível rastrear histórico de notificações
- ❌ Auditoria comprometida

**Solução:**
```typescript
// Adicionar validação de autenticação
const { user } = await validateRequest()
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// Usar ID real do usuário
result = await notificationService.sendWelcome(
  user.id, // ✅ ID real
  recipient.name,
  data?.churchName || 'Nossa Igreja',
  recipient.phone,
  recipient.email
)
```

---

### BUG #2: Webhook Cielo Retorna 200 Mesmo com Erros ✅ CORRIGIDO
**Arquivo:** `src/app/api/v1/webhooks/cielo/route.ts`  
**Linhas:** 165-170  
**Severidade:** 🔴 CRÍTICA  
**Status:** ✅ CORRIGIDO em 2025-11-06

**Descrição:**
O webhook sempre retorna status 200 mesmo quando ocorrem erros no processamento, mascarando falhas críticas.

**Código Problemático:**
```typescript
} catch (error) {
  console.error('[CIELO_WEBHOOK] Error:', error)
  // Retorna 200 mesmo com erro para não desativar webhook ❌
  return NextResponse.json(
    { success: true, message: 'Webhook received but error processing' },
    { status: 200 }
  )
}
```

**Impacto:**
- ❌ Erros silenciosos no processamento de pagamentos
- ❌ Transações podem ficar em estado inconsistente
- ❌ Dificulta debugging e monitoramento
- ❌ Cielo não é notificada de falhas reais

**Solução:**
```typescript
} catch (error) {
  console.error('[CIELO_WEBHOOK] Error:', error)
  
  // Diferenciar erros de validação (200) de erros de processamento (500)
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { success: true, message: 'Webhook validated but skipped' },
      { status: 200 }
    )
  }
  
  // Erros reais devem retornar 500 para Cielo retentar
  return NextResponse.json(
    { success: false, error: 'Processing error' },
    { status: 500 }
  )
}
```

---

## 🟡 BUGS MÉDIOS (3)

### BUG #3: Falta Validação de Autenticação em Cron ✅ CORRIGIDO
**Arquivo:** `src/app/api/cron/notifications/route.ts`  
**Linhas:** 11-14  
**Severidade:** 🟡 MÉDIA  
**Status:** ✅ CORRIGIDO em 2025-11-06

**Descrição:**
O endpoint de cron não valida corretamente o token de autorização, permitindo execução não autorizada.

**Código Problemático:**
```typescript
const authHeader = request.headers.get('authorization')
if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

**Problemas:**
- ⚠️ Comparação simples de string (vulnerável a timing attacks)
- ⚠️ Não valida se CRON_SECRET está definido
- ⚠️ Não há rate limiting adicional

**Solução:**
```typescript
import { timingSafeEqual } from 'crypto'

const CRON_SECRET = process.env.CRON_SECRET
if (!CRON_SECRET) {
  throw new Error('CRON_SECRET not configured')
}

const authHeader = request.headers.get('authorization')
if (!authHeader) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

const token = authHeader.replace('Bearer ', '')
const expectedToken = Buffer.from(CRON_SECRET)
const receivedToken = Buffer.from(token)

if (expectedToken.length !== receivedToken.length || 
    !timingSafeEqual(expectedToken, receivedToken)) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

### BUG #4: Query Ineficiente no Dashboard Admin ✅ CORRIGIDO
**Arquivo:** `src/app/api/v1/dashboard/admin/route.ts`  
**Linhas:** 244-290, 292-338  
**Severidade:** 🟡 MÉDIA  
**Status:** ✅ CORRIGIDO em 2025-11-06

**Descrição:**
O endpoint busca inadimplentes com múltiplas queries dentro de loops, causando N+1 queries.

**Código Problemático:**
```typescript
// Loop sobre todos os pastores
for (const pastor of pastorsWithTitheDay) {
  // Query individual para cada pastor ❌
  const lastPayment = await db
    .select({ createdAt: transactions.createdAt })
    .from(transactions)
    .where(...)
    .limit(1)
}

// Loop sobre todas as igrejas
for (const church of churchesWithTitheDay) {
  // Query individual para cada igreja ❌
  const lastPayment = await db
    .select({ createdAt: transactions.createdAt })
    .from(transactions)
    .where(...)
    .limit(1)
}
```

**Impacto:**
- ⚠️ Performance degradada com muitos pastores/igrejas
- ⚠️ Timeout em produção com grande volume
- ⚠️ Carga desnecessária no banco de dados

**Solução:**
```typescript
// Buscar todos os últimos pagamentos de uma vez
const lastPayments = await db
  .select({
    contributorId: transactions.contributorId,
    lastPayment: sql<Date>`MAX(${transactions.createdAt})`,
  })
  .from(transactions)
  .where(
    and(
      eq(transactions.status, 'approved'),
      gte(transactions.createdAt, threeMonthsAgo)
    )
  )
  .groupBy(transactions.contributorId)

const lastPaymentMap = new Map(
  lastPayments.map(p => [p.contributorId, p.lastPayment])
)

// Processar sem queries adicionais
for (const pastor of pastorsWithTitheDay) {
  const lastPayment = lastPaymentMap.get(pastor.id)
  // Processar...
}
```

---

### BUG #5: Falta Validação de Permissões em Upload ✅ CORRIGIDO
**Arquivo:** `src/app/api/v1/upload/route.ts`  
**Linhas:** 18-23  
**Severidade:** 🟡 MÉDIA  
**Status:** ✅ CORRIGIDO em 2025-11-06

**Descrição:**
O endpoint de upload não valida se o usuário tem permissão para fazer upload na pasta especificada.

**Código Problemático:**
```typescript
const { user } = await validateRequest()
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

const formData = await request.formData()
const file = formData.get('file') as File
const folder = formData.get('folder') as string || 'uploads' // ❌ Sem validação
```

**Problemas:**
- ⚠️ Usuário pode fazer upload em qualquer pasta
- ⚠️ Possível path traversal (../../../etc/passwd)
- ⚠️ Sem validação de tipo de arquivo
- ⚠️ Sem limite de tamanho

**Solução:**
```typescript
// Validar folder
const allowedFolders = ['uploads', 'avatars', 'documents']
const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '')

if (!allowedFolders.includes(sanitizedFolder)) {
  return NextResponse.json(
    { error: 'Invalid folder' },
    { status: 400 }
  )
}

// Validar tipo de arquivo
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
if (!allowedTypes.includes(file.type)) {
  return NextResponse.json(
    { error: 'Invalid file type' },
    { status: 400 }
  )
}

// Validar tamanho (5MB)
const maxSize = 5 * 1024 * 1024
if (file.size > maxSize) {
  return NextResponse.json(
    { error: 'File too large (max 5MB)' },
    { status: 400 }
  )
}
```

---

### BUG #6: Erro de Tipagem em Transações ⚠️ QUESTIONÁVEL
**Arquivo:** `src/app/api/v1/transacoes/route.ts`  
**Linhas:** 17-18  
**Severidade:** 🟡 MÉDIA  
**Status:** ❌ NÃO CORRIGIDO (possível design intencional - requer validação)

**Descrição:**
O endpoint GET de transações não valida corretamente o role do usuário, permitindo acesso não autorizado.

**Código Problemático:**
```typescript
export async function GET(request: NextRequest) {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') { // ❌ Apenas admin pode ver?
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
```

**Problemas:**
- ⚠️ Apenas admin pode listar transações
- ⚠️ Managers e Supervisores deveriam ver suas transações
- ⚠️ Usuários não podem ver suas próprias transações

**Solução:**
```typescript
export async function GET(request: NextRequest) {
  const { user } = await validateRequest()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  // Admin pode ver todas
  if (user.role === 'admin') {
    // Query sem filtro adicional
  }
  // Manager/Supervisor podem ver da sua rede
  else if (user.role === 'manager' || user.role === 'supervisor') {
    // Filtrar por rede do usuário
  }
  // Outros só veem suas próprias
  else {
    if (userId && userId !== user.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
    }
    // Forçar filtro pelo próprio ID
  }
}
```

---

## 🟢 BUGS BAIXOS (2)

### BUG #7: Falta Sanitização de Host em Reset Password ✅ CORRIGIDO
**Arquivo:** `src/app/api/auth/forgot-password/route.ts`  
**Linhas:** 54-55  
**Severidade:** 🟢 BAIXA  
**Status:** ✅ CORRIGIDO em 2025-11-06

**Descrição:**
O endpoint usa o header `host` diretamente sem validação, permitindo potencial host header injection.

**Código Problemático:**
```typescript
const host = process.env.NEXT_PUBLIC_APP_URL || 
             process.env.VERCEL_URL || 
             request.headers.get('host') || // ❌ Sem validação
             'localhost:3000'
const resetLink = `https://${host}/auth/redefinir-senha/${token}`
```

**Impacto:**
- ⚠️ Possível phishing via host header injection
- ⚠️ Links de reset podem apontar para domínio malicioso

**Solução:**
```typescript
const allowedHosts = [
  'vinha.com',
  'app.vinha.com',
  'localhost:3000',
  'localhost:9002'
]

let host = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
if (!host) {
  const requestHost = request.headers.get('host')
  if (requestHost && allowedHosts.includes(requestHost)) {
    host = requestHost
  } else {
    host = 'app.vinha.com' // Fallback seguro
  }
}

const resetLink = `https://${host}/auth/redefinir-senha/${token}`
```

---

### BUG #8: Layouts com Try-Catch Desnecessário ✅ CORRIGIDO
**Arquivos:** 
- `src/app/manager/layout.tsx`
- `src/app/supervisor/layout.tsx`
- `src/app/pastor/layout.tsx`
- `src/app/igreja/layout.tsx`

**Linhas:** 35-84 (variando por arquivo)  
**Severidade:** 🟢 BAIXA  
**Status:** ✅ CORRIGIDO em 2025-11-06

**Descrição:**
Os layouts de Manager, Supervisor, Pastor e Igreja usam try-catch para capturar `redirect()`, que lança um erro especial `NEXT_REDIRECT` como comportamento normal do Next.js, causando logs de erro desnecessários em todos os perfis durante logout.

**Código Problemático:**
```typescript
export default async function ChurchLayout({
  children,
}: {
  children: React.ReactNode
}): Promise<JSX.Element> {
  try {
    const { user } = await validateRequest()

    if (!user || user.role !== 'church_account') {
      redirect('/auth/login') // ❌ Lança NEXT_REDIRECT (comportamento normal)
    }
    // ... resto do código
  } catch (error) {
    console.error('Igreja layout error:', error) // ❌ Loga erro normal
    redirect('/auth/login')
  }
}
```

**Impacto:**
- ⚠️ Logs poluídos com "Manager/Supervisor/Pastor/Igreja layout error: Error: NEXT_REDIRECT"
- ⚠️ Aparência de erro quando é comportamento esperado
- ⚠️ Dificulta debugging de erros reais
- ⚠️ Acontece em TODOS os logouts de todos os perfis

**Solução Aplicada:**
Removido try-catch de todos os 4 layouts, seguindo o padrão correto do Admin layout:

```typescript
// ✅ ANTES (INCORRETO - com try-catch)
export default async function ManagerLayout(...) {
  try {
    const { user } = await validateRequest()
    if (!user || user.role !== 'manager') {
      redirect('/auth/login') // Lança NEXT_REDIRECT
    }
    // ... resto do código
  } catch (error) {
    console.error('Manager layout error:', error) // ❌ Captura NEXT_REDIRECT
    redirect('/auth/login')
  }
}

// ✅ DEPOIS (CORRETO - sem try-catch)
export default async function ManagerLayout(...) {
  const { user } = await validateRequest()
  
  if (!user || user.role !== 'manager') {
    redirect('/auth/login') // ✅ Redirect normal, NEXT_REDIRECT não é capturado
  }
  
  // ... resto do código normalmente
  return (<ErrorBoundary>...</ErrorBoundary>)
}
```

**Benefícios:**
- ✅ Logs limpos, sem erros falsos
- ✅ Comportamento consistente com Admin layout
- ✅ Debugging facilitado
- ✅ Logout funciona sem gerar logs de erro

**Nota:** O `redirect()` do Next.js lança um erro especial `NEXT_REDIRECT` internamente para interromper a execução. Isso é comportamento normal e não deve ser capturado com try-catch.

---

## 📋 Checklist de Correções

### Prioridade Alta (Críticos)
- [x] **BUG #1** - Corrigir hardcoded user ID em notificações ✅ FEITO
- [x] **BUG #2** - Implementar tratamento correto de erros no webhook Cielo ✅ FEITO

### Prioridade Média
- [x] **BUG #3** - Melhorar validação de autenticação em cron ✅ FEITO
- [x] **BUG #4** - Otimizar queries de inadimplentes no dashboard ✅ FEITO
- [x] **BUG #5** - Adicionar validações de segurança em upload ✅ FEITO
- [ ] **BUG #6** - Corrigir controle de acesso em transações ⚠️ VALIDAR REQUISITO

### Prioridade Baixa
- [x] **BUG #7** - Sanitizar host header em reset password ✅ FEITO
- [x] **BUG #8** - Remover try-catch desnecessário dos layouts (4 arquivos) ✅ FEITO

**✅ Status Geral:** 7/8 bugs corrigidos (87.5%)  
**📅 Data:** 2025-11-06

---

## 🎯 Recomendações Gerais

### Segurança
1. ✅ Implementar rate limiting em todos os endpoints públicos
2. ✅ Adicionar validação de input com Zod em todos os endpoints
3. ⚠️ Revisar controle de acesso baseado em roles
4. ⚠️ Implementar CSRF protection

### Performance
1. ⚠️ Adicionar cache em endpoints de leitura frequente
2. ⚠️ Otimizar queries com N+1 problems
3. ✅ Implementar paginação em listagens

### Monitoramento
1. ⚠️ Adicionar logging estruturado (Winston/Pino)
2. ⚠️ Implementar APM (Application Performance Monitoring)
3. ⚠️ Criar alertas para erros críticos

---

## 📊 Estatísticas da API

| Métrica | Valor |
|---------|-------|
| Total de Endpoints | ~80+ |
| Endpoints com Auth | ~75 (94%) |
| Endpoints com Rate Limit | ~10 (12%) |
| Endpoints com Cache | ~5 (6%) |
| Endpoints com Validação Zod | ~60 (75%) |

---

## ✅ Pontos Positivos

1. ✅ **Boa estrutura de pastas** - Organização clara por domínio
2. ✅ **Validação com Zod** - Maioria dos endpoints usa validação
3. ✅ **Error handling** - Try/catch implementado consistentemente
4. ✅ **Rate limiting** - Implementado em endpoints críticos
5. ✅ **TypeScript** - Tipagem forte em toda a API

---

**Próximos Passos:**
1. Corrigir bugs críticos (#1 e #2)
2. Implementar testes automatizados para APIs
3. Adicionar documentação OpenAPI/Swagger
4. Revisar e padronizar responses de erro

---

**Documento gerado em:** 2025-01-XX  
**Última atualização:** 2025-01-XX  
**Responsável:** Amazon Q Developer
