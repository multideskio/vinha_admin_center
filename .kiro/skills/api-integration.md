---
inclusion: manual
---

# Skill: Integração com APIs Externas

## Objetivo

Implementar integrações seguras e robustas com APIs externas (Cielo, Bradesco, AWS, WhatsApp).

## Padrões de Integração

### 1. Cliente HTTP Reutilizável

```typescript
// lib/http-client.ts
export class HttpClient {
  constructor(
    private baseURL: string,
    private defaultHeaders: Record<string, string> = {},
  ) {}

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.defaultHeaders,
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  post<T>(endpoint: string, data: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}
```

### 2. Cliente Cielo

```typescript
// lib/services/cielo.ts
export class CieloClient extends HttpClient {
  constructor() {
    super(process.env.CIELO_API_URL!, {
      MerchantId: process.env.CIELO_MERCHANT_ID!,
      MerchantKey: process.env.CIELO_MERCHANT_KEY!,
    })
  }

  async createPayment(data: PaymentData) {
    return this.post<PaymentResponse>('/1/sales', data)
  }

  async capturePayment(paymentId: string, amount: number) {
    return this.put<CaptureResponse>(`/1/sales/${paymentId}/capture`, { Amount: amount })
  }
}

export const cieloClient = new CieloClient()
```

### 3. Cliente Bradesco

```typescript
// lib/services/bradesco.ts
export class BradescoClient extends HttpClient {
  constructor() {
    super(process.env.BRADESCO_API_URL!, {
      Authorization: `Bearer ${process.env.BRADESCO_API_TOKEN}`,
      'Content-Type': 'application/json',
    })
  }

  async createBoleto(data: BoletoData) {
    return this.post<BoletoResponse>('/boleto', data)
  }

  async consultBoleto(boletoId: string) {
    return this.get<BoletoStatus>(`/boleto/${boletoId}`)
  }
}

export const bradescoClient = new BradescoClient()
```

### 4. Retry e Timeout

```typescript
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    timeout?: number
    backoff?: number
  } = {},
): Promise<T> {
  const { maxRetries = 3, timeout = 10000, backoff = 1000 } = options

  let lastError: Error

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Adicionar timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout),
      )

      return (await Promise.race([fn(), timeoutPromise])) as T
    } catch (error) {
      lastError = error as Error

      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, backoff * (attempt + 1)))
      }
    }
  }

  throw lastError!
}
```

### 5. Validação de Webhook

```typescript
import crypto from 'crypto'

export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex')

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
}

// Uso em API Route
export async function POST(request: Request) {
  const signature = request.headers.get('x-signature')
  const payload = await request.text()

  if (!validateWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET!)) {
    return Response.json({ error: 'Assinatura inválida' }, { status: 401 })
  }

  // Processar webhook
}
```

### 6. Rate Limiting

```typescript
export class RateLimiter {
  private requests: Map<string, number[]> = new Map()

  constructor(
    private maxRequests: number,
    private windowMs: number,
  ) {}

  canMakeRequest(key: string): boolean {
    const now = Date.now()
    const requests = this.requests.get(key) || []

    // Remover requests antigas
    const validRequests = requests.filter((time) => now - time < this.windowMs)

    if (validRequests.length >= this.maxRequests) {
      return false
    }

    validRequests.push(now)
    this.requests.set(key, validRequests)

    return true
  }
}

// Uso
const limiter = new RateLimiter(10, 60000) // 10 req/min

if (!limiter.canMakeRequest(userId)) {
  throw new Error('Rate limit excedido')
}
```

### 7. Cache de Respostas

```typescript
import { unstable_cache } from 'next/cache'

export const getCachedData = unstable_cache(
  async (id: string) => {
    return await externalAPI.getData(id)
  },
  ['external-data'],
  { revalidate: 3600 }, // 1 hora
)
```

### 8. Logging de Requisições

```typescript
export async function logAPIRequest(
  service: string,
  endpoint: string,
  method: string,
  duration: number,
  status: number,
) {
  await db.insert(apiLogs).values({
    service,
    endpoint,
    method,
    duration,
    status,
    timestamp: new Date(),
  })
}
```

## Checklist de Integração

- [ ] Credenciais em variáveis de ambiente
- [ ] Timeout configurado
- [ ] Retry logic implementado
- [ ] Validação de webhook signature
- [ ] Rate limiting quando necessário
- [ ] Logs de requisições
- [ ] Tratamento de erros robusto
- [ ] Cache para dados estáticos
- [ ] Testes com mocks
