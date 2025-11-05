# ✨ Auditoria do Sistema OpenAI

**Data:** 2025-11-05  
**Status:** ✅ SISTEMA FUNCIONANDO CORRETAMENTE  
**Versão:** 1.0

---

## 🎯 Resumo Executivo

**Sistema Auditado:** Integração com OpenAI API para recursos de IA

**Resultado:** ✅ **SISTEMA ESTÁ CORRETO**
- Chave OpenAI armazenada corretamente no banco
- Mascaramento de chave funcionando
- 2 endpoints usando IA validados
- Auth e segurança implementados

**Melhorias Aplicadas:**
- ✅ Estilo Videira aplicado na interface
- ✅ Card informativo detalhando usos da IA
- ✅ Alert com formato da chave
- ✅ Badge "Chave Ativa" no header
- ✅ Documentação completa criada

---

## 📊 Estrutura do Sistema OpenAI

### Arquivos Principais

| Arquivo | Finalidade | Status |
|---------|------------|--------|
| `src/app/api/v1/settings/openai/route.ts` | CRUD de configurações | ✅ OK |
| `src/app/admin/configuracoes/openai/page.tsx` | Interface admin | ✅ OK |
| `src/app/api/v1/templates/ai-suggest/route.ts` | Sugestão de templates | ✅ OK |
| `src/app/api/v1/dashboard/insights/route.ts` | Insights do dashboard | ✅ OK |
| `src/db/schema.ts` | Schema (openaiApiKey) | ✅ OK |

---

## 🔧 Implementação da API de Configuração

### ✅ `src/app/api/v1/settings/openai/route.ts`

#### GET - Buscar Chave Configurada

```typescript
export async function GET() {
  // 1. Validar autenticação (admin only)
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  // 2. Buscar da tabela otherSettings
  const [settings] = await db
    .select()
    .from(otherSettings)
    .where(eq(otherSettings.companyId, user.companyId))
    .limit(1)

  // 3. Mascarar chave (mostra apenas últimos 4 caracteres)
  const masked = settings?.openaiApiKey 
    ? settings.openaiApiKey.replace(/.(?=.{4})/g, '*') 
    : ''

  // 4. Retornar
  return NextResponse.json({
    openaiApiKey: masked,     // ✅ Mascarada (sk-***...1234)
    hasKey: !!settings?.openaiApiKey,  // ✅ Boolean
    updatedAt: null,          // Pode ser implementado
  })
}
```

**Status:** ✅ **IMPLEMENTAÇÃO CORRETA**

**Segurança:**
- ✅ Auth check (admin only)
- ✅ Company isolation (cada empresa tem sua chave)
- ✅ Mascaramento de chave (mostra apenas últimos 4 chars)

---

#### PUT - Salvar/Atualizar Chave

```typescript
export async function PUT(request: NextRequest) {
  // 1. Validar autenticação
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  // 2. Validar input
  const { openaiApiKey } = await request.json()
  if (typeof openaiApiKey !== 'string') {
    return NextResponse.json({ error: 'openaiApiKey inválida' }, { status: 400 })
  }

  // 3. Upsert (insert ou update)
  const [existing] = await db
    .select()
    .from(otherSettings)
    .where(eq(otherSettings.companyId, user.companyId))
    .limit(1)

  if (existing) {
    await db
      .update(otherSettings)
      .set({ openaiApiKey })
      .where(eq(otherSettings.companyId, user.companyId))
  } else {
    await db
      .insert(otherSettings)
      .values({ companyId: user.companyId, openaiApiKey })
  }

  return NextResponse.json({ success: true })
}
```

**Status:** ✅ **IMPLEMENTAÇÃO CORRETA**

**Funcionalidades:**
- ✅ Aceita string vazia (para remover chave)
- ✅ Upsert pattern (cria ou atualiza)
- ✅ Company isolation

---

## 🤖 Usos da OpenAI no Sistema

### ✅ 1. Sugestão de Templates de Mensagem
**Arquivo:** `src/app/api/v1/templates/ai-suggest/route.ts`

**Endpoint:** `POST /api/v1/templates/ai-suggest`

**Finalidade:** Gerar sugestões de templates de mensagens automáticas usando IA

**Fluxo:**
```typescript
1. Validar autenticação (admin only)
2. Buscar openaiApiKey do banco
3. Validar que chave existe
4. Construir prompt baseado em:
   - eventTrigger (user_registered, payment_received, etc)
   - daysOffset (para lembretes)
   - variables ({nome_usuario}, {valor_transacao}, etc)
   - tone (respeitoso, claro, objetivo)
5. Chamar OpenAI API (gpt-4o-mini)
6. Retornar sugestão de template
```

**Request Body:**
```json
{
  "eventTrigger": "payment_due_reminder",
  "daysOffset": 3,
  "variables": ["{nome_usuario}", "{valor_transacao}", "{data_vencimento}"],
  "tone": "respeitoso e objetivo"
}
```

**OpenAI Request:**
```typescript
{
  "model": "gpt-4o-mini",
  "messages": [
    { 
      "role": "system", 
      "content": "Você é um assistente que escreve mensagens curtas e eficazes em PT-BR para um sistema de gestão de igrejas..."
    },
    { 
      "role": "user", 
      "content": "Gere um texto de mensagem para o evento: payment_due_reminder. Dias de offset: 3..."
    }
  ],
  "temperature": 0.7,
  "max_tokens": 180
}
```

**Response:**
```json
{
  "suggestion": "Olá {nome_usuario}! Lembramos que sua contribuição de {valor_transacao} vence em {data_vencimento}. Contamos com você! 🙏"
}
```

**Status:** ✅ **FUNCIONANDO CORRETAMENTE**

**Validações:**
- ✅ Auth check (admin)
- ✅ Chave OpenAI configurada
- ✅ Error handling para falhas da OpenAI
- ✅ Prompt bem estruturado (evita variáveis não disponíveis)

---

### ✅ 2. Insights do Dashboard com IA
**Arquivo:** `src/app/api/v1/dashboard/insights/route.ts`

**Endpoint:** `GET /api/v1/dashboard/insights?from=2024-01-01&to=2024-12-31`

**Finalidade:** Gerar análise inteligente dos dados do dashboard usando IA

**Fluxo:**
```typescript
1. Validar autenticação (admin only)
2. Buscar dados do dashboard via /api/v1/dashboard/admin
3. Buscar openaiApiKey do banco
4. Validar que chave existe
5. Construir prompt com JSON do dashboard
6. Chamar OpenAI API (gpt-4o-mini)
7. Retornar insight gerado
```

**OpenAI Request:**
```typescript
{
  "model": "gpt-4o-mini",
  "messages": [
    { 
      "role": "system", 
      "content": "Você é um analista financeiro e operacional, escreve em PT-BR, claro e conciso."
    },
    { 
      "role": "user", 
      "content": "Com base no JSON abaixo do dashboard, produza um resumo curto (3-5 linhas) e 3 recomendações acionáveis..."
    }
  ],
  "temperature": 0.5,
  "max_tokens": 400
}
```

**Response:**
```json
{
  "insight": "📊 **Resumo:** Receita cresceu 15% vs. mês anterior, mas inadimplência subiu para 12%...\n\n✅ **Recomendações:**\n- Implementar lembretes automáticos 3 dias antes do vencimento\n- Focar campanhas na região Sul (maior taxa de conversão)\n- Diversificar métodos de pagamento (70% ainda usa apenas PIX)"
}
```

**Status:** ✅ **FUNCIONANDO CORRETAMENTE**

**Validações:**
- ✅ Auth check (admin)
- ✅ Chave OpenAI configurada
- ✅ Reusa dados do dashboard (não duplica queries)
- ✅ Error handling para falhas da OpenAI
- ✅ Prompt focado em insights acionáveis

---

## 🔐 Segurança e Validação

### ✅ Armazenamento Seguro

**Banco de Dados:**
```typescript
// Schema: src/db/schema.ts
export const otherSettings = pgTable('other_settings', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  openaiApiKey: text('openai_api_key'),  // ✅ Armazenada por empresa
  // ... outros campos
})
```

**Características:**
- ✅ Armazenada em `text` (suporta chaves longas)
- ✅ Por empresa (`companyId`)
- ✅ Nullable (opcional)
- ✅ Não possui índice único (múltiplas empresas podem usar a mesma chave)

---

### ✅ Mascaramento de Chave

**Implementação:**
```typescript
// API retorna chave mascarada
const masked = settings?.openaiApiKey 
  ? settings.openaiApiKey.replace(/.(?=.{4})/g, '*') 
  : ''

// Exemplo:
// Original: sk-proj-abcdefghijklmnopqrstuvwxyz1234
// Mascarada: *********************************1234
```

**Benefícios:**
- ✅ Chave nunca é exposta completa no frontend
- ✅ Admin pode verificar se é a chave correta (últimos 4 chars)
- ✅ Não é possível copiar a chave do frontend

---

### ✅ Controle de Acesso

**Todas as rotas validam:**
```typescript
const { user } = await validateRequest()
if (!user || user.role !== 'admin') {
  return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
}
```

**Níveis de proteção:**
- ✅ Configuração de chave: **Admin only**
- ✅ Uso da chave (AI suggestions): **Admin only**
- ✅ Insights do dashboard: **Admin only**

---

## 🎨 Estilo Videira Aplicado - `/admin/configuracoes/openai`

### ✅ Header Moderno com Badge de Status
- Gradiente Videira (cyan → blue → purple)
- Ícone Sparkles de 8x8
- Título "Configuração OpenAI"
- **Badge "Chave Ativa"** (verde) se já configurada
- Descrição em branco

### ✅ Card de Configuração (Esquerda)
- Border-top videira-blue
- Título com ícone Bot e badge
- **Alert informativo** sobre formato da chave (`sk-` ou `sk-proj-`)
- Input com toggle show/hide password
- 2 Botões estilizados:
  - "Salvar Chave" (videira-blue)
  - "Remover" (destructive, só aparece se tem chave)

### ✅ Card de Recursos de IA (Direita)
- Border-top videira-purple
- **3 Seções detalhadas:**
  1. **Como será usada?** (ícone Bot, videira-cyan)
     - Sugestões de templates
     - Insights do dashboard
     - Relatórios futuros
  2. **Segurança** (ícone Shield, verde)
     - Chave mascarada
     - Remoção a qualquer momento
     - Uso restrito ao backend
  3. **Observações** (ícone Info, âmbar)
     - Auth admin necessária
     - Modelo usado: `gpt-4o-mini`

### ✅ UX Melhorado
- Ícones coloridos (cyan/blue/purple) por categoria
- Bullet points estilizados (círculos coloridos)
- Alert com instruções de formato
- Estados de loading claros
- Hover effects em todos os botões

---

## 📁 Modelo OpenAI Usado

### GPT-4o-mini

**Por que este modelo?**
- ✅ Mais econômico que GPT-4
- ✅ Latência mais baixa (respostas rápidas)
- ✅ Suficiente para tarefas de geração de texto curto
- ✅ Boa performance em português

**Configurações:**

| Uso | Temperature | Max Tokens | Motivo |
|-----|------------|------------|--------|
| Templates de mensagem | 0.7 | 180 | Criatividade moderada, texto curto |
| Insights do dashboard | 0.5 | 400 | Mais determinístico, análise objetiva |

---

## 🔄 Fluxo de Uso Completo

### 1. Admin Configura Chave

```mermaid
Admin → Interface /admin/configuracoes/openai → API PUT /api/v1/settings/openai → Banco
                                                                                      ↓
                                                                          Chave salva por empresa
```

### 2. Admin Usa IA para Templates

```mermaid
Admin → Configuração de Mensagens → Clica "Sugerir com IA" → API POST /api/v1/templates/ai-suggest
                                                                          ↓
                                                                    Busca chave do banco
                                                                          ↓
                                                                  Chama OpenAI API
                                                                          ↓
                                                              Retorna sugestão de template
```

### 3. Admin Visualiza Insights

```mermaid
Admin → Dashboard → Clica "Ver Insights" → API GET /api/v1/dashboard/insights
                                                      ↓
                                              Busca dados do dashboard
                                                      ↓
                                              Busca chave do banco
                                                      ↓
                                              Chama OpenAI API
                                                      ↓
                                              Retorna análise + recomendações
```

---

## 🛡️ Padrão Correto para Desenvolvedores

### ✅ Ao criar novo endpoint com IA

```typescript
import { db } from '@/db/drizzle'
import { otherSettings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  // 1. Validar autenticação
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  // 2. Buscar chave OpenAI
  const [settings] = await db
    .select()
    .from(otherSettings)
    .where(eq(otherSettings.companyId, user.companyId))
    .limit(1)
  
  const apiKey = settings?.openaiApiKey
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Chave da OpenAI não configurada.' }, 
      { status: 400 }
    )
  }

  // 3. Chamar OpenAI
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Seu prompt de sistema...' },
        { role: 'user', content: 'Sua pergunta...' },
      ],
      temperature: 0.7,
      max_tokens: 200,
    }),
  })

  // 4. Validar resposta
  if (!response.ok) {
    const errText = await response.text()
    return NextResponse.json(
      { error: 'Falha na OpenAI', details: errText }, 
      { status: 500 }
    )
  }

  // 5. Retornar resultado
  const data = await response.json()
  const result = data.choices?.[0]?.message?.content?.trim() || ''
  
  return NextResponse.json({ result })
}
```

---

## ❌ Anti-Padrões (NUNCA FAZER)

### ❌ ERRADO: Usar variável de ambiente global
```typescript
// ❌ NUNCA FAZER ISSO!
const apiKey = process.env.OPENAI_API_KEY  // Seria a mesma para todas as empresas!
```

### ❌ ERRADO: Retornar chave completa
```typescript
// ❌ NUNCA FAZER ISSO!
return NextResponse.json({
  openaiApiKey: settings.openaiApiKey  // Expõe chave completa!
})

// ✅ CORRETO
return NextResponse.json({
  openaiApiKey: settings.openaiApiKey.replace(/.(?=.{4})/g, '*')  // Mascarada
})
```

### ❌ ERRADO: Permitir qualquer usuário configurar
```typescript
// ❌ NUNCA FAZER ISSO!
const { user } = await validateRequest()
if (!user) {  // Qualquer usuário logado poderia alterar!
  return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
}

// ✅ CORRETO
if (!user || user.role !== 'admin') {  // Apenas admin
  return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
}
```

---

## 📊 Onde a OpenAI é Usada

| Localização | Finalidade | Model | Tokens | Status |
|-------------|------------|-------|--------|--------|
| `/api/v1/templates/ai-suggest` | Sugerir templates | gpt-4o-mini | 180 | ✅ OK |
| `/api/v1/dashboard/insights` | Análise do dashboard | gpt-4o-mini | 400 | ✅ OK |
| (Futuro) Relatórios | Análise de relatórios | gpt-4o-mini | TBD | 📝 Planejado |

**Total:** 2 endpoints ativos ✅

---

## 💡 Ideias para Futuros Usos

### 1. Respostas Automáticas WhatsApp
- IA responde perguntas frequentes
- Direciona para humano quando necessário
- Exemplo: "Qual o valor da mensalidade?" → IA busca e responde

### 2. Categorização Automática de Contribuições
- IA categoriza comentários/observações
- Exemplo: "Oferta especial aniversário" → categoria: "Evento"

### 3. Geração de Relatórios Narrativos
- IA escreve relatório em português baseado em dados
- Exemplo: Relatório mensal com análise automática

### 4. Detecção de Anomalias
- IA identifica padrões estranhos
- Exemplo: "Usuário sempre contribui R$ 100, esse mês R$ 10 → alerta"

---

## 📊 Estatísticas Finais

| Métrica | Valor |
|---------|-------|
| **Bugs encontrados** | 0 |
| **Endpoints validados** | 3 (1 config + 2 usos) |
| **Modelo usado** | gpt-4o-mini |
| **Usos atuais** | 2 (templates + insights) |
| **Auth implementada** | ✅ Admin only |
| **Mascaramento** | ✅ Implementado |
| **TypeCheck** | ✅ Passou |
| **Linter** | ✅ Sem erros |
| **Estilo Videira** | ✅ Aplicado |

---

## ✅ Checklist de Validação

### Configuração
- [x] Interface de OpenAI funcional
- [x] CRUD de configurações OK
- [x] Chave salva no banco (por empresa)
- [x] Mascaramento de chave funciona
- [x] Remoção de chave funciona
- [x] Auth check (admin only)

### Uso da IA
- [x] Templates AI Suggest funciona
- [x] Dashboard Insights funciona
- [x] Chave buscada corretamente do banco
- [x] Error handling robusto
- [x] Prompts bem estruturados

### Interface
- [x] Estilo Videira aplicado
- [x] Badge de status (Chave Ativa)
- [x] Card informativo sobre usos
- [x] Alert com instruções
- [x] Botões estilizados
- [x] UX intuitiva

---

## 🔧 Configuração Recomendada

### Criar Chave OpenAI

**1. Acesse:** https://platform.openai.com/api-keys

**2. Crie uma nova chave:**
- Clique em "Create new secret key"
- Nome: "Vinha Admin Center"
- Copie a chave (começa com `sk-proj-...`)

**3. Configure no Sistema:**
```
/admin/configuracoes/openai
↓
Cole a chave
↓
Clique "Salvar Chave"
```

**4. Teste:**
- Vá em `/admin/configuracoes/mensagens`
- Clique em "Sugerir com IA" em algum template
- OU vá no Dashboard e clique "Ver Insights"

---

### Limites e Custos

**GPT-4o-mini Pricing (OpenAI):**
- Input: $0.150 / 1M tokens
- Output: $0.600 / 1M tokens

**Exemplo de uso:**
- Template de mensagem (180 tokens): ~$0.00011
- Insight do dashboard (400 tokens): ~$0.00024
- **100 requisições/dia ≈ $0.035/dia ≈ $1/mês** 💰

---

## ⚠️ Melhorias Recomendadas (Não Críticas)

### 1. Adicionar Campo `updatedAt`
**Arquivo:** `src/app/api/v1/settings/openai/route.ts`

```typescript
// Atualmente retorna null
updatedAt: null

// Melhorar para rastrear quando foi atualizada
updatedAt: settings?.updatedAt || null
```

---

### 2. Validação de Formato de Chave
```typescript
// Adicionar validação
if (openaiApiKey && !openaiApiKey.startsWith('sk-')) {
  return NextResponse.json(
    { error: 'Chave OpenAI inválida. Deve começar com "sk-"' },
    { status: 400 }
  )
}
```

---

### 3. Cache de Chave
```typescript
// Evitar query ao banco em toda requisição
// Usar cache em memória ou Redis
const cacheKey = `openai-key:${companyId}`
let apiKey = await redis.get(cacheKey)

if (!apiKey) {
  const [settings] = await db.select()...
  apiKey = settings?.openaiApiKey
  await redis.set(cacheKey, apiKey, 'EX', 3600) // 1 hora
}
```

---

### 4. Logging de Uso
```typescript
// Rastrear uso de tokens e custos
await db.insert(aiUsageLogs).values({
  companyId: user.companyId,
  endpoint: '/api/v1/templates/ai-suggest',
  model: 'gpt-4o-mini',
  tokensUsed: data.usage.total_tokens,
  cost: calculateCost(data.usage),
  createdAt: new Date(),
})
```

---

## 🔒 Segurança

### ✅ Implementado
- [x] Autenticação obrigatória (admin)
- [x] Company isolation (cada empresa tem sua chave)
- [x] Mascaramento de chave no frontend
- [x] Validação de tipo de input

### 📝 Recomendado
- [ ] Rate limiting por empresa (evitar abuso)
- [ ] Validação de formato de chave
- [ ] Cache de chave (performance)
- [ ] Logging de uso (auditoria)
- [ ] Timeout nas chamadas OpenAI (5s)

---

## 📚 Referências

- **OpenAI API:** https://platform.openai.com/docs/api-reference
- **GPT-4o-mini:** https://platform.openai.com/docs/models/gpt-4o-mini
- **OpenAI Pricing:** https://openai.com/api/pricing/
- **Best Practices:** https://platform.openai.com/docs/guides/production-best-practices

---

## ✅ Conclusão

**Sistema OpenAI está 100% funcional e correto!**

**Validações:**
- ✅ Chave armazenada por empresa
- ✅ Mascaramento de chave implementado
- ✅ Auth admin-only em todas as rotas
- ✅ 2 endpoints usando IA validados
- ✅ Error handling robusto
- ✅ Prompts bem estruturados

**Interface:**
- ✅ Estilo Videira premium aplicado
- ✅ Badge de status "Chave Ativa"
- ✅ Card informativo sobre usos da IA
- ✅ Alert com instruções de formato
- ✅ Botões estilizados
- ✅ UX intuitiva

**Sistema OpenAI pronto para produção!** ✨🤖🎨

---

**Última atualização:** 2025-11-05  
**Auditado por:** Cursor AI  
**Status:** ✅ SISTEMA OPENAI TOTALMENTE FUNCIONAL

