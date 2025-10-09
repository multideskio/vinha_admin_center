import { db } from '@/db/drizzle'
import { gatewayConfigurations } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

const COMPANY_ID = process.env.COMPANY_INIT!

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

export async function createPixPayment(amount: number, customerName: string, customerEmail: string) {
  const config = await getCieloConfig()

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
    url: `${apiUrl}/1/pix/payments`,
    environment: config.environment,
    merchantId: config.merchantId,
    payload,
  })

  const response = await fetch(`${apiUrl}/1/pix/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      MerchantId: config.merchantId,
      MerchantKey: config.merchantKey,
    },
    body: JSON.stringify(payload),
  })

  console.log('Cielo PIX Response:', {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
  })

  const responseText = await response.text()
  
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
  customerZipCode: string
) {
  const config = await getCieloConfig()

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
  const config = await getCieloConfig()

  const apiUrl = getCieloApiUrl(config.environment)

  const response = await fetch(`${apiUrl}/1/sales/${paymentId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      MerchantId: config.merchantId,
      MerchantKey: config.merchantKey,
    },
  })

  if (!response.ok) {
    throw new Error('Erro ao consultar pagamento')
  }

  return await response.json()
}
