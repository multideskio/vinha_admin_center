#!/usr/bin/env node

const { Pool } = require('pg')
require('dotenv').config()

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()

  console.log('🔧 Verificando senha SMTP no banco...')
  const settings = await client.query(
    `
    SELECT 
      smtp_host,
      smtp_port,
      smtp_user,
      smtp_pass,
      smtp_from
    FROM other_settings 
    WHERE company_id = $1
  `,
    [process.env.COMPANY_INIT],
  )

  if (settings.rows.length === 0) {
    console.log('❌ Nenhuma configuração encontrada')
  } else {
    const config = settings.rows[0]
    console.log('SMTP Host:', config.smtp_host)
    console.log('SMTP Port:', config.smtp_port)
    console.log('SMTP User:', config.smtp_user)
    console.log('SMTP From:', config.smtp_from)
    console.log('SMTP Pass existe:', config.smtp_pass ? 'SIM' : 'NÃO')
    console.log('SMTP Pass length:', config.smtp_pass ? config.smtp_pass.length : 0)

    if (config.smtp_pass) {
      console.log('SMTP Pass primeiros 4 chars:', config.smtp_pass.substring(0, 4) + '...')
    }
  }

  client.release()
  await pool.end()
}

main().catch(console.error)
