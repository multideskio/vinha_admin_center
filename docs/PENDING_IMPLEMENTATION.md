# 📋 Funcionalidades Pendentes de Implementação

**Vinha Admin Center v0.1.2**  
**Data:** Janeiro 2025  
**Status:** Documento de Planejamento

---

## 📊 Resumo Executivo

Este documento lista todas as funcionalidades que estão **parcialmente implementadas** ou **não implementadas** no sistema Vinha Admin Center.

### Status Geral do Sistema: **85% Completo**

| Categoria | Status | Prioridade |
|-----------|--------|------------|
| **Frontend** | ✅ 100% | - |
| **Backend APIs** | ✅ 95% | - |
| **Banco de Dados** | ✅ 100% | - |
| **Autenticação** | ✅ 100% | - |
| **Pagamentos** | ✅ 95% | Média |
| **Notificações** | ⚠️ 70% | **Alta** |
| **Mensagens Automáticas** | ⚠️ 70% | **Alta** |
| **Cron Jobs** | ❌ 0% | **Crítica** |
| **Workers** | ❌ 0% | Média |
| **Cache** | ❌ 0% | Baixa |
| **Testes** | ❌ 10% | Média |
| **Monitoramento** | ❌ 0% | Média |

---

## 🔴 PRIORIDADE CRÍTICA

### 1. Sistema de Cron Jobs / Scheduler

**Status:** ❌ Não Implementado  
**Impacto:** Alto - Notificações automáticas não funcionam  
**Estimativa:** 8-16 horas

#### O que falta:

**1.1. Scheduler de Lembretes de Pagamento**
```typescript
// src/lib/schedulers/payment-reminders.ts
- Buscar transações com vencimento próximo
- Verificar regras de notificação ativas
- Calcular daysOffset (ex: -5 dias antes)
- Processar e enviar notificações
- Registrar logs de envio
```

**1.2. Scheduler de Avisos de Atraso**
```typescript
// src/lib/schedulers/payment-overdue.ts
- Buscar transações vencidas
- Verificar regras de notificação ativas
- Calcular dias de atraso
- Processar e enviar notificações
- Registrar logs de envio
```

**1.3. Configuração de Cron**
```typescript
// Opções de implementação:
1. node-cron (simples, local)
2. node-schedule (mais recursos)
3. BullMQ + Redis (produção, escalável)
4. Vercel Cron (se deploy na Vercel)
5. AWS EventBridge (se AWS)
```

**Arquivos a criar:**
- `src/lib/schedulers/payment-reminders.ts`
- `src/lib/schedulers/payment-overdue.ts`
- `src/lib/schedulers/index.ts`
- `src/app/api/cron/payment-reminders/route.ts`
- `src/app/api/cron/payment-overdue/route.ts`

**Dependências:**
```json
{
  "node-cron": "^3.0.3",
  "node-schedule": "^2.1.1"
}
```

---

### 2. Processador de Eventos de Notificação

**Status:** ❌ Não Implementado  
**Impacto:** Alto - Regras de mensagens não executam  
**Estimativa:** 6-12 horas

#### O que falta:

**2.1. Processador de Regras**
```typescript
// src/lib/notification-processor.ts
export async function processNotificationEvent(
  eventType: NotificationEventTrigger,
  data: EventData
) {
  // 1. Buscar regras ativas para o evento
  // 2. Filtrar por daysOffset (se aplicável)
  // 3. Substituir variáveis no template
  // 4. Enviar via NotificationService
  // 5. Registrar log
}
```

**2.2. Substituidor de Variáveis**
```typescript
// src/lib/template-processor.ts
export function replaceVariables(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/{(\w+)}/g, (_, key) => {
    return variables[key] || `{${key}}`
  })
}
```

**2.3. Integração com Eventos**
```typescript
// Adicionar em:
- Webhook Cielo (payment_received)
- Criação de usuário (user_registered)
- Cron job diário (payment_due_reminder, payment_overdue)
```

**Arquivos a criar:**
- `src/lib/notification-processor.ts`
- `src/lib/template-processor.ts`

---

### 3. Notificações de Transações

**Status:** ❌ Não Implementado  
**Impacto:** Alto - Usuários não recebem confirmação  
**Estimativa:** 4-8 horas

#### O que falta:

**3.1. Email de Confirmação de Pagamento**
```typescript
// Adicionar no webhook Cielo
// src/app/api/webhooks/cielo/route.ts

if (payment.status === 'approved') {
  await sendTransactionConfirmation({
    userId,
    transactionId,
    amount,
    method,
    email,
    phone
  })
}
```

**3.2. WhatsApp de Confirmação**
```typescript
// Usar NotificationService
const notificationService = new NotificationService(config)
await notificationService.sendWhatsApp({
  phone: user.phone,
  message: `Pagamento confirmado! R$ ${amount}`
})
```

**Arquivos a modificar:**
- `src/app/api/webhooks/cielo/route.ts`
- `src/lib/notification-hooks.ts`

---

## 🟡 PRIORIDADE ALTA

### 4. Sistema de Recuperação de Senha

**Status:** ❌ Não Implementado  
**Impacto:** Médio - Usuários não conseguem recuperar senha  
**Estimativa:** 6-10 horas

#### O que falta:

**4.1. Frontend**
- Página `/recuperar-senha`
- Página `/redefinir-senha/[token]`
- Formulários com validação

**4.2. Backend**
```typescript
// APIs a criar:
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET /api/auth/verify-token
```

**4.3. Banco de Dados**
```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token VARCHAR(255) UNIQUE,
  expires_at TIMESTAMP,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**4.4. Email Template**
- Usar `createPasswordResetEmail` (já existe)
- Integrar com sistema de email

**Arquivos a criar:**
- `src/app/(auth)/recuperar-senha/page.tsx`
- `src/app/(auth)/redefinir-senha/[token]/page.tsx`
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`
- Schema: `passwordResetTokens` table

---

### 5. Notificações de Boas-Vindas

**Status:** ⚠️ Parcialmente Implementado  
**Impacto:** Médio - Novos usuários não recebem boas-vindas  
**Estimativa:** 2-4 horas

#### O que falta:

**5.1. Integrar com Criação de Usuário**
```typescript
// Adicionar em todas as rotas de criação:
- POST /api/v1/admin/managers
- POST /api/v1/admin/supervisors
- POST /api/v1/admin/pastors
- POST /api/v1/admin/churches

// Após criar usuário:
await onUserCreated(newUser.id)
```

**5.2. Melhorar Hook**
```typescript
// src/lib/notification-hooks.ts
// Remover setTimeout de 5 minutos
// Enviar imediatamente após criação
```

**Arquivos a modificar:**
- Todas as rotas de criação de usuários
- `src/lib/notification-hooks.ts`

---

### 6. Parcelamento de Cartão de Crédito

**Status:** ⚠️ Parcialmente Implementado  
**Impacto:** Médio - Usuários não podem parcelar  
**Estimativa:** 4-6 horas

#### O que falta:

**6.1. Frontend - Seletor de Parcelas**
```typescript
// src/components/contributions/payments/CreditCardPayment.tsx
<Select>
  <SelectItem value="1">1x de R$ 100,00</SelectItem>
  <SelectItem value="2">2x de R$ 50,00</SelectItem>
  <SelectItem value="3">3x de R$ 33,33</SelectItem>
  // ... até 12x
</Select>
```

**6.2. Backend - Processar Parcelas**
```typescript
// Já implementado em src/lib/cielo.ts
// Apenas passar installments do frontend
```

**6.3. Exibir Parcelas na Transação**
- Adicionar campo `installments` na tabela transactions
- Exibir na página de detalhes

**Arquivos a modificar:**
- `src/components/contributions/payments/CreditCardPayment.tsx`
- `src/app/api/v1/contributions/route.ts`
- Schema: adicionar `installments` em transactions

---

## 🟢 PRIORIDADE MÉDIA

### 7. Sistema de Workers/Filas

**Status:** ❌ Não Implementado  
**Impacto:** Baixo - Sistema funciona sem, mas não escala  
**Estimativa:** 16-24 horas

#### O que implementar:

**7.1. BullMQ + Redis**
```typescript
// Filas a criar:
- email-queue (envio de emails)
- whatsapp-queue (envio de WhatsApp)
- notification-queue (processamento de notificações)
- report-queue (geração de relatórios)
```

**7.2. Workers**
```typescript
// src/workers/email-worker.ts
// src/workers/whatsapp-worker.ts
// src/workers/notification-worker.ts
// src/workers/report-worker.ts
```

**7.3. Dashboard de Filas**
- Bull Board para monitorar filas
- Retry automático de falhas
- Dead letter queue

**Dependências:**
```json
{
  "bullmq": "^5.0.0",
  "ioredis": "^5.3.2",
  "@bull-board/api": "^5.0.0",
  "@bull-board/express": "^5.0.0"
}
```

---

### 8. Sistema de Cache

**Status:** ❌ Não Implementado  
**Impacto:** Baixo - Performance pode melhorar  
**Estimativa:** 8-12 horas

#### O que implementar:

**8.1. Redis Cache**
```typescript
// Cache para:
- Configurações da empresa (S3, SMTP, WhatsApp)
- Dados de usuário (perfil, permissões)
- Dashboards (KPIs, gráficos)
- Relatórios (resultados de queries pesadas)
```

**8.2. Cache Strategy**
```typescript
// src/lib/cache.ts
export class CacheService {
  async get(key: string)
  async set(key: string, value: any, ttl: number)
  async del(key: string)
  async invalidate(pattern: string)
}
```

**8.3. Cache Invalidation**
```typescript
// Invalidar cache quando:
- Configurações são alteradas
- Perfil é atualizado
- Transação é criada
```

**Dependências:**
```json
{
  "ioredis": "^5.3.2"
}
```

---

### 9. Testes Automatizados

**Status:** ❌ Não Implementado (10%)  
**Impacto:** Médio - Qualidade do código  
**Estimativa:** 40-60 horas

#### O que implementar:

**9.1. Testes Unitários**
```typescript
// Testar:
- Funções utilitárias (src/lib/*)
- Validações (schemas Zod)
- Processadores (notification-processor, template-processor)
```

**9.2. Testes de Integração**
```typescript
// Testar:
- APIs (rotas /api/*)
- Banco de dados (queries)
- Integrações externas (Cielo, S3, SES)
```

**9.3. Testes E2E**
```typescript
// Testar:
- Fluxos completos (login, pagamento, etc)
- Navegação entre páginas
- Formulários
```

**Dependências:**
```json
{
  "jest": "^29.7.0",
  "@testing-library/react": "^14.0.0",
  "@testing-library/jest-dom": "^6.1.0",
  "playwright": "^1.40.0"
}
```

---

### 10. Monitoramento e Logs

**Status:** ❌ Não Implementado  
**Impacto:** Médio - Dificulta debug em produção  
**Estimativa:** 8-12 horas

#### O que implementar:

**10.1. Logging Estruturado**
```typescript
// src/lib/logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})
```

**10.2. Error Tracking**
```typescript
// Opções:
- Sentry (recomendado)
- Rollbar
- Bugsnag
```

**10.3. Performance Monitoring**
```typescript
// Monitorar:
- Tempo de resposta das APIs
- Queries lentas do banco
- Uso de memória
- Taxa de erro
```

**Dependências:**
```json
{
  "winston": "^3.11.0",
  "@sentry/nextjs": "^7.91.0"
}
```

---

## 🔵 PRIORIDADE BAIXA

### 11. Webhooks de Evolution API

**Status:** ❌ Não Implementado  
**Impacto:** Baixo - Funcionalidade extra  
**Estimativa:** 4-6 horas

#### O que implementar:

**11.1. Receber Eventos do WhatsApp**
```typescript
// POST /api/webhooks/evolution
- Mensagens recebidas
- Status de entrega
- Leitura de mensagens
```

**11.2. Processar Respostas**
```typescript
// Responder automaticamente a:
- Comandos (ex: /saldo, /ajuda)
- Confirmações de pagamento
```

---

### 12. Relatórios por Email

**Status:** ❌ Não Implementado  
**Impacto:** Baixo - Funcionalidade extra  
**Estimativa:** 4-6 horas

#### O que implementar:

**12.1. Agendar Envio de Relatórios**
```typescript
// Enviar relatórios:
- Diários (resumo do dia)
- Semanais (resumo da semana)
- Mensais (fechamento do mês)
```

**12.2. Configuração por Usuário**
```typescript
// Permitir usuário escolher:
- Frequência (diário, semanal, mensal)
- Tipo de relatório
- Formato (PDF, Excel)
```

---

### 13. Dashboard de Estatísticas

**Status:** ❌ Não Implementado  
**Impacto:** Baixo - Funcionalidade extra  
**Estimativa:** 8-12 horas

#### O que implementar:

**13.1. Estatísticas de Notificações**
```typescript
// Exibir:
- Total de notificações enviadas
- Taxa de entrega (email, WhatsApp)
- Taxa de abertura (email)
- Taxa de erro
```

**13.2. Estatísticas de Pagamentos**
```typescript
// Exibir:
- Taxa de conversão por método
- Tempo médio de pagamento
- Taxa de cancelamento
- Análise de horários
```

---

## 📦 Dependências a Adicionar

```json
{
  "dependencies": {
    "node-cron": "^3.0.3",
    "bullmq": "^5.0.0",
    "ioredis": "^5.3.2",
    "winston": "^3.11.0",
    "@sentry/nextjs": "^7.91.0"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "playwright": "^1.40.0",
    "@bull-board/api": "^5.0.0",
    "@bull-board/express": "^5.0.0"
  }
}
```

---

## 🎯 Roadmap de Implementação

### Fase 1 - Crítico (1-2 semanas)
1. ✅ Sistema de Cron Jobs
2. ✅ Processador de Eventos
3. ✅ Notificações de Transações

### Fase 2 - Alta Prioridade (1-2 semanas)
4. ✅ Recuperação de Senha
5. ✅ Notificações de Boas-Vindas
6. ✅ Parcelamento de Cartão

### Fase 3 - Média Prioridade (2-4 semanas)
7. ✅ Sistema de Workers
8. ✅ Sistema de Cache
9. ✅ Testes Automatizados
10. ✅ Monitoramento e Logs

### Fase 4 - Baixa Prioridade (1-2 semanas)
11. ✅ Webhooks Evolution API
12. ✅ Relatórios por Email
13. ✅ Dashboard de Estatísticas

---

## 📝 Notas Finais

### O que está 100% pronto:
- ✅ Frontend completo (5 painéis)
- ✅ Backend APIs (50+ endpoints)
- ✅ Autenticação e autorização
- ✅ Sistema de pagamentos (Cielo)
- ✅ Upload de arquivos (S3)
- ✅ Configurações (SMTP, WhatsApp, S3)
- ✅ Banco de dados (schema completo)

### O que precisa de atenção:
- ⚠️ Cron Jobs (crítico)
- ⚠️ Processador de notificações (crítico)
- ⚠️ Notificações de transações (alta)
- ⚠️ Recuperação de senha (alta)

### Estimativa total:
- **Crítico:** 18-36 horas
- **Alta:** 16-26 horas
- **Média:** 72-108 horas
- **Baixa:** 16-24 horas
- **TOTAL:** 122-194 horas (15-24 dias úteis)

---

**Documento gerado em:** Janeiro 2025  
**Versão do sistema:** 0.1.2  
**Próxima revisão:** Após implementação da Fase 1
