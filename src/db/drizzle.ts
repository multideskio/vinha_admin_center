/**
 * @fileoverview Conexão Drizzle com PostgreSQL.
 * Em Vercel/Neon: usa @neondatabase/serverless (HTTP) para melhor desempenho serverless.
 * Local: usa pg Pool para dev e scripts.
 */
import * as dotenv from 'dotenv'
import { neon, neonConfig } from '@neondatabase/serverless'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

dotenv.config({ path: '.env' })

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL ou POSTGRES_URL não configurada nas variáveis de ambiente')
}

const isServerless = !!process.env.VERCEL

// Serverless (Vercel): Neon HTTP driver com connection reuse
// Local: pg Pool
const db = isServerless ? createNeonDb() : createPgDb()

function createNeonDb() {
  neonConfig.fetchConnectionCache = true
  const sql = neon(connectionString!)
  return drizzleNeon({ client: sql, schema })
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
