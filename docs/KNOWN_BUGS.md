# 🐛 Bugs Conhecidos - Vinha Admin Center

> **Última atualização:** 2025-11-05  
> **Versão:** 0.1.2

Este documento mantém registro de todos os bugs conhecidos no projeto, organizados por prioridade e status de resolução.

---

## 📊 Status Geral

| Prioridade | Total | Resolvidos | Pendentes | % Conclusão |
|------------|-------|------------|-----------|-------------|
| 🔴 CRÍTICA | 4     | 4          | 0         | 100% 🎉     |
| 🟡 MÉDIA   | 5     | 0          | 5         | 0%          |
| 🟢 BAIXA   | 3     | 0          | 3         | 0%          |
| **TOTAL**  | **12**| **4**      | **8**     | **33%**     |

**Última atualização:** 2025-11-05  
**Bugs corrigidos hoje:** 4 (Bug #1, #2, #3, #4)  
**Status:** ✅ TODOS OS BUGS CRÍTICOS RESOLVIDOS

---

## 🔴 BUGS CRÍTICOS (Bloqueia Produção)

### Bug #1: Build Ignora Erros de TypeScript e ESLint

**Status:** ✅ RESOLVIDO  
**Prioridade:** 🔴 CRÍTICA  
**Descoberto em:** 2025-11-05  
**Resolvido em:** 2025-11-05  
**Arquivo:** `next.config.ts` (linhas 4-9)  
**Resolvido por:** Cursor AI

#### Descrição
O Next.js está configurado para ignorar erros de TypeScript e ESLint durante o build, permitindo que código com erros seja deployado em produção.

#### Código Problemático
```typescript
const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,  // ❌ PERIGOSO
  },
  eslint: {
    ignoreDuringBuilds: true, // ❌ PERIGOSO
  },
  // ...
}
```

#### Impacto
- ⚠️ Bugs de tipagem podem ir para produção
- ⚠️ Código mal formatado pode ser deployado
- ⚠️ Erros de runtime inesperados
- ⚠️ Maior dificuldade de debugging

#### Solução
```typescript
const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false, // ✅ Correto
  },
  eslint: {
    ignoreDuringBuilds: false, // ✅ Correto
  },
  // ...
}
```

#### ✅ Correção Aplicada
```typescript
// ✅ CORRIGIDO em next.config.ts
const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false, // ✅ Validar tipos no build
  },
  eslint: {
    ignoreDuringBuilds: false, // ✅ Validar lint no build
  },
  // ...
}
```

#### Passos para Resolver
1. [x] Mudar `ignoreBuildErrors` para `false` - **CONCLUÍDO**
2. [x] Mudar `ignoreDuringBuilds` para `false` - **CONCLUÍDO**
3. [x] Executar `npm run build` e corrigir erros - **VALIDADO**
4. [ ] Garantir que CI/CD também falhe se houver erros

#### Responsável
- [x] Cursor AI - **CONCLUÍDO**

#### Data de Resolução
- [x] 2025-11-05

---

### Bug #2: Duplicação de Sistema de Autenticação

**Status:** ✅ RESOLVIDO  
**Prioridade:** 🔴 CRÍTICA  
**Descoberto em:** 2025-11-05  
**Resolvido em:** 2025-11-05  
**Arquivos:** `src/lib/auth.ts` (removido), `src/lib/jwt.ts` (mantido)  
**Resolvido por:** Cursor AI

#### Descrição
O projeto possui dois sistemas de autenticação diferentes rodando simultaneamente (Lucia Auth e JWT), causando inconsistências e possíveis vulnerabilidades de segurança.

#### Código Problemático

**Sistema 1 - Lucia (`src/lib/auth.ts`):**
```typescript
export const lucia = new Lucia(adapter, {
  sessionCookie: { ... },
  sessionExpiresIn: new TimeSpan(30, 'd'),
  getUserAttributes: (attributes) => ({ ... })
})

export const validateRequest = cache(async () => {
  // Validação usando Lucia
})
```

**Sistema 2 - JWT (`src/lib/jwt.ts`):**
```typescript
export async function createJWT(user: { id: string; email: string; role: UserRole }) {
  const token = await new SignJWT({ ... })
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET)
}

export async function validateRequest() {
  // Validação usando JWT (CONFLITO!)
}
```

**Uso Misto (`src/actions/auth.ts`):**
```typescript
import { createJWT, setJWTCookie, validateRequest } from '@/lib/jwt'
// Usando JWT, mas Lucia também está configurado
```

#### Impacto
- 🔒 **Vulnerabilidade de segurança crítica**
- ⚠️ Confusão sobre qual sistema está ativo
- ⚠️ Sessões podem ser invalidadas incorretamente
- ⚠️ Possível bypass de autenticação
- ⚠️ Dados de sessão inconsistentes entre requests

#### Solução Proposta

**Opção A - Usar apenas JWT (Recomendado):**
1. Remover completamente `src/lib/auth.ts` (Lucia)
2. Atualizar todos os imports para usar `src/lib/jwt.ts`
3. Remover dependência `@lucia-auth/adapter-drizzle` e `lucia`
4. Manter tabela `sessions` para tracking opcional

**Opção B - Usar apenas Lucia:**
1. Remover `src/lib/jwt.ts`
2. Atualizar `src/actions/auth.ts` para usar Lucia
3. Remover dependência `jose`
4. Usar `validateRequest` do `auth.ts` em todos os lugares

#### ✅ Correção Aplicada

**Decisão:** Opção A - Manter JWT, remover Lucia

**Ações realizadas:**
1. ✅ Removido arquivo `src/lib/auth.ts`
2. ✅ Removido dependências `lucia` e `@lucia-auth/adapter-drizzle` do `package.json`
3. ✅ Sistema unificado usando apenas `src/lib/jwt.ts`
4. ✅ Tabela `sessions` mantida no schema para tracking opcional
5. ✅ Nenhum import estava usando `@/lib/auth` (verificado)

**Benefícios:**
- Sistema de autenticação único e consistente
- Melhor performance (JWT é stateless)
- Menos dependências para manter
- Sem conflitos entre sistemas

#### Passos Executados
1. [x] **DECISÃO:** Escolhido JWT (Opção A) - **CONCLUÍDO**
2. [x] Remover sistema não escolhido (Lucia) - **CONCLUÍDO**
3. [x] Verificar imports - **NENHUM IMPORT ENCONTRADO**
4. [x] Remover dependências não usadas - **CONCLUÍDO**
5. [x] Atualizar documentação - **CONCLUÍDO**
6. [ ] Testar autenticação em todos os fluxos (Recomendado antes de deploy):
   - [ ] Login
   - [ ] Logout
   - [ ] Sessão persistente
   - [ ] Validação em API routes
   - [ ] Validação em Server Components

#### Responsável
- [x] Cursor AI - **CONCLUÍDO**

#### Data de Resolução
- [x] 2025-11-05

---

### Bug #3: Middleware com AbortSignal.timeout() Incompatível

**Status:** ✅ RESOLVIDO  
**Prioridade:** 🔴 CRÍTICA  
**Descoberto em:** 2025-11-05  
**Resolvido em:** 2025-11-05  
**Arquivo:** `src/middleware.ts` (linha 36-59)  
**Resolvido por:** Cursor AI

#### Descrição
O middleware usa `AbortSignal.timeout()` que não é compatível com Edge Runtime do Next.js, podendo causar erro `AbortSignal.timeout is not a function` e quebrar todo o site.

#### Código Problemático
```typescript
const maintenanceCheck = await fetch(
  new URL('/api/v1/maintenance-check', request.url),
  { 
    headers: { 'x-middleware-check': 'true' },
    signal: AbortSignal.timeout(1000) // ❌ Não funciona em Edge
  }
)
```

#### Impacto
- 💥 **Middleware pode quebrar completamente**
- 💥 Todas as requisições ao site falhariam
- 💥 Site ficaria completamente inacessível
- ⚠️ Erro só aparece em produção (Edge Runtime)

#### Solução
```typescript
// Usar AbortController com timeout manual
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 1000)

try {
  const maintenanceCheck = await fetch(
    new URL('/api/v1/maintenance-check', request.url),
    { 
      headers: { 'x-middleware-check': 'true' },
      signal: controller.signal
    }
  )
  
  clearTimeout(timeoutId)
  
  if (maintenanceCheck.ok) {
    const { maintenanceMode } = await maintenanceCheck.json()
    if (maintenanceMode) {
      return NextResponse.redirect(new URL('/maintenance', request.url))
    }
  }
} catch (error) {
  clearTimeout(timeoutId)
  // Silently fail - allow request to continue if maintenance check fails
}
```

#### ✅ Correção Aplicada
```typescript
// ✅ CORRIGIDO em src/middleware.ts
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 1000)

try {
  const maintenanceCheck = await fetch(
    new URL('/api/v1/maintenance-check', request.url),
    { 
      headers: { 'x-middleware-check': 'true' },
      signal: controller.signal
    }
  )
  clearTimeout(timeoutId)
  // ... resto do código
} catch (error) {
  clearTimeout(timeoutId)
  // Silently fail
}
```

#### Passos para Resolver
1. [x] Substituir `AbortSignal.timeout()` por `AbortController` - **CONCLUÍDO**
2. [x] Adicionar `clearTimeout()` em todos os caminhos - **CONCLUÍDO**
3. [x] Testar em ambiente local - **VALIDADO**
4. [ ] Testar em staging com Edge Runtime
5. [ ] Deploy para produção

#### Responsável
- [x] Cursor AI - **CONCLUÍDO**

#### Data de Resolução
- [x] 2025-11-05

---

### Bug #4: API Maintenance-Check Não Retorna maintenanceMode

**Status:** ✅ RESOLVIDO  
**Prioridade:** 🔴 CRÍTICA  
**Descoberto em:** 2025-11-05  
**Resolvido em:** 2025-11-05  
**Arquivo:** `src/app/api/v1/maintenance-check/route.ts`  
**Resolvido por:** Cursor AI

#### Descrição
A API `/api/v1/maintenance-check` não retorna o campo `maintenanceMode`, mas o middleware espera esse campo. Isso torna o sistema de modo de manutenção completamente não funcional.

#### Código Problemático

**API atual:**
```typescript
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    // ❌ Falta maintenanceMode!
  });
}
```

**Middleware esperando:**
```typescript
const { maintenanceMode } = await maintenanceCheck.json()
if (maintenanceMode) { // maintenanceMode é sempre undefined!
  return NextResponse.redirect(new URL('/maintenance', request.url))
}
```

#### Impacto
- 🚨 **Sistema de manutenção nunca ativa**
- ⚠️ Impossível colocar site em manutenção
- ⚠️ Funcionalidade completa não funciona

#### Solução
```typescript
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { companies } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const companyId = process.env.COMPANY_INIT;
    
    if (!companyId) {
      return NextResponse.json({
        status: 'error',
        maintenanceMode: false,
        timestamp: new Date().toISOString(),
      }, { status: 500 });
    }
    
    const [company] = await db
      .select({ maintenanceMode: companies.maintenanceMode })
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);
    
    return NextResponse.json({
      status: 'ok',
      maintenanceMode: company?.maintenanceMode || false,
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    console.error('Maintenance check error:', error);
    return NextResponse.json({
      status: 'error',
      maintenanceMode: false, // Fail-safe: permitir acesso se erro
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
```

#### ✅ Correção Aplicada
```typescript
// ✅ CORRIGIDO em src/app/api/v1/maintenance-check/route.ts
const [company] = await db
  .select({ maintenanceMode: companies.maintenanceMode })
  .from(companies)
  .where(eq(companies.id, companyId))
  .limit(1);

return NextResponse.json({
  status: 'ok',
  maintenanceMode: company?.maintenanceMode || false,
  timestamp: new Date().toISOString(),
  env: process.env.NODE_ENV || 'development',
});
```

#### Passos para Resolver
1. [x] Implementar consulta ao banco de dados - **CONCLUÍDO**
2. [x] Retornar campo `maintenanceMode` no JSON - **CONCLUÍDO**
3. [x] Adicionar error handling adequado - **CONCLUÍDO**
4. [ ] Testar ativação/desativação do modo de manutenção
5. [ ] Verificar se redirecionamento funciona
6. [ ] Documentar como ativar modo de manutenção

#### Responsável
- [x] Cursor AI - **CONCLUÍDO**

#### Data de Resolução
- [x] 2025-11-05

---

## 🟡 BUGS MÉDIOS (Afeta Funcionalidade)

### Bug #5: Validação de Templates Muito Restritiva

**Status:** ❌ NÃO RESOLVIDO  
**Prioridade:** 🟡 MÉDIA  
**Descoberto em:** 2025-11-05  
**Arquivo:** `src/lib/template-engine.ts` (linha 61-70)

#### Descrição
A validação de templates aceita apenas 5 variáveis específicas, mas o código usa muitas mais (aliases PT-BR), fazendo templates personalizados serem rejeitados incorretamente.

#### Código Problemático
```typescript
export function validateTemplate(template: string): { isValid: boolean; errors: string[] } {
  // ...
  const invalidVars = variables.filter(v => {
    const varName = v.replace(/[{}]/g, '')
    return !['name', 'churchName', 'amount', 'dueDate', 'paymentLink'].includes(varName)
    // ❌ Só aceita essas 5 variáveis
  })
}
```

**Mas em `notifications.ts` são usadas:**
```typescript
const variables: TemplateVariables = {
  name,
  amount,
  dueDate,
  paymentLink,
  // Aliases PT-BR que serão rejeitados:
  nome_usuario: name,
  valor_transacao: amount,
  data_vencimento: dueDate,
  link_pagamento: paymentLink,
}
```

#### Impacto
- 📝 Templates personalizados em PT-BR são rejeitados
- ⚠️ Funcionalidade de customização limitada
- ⚠️ UX ruim para usuários brasileiros

#### Solução
Ver `.cursorrules` seção "Bug #5" para código completo.

#### Passos para Resolver
1. [ ] Expandir lista de variáveis válidas
2. [ ] Incluir todos os aliases PT-BR
3. [ ] Testar validação de templates
4. [ ] Atualizar documentação de variáveis disponíveis

---

### Bug #6: Notificações de Boas-Vindas com Lógica Invertida

**Status:** ❌ NÃO RESOLVIDO  
**Prioridade:** 🟡 MÉDIA  
**Descoberto em:** 2025-11-05  
**Arquivo:** `src/lib/notification-scheduler.ts` (linha 24-30)

#### Descrição
A query que busca usuários para enviar boas-vindas tem lógica invertida e não verifica se já foi enviado, causando envios duplicados ou ausentes.

#### Código Problemático
```typescript
const newUsers = await db
  .select({ ... })
  .from(users)
  .where(
    and(
      lte(users.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)),
      // ❌ lte = "criado HÁ MAIS de 24h" (invertido!)
      // ❌ Não verifica welcomeSent flag
      isNull(users.deletedAt)
    )
  )
```

#### Impacto
- 📧 Novos usuários não recebem boas-vindas
- 📧 Usuários antigos podem receber múltiplas vezes
- ⚠️ Sistema de onboarding quebrado

#### Solução
Ver `.cursorrules` seção "Bug #6" para código completo.

---

### Bug #7: Credenciais S3 Usadas para SES

**Status:** ❌ NÃO RESOLVIDO  
**Prioridade:** 🟡 MÉDIA  
**Descoberto em:** 2025-11-05  
**Arquivo:** `src/lib/notification-scheduler.ts` (linha 87-89)

#### Descrição
Configuração do SES (serviço de email) usa credenciais do S3 (serviço de armazenamento), que são serviços AWS diferentes e não devem compartilhar credenciais.

#### Código Problemático
```typescript
const notificationService = new NotificationService({
  // ...
  sesRegion: settings.s3Region || undefined,           // ❌ Usando S3
  sesAccessKeyId: settings.s3AccessKeyId || undefined, // ❌ Usando S3
  sesSecretAccessKey: settings.s3SecretAccessKey || undefined, // ❌ Usando S3
  // ...
})
```

#### Impacto
- 📮 Emails podem falhar com erro de autenticação
- ⚠️ Possível exposição de credenciais incorretas

#### Solução
```typescript
sesRegion: 'us-east-1',
sesAccessKeyId: settings.smtpUser || undefined,
sesSecretAccessKey: settings.smtpPass || undefined,
```

---

### Bug #8: URL S3 Formatada Incorretamente

**Status:** ❌ NÃO RESOLVIDO  
**Prioridade:** 🟡 MÉDIA  
**Descoberto em:** 2025-11-05  
**Arquivo:** `src/lib/s3-client.ts` (linha 84-89)

#### Descrição
URL retornada após upload não segue padrão AWS S3, podendo causar falha ao carregar imagens/arquivos.

#### Impacto
- 🖼️ Imagens podem não carregar
- ⚠️ URLs quebradas em produção

#### Solução
Ver `.cursorrules` seção "Bug #8" para código completo.

---

### Bug #9: Redis Worker Silencia Todos os Erros

**Status:** ❌ NÃO RESOLVIDO  
**Prioridade:** 🟡 MÉDIA  
**Descoberto em:** 2025-11-05  
**Arquivo:** `src/workers/notification-worker.ts` (linha 15)

#### Descrição
Worker de notificações silencia completamente erros do Redis, impossibilitando debugging.

#### Código Problemático
```typescript
client.on('error', () => {}) // ❌ Silencia TODOS os erros
```

#### Impacto
- 🔕 Impossível debugar problemas com notificações
- ⚠️ Sistema pode falhar silenciosamente

#### Solução
```typescript
client.on('error', (error) => {
  console.error('Redis connection error:', error)
})
```

---

## 🟢 MELHORIAS RECOMENDADAS

### Melhoria #10: Validação de Environment Variables

**Status:** ❌ NÃO IMPLEMENTADO  
**Prioridade:** 🟢 BAIXA  
**Descoberto em:** 2025-11-05

#### Descrição
Variáveis de ambiente críticas como `COMPANY_INIT` não são validadas, causando comportamento silencioso incorreto.

---

### Melhoria #11: Rate Limiting e Validação de Upload

**Status:** ❌ NÃO IMPLEMENTADO  
**Prioridade:** 🟢 BAIXA  
**Arquivo:** `src/app/api/v1/upload/route.ts`

#### Descrição
Falta validação de tamanho de arquivo e tipo, permitindo uploads abusivos.

---

### Melhoria #12: Cleanup de Sessões Expiradas

**Status:** ❌ NÃO IMPLEMENTADO  
**Prioridade:** 🟢 BAIXA

#### Descrição
Tabela `sessions` acumula sessões expiradas indefinidamente, desperdiçando espaço.

---

## 📈 Progresso de Resolução

### Semana 2025-11-05
- ✅ Identificados 12 bugs
- ❌ 0 bugs resolvidos
- 📊 0% de conclusão

### Próxima Revisão
**Data:** A ser definida  
**Responsável:** Tech Lead

---

## 🔄 Como Atualizar Este Documento

### Quando Resolver um Bug
1. Mudar **Status** de ❌ NÃO RESOLVIDO para ✅ RESOLVIDO
2. Adicionar data de resolução
3. Adicionar nome do responsável
4. Atualizar tabela de status geral
5. Mover para seção "Bugs Resolvidos" (criar se não existir)

### Quando Encontrar Novo Bug
1. Adicionar na seção apropriada (🔴/🟡/🟢)
2. Seguir template de bug
3. Atualizar tabela de status geral
4. Atualizar `.cursorrules` também

---

**Documento mantido por:** Time de Desenvolvimento  
**Última revisão:** 2025-11-05

