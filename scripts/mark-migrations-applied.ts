/**
 * @fileoverview Script para marcar migrações como aplicadas
 * @date 2026-01-06
 */

import { Pool } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in the environment variables')
}

async function markMigrationsApplied() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  console.log('📝 Marcando migrações como aplicadas...')

  try {
    // Criar tabela de migrações se não existir
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      );
    `)

    // Marcar todas as migrações como aplicadas
    const migrations = [
      { id: 1, hash: '0000_wise_ares' },
      { id: 2, hash: '0001_stiff_la_nuit' },
      { id: 3, hash: '0002_fast_invaders' },
      { id: 4, hash: '0003_perpetual_madame_web' },
      { id: 5, hash: '0004_living_juggernaut' },
      { id: 6, hash: '0005_chunky_mother_askani' },
    ]

    for (const migration of migrations) {
      await pool.query(
        `INSERT INTO "__drizzle_migrations" (id, hash, created_at) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (id) DO NOTHING`,
        [migration.id, migration.hash, Date.now()],
      )
      console.log(`✅ Migração ${migration.hash} marcada como aplicada`)
    }

    console.log('🎉 Todas as migrações foram marcadas como aplicadas!')
  } catch (error) {
    console.error('❌ Erro ao marcar migrações:', error)
    throw error
  } finally {
    await pool.end()
  }
}

markMigrationsApplied().catch(console.error)
