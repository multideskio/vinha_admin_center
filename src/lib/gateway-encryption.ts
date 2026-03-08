/**
 * @fileoverview Helper para criptografia/descriptografia de credenciais de gateway.
 * Aplica encrypt/decrypt nos campos sensíveis de gatewayConfigurations.
 * Compatível com dados legados (texto plano) — decrypt retorna o valor original se não estiver criptografado.
 */

import { encrypt, decrypt } from '@/lib/encryption'

// Campos sensíveis que devem ser criptografados
const SENSITIVE_FIELDS = [
  'prodClientId',
  'prodClientSecret',
  'devClientId',
  'devClientSecret',
  'certificate',
  'certificatePassword',
  'pixKey',
  'boletoProdClientId',
  'boletoProdClientSecret',
  'boletoProdApiKey',
  'boletoDevClientId',
  'boletoDevClientSecret',
  'boletoDevApiKey',
  'pixProdClientId',
  'pixProdClientSecret',
  'pixProdApiKey',
  'pixDevClientId',
  'pixDevClientSecret',
  'pixDevApiKey',
] as const

type GatewayConfig = Record<string, unknown>

/**
 * Descriptografa os campos sensíveis de um config de gateway.
 * Seguro para dados legados (texto plano) — retorna como está se não estiver criptografado.
 */
export function decryptGatewayConfig<T extends GatewayConfig>(config: T): T {
  const decrypted: GatewayConfig = { ...config }

  for (const field of SENSITIVE_FIELDS) {
    if (field in decrypted && typeof decrypted[field] === 'string') {
      decrypted[field] = decrypt(decrypted[field] as string)
    }
  }

  return decrypted as T
}

/**
 * Criptografa os campos sensíveis antes de salvar no banco.
 * Só criptografa campos que têm valor (não null/undefined/vazio).
 */
export function encryptGatewayFields(data: GatewayConfig): GatewayConfig {
  const encrypted = { ...data }

  for (const field of SENSITIVE_FIELDS) {
    if (field in encrypted && typeof encrypted[field] === 'string' && encrypted[field]) {
      encrypted[field] = encrypt(encrypted[field] as string)
    }
  }

  return encrypted
}
