/**
 * @fileoverview Conexão Drizzle com PostgreSQL.
 * Em Vercel/Neon: usa @neondatabase/serverless (WebSocket) com suporte a transações.
 * Local: usa pg Pool para dev e scripts.
 */
import * as dotenv from 'dotenv'
import { Pool as NeonPool } from '@neondatabase/serverless'
import { drizzle as drizzleNeonServerless } from 'drizzle-orm/neon-serverless'
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

dotenv.config({ path: '.env' })

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL ou POSTGRES_URL não configurada nas variáveis de ambiente')
}

const isServerless = !!process.env.VERCEL

// Serverless (Vercel): Neon WebSocket driver (suporta transações)
// Local: pg Pool
const db = isServerless ? createNeonDb() : createPgDb()

function createNeonDb() {
  const pool = new NeonPool({ connectionString: connectionString as string })
  return drizzleNeonServerless({ client: pool, schema })
}

function createPgDb() {
  const pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
  })
  pool.on('error', (err: Error) => {
    console.error('Unexpected database pool error:', err.message)
  })
  return drizzlePg(pool, { schema })
}

export { db }
