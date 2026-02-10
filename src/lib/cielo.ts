import { db } from '@/db/drizzle'
import { gatewayConfigurations } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { logCieloRequest, logCieloResponse } from './cielo-logger'
import { env } from '@/lib/env'
import { safeLog, safeError } from '@/lib/log-sanitizer'
import { configCache, CACHE_KEYS } from '@/lib/config-cache'

const COMPANY_ID = env.COMPANY_INIT

/** Timeout padrão para chamadas à Cielo API (15 segundos) */
const CIELO_TIMEOUT_MS = 15_000

/**
 * Wrapper para fetch com AbortController e timeout.
 * Compatível com Edge Runtime (não usa AbortSignal.timeout).
 */
async function cieloFetch(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), CIELO_TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[CIELO_TIMEOUT] Timeout ao comunicar com Cielo API', { url })
      throw new Error('Timeout ao comunicar com a Cielo API. Tente novamente.')
    }
    throw error
  }
}

type CieloConfig = {
  merchantId: string
  merchantKey: string
  environment: 'production' | 'development'
}

async function getCieloConfig(): Promise<CieloConfig | null> {
  // ✅ Verificar cache primeiro
  const cacheKey = CACHE_KEYS.CIELO_CONFIG(COMPANY_ID)
  const cached = configCache.get<CieloConfig>(cacheKey)
  if (cached) {
    return cached
  }

  // Buscar do banco se não estiver em cache
  const [config] = await db
    .select()
    .from(gatewayConfigurations)
    .where(
      and(
        eq(gatewayConfigurations.companyId, COMPANY_ID),
        eq(gatewayConfigurations.gatewayName, 'Cielo'),
      ),
    )
    .limit(1)

  if (!config) {
    throw new Error('Gateway Cielo não configurado. Configure em /admin/gateways/cielo')
  }

  if (!config.isActive) {
    throw new Error('Gateway Cielo está desativado. Ative em /admin/gateways/cielo')
  }

  const merchantId = config.environment === 'production' ? config.prodClientId : config.devClientId
  const merchantKey =
    config.environment === 'production' ? config.prodClientSecret : config.devClientSecret

  if (!merchantId || !merchantKey) {
    throw new Error(
      `Credenciais Cielo ${config.environment} não configuradas. Configure em /admin/gateways/cielo`,
    )
  }

  const cieloConfig: CieloConfig = {
    merchantId,
    merchantKey,
    environment: config.environment as 'production' | 'development',
  }

  // ✅ Armazenar no cache
  configCache.set(cacheKey, cieloConfig)

  return cieloConfig
}

function getCieloApiUrl(environment: 'production' | 'development'): string {
  return environment === 'production'
    ? 'https://api.cieloecommerce.cielo.com.br'
    : 'https://apisandbox.cieloecommerce.cielo.com.br'
}

function getCieloQueryApiUrl(environment: 'production' | 'development'): string {
  return environment === 'production'
    ? 'https://apiquery.cieloecommerce.cielo.com.br'
    : 'https://apiquerysandbox.cieloecommerce.cielo.com.br'
}

export async function createPixPayment(amount: number, customerName: string) {
  const config = await getCieloConfig()
  if (!config) throw new Error('Configuração Cielo não encontrada')

  const apiUrl = getCieloApiUrl(config.environment)

  const payload = {
    MerchantOrderId: `PIX-${Date.now()}`,
    Customer: {
      Name: customerName,
    },
    Payment: {
      Type: 'Pix',
      Amount: Math.round(amount * 100),
      ExpirationDate: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    },
  }

  safeLog('[CIELO_PIX_REQUEST]', {
    url: `${apiUrl}/1/sales/`,
    environment: config.environment,
    amount: payload.Payment.Amount,
  })

  await logCieloRequest({
    operationType: 'pix',
    method: 'POST',
    endpoint: `${apiUrl}/1/sales/`,
    requestBody: payload,
  })

  const response = await cieloFetch(`${apiUrl}/1/sales/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      MerchantId: config.merchantId,
      MerchantKey: config.merchantKey,
    },
    body: JSON.stringify(payload),
  })

  const responseText = await response.text()

  let paymentId: string | undefined
  try {
    const parsed = JSON.parse(responseText)
    paymentId = parsed.Payment?.PaymentId
  } catch (error) {
    console.warn(
      '[CIELO_PARSE] Não foi possível extrair paymentId da resposta PIX:',
      responseText?.substring(0, 200),
    )
  }

  await logCieloResponse({
    operationType: 'pix',
    method: 'POST',
    endpoint: `${apiUrl}/1/sales/`,
    statusCode: response.status,
    responseBody: responseText,
    paymentId,
    errorMessage: !response.ok ? responseText : undefined,
  })

  if (!response.ok) {
    let errorMessage = 'Erro ao criar pagamento PIX'
    try {
      const error = JSON.parse(responseText)
      errorMessage = error.Message || error[0]?.Message || errorMessage
    } catch (error) {
      console.warn(
        '[CIELO_ERROR_PARSE] Não foi possível parsear erro da Cielo (PIX):',
        responseText?.substring(0, 200),
      )
      errorMessage = `Erro ${response.status}: ${responseText || 'Resposta vazia'}`
    }
    throw new Error(errorMessage)
  }

  const data = JSON.parse(responseText)
  safeLog('[CIELO_PIX_RESPONSE]', data)

  return {
    PaymentId: data.Payment.PaymentId,
    QrCodeBase64Image: data.Payment.QrCodeBase64Image,
    QrCodeString: data.Payment.QrCodeString,
  }
}

export async function createCreditCardPayment(
  amount: number,
  customerName: string,
  customerEmail: string,
  card: {
    number: string
    holder: string
    expirationDate: string
    securityCode: string
    brand: string
  },
  installments: number = 1,
) {
  const config = await getCieloConfig()
  if (!config) throw new Error('Configuração Cielo não encontrada')

  const apiUrl = getCieloApiUrl(config.environment)

  const [month, year] = card.expirationDate.split('/')

  const payload = {
    MerchantOrderId: `ORDER-${Date.now()}`,
    Customer: {
      Name: customerName,
      Email: customerEmail,
    },
    Payment: {
      Type: 'CreditCard',
      Amount: Math.round(amount * 100),
      Installments: installments,
      SoftDescriptor: 'Contribuicao',
      CreditCard: {
        CardNumber: card.number.replace(/\s/g, ''),
        Holder: card.holder,
        ExpirationDate: `${month}/20${year}`,
        SecurityCode: card.securityCode,
        Brand: card.brand,
      },
    },
  }

  await logCieloRequest({
    operationType: 'cartao',
    method: 'POST',
    endpoint: `${apiUrl}/1/sales`,
    requestBody: payload,
  })

  const response = await cieloFetch(`${apiUrl}/1/sales`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      MerchantId: config.merchantId,
      MerchantKey: config.merchantKey,
    },
    body: JSON.stringify(payload),
  })

  const responseText = await response.text()

  let paymentId: string | undefined
  try {
    const parsed = JSON.parse(responseText)
    paymentId = parsed.Payment?.PaymentId
  } catch (error) {
    console.warn(
      '[CIELO_PARSE] Não foi possível extrair paymentId da resposta cartão:',
      responseText?.substring(0, 200),
    )
  }

  await logCieloResponse({
    operationType: 'cartao',
    method: 'POST',
    endpoint: `${apiUrl}/1/sales`,
    statusCode: response.status,
    responseBody: responseText,
    paymentId,
    errorMessage: !response.ok ? responseText : undefined,
  })

  if (!response.ok) {
    let errorMessage = 'Erro ao processar cartão de crédito'
    try {
      const error = JSON.parse(responseText)
      errorMessage = error.Message || error[0]?.Message || errorMessage
    } catch (error) {
      console.warn(
        '[CIELO_ERROR_PARSE] Não foi possível parsear erro da Cielo (cartão):',
        responseText?.substring(0, 200),
      )
      errorMessage = `Erro ${response.status}: ${responseText || 'Resposta vazia'}`
    }
    throw new Error(errorMessage)
  }

  const data = JSON.parse(responseText)
  return {
    PaymentId: data.Payment.PaymentId,
    Status: data.Payment.Status,
    ReturnCode: data.Payment.ReturnCode,
    ReturnMessage: data.Payment.ReturnMessage,
  }
}

export async function createBoletoPayment(
  amount: number,
  customerName: string,
  customerEmail: string,
  customerCpf: string,
  customerAddress: string,
  customerCity: string,
  customerState: string,
  customerZipCode: string,
  customerDistrict: string,
) {
  const config = await getCieloConfig()
  if (!config) throw new Error('Configuração Cielo não encontrada')

  const apiUrl = getCieloApiUrl(config.environment)

  const payload = {
    MerchantOrderId: `ORDER-${Date.now()}`,
    Customer: {
      Name: customerName,
      Identity: customerCpf.replace(/\D/g, ''),
      IdentityType: 'CPF',
      Address: {
        Street: customerAddress,
        Number: '0',
        Complement: '',
        ZipCode: customerZipCode.replace(/\D/g, ''),
        City: customerCity,
        State: customerState,
        Country: 'BRA',
        District: customerDistrict,
      },
    },
    Payment: {
      Type: 'Boleto',
      Amount: Math.round(amount * 100),
      Provider: 'Bradesco2',
      Assignor: 'Vinha Ministérios',
      Demonstrative: 'Contribuição',
      ExpirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      Identification: customerCpf.replace(/\D/g, ''),
      Instructions: 'Aceitar somente até a data de vencimento',
    },
  }

  await logCieloRequest({
    operationType: 'boleto',
    method: 'POST',
    endpoint: `${apiUrl}/1/sales`,
    requestBody: payload,
  })

  const response = await cieloFetch(`${apiUrl}/1/sales`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      MerchantId: config.merchantId,
      MerchantKey: config.merchantKey,
    },
    body: JSON.stringify(payload),
  })

  const responseText = await response.text()

  let paymentId: string | undefined
  try {
    const parsed = JSON.parse(responseText)
    paymentId = parsed.Payment?.PaymentId
  } catch (error) {
    console.warn(
      '[CIELO_PARSE] Não foi possível extrair paymentId da resposta boleto:',
      responseText?.substring(0, 200),
    )
  }

  await logCieloResponse({
    operationType: 'boleto',
    method: 'POST',
    endpoint: `${apiUrl}/1/sales`,
    statusCode: response.status,
    responseBody: responseText,
    paymentId,
    errorMessage: !response.ok ? responseText : undefined,
  })

  if (!response.ok) {
    let errorMessage = 'Erro ao gerar boleto'
    try {
      const error = JSON.parse(responseText)
      errorMessage = error.Message || error[0]?.Message || errorMessage
    } catch (error) {
      console.warn(
        '[CIELO_ERROR_PARSE] Não foi possível parsear erro da Cielo (boleto):',
        responseText?.substring(0, 200),
      )
      errorMessage = `Erro ${response.status}: ${responseText || 'Resposta vazia'}`
    }

    // Mensagem específica para método não habilitado na Cielo
    if (errorMessage.toLowerCase().includes('payment method is not enabled')) {
      throw new Error(
        'Boleto não está habilitado na sua conta Cielo. Por favor, use PIX ou Cartão de Crédito, ou entre em contato com o suporte da Cielo para ativar o produto "Boleto".',
      )
    }

    throw new Error(errorMessage)
  }

  const data = JSON.parse(responseText)
  return {
    PaymentId: data.Payment.PaymentId,
    Url: data.Payment.Url,
    DigitableLine: data.Payment.DigitableLine,
    BarCodeNumber: data.Payment.BarCodeNumber,
  }
}

export async function cancelPayment(paymentId: string, amount?: number) {
  safeLog('[CIELO_CANCEL]', { paymentId, amount })

  const config = await getCieloConfig()
  if (!config) {
    throw new Error('Configuração Cielo não encontrada')
  }

  const apiUrl = getCieloApiUrl(config.environment)
  const amountParam = amount ? `?amount=${Math.round(amount * 100)}` : ''
  const requestUrl = `${apiUrl}/1/sales/${paymentId}/void${amountParam}`

  await logCieloRequest({
    operationType: 'cancelamento',
    method: 'PUT',
    endpoint: requestUrl,
    paymentId,
  })

  const response = await cieloFetch(requestUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      MerchantId: config.merchantId,
      MerchantKey: config.merchantKey,
    },
  })

  const responseText = await response.text()

  await logCieloResponse({
    operationType: 'cancelamento',
    method: 'PUT',
    endpoint: requestUrl,
    paymentId,
    statusCode: response.status,
    responseBody: responseText,
    errorMessage: !response.ok ? responseText : undefined,
  })

  if (!response.ok) {
    let errorMessage = 'Erro ao cancelar pagamento na Cielo'
    try {
      const error = JSON.parse(responseText)
      errorMessage = error.Message || error[0]?.Message || errorMessage
    } catch (error) {
      console.warn(
        '[CIELO_ERROR_PARSE] Não foi possível parsear erro da Cielo (cancelamento):',
        responseText?.substring(0, 200),
      )
      errorMessage = `Erro ${response.status}: ${responseText || 'Resposta vazia'}`
    }
    throw new Error(errorMessage)
  }

  const data = JSON.parse(responseText)
  safeLog('[CIELO_CANCEL_SUCCESS]', data)

  return data
}

export async function queryPayment(paymentId: string) {
  safeLog('[CIELO_QUERY_START]', { paymentId })

  const config = await getCieloConfig()
  if (!config) {
    safeError('[CIELO_QUERY_ERROR]', 'Configuration not found')
    throw new Error('Configuração Cielo não encontrada')
  }

  const apiUrl = getCieloQueryApiUrl(config.environment)
  const requestUrl = `${apiUrl}/1/sales/${paymentId}`

  await logCieloRequest({
    operationType: 'consulta',
    method: 'GET',
    endpoint: requestUrl,
    paymentId,
  })

  const response = await cieloFetch(requestUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      MerchantId: config.merchantId,
      MerchantKey: config.merchantKey,
    },
  })

  const responseText = await response.text()

  await logCieloResponse({
    operationType: 'consulta',
    method: 'GET',
    endpoint: requestUrl,
    paymentId,
    statusCode: response.status,
    responseBody: responseText,
    errorMessage: !response.ok ? responseText : undefined,
  })

  if (!response.ok) {
    safeError('[CIELO_QUERY_FAILED]', {
      paymentId,
      status: response.status,
      statusText: response.statusText,
    })

    // Se for 404, pode ser que o pagamento ainda não esteja disponível na Cielo
    // Isso é comum em PIX - o pagamento pode ter sido feito mas a API ainda não reconhece
    if (response.status === 404) {
      safeLog('[CIELO_QUERY_404]', {
        paymentId,
        message: 'Payment not found - returning pending status',
      })
      return {
        Payment: {
          Status: 0, // Status pendente - continuará verificando
          ReasonCode: 404,
          ReasonMessage: 'Pagamento ainda não disponível para consulta na Cielo (comum em PIX)',
        },
      }
    }

    safeError('[CIELO_QUERY_ERROR]', { status: response.status })
    throw new Error(`Erro ao consultar pagamento: ${response.status}`)
  }

  safeLog('[CIELO_QUERY_SUCCESS]', { paymentId })
  const parsedResponse = JSON.parse(responseText)

  return parsedResponse
}
