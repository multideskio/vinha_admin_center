/**
 * @fileoverview Criptografia AES-256-GCM para dados sensíveis no banco.
 * Usa uma chave derivada de ENCRYPTION_KEY (variável de ambiente).
 * Fallback gracioso: se ENCRYPTION_KEY não estiver configurada, retorna dados em texto plano.
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const ENCODING = 'base64'
const PREFIX = 'enc:' // Prefixo para identificar dados criptografados

/**
 * Obtém a chave de criptografia do ambiente.
 * Retorna null se não configurada (fallback para texto plano).
 */
function getEncryptionKey(): Buffer | null {
  const key = process.env.ENCRYPTION_KEY
  if (!key) return null

  // A chave deve ter exatamente 32 bytes (256 bits)
  // Se for hex (64 chars), converter. Se for string, usar SHA-256.
  if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
    return Buffer.from(key, 'hex')
  }

  // Derivar chave de 256 bits via SHA-256
  return crypto.createHash('sha256').update(key).digest()
}

/**
 * Criptografa um valor string.
 * Retorna o valor prefixado com 'enc:' + IV + authTag + ciphertext em base64.
 * Se ENCRYPTION_KEY não estiver configurada, retorna o valor original.
 */
export function encrypt(plaintext: string | null | undefined): string | null {
  if (!plaintext) return plaintext as null

  const key = getEncryptionKey()
  if (!key) return plaintext // Fallback: sem criptografia

  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', ENCODING)
  encrypted += cipher.final(ENCODING)

  const authTag = cipher.getAuthTag()

  // Formato: enc:<iv>:<authTag>:<ciphertext> (tudo em base64)
  return `${PREFIX}${iv.toString(ENCODING)}:${authTag.toString(ENCODING)}:${encrypted}`
}

/**
 * Descriptografa um valor string.
 * Se o valor não tiver o prefixo 'enc:', retorna como está (texto plano legado).
 * Se ENCRYPTION_KEY não estiver configurada, retorna o valor original.
 */
export function decrypt(ciphertext: string | null | undefined): string | null {
  if (!ciphertext) return ciphertext as null

  // Se não está criptografado, retornar como está (compatibilidade com dados legados)
  if (!ciphertext.startsWith(PREFIX)) return ciphertext

  const key = getEncryptionKey()
  if (!key) {
    console.warn('[ENCRYPTION] ENCRYPTION_KEY não configurada, impossível descriptografar')
    return ciphertext
  }

  try {
    const parts = ciphertext.slice(PREFIX.length).split(':')
    if (parts.length !== 3) {
      console.error('[ENCRYPTION] Formato de dados criptografados inválido')
      return null
    }

    const ivStr = parts[0]
    const authTagStr = parts[1]
    const encryptedStr = parts[2]

    if (!ivStr || !authTagStr || !encryptedStr) {
      console.error('[ENCRYPTION] Partes do dado criptografado estão vazias')
      return null
    }

    const iv = Buffer.from(ivStr, ENCODING)
    const authTag = Buffer.from(authTagStr, ENCODING)

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedStr, ENCODING, 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error(
      '[ENCRYPTION] Falha ao descriptografar:',
      error instanceof Error ? error.message : error,
    )
    return null
  }
}

/**
 * Verifica se um valor está criptografado.
 */
export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(PREFIX)
}
