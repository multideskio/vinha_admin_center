# Guia de Uso do Logger Estruturado

## Visão Geral

O sistema de logging estruturado (`src/lib/logger.ts`) fornece uma maneira consistente e segura de registrar eventos no sistema, com sanitização automática de dados sensíveis e suporte a contexto.

## Características

- ✅ **Formato JSON estruturado** - Facilita parsing e análise em produção
- ✅ **Sanitização automática** - Remove dados sensíveis (senhas, tokens, CPF, cartões)
- ✅ **Suporte a contexto** - Adicione informações como userId, operation, etc.
- ✅ **Timestamps ISO 8601** - Formato padrão internacional
- ✅ **Logger filho** - Crie loggers isolados com contexto específico
- ✅ **TypeScript** - Totalmente tipado

## Instalação

```typescript
import { logger } from '@/lib/logger'
```

## Uso Básico

### Logging Simples

```typescript
// Info - eventos importantes do sistema
logger.info('Usuário criado com sucesso')

// Warning - situações anormais mas não críticas
logger.warn('Tentativa de acesso a recurso inexistente')

// Error - erros críticos que requerem atenção
logger.error('Falha ao conectar ao banco de dados')
```

### Logging com Dados

```typescript
logger.info('Pagamento processado', {
  transactionId: 'tx123',
  amount: 10000, // em centavos
  method: 'credit_card',
})
```

### Logging com Contexto

```typescript
// Definir contexto no início da operação
logger.setContext({
  userId: user.id,
  operation: 'create-payment',
  role: user.role,
})

// Todos os logs subsequentes incluirão o contexto
logger.info('Iniciando criação de pagamento')
logger.info('Validando dados do cartão')
logger.info('Enviando para gateway')

// Limpar contexto ao final
logger.clearContext()
```

### Logging de Erros

```typescript
try {
  await processPayment()
} catch (error) {
  // Logger automaticamente extrai message e stack trace
  logger.error('Falha ao processar pagamento', error)
}

// Com dados adicionais
try {
  await processPayment()
} catch (error) {
  logger.error('Falha ao processar pagamento', error, {
    transactionId: 'tx123',
    userId: 'user456',
  })
}
```

## Uso em Rotas de API

### Padrão Recomendado

```typescript
import { logger } from '@/lib/logger'
import { validateRequest } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const { user } = await validateRequest()
    if (!user) {
      logger.warn('Tentativa de acesso não autorizado')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Definir contexto
    logger.setContext({
      userId: user.id,
      operation: 'create-transaction',
      role: user.role,
    })

    // 3. Validação
    const body = await request.json()
    logger.info('Dados recebidos', { amount: body.amount })

    // 4. Processamento
    const result = await createTransaction(body)
    logger.info('Transação criada com sucesso', { transactionId: result.id })

    // 5. Limpar contexto
    logger.clearContext()

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    logger.error('Erro ao criar transação', error)
    logger.clearContext()

    return NextResponse.json({ error: 'Erro ao processar requisição' }, { status: 500 })
  }
}
```

## Logger Filho (Child Logger)

Use loggers filhos para criar instâncias isoladas com contexto específico:

```typescript
// Logger principal
logger.setContext({ userId: 'user123' })

// Logger filho herda contexto do pai e adiciona o seu próprio
const paymentLogger = logger.child({ operation: 'payment' })
paymentLogger.info('Processando pagamento') // Inclui userId e operation

const notificationLogger = logger.child({ operation: 'notification' })
notificationLogger.info('Enviando email') // Inclui userId e operation

// Contextos são isolados
paymentLogger.setContext({ transactionId: 'tx123' })
// notificationLogger NÃO terá transactionId
```

## Sanitização Automática

O logger automaticamente remove ou mascara dados sensíveis:

### Campos Sensíveis (sempre [REDACTED])

```typescript
logger.info('Dados', {
  password: 'senha123', // → [REDACTED]
  token: 'abc123', // → [REDACTED]
  securityCode: '123', // → [REDACTED]
  cvv: '456', // → [REDACTED]
  cardNumber: '1234...', // → [REDACTED]
  jwt: 'eyJ...', // → [REDACTED]
  secret: 'secret123', // → [REDACTED]
  apiKey: 'key123', // → [REDACTED]
})
```

### Padrões em Strings (mascarados)

```typescript
logger.info('Dados', {
  cpf: '123.456.789-01', // → ***.***.***-**
  cardNumber: '1234567890123456', // → ****-****-****-****
})
```

### Arrays e Objetos Aninhados

```typescript
logger.info('Lista', [
  { name: 'User 1', password: 'pass1' }, // password → [REDACTED]
  { name: 'User 2', token: 'token123' }, // token → [REDACTED]
])
```

## Formato de Saída

Todos os logs são emitidos em formato JSON:

```json
{
  "level": "info",
  "message": "Transação criada",
  "timestamp": "2024-01-20T10:30:45.123Z",
  "context": {
    "userId": "user123",
    "operation": "create-transaction",
    "role": "pastor"
  },
  "data": {
    "transactionId": "tx456",
    "amount": 10000
  }
}
```

Para erros:

```json
{
  "level": "error",
  "message": "Falha ao processar pagamento",
  "timestamp": "2024-01-20T10:30:45.123Z",
  "context": {
    "userId": "user123",
    "operation": "create-payment"
  },
  "error": "Connection timeout",
  "stack": "Error: Connection timeout\n    at ..."
}
```

## Boas Práticas

### ✅ Faça

```typescript
// Use contexto para operações complexas
logger.setContext({ userId: user.id, operation: 'payment' })

// Limpe contexto ao final
logger.clearContext()

// Use níveis apropriados
logger.error('Erro crítico', error) // Erros inesperados
logger.warn('Recurso não encontrado') // Situações anormais
logger.info('Operação concluída') // Eventos importantes

// Inclua dados relevantes
logger.info('Pagamento processado', { transactionId, amount })
```

### ❌ Não Faça

```typescript
// Não use console.log diretamente
console.log('Usuário criado') // ❌

// Não logue dados sensíveis manualmente
logger.info(`Senha: ${password}`) // ❌ Use objetos para sanitização automática

// Não esqueça de limpar contexto
logger.setContext({ userId: 'user123' })
// ... operação ...
// ❌ Faltou logger.clearContext()

// Não use logger para debug em desenvolvimento
logger.info('Debug: variável x =', x) // ❌ Use console.log em dev
```

## Integração com Monitoramento

O formato JSON estruturado facilita integração com ferramentas de monitoramento:

### Vercel Logs

Os logs aparecem automaticamente no dashboard da Vercel com parsing JSON.

### CloudWatch / DataDog

Configure parsing de JSON para extrair campos automaticamente:

```json
{
  "level": "$.level",
  "message": "$.message",
  "userId": "$.context.userId",
  "operation": "$.context.operation"
}
```

### Alertas

Configure alertas baseados em:

- `level: "error"` - Erros críticos
- `context.operation: "payment"` - Falhas em pagamentos
- `message` contém "timeout" - Problemas de performance

## Migração de console.log

Para migrar código existente:

```typescript
// Antes
console.log('Usuário criado:', userId)
console.error('Erro:', error)

// Depois
logger.info('Usuário criado', { userId })
logger.error('Erro ao criar usuário', error)
```

## Próximos Passos

Quando a tarefa 12 for concluída, o logger será atualizado para usar a função de sanitização completa de `log-sanitizer.ts`, que incluirá:

- Mais padrões de dados sensíveis
- Sanitização de dados de cartão de crédito
- Mascaramento de emails parciais
- Configuração customizável de campos sensíveis

## Suporte

Para dúvidas ou problemas, consulte:

- Código fonte: `src/lib/logger.ts`
- Testes: `src/lib/logger.test.ts`
- Spec: `.kiro/specs/code-quality-fixes/`
