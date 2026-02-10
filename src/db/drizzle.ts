import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as dotenv from 'dotenv'
import * as schema from './schema'

dotenv.config({ path: '.env' })

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in the environment variables')
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Aumentado de 10 para 20 para suportar mais requisições simultâneas
  idleTimeoutMillis: 30000, // Reduzido de 60s para 30s - libera conexões idle mais rápido
  connectionTimeoutMillis: 15000, // Aumentado de 10s para 15s - mais tempo para aguardar conexão disponível
  allowExitOnIdle: false,
})

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message)
})

pool.on('connect', () => {
  console.warn('Database connection established')
})

pool.on('remove', () => {
  console.warn('Database connection removed from pool')
})

export const db = drizzle(pool, { schema })
