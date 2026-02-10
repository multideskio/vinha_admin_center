import { z } from 'zod'

/**
 * Schema de validação para variáveis de ambiente
 *
 * Este arquivo centraliza a validação de todas as variáveis de ambiente
 * críticas do sistema, garantindo que o aplicativo não inicie com
 * configurações inválidas ou ausentes.
 */
const envSchema = z.object({
  // ===== Variáveis Obrigatórias =====

  // Banco de Dados
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),

  // Identificadores da Empresa
  COMPANY_INIT: z.string().uuid('COMPANY_INIT deve ser um UUID válido'),
  ADMIN_INIT: z.string().uuid('ADMIN_INIT deve ser um UUID válido'),

  // Autenticação
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter no mínimo 32 caracteres'),
  DEFAULT_PASSWORD: z.string().min(6, 'DEFAULT_PASSWORD deve ter no mínimo 6 caracteres'),
  CRON_SECRET: z.string().min(16, 'CRON_SECRET deve ter no mínimo 16 caracteres').optional(),

  // ===== Variáveis Opcionais =====

  // Ambiente
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Redis (opcional - fallback para localhost)
  REDIS_URL: z
    .string()
    .url('REDIS_URL deve ser uma URL válida')
    .optional()
    .default('redis://localhost:6379'),

  // AWS SES (opcional - sistema funciona sem email)
  AWS_SES_REGION: z.string().optional(),
  AWS_SES_ACCESS_KEY_ID: z.string().optional(),
  AWS_SES_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_SES_FROM_EMAIL: z.string().email('AWS_SES_FROM_EMAIL deve ser um email válido').optional(),

  // AWS S3 (opcional - sistema funciona sem upload)
  AWS_S3_REGION: z.string().optional(),
  AWS_S3_ACCESS_KEY_ID: z.string().optional(),
  AWS_S3_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET_NAME: z.string().optional(),

  // URL pública da aplicação (opcional - usada em links de emails/notificações)
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL deve ser uma URL válida').optional(),
})

/**
 * Tipo inferido do schema de validação
 */
export type Env = z.infer<typeof envSchema>

/**
 * Valida e exporta as variáveis de ambiente
 *
 * @throws {z.ZodError} Se alguma variável obrigatória estiver ausente ou inválida
 */
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Erro de validação de variáveis de ambiente:')
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      error.errors.forEach((err) => {
        const path = err.path.join('.')
        console.error(`  • ${path}: ${err.message}`)
      })

      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error(
        '\n💡 Verifique seu arquivo .env e certifique-se de que todas as variáveis obrigatórias estão definidas.\n',
      )

      throw new Error('Falha na validação de variáveis de ambiente')
    }
    throw error
  }
}

/**
 * Objeto tipado e validado com todas as variáveis de ambiente
 *
 * Use este objeto em vez de `process.env` para garantir type safety
 * e validação em tempo de execução.
 *
 * @example
 * ```typescript
 * import { env } from '@/lib/env'
 *
 * const companyId = env.COMPANY_INIT // string (UUID validado)
 * const jwtSecret = env.JWT_SECRET   // string (mínimo 32 caracteres)
 * ```
 */
export const env = validateEnv()
