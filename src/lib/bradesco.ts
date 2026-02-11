/**
 * @fileoverview Módulo de integração com as APIs do Bradesco (PIX + Boleto)
 * @description Tipos, interfaces, configuração com cache, fetch wrapper e utilitários.
 *              OAuth, PIX e Boleto são implementados em tasks subsequentes.
 */

import https from 'https'
import { db } from '@/db/drizzle'
import { gatewayConfigurations } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { env } from '@/lib/env'
import { safeLog, safeError } from '@/lib/log-sanitizer'
import { logBradescoRequest, logBradescoResponse } from '@/lib/bradesco-logger'
import { configCache, CACHE_KEYS } from '@/lib/config-cache'

const COMPANY_ID = env.COMPANY_INIT

/** Timeout padrão para chamadas à API do Bradesco (15 segundos) */
const BRADESCO_TIMEOUT_MS = 15_000

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface BradescoOAuthToken {
  accessToken: string
  expiresAt: number // timestamp em ms
}

export type BradescoEnvironment = 'production' | 'development' | 'sandbox'

export interface BradescoConfig {
  clientId: string
  clientSecret: string
  certificate: string // conteúdo base64 do .pfx/.pem
  certificatePassword: string
  pixKey: string // chave PIX do recebedor (CNPJ, email, telefone ou EVP)
  environment: BradescoEnvironment
}

export interface BradescoPixResponse {
  txid: string
  location: string
  qrCode: string
  qrCodeBase64Image: string
  status: 'ATIVA' | 'CONCLUIDA' | 'REMOVIDA_PELO_USUARIO_RECEBEDOR' | 'REMOVIDA_PELO_PSP'
}

export interface BradescoPixQueryResponse {
  txid: string
  status: 'ATIVA' | 'CONCLUIDA' | 'REMOVIDA_PELO_USUARIO_RECEBEDOR' | 'REMOVIDA_PELO_PSP'
  valor: { original: string }
  pix?: Array<{
    endToEndId: string
    valor: string
    horario: string
  }>
}

export interface BradescoBoletoResponse {
  nossoNumero: string
  linhaDigitavel: string
  codigoBarras: string
  url: string
}

export interface BradescoBoletoQueryResponse {
  nossoNumero: string
  status: 'registrado' | 'pago' | 'vencido' | 'cancelado'
  valorPago?: number
  dataPagamento?: string
}

// ─── Mapeamento de URLs por ambiente ─────────────────────────────────────────

/**
 * URLs oficiais da API Bradesco por ambiente e tipo de serviço.
 *
 * Open APIs (Arrecadação, Cobrança, Boleto, etc.):
 *   - Homologação: https://proxy.api.prebanco.com.br
 *   - Sandbox:     https://openapisandbox.prebanco.com.br
 *   - Produção:    https://openapi.bradesco.com.br
 *
 * APIs PIX:
 *   - Sandbox:     https://openapisandbox.prebanco.com.br (usa mesma base das Open APIs)
 *   - Homologação: https://qrpix-h.bradesco.com.br
 *   - Produção:    https://qrpix.bradesco.com.br
 *
 * Webhook PIX:
 *   - Homologação: bspi.webhook.prebanco.com.br
 *   - Produção:    qrpix.webhook.bradesco.com.br
 *
 * Webhook Cobrança:
 *   - Produção:    boletosliquidados.bradesco.com.br
 */
const BRADESCO_URLS = {
  production: {
    auth: 'https://qrpix.bradesco.com.br/auth/server/oauth/token',
    api: 'https://openapi.bradesco.com.br',
    pix: 'https://qrpix.bradesco.com.br',
  },
  development: {
    auth: 'https://proxy.api.prebanco.com.br/auth/server/oauth/token',
    api: 'https://proxy.api.prebanco.com.br',
    pix: 'https://qrpix-h.bradesco.com.br',
  },
  sandbox: {
    auth: 'https://openapisandbox.prebanco.com.br/auth/server/oauth/token',
    api: 'https://openapisandbox.prebanco.com.br',
    pix: 'https://openapisandbox.prebanco.com.br',
  },
} as const

/**
 * Retorna a URL base da API do Bradesco (Open APIs / Boleto) para o ambiente informado.
 */
export function getBradescoApiUrl(environment: BradescoEnvironment): string {
  return BRADESCO_URLS[environment].api
}

/**
 * Retorna a URL base da API PIX do Bradesco para o ambiente informado.
 */
export function getBradescoPixUrl(environment: BradescoEnvironment): string {
  return BRADESCO_URLS[environment].pix
}

/**
 * Retorna a URL de autenticação OAuth do Bradesco para o ambiente informado.
 */
export function getBradescoAuthUrl(environment: BradescoEnvironment): string {
  return BRADESCO_URLS[environment].auth
}

// ─── Configuração com cache ──────────────────────────────────────────────────

/**
 * Busca a configuração do gateway Bradesco no banco de dados com cache.
 * Segue o mesmo padrão do `getCieloConfig()`.
 *
 * @returns Configuração do Bradesco com credenciais e certificado
 * @throws Error se o gateway não estiver configurado ou ativo
 */
export async function getBradescoConfig(): Promise<BradescoConfig> {
  const cacheKey = CACHE_KEYS.BRADESCO_CONFIG(COMPANY_ID)
  const cached = configCache.get<BradescoConfig>(cacheKey)
  if (cached) {
    return cached
  }

  const [config] = await db
    .select()
    .from(gatewayConfigurations)
    .where(
      and(
        eq(gatewayConfigurations.companyId, COMPANY_ID),
        eq(gatewayConfigurations.gatewayName, 'Bradesco'),
      ),
    )
    .limit(1)

  if (!config) {
    throw new Error('Gateway Bradesco não configurado. Configure em /admin/gateways/bradesco')
  }

  if (!config.isActive) {
    throw new Error('Gateway Bradesco está desativado. Ative em /admin/gateways/bradesco')
  }

  const clientId = config.environment === 'production' ? config.prodClientId : config.devClientId
  const clientSecret =
    config.environment === 'production' ? config.prodClientSecret : config.devClientSecret

  if (!clientId || !clientSecret) {
    throw new Error(
      `Credenciais Bradesco ${config.environment} não configuradas. Configure em /admin/gateways/bradesco`,
    )
  }

  if (!config.certificate || !config.certificatePassword) {
    throw new Error(
      'Certificado digital do Bradesco não configurado. Configure em /admin/gateways/bradesco',
    )
  }

  if (!config.pixKey) {
    throw new Error('Chave PIX do recebedor não configurada. Configure em /admin/gateways/bradesco')
  }

  const bradescoConfig: BradescoConfig = {
    clientId,
    clientSecret,
    certificate: config.certificate,
    certificatePassword: config.certificatePassword,
    pixKey: config.pixKey,
    environment: config.environment as BradescoEnvironment,
  }

  configCache.set(cacheKey, bradescoConfig)

  safeLog('[BRADESCO_CONFIG] Configuração carregada e cacheada', {
    environment: bradescoConfig.environment,
  })

  return bradescoConfig
}

// ─── OAuth Client com mTLS ────────────────────────────────────────────────────

/** Token OAuth2 cacheado em memória */
let cachedToken: BradescoOAuthToken | null = null

/**
 * Realiza uma requisição HTTPS com mTLS (certificado digital).
 * Necessário para autenticação OAuth2 com o Bradesco, pois o `fetch` padrão
 * não suporta `https.Agent` em todas as versões do Node.js.
 *
 * @param url - URL completa do endpoint
 * @param options - Opções da requisição (method, headers, body, agent)
 * @returns Objeto com statusCode e body (string)
 */
function bradescoMtlsFetch(
  url: string,
  options: {
    method: string
    headers: Record<string, string>
    body: string
    agent: https.Agent
  },
): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    const req = https.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method,
        headers: options.headers,
        agent: options.agent,
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => chunks.push(chunk))
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf-8')
          resolve({ statusCode: res.statusCode ?? 0, body })
        })
      },
    )

    const timeoutId = setTimeout(() => {
      req.destroy()
      reject(
        new Error('Timeout ao comunicar com a API de autenticação do Bradesco. Tente novamente.'),
      )
    }, BRADESCO_TIMEOUT_MS)

    req.on('error', (error) => {
      clearTimeout(timeoutId)
      reject(error)
    })

    req.on('close', () => {
      clearTimeout(timeoutId)
    })

    req.write(options.body)
    req.end()
  })
}

/**
 * Obtém um token OAuth2 do Bradesco via client_credentials com mTLS.
 * O token é cacheado em memória com TTL baseado no `expires_in` da resposta,
 * subtraindo 1 minuto como margem de segurança.
 *
 * @returns Token OAuth2 com accessToken e expiresAt
 * @throws Error se a autenticação falhar (mensagem em pt-BR)
 */
export async function getBradescoToken(): Promise<BradescoOAuthToken> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken
  }

  const config = await getBradescoConfig()
  const authUrl = getBradescoAuthUrl(config.environment)

  // Sandbox envia client_id/client_secret no body (form-urlencoded).
  // Produção e homologação usam Basic Auth no header.
  const isSandbox = config.environment === 'sandbox'
  const body = isSandbox
    ? `grant_type=client_credentials&client_id=${encodeURIComponent(config.clientId)}&client_secret=${encodeURIComponent(config.clientSecret)}`
    : 'grant_type=client_credentials'

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  if (!isSandbox) {
    const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')
    headers['Authorization'] = `Basic ${basicAuth}`
  }

  await logBradescoRequest({
    operationType: 'token',
    method: 'POST',
    endpoint: authUrl,
    requestBody: { grant_type: 'client_credentials', environment: config.environment },
  })

  try {
    const agent = new https.Agent({
      pfx: Buffer.from(config.certificate, 'base64'),
      passphrase: config.certificatePassword,
    })

    const response = await bradescoMtlsFetch(authUrl, {
      method: 'POST',
      headers,
      body,
      agent,
    })

    if (response.statusCode < 200 || response.statusCode >= 300) {
      await logBradescoResponse({
        operationType: 'token',
        method: 'POST',
        endpoint: authUrl,
        statusCode: response.statusCode,
        responseBody: response.body,
        errorMessage: `HTTP ${response.statusCode}`,
      })
      throw new Error(
        'Erro na autenticação OAuth2 com o Bradesco. Verifique as credenciais e o certificado digital.',
      )
    }

    const data: { access_token: string; expires_in: number; token_type: string } = JSON.parse(
      response.body,
    )

    const token: BradescoOAuthToken = {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000 - 60_000,
    }

    cachedToken = token

    await logBradescoResponse({
      operationType: 'token',
      method: 'POST',
      endpoint: authUrl,
      statusCode: response.statusCode,
      responseBody: { token_type: data.token_type, expires_in: data.expires_in },
    })

    safeLog('[BRADESCO_AUTH] Token OAuth2 obtido e cacheado', {
      environment: config.environment,
      expiresIn: data.expires_in,
    })

    return token
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Erro na autenticação OAuth2')) {
      throw error
    }

    safeError('[BRADESCO_AUTH] Falha na autenticação OAuth2', {
      error: error instanceof Error ? error.message : String(error),
    })

    throw new Error(
      'Erro na autenticação OAuth2 com o Bradesco. Verifique as credenciais e o certificado digital.',
    )
  }
}

// ─── Fetch wrapper com timeout ───────────────────────────────────────────────

/**
 * Wrapper para fetch com AbortController e timeout de 15s.
 * Compatível com Node.js runtime (não usa AbortSignal.timeout).
 * Segue o mesmo padrão do `cieloFetch()`.
 */
export async function bradescoFetch(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), BRADESCO_TIMEOUT_MS)
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
      safeError('[BRADESCO_TIMEOUT] Timeout ao comunicar com API do Bradesco', { url })
      throw new Error('Timeout ao comunicar com a API do Bradesco. Tente novamente.')
    }
    throw error
  }
}

// ─── Geradores de identificadores ────────────────────────────────────────────

/** Caracteres alfanuméricos para geração de txid (a-z, A-Z, 0-9) */
const ALPHANUMERIC_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

/**
 * Gera um txid único para cobranças PIX (padrão BACEN).
 * O txid deve ter entre 26 e 35 caracteres alfanuméricos, sem hífens.
 * Gera 32 caracteres por padrão.
 *
 * @returns txid alfanumérico de 32 caracteres
 */
export function generateTxid(): string {
  const length = 32
  let txid = ''
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)
  for (let i = 0; i < length; i++) {
    const idx = randomValues[i]! % ALPHANUMERIC_CHARS.length
    txid += ALPHANUMERIC_CHARS[idx]
  }
  return txid
}

/**
 * Gera um nosso número único para boletos Bradesco.
 * O nosso número é composto por 11 dígitos numéricos.
 *
 * @returns nosso número de 11 dígitos
 */
export function generateNossoNumero(): string {
  const length = 11
  let nossoNumero = ''
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)
  for (let i = 0; i < length; i++) {
    nossoNumero += (randomValues[i]! % 10).toString()
  }
  return nossoNumero
}

// ─── PIX Service ─────────────────────────────────────────────────────────────

/** Payload BACEN para cobrança PIX imediata */
interface BradescoPixCobPayload {
  calendario: { expiracao: number }
  devedor: { cpf: string; nome: string }
  valor: { original: string }
  chave: string
  solicitacaoPagador: string
}

/**
 * Formata um valor em reais para string com 2 casas decimais (padrão BACEN).
 * Ex: 100 → "100.00", 49.9 → "49.90"
 */
function formatPixAmount(amount: number): string {
  return amount.toFixed(2)
}

/**
 * Remove caracteres não numéricos de um CPF.
 * Ex: "123.456.789-01" → "12345678901"
 */
function stripCpfNonDigits(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

/**
 * Cria uma cobrança PIX imediata (cob) na API PIX V8 do Bradesco.
 * Segue a especificação BACEN para API PIX Recebimento.
 *
 * @param amount - Valor em reais (convertido para string "0.00")
 * @param pixKey - Chave PIX do recebedor
 * @param customerName - Nome do devedor
 * @param customerCpf - CPF do devedor (aceita formatado ou apenas dígitos)
 * @returns Dados da cobrança PIX criada (txid, location, QR Code)
 * @throws Error com mensagem em pt-BR se a criação falhar
 */
export async function createBradescoPixPayment(
  amount: number,
  pixKey: string,
  customerName: string,
  customerCpf: string,
): Promise<BradescoPixResponse> {
  const config = await getBradescoConfig()
  const token = await getBradescoToken()
  const txid = generateTxid()
  const pixUrl = getBradescoPixUrl(config.environment)
  const endpoint = `${pixUrl}/v2/cob/${txid}`

  const payload: BradescoPixCobPayload = {
    calendario: { expiracao: 3600 },
    devedor: {
      cpf: stripCpfNonDigits(customerCpf),
      nome: customerName,
    },
    valor: { original: formatPixAmount(amount) },
    chave: pixKey,
    solicitacaoPagador: 'Contribuição',
  }

  safeLog('[BRADESCO_PIX_REQUEST]', {
    endpoint,
    environment: config.environment,
    amount: payload.valor.original,
    txid,
  })

  await logBradescoRequest({
    operationType: 'pix',
    method: 'PUT',
    endpoint,
    paymentId: txid,
    requestBody: payload,
  })

  try {
    const response = await bradescoFetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.accessToken}`,
      },
      body: JSON.stringify(payload),
    })

    const responseText = await response.text()

    await logBradescoResponse({
      operationType: 'pix',
      method: 'PUT',
      endpoint,
      paymentId: txid,
      statusCode: response.status,
      responseBody: responseText,
      errorMessage: !response.ok ? responseText : undefined,
    })

    if (!response.ok) {
      let errorMessage = 'Erro ao criar cobrança PIX no Bradesco'
      try {
        const errorData: { title?: string; detail?: string; violacoes?: Array<{ razao: string }> } =
          JSON.parse(responseText)
        if (errorData.detail) {
          errorMessage = `Erro ao criar cobrança PIX: ${errorData.detail}`
        } else if (errorData.violacoes && errorData.violacoes.length > 0) {
          errorMessage = `Erro ao criar cobrança PIX: ${errorData.violacoes.map((v) => v.razao).join(', ')}`
        }
      } catch (parseError) {
        safeError('[BRADESCO_PIX_PARSE_ERROR] Não foi possível parsear erro da API PIX', {
          responseText: responseText?.substring(0, 200),
        })
        errorMessage = `Erro ${response.status} ao criar cobrança PIX no Bradesco`
      }
      throw new Error(errorMessage)
    }

    const data: {
      txid: string
      status: string
      location?: string
      pixCopiaECola?: string
      qrcode?: string
    } = JSON.parse(responseText)

    safeLog('[BRADESCO_PIX_RESPONSE]', {
      txid: data.txid,
      status: data.status,
      hasLocation: !!data.location,
    })

    // Se a resposta já contém QR Code, usar diretamente.
    // Caso contrário, buscar via location URL (padrão BACEN).
    // A API PIX BACEN retorna `location` no PUT /cob/{txid}.
    // O GET na location com Accept: application/json retorna o payload com pixCopiaECola.
    let qrCode = data.pixCopiaECola || ''
    let qrCodeBase64Image = data.qrcode || ''
    const location = data.location || ''

    if (location && !qrCode) {
      try {
        // Buscar payload PIX via location URL (padrão BACEN)
        const qrResponse = await bradescoFetch(location, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token.accessToken}`,
            Accept: 'application/json',
          },
        })

        if (qrResponse.ok) {
          const qrText = await qrResponse.text()
          try {
            const qrData: {
              pixCopiaECola?: string
              qrcode?: string
              imagemQrcode?: string
              emv?: string
            } = JSON.parse(qrText)

            // Diferentes bancos retornam o BRCode em campos diferentes
            if (!qrCode) {
              qrCode = qrData.pixCopiaECola || qrData.emv || qrData.qrcode || ''
            }
            if (!qrCodeBase64Image && qrData.imagemQrcode) {
              qrCodeBase64Image = qrData.imagemQrcode
            }
          } catch (parseError) {
            // Se não é JSON, pode ser o próprio BRCode/EMV como texto plano
            if (qrText && qrText.length > 20 && qrText.length < 500) {
              qrCode = qrText.trim()
            }
            safeError('[BRADESCO_PIX_QR_PARSE] Resposta da location não é JSON válido', {
              location,
              responseLength: qrText.length,
            })
          }
        } else {
          safeError('[BRADESCO_PIX_QR_FETCH_FAILED] Falha ao buscar QR Code via location', {
            location,
            status: qrResponse.status,
          })
        }
      } catch (qrError) {
        safeError('[BRADESCO_PIX_QR_ERROR] Erro ao buscar QR Code via location', {
          location,
          error: qrError instanceof Error ? qrError.message : String(qrError),
        })
      }
    }

    // Fallback: usar location como qrCode se ainda não tiver
    if (!qrCode && location) {
      qrCode = location
    }

    return {
      txid: data.txid || txid,
      location,
      qrCode,
      qrCodeBase64Image,
      status: (data.status as BradescoPixResponse['status']) || 'ATIVA',
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Erro')) {
      throw error
    }
    if (error instanceof Error && error.message.startsWith('Timeout')) {
      throw error
    }

    safeError('[BRADESCO_PIX_ERROR] Falha ao criar cobrança PIX', {
      txid,
      error: error instanceof Error ? error.message : String(error),
    })

    throw new Error('Erro ao criar cobrança PIX no Bradesco. Tente novamente.')
  }
}

/**
 * Consulta o status de uma cobrança PIX por txid na API PIX V8 do Bradesco.
 * Segue a especificação BACEN para consulta de cobrança imediata.
 *
 * Em caso de erro, retorna status 'ATIVA' (pendente) para permitir nova tentativa,
 * seguindo o mesmo padrão do `queryPayment()` da Cielo.
 *
 * @param txid - Identificador único da cobrança PIX
 * @returns Dados da cobrança com status atual e informações de pagamento (se concluída)
 */
export async function queryBradescoPixPayment(txid: string): Promise<BradescoPixQueryResponse> {
  const config = await getBradescoConfig()
  const token = await getBradescoToken()
  const pixUrl = getBradescoPixUrl(config.environment)
  const endpoint = `${pixUrl}/v2/cob/${txid}`

  safeLog('[BRADESCO_PIX_QUERY_REQUEST]', {
    endpoint,
    environment: config.environment,
    txid,
  })

  await logBradescoRequest({
    operationType: 'consulta',
    method: 'GET',
    endpoint,
    paymentId: txid,
  })

  try {
    const response = await bradescoFetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
      },
    })

    const responseText = await response.text()

    await logBradescoResponse({
      operationType: 'consulta',
      method: 'GET',
      endpoint,
      paymentId: txid,
      statusCode: response.status,
      responseBody: responseText,
      errorMessage: !response.ok ? responseText : undefined,
    })

    if (!response.ok) {
      safeError('[BRADESCO_PIX_QUERY_FAILED]', {
        txid,
        status: response.status,
        statusText: response.statusText,
      })

      return {
        txid,
        status: 'ATIVA',
        valor: { original: '0.00' },
      }
    }

    const data: {
      txid: string
      status: string
      valor: { original: string }
      pix?: Array<{
        endToEndId: string
        valor: string
        horario: string
      }>
    } = JSON.parse(responseText)

    safeLog('[BRADESCO_PIX_QUERY_SUCCESS]', {
      txid: data.txid,
      status: data.status,
      hasPix: !!data.pix && data.pix.length > 0,
    })

    return {
      txid: data.txid || txid,
      status: (data.status as BradescoPixQueryResponse['status']) || 'ATIVA',
      valor: data.valor || { original: '0.00' },
      pix: data.pix,
    }
  } catch (error) {
    safeError('[BRADESCO_PIX_QUERY_ERROR] Falha ao consultar cobrança PIX', {
      txid,
      error: error instanceof Error ? error.message : String(error),
    })

    return {
      txid,
      status: 'ATIVA',
      valor: { original: '0.00' },
    }
  }
}

// ─── Boleto Service ──────────────────────────────────────────────────────────

/** Payload para registro de boleto no Bradesco */
interface BradescoBoletoPayload {
  nossoNumero: string
  valorNominal: number // valor em centavos
  dataVencimento: string // formato "YYYY-MM-DD"
  pagador: {
    nome: string
    cpf: string
    endereco: string
    cidade: string
    uf: string
    cep: string
    bairro: string
  }
}

/**
 * Formata a data de vencimento do boleto (7 dias a partir de hoje).
 * Formato: "YYYY-MM-DD"
 */
function getBoletoExpirationDate(): string {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Remove caracteres não numéricos de um CEP.
 * Ex: "01310-100" → "01310100"
 */
function stripCepNonDigits(cep: string): string {
  return cep.replace(/\D/g, '')
}

/**
 * Registra um boleto na API de Boleto Registrado do Bradesco.
 *
 * @param amount - Valor em reais (convertido para centavos internamente)
 * @param customerName - Nome do pagador
 * @param customerCpf - CPF do pagador (aceita formatado ou apenas dígitos)
 * @param customerAddress - Endereço do pagador
 * @param customerCity - Cidade do pagador
 * @param customerState - UF do pagador (2 caracteres)
 * @param customerZipCode - CEP do pagador (aceita formatado ou apenas dígitos)
 * @param customerDistrict - Bairro do pagador
 * @returns Dados do boleto registrado (nossoNumero, linhaDigitavel, codigoBarras, url)
 * @throws Error com mensagem em pt-BR se o registro falhar
 */
export async function createBradescoBoletoPayment(
  amount: number,
  customerName: string,
  customerCpf: string,
  customerAddress: string,
  customerCity: string,
  customerState: string,
  customerZipCode: string,
  customerDistrict: string,
): Promise<BradescoBoletoResponse> {
  const config = await getBradescoConfig()
  const token = await getBradescoToken()
  const nossoNumero = generateNossoNumero()
  const apiUrl = getBradescoApiUrl(config.environment)
  const endpoint = `${apiUrl}/v1/boleto/registrar`

  const payload: BradescoBoletoPayload = {
    nossoNumero,
    valorNominal: Math.round(amount * 100),
    dataVencimento: getBoletoExpirationDate(),
    pagador: {
      nome: customerName,
      cpf: stripCpfNonDigits(customerCpf),
      endereco: customerAddress,
      cidade: customerCity,
      uf: customerState,
      cep: stripCepNonDigits(customerZipCode),
      bairro: customerDistrict,
    },
  }

  safeLog('[BRADESCO_BOLETO_REQUEST]', {
    endpoint,
    environment: config.environment,
    amount: payload.valorNominal,
    nossoNumero,
  })

  await logBradescoRequest({
    operationType: 'boleto',
    method: 'POST',
    endpoint,
    paymentId: nossoNumero,
    requestBody: payload,
  })

  try {
    const response = await bradescoFetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.accessToken}`,
      },
      body: JSON.stringify(payload),
    })

    const responseText = await response.text()

    await logBradescoResponse({
      operationType: 'boleto',
      method: 'POST',
      endpoint,
      paymentId: nossoNumero,
      statusCode: response.status,
      responseBody: responseText,
      errorMessage: !response.ok ? responseText : undefined,
    })

    if (!response.ok) {
      let errorMessage = 'Erro ao registrar boleto no Bradesco'
      try {
        const errorData: { title?: string; detail?: string; mensagem?: string } =
          JSON.parse(responseText)
        if (errorData.detail) {
          errorMessage = `Erro ao registrar boleto: ${errorData.detail}`
        } else if (errorData.mensagem) {
          errorMessage = `Erro ao registrar boleto: ${errorData.mensagem}`
        }
      } catch (parseError) {
        safeError('[BRADESCO_BOLETO_PARSE_ERROR] Não foi possível parsear erro da API Boleto', {
          responseText: responseText?.substring(0, 200),
        })
        errorMessage = `Erro ${response.status} ao registrar boleto no Bradesco`
      }
      throw new Error(errorMessage)
    }

    const data: {
      nossoNumero?: string
      linhaDigitavel?: string
      codigoBarras?: string
      url?: string
    } = JSON.parse(responseText)

    safeLog('[BRADESCO_BOLETO_RESPONSE]', {
      nossoNumero: data.nossoNumero || nossoNumero,
      hasLinhaDigitavel: !!data.linhaDigitavel,
      hasCodigoBarras: !!data.codigoBarras,
      hasUrl: !!data.url,
    })

    return {
      nossoNumero: data.nossoNumero || nossoNumero,
      linhaDigitavel: data.linhaDigitavel || '',
      codigoBarras: data.codigoBarras || '',
      url: data.url || '',
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Erro')) {
      throw error
    }
    if (error instanceof Error && error.message.startsWith('Timeout')) {
      throw error
    }

    safeError('[BRADESCO_BOLETO_ERROR] Falha ao registrar boleto', {
      nossoNumero,
      error: error instanceof Error ? error.message : String(error),
    })

    throw new Error('Erro ao registrar boleto no Bradesco. Tente novamente.')
  }
}

/**
 * Consulta o status de um boleto por nosso número na API do Bradesco.
 *
 * Em caso de erro, retorna status 'registrado' (pendente) para permitir nova tentativa,
 * seguindo o mesmo padrão do `queryBradescoPixPayment()`.
 *
 * @param nossoNumero - Número de controle do boleto
 * @returns Dados do boleto com status atual e informações de pagamento (se pago)
 */
export async function queryBradescoBoletoPayment(
  nossoNumero: string,
): Promise<BradescoBoletoQueryResponse> {
  const config = await getBradescoConfig()
  const token = await getBradescoToken()
  const apiUrl = getBradescoApiUrl(config.environment)
  const endpoint = `${apiUrl}/v1/boleto/consultar/${nossoNumero}`

  safeLog('[BRADESCO_BOLETO_QUERY_REQUEST]', {
    endpoint,
    environment: config.environment,
    nossoNumero,
  })

  await logBradescoRequest({
    operationType: 'consulta',
    method: 'GET',
    endpoint,
    paymentId: nossoNumero,
  })

  try {
    const response = await bradescoFetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
      },
    })

    const responseText = await response.text()

    await logBradescoResponse({
      operationType: 'consulta',
      method: 'GET',
      endpoint,
      paymentId: nossoNumero,
      statusCode: response.status,
      responseBody: responseText,
      errorMessage: !response.ok ? responseText : undefined,
    })

    if (!response.ok) {
      safeError('[BRADESCO_BOLETO_QUERY_FAILED]', {
        nossoNumero,
        status: response.status,
        statusText: response.statusText,
      })

      return {
        nossoNumero,
        status: 'registrado',
      }
    }

    const data: {
      nossoNumero?: string
      status?: string
      valorPago?: number
      dataPagamento?: string
    } = JSON.parse(responseText)

    safeLog('[BRADESCO_BOLETO_QUERY_SUCCESS]', {
      nossoNumero: data.nossoNumero || nossoNumero,
      status: data.status,
      hasValorPago: data.valorPago !== undefined,
    })

    return {
      nossoNumero: data.nossoNumero || nossoNumero,
      status: (data.status as BradescoBoletoQueryResponse['status']) || 'registrado',
      valorPago: data.valorPago,
      dataPagamento: data.dataPagamento,
    }
  } catch (error) {
    safeError('[BRADESCO_BOLETO_QUERY_ERROR] Falha ao consultar boleto', {
      nossoNumero,
      error: error instanceof Error ? error.message : String(error),
    })

    return {
      nossoNumero,
      status: 'registrado',
    }
  }
}

// ─── Payment Router ──────────────────────────────────────────────────────────

/**
 * Verifica qual gateway de pagamento está ativo para a empresa.
 * Consulta a tabela `gateway_configurations` para encontrar o gateway ativo.
 *
 * @returns 'Cielo' ou 'Bradesco' conforme o gateway ativo
 * @throws Error se nenhum gateway estiver ativo ou se o gateway não for suportado
 */
export async function getActiveGateway(): Promise<'Cielo' | 'Bradesco'> {
  const [activeConfig] = await db
    .select({ gatewayName: gatewayConfigurations.gatewayName })
    .from(gatewayConfigurations)
    .where(
      and(
        eq(gatewayConfigurations.companyId, COMPANY_ID),
        eq(gatewayConfigurations.isActive, true),
      ),
    )
    .limit(1)

  if (!activeConfig) {
    throw new Error('Nenhum gateway de pagamento está ativo. Configure em /admin/gateways/')
  }

  if (activeConfig.gatewayName !== 'Cielo' && activeConfig.gatewayName !== 'Bradesco') {
    throw new Error(`Gateway "${activeConfig.gatewayName}" não é suportado pelo sistema.`)
  }

  return activeConfig.gatewayName as 'Cielo' | 'Bradesco'
}
