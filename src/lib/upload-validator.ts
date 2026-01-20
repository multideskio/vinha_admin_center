/**
 * Validador de uploads de arquivos
 *
 * Este módulo fornece validação de segurança para uploads de arquivos,
 * verificando tipo MIME, tamanho e extensão antes do envio ao S3.
 *
 * CRÍTICO: Sempre use estas validações antes de fazer upload de arquivos
 * para prevenir uploads maliciosos ou arquivos muito grandes.
 */

/**
 * Tipos MIME permitidos para upload
 */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const

/**
 * Extensões de arquivo permitidas
 */
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'pdf'] as const

/**
 * Tamanho máximo de arquivo: 10MB
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB em bytes

/**
 * Resultado da validação de upload
 */
export interface UploadValidationResult {
  valid: boolean
  error?: string
}

/**
 * Valida um arquivo antes do upload
 *
 * Verifica:
 * - Tamanho do arquivo (máx 10MB)
 * - Tipo MIME permitido
 * - Extensão do arquivo permitida
 *
 * @param file - Buffer do arquivo
 * @param filename - Nome do arquivo original
 * @param mimeType - Tipo MIME do arquivo
 * @returns Objeto com `valid` (boolean) e `error` (string opcional)
 *
 * @example
 * ```typescript
 * const file = await request.arrayBuffer()
 * const buffer = Buffer.from(file)
 * const validation = validateUpload(buffer, 'foto.jpg', 'image/jpeg')
 *
 * if (!validation.valid) {
 *   return NextResponse.json({ error: validation.error }, { status: 400 })
 * }
 * ```
 */
export function validateUpload(
  file: Buffer,
  filename: string,
  mimeType: string,
): UploadValidationResult {
  // Validar tamanho do arquivo
  if (file.length > MAX_FILE_SIZE) {
    const sizeMB = (file.length / (1024 * 1024)).toFixed(2)
    return {
      valid: false,
      error: `Arquivo muito grande (${sizeMB}MB). Tamanho máximo permitido: 10MB`,
    }
  }

  // Validar tipo MIME
  if (!ALLOWED_MIME_TYPES.includes(mimeType as (typeof ALLOWED_MIME_TYPES)[number])) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido: ${mimeType}. Tipos permitidos: ${ALLOWED_MIME_TYPES.join(', ')}`,
    }
  }

  // Extrair e validar extensão do arquivo
  const ext = filename.split('.').pop()?.toLowerCase()
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])) {
    return {
      valid: false,
      error: `Extensão de arquivo não permitida: ${ext || 'sem extensão'}. Extensões permitidas: ${ALLOWED_EXTENSIONS.join(', ')}`,
    }
  }

  // Validação adicional: verificar se extensão corresponde ao MIME type
  const mimeToExtMap: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
    'application/pdf': ['pdf'],
  }

  const expectedExtensions = mimeToExtMap[mimeType]
  if (expectedExtensions && !expectedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `Extensão do arquivo (${ext}) não corresponde ao tipo MIME (${mimeType})`,
    }
  }

  return { valid: true }
}

/**
 * Sanitiza o nome de um arquivo, removendo caracteres especiais
 * e espaços que podem causar problemas.
 *
 * @param filename - Nome do arquivo original
 * @returns Nome do arquivo sanitizado
 *
 * @example
 * ```typescript
 * const safe = sanitizeFilename('Minha Foto (1).jpg')
 * // Retorna: 'minha-foto-1.jpg'
 * ```
 */
export function sanitizeFilename(filename: string): string {
  // Separar nome e extensão
  const parts = filename.split('.')
  const ext = parts.pop()?.toLowerCase() || ''
  const name = parts.join('.')

  // Remover caracteres especiais e espaços
  // Permitir apenas letras, números, hífens e underscores
  const sanitizedName = name
    .toLowerCase()
    .normalize('NFD') // Normalizar caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9-_]/g, '-') // Substituir caracteres especiais por hífen
    .replace(/-+/g, '-') // Remover hífens duplicados
    .replace(/^-|-$/g, '') // Remover hífens no início/fim

  // Limitar tamanho do nome (máx 100 caracteres)
  const truncatedName = sanitizedName.slice(0, 100)

  return ext ? `${truncatedName}.${ext}` : truncatedName
}

/**
 * Gera um nome de arquivo único com timestamp e UUID
 *
 * @param originalFilename - Nome do arquivo original
 * @returns Nome de arquivo único e sanitizado
 *
 * @example
 * ```typescript
 * const uniqueName = generateUniqueFilename('foto.jpg')
 * // Retorna algo como: '1704567890123-a1b2c3d4-foto.jpg'
 * ```
 */
export function generateUniqueFilename(originalFilename: string): string {
  const sanitized = sanitizeFilename(originalFilename)
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 10)

  const parts = sanitized.split('.')
  const ext = parts.pop()
  const name = parts.join('.')

  return `${timestamp}-${randomId}-${name}.${ext}`
}

/**
 * Constantes exportadas para uso externo
 */
export const UPLOAD_CONSTANTS = {
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_MB: MAX_FILE_SIZE / (1024 * 1024),
  ALLOWED_MIME_TYPES: [...ALLOWED_MIME_TYPES],
  ALLOWED_EXTENSIONS: [...ALLOWED_EXTENSIONS],
} as const
