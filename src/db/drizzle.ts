import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as dotenv from 'dotenv'
import * as schema from './schema'

dotenv.config({ path: '.env' })

// Neon/Vercel integration injeta POSTGRES_URL (pooled) automaticamente em preview deploys.
// Fallback para DATABASE_URL para manter compatibilidade com o setup atual.
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL ou POSTGRES_URL não configurada nas variáveis de ambiente')
}

const isServerless = !!process.env.VERCEL

const pool = new Pool({
  connectionString,
  max: isServerless ? 5 : 20,
  idleTimeoutMillis: isServerless ? 10000 : 30000,
  connectionTimeoutMillis: 15000,
  allowExitOnIdle: isServerless,
})

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message)
})

export const db = drizzle(pool, { schema })
