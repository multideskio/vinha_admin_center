/**
 * @fileoverview Configuração do Drizzle Kit para geração de migrações.
 * @version 1.1
 * @date 2024-08-07
 * @author PH
 */
import { defineConfig } from 'drizzle-kit'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

// Neon/Vercel injeta POSTGRES_URL_NON_POOLING para migrations (conexão direta, sem pooler).
// Fallback para DATABASE_URL para manter compatibilidade local.
const migrationUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL

if (!migrationUrl) {
  throw new Error(
    'DATABASE_URL ou POSTGRES_URL_NON_POOLING não configurada nas variáveis de ambiente',
  )
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: migrationUrl,
  },
  verbose: true,
  strict: true,
})
