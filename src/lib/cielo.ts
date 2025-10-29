import { db } from '@/db/drizzle'
import { gatewayConfigurations } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { logCieloRequest, logCieloResponse } from './cielo-logger'

const COMPANY_ID = process.env.COMPANY_INIT || ''

type CieloConfig = {
  merchantId: string
  merchantKey: string
  environment: 'production' | 'development'
}

async function getCieloConfig(): Promise<CieloConfig | null> {
  const [config] = await db
    .select()
    .from(gatewayConfigurations)
    .where(
      and(
        eq(gatewayConfigurations.companyId, COMPANY_ID),
        eq(gatewayConfigurations.gatewayName, 'Cielo')
      )
    )
    .limit(1)

  if (!config) {
    throw new Error('Gateway Cielo não configurado. Configure em /admin/gateways/cielo')
  }

  if (!config.isActive) {
    throw new Error('Gateway Cielo está desativado. Ative em /admin/gateways/cielo')
  }

  const merchantId = config.environment === 'production' ? config.prodClientId : config.devClientId
  const merchantKey = config.environment === 'production' ? config.prodClientSecret : config.devClientSecret

  if (!merchantId || !merchantKey) {
    throw new Error(`Credenciais Cielo ${config.environment} não configuradas. Configure em /admin/gateways/cielo`)
  }

  return {
    merchantId,
    merchantKey,
    environment: config.environment as 'production' | 'development',
  }
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

  console.log('Cielo PIX Request:', {
    url: `${apiUrl}/1/sales/`,
    environment: config.environment,
    merchantId: config.merchantId,
    payload,
  })

  await logCieloRequest({ method: 'POST', endpoint: `${apiUrl}/1/sales/`, requestBody: payload })

  const response = await fetch(`${apiUrl}/1/sales/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      MerchantId: config.merchantId,
      MerchantKey: config.merchantKey,
    },
    body: JSON.stringify(payload),
  })

  const responseText = await response.text()
  await logCieloResponse({ method: 'POST', endpoint: `${apiUrl}/1/sales/`, statusCode: response.status, responseBody: responseText, errorMessage: !response.ok ? responseText : undefined })
  
  if (!response.ok) {
    let errorMessage = 'Erro ao criar pagamento PIX'
    try {
      const error = JSON.parse(responseText)
      errorMessage = error.Message || error[0]?.Message || errorMessage
    } catch {
      errorMessage = `Erro ${response.status}: ${responseText || 'Resposta vazia'}`
    }
    throw new Error(errorMessage)
  }

  const data = JSON.parse(responseText)
  console.log('Cielo PIX Full Response:', JSON.stringify(data, null, 2))
  
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
  }
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
      Installments: 1,
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

  await logCieloRequest({ operationType: 'cartao', method: 'POST', endpoint: `${apiUrl}/1/sales`, requestBody: payload })

  const response = await fetch(`${apiUrl}/1/sales`, {
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
  } catch {}
  
  await logCieloResponse({ operationType: 'cartao', method: 'POST', endpoint: `${apiUrl}/1/sales`, statusCode: response.status, responseBody: responseText, paymentId, errorMessage: !response.ok ? responseText : undefined })
  
  if (!response.ok) {
    let errorMessage = 'Erro ao processar cartão de crédito'
    try {
      const error = JSON.parse(responseText)
      errorMessage = error.Message || error[0]?.Message || errorMessage
    } catch {
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
  customerDistrict: string
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

  await logCieloRequest({ operationType: 'boleto', method: 'POST', endpoint: `${apiUrl}/1/sales`, requestBody: payload })

  const response = await fetch(`${apiUrl}/1/sales`, {
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
  } catch {}
  
  await logCieloResponse({ operationType: 'boleto', method: 'POST', endpoint: `${apiUrl}/1/sales`, statusCode: response.status, responseBody: responseText, paymentId, errorMessage: !response.ok ? responseText : undefined })
  
  if (!response.ok) {
    let errorMessage = 'Erro ao gerar boleto'
    try {
      const error = JSON.parse(responseText)
      errorMessage = error.Message || error[0]?.Message || errorMessage
    } catch {
      errorMessage = `Erro ${response.status}: ${responseText || 'Resposta vazia'}`
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

export async function queryPayment(paymentId: string) {
  console.log(`[CIELO] Starting query for payment ID: ${paymentId}`)
  
  const config = await getCieloConfig()
  if (!config) {
    console.error('[CIELO] Configuration not found')
    throw new Error('Configuração Cielo não encontrada')
  }

  const apiUrl = getCieloQueryApiUrl(config.environment)
  console.log(`[CIELO] Using API URL: ${apiUrl}`)
  console.log(`[CIELO] Environment: ${config.environment}`)
  console.log(`[CIELO] MerchantId: ${config.merchantId?.substring(0, 8)}...`)

  const requestUrl = `${apiUrl}/1/sales/${paymentId}`
  console.log(`[CIELO] Making request to: ${requestUrl}`)

  await logCieloRequest({ operationType: 'consulta', method: 'GET', endpoint: requestUrl, paymentId })

  const response = await fetch(requestUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      MerchantId: config.merchantId,
      MerchantKey: config.merchantKey,
    },
  })

  console.log(`[CIELO] Response status: ${response.status} ${response.statusText}`)

  const responseText = await response.text()
  console.log(`[CIELO] Response body length: ${responseText.length} characters`)
  
  await logCieloResponse({ operationType: 'consulta', method: 'GET', endpoint: requestUrl, paymentId, statusCode: response.status, responseBody: responseText, errorMessage: !response.ok ? responseText : undefined })

  if (!response.ok) {
    console.error(`[CIELO] Query failed for payment ${paymentId}:`, {
      status: response.status,
      statusText: response.statusText,
      body: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''),
      url: requestUrl
    })
    
    // Se for 404, pode ser que o pagamento ainda não esteja disponível na Cielo
    // Isso é comum em PIX - o pagamento pode ter sido feito mas a API ainda não reconhece
    if (response.status === 404) {
      console.log(`[CIELO] Payment ${paymentId} not found (404) - returning pending status`)
      return {
        Payment: {
          Status: 0, // Status pendente - continuará verificando
          ReasonCode: 404,
          ReasonMessage: 'Pagamento ainda não disponível para consulta na Cielo (comum em PIX)'
        }
      }
    }
    
    console.error(`[CIELO] Throwing error for status ${response.status}`)
    throw new Error(`Erro ao consultar pagamento: ${response.status}`)
  }

  console.log(`[CIELO] Successful response for payment ${paymentId}`)
  const parsedResponse = JSON.parse(responseText)
  console.log(`[CIELO] Parsed response:`, JSON.stringify(parsedResponse, null, 2))
  
  return parsedResponse
}
