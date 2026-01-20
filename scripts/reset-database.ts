/**
 * @fileoverview Script para reset completo do banco de dados
 * @date 2026-01-05
 */

import { Pool } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in the environment variables')
}

async function resetDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  console.log('🗑️  Iniciando reset completo do banco de dados...')

  try {
    // Dropar todas as tabelas em cascata
    console.log('📋 Listando tabelas existentes...')

    const tablesResult = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%' 
      AND tablename NOT LIKE 'sql_%'
    `)

    const tables = tablesResult.rows

    if (tables.length > 0) {
      console.log(
        `🔍 Encontradas ${tables.length} tabelas:`,
        tables.map((t) => t.tablename).join(', '),
      )

      // Dropar todas as tabelas
      for (const table of tables) {
        console.log(`🗑️  Dropando tabela: ${table.tablename}`)
        await pool.query(`DROP TABLE IF EXISTS "${table.tablename}" CASCADE`)
      }
    }

    // Dropar todos os ENUMs
    console.log('🗑️  Dropando ENUMs...')
    const enumsResult = await pool.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e' 
      AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    `)

    const enums = enumsResult.rows

    if (enums.length > 0) {
      console.log(`🔍 Encontrados ${enums.length} ENUMs:`, enums.map((e) => e.typname).join(', '))

      for (const enumType of enums) {
        console.log(`🗑️  Dropando ENUM: ${enumType.typname}`)
        await pool.query(`DROP TYPE IF EXISTS "${enumType.typname}" CASCADE`)
      }
    }

    // Dropar a tabela de migrações do Drizzle se existir
    console.log('🗑️  Dropando tabela de migrações...')
    await pool.query('DROP TABLE IF EXISTS "__drizzle_migrations" CASCADE')

    // Verificar se ainda existem tabelas
    const remainingTablesResult = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%' 
      AND tablename NOT LIKE 'sql_%'
    `)

    const remainingTables = remainingTablesResult.rows

    // Verificar se ainda existem ENUMs
    const remainingEnumsResult = await pool.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e' 
      AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    `)

    const remainingEnums = remainingEnumsResult.rows

    if (remainingTables.length === 0 && remainingEnums.length === 0) {
      console.log('✅ Banco de dados resetado com sucesso!')
      console.log('📝 Agora execute: npm run db:push')
    } else {
      if (remainingTables.length > 0) {
        console.log(
          '⚠️  Ainda existem tabelas:',
          remainingTables.map((t) => t.tablename).join(', '),
        )
      }
      if (remainingEnums.length > 0) {
        console.log('⚠️  Ainda existem ENUMs:', remainingEnums.map((e) => e.typname).join(', '))
      }
    }
  } catch (error) {
    console.error('❌ Erro ao resetar banco de dados:', error)
    throw error
  } finally {
    await pool.end()
  }
}

resetDatabase().catch(console.error)
