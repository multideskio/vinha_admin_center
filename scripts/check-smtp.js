#!/usr/bin/env node

const { Pool } = require('pg')
require('dotenv').config()

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()
  
  console.log('🔧 Verificando configurações SMTP...')
  const settings = await client.query(`
    SELECT 
      smtp_host,
      smtp_port,
      smtp_user,
      smtp_from,
      whatsapp_api_url,
      whatsapp_api_key,
      whatsapp_api_instance
    FROM other_settings 
    WHERE company_id = $1
  `, [process.env.COMPANY_INIT])
  
  if (settings.rows.length === 0) {
    console.log('❌ Nenhuma configuração encontrada')
  } else {
    const config = settings.rows[0]
    console.log('SMTP Host:', config.smtp_host || 'N/A')
    console.log('SMTP Port:', config.smtp_port || 'N/A')
    console.log('SMTP User:', config.smtp_user || 'N/A')
    console.log('SMTP From:', config.smtp_from || 'N/A')
    console.log('WhatsApp URL:', config.whatsapp_api_url || 'N/A')
    console.log('WhatsApp Key:', config.whatsapp_api_key ? '***configurado***' : 'N/A')
    console.log('WhatsApp Instance:', config.whatsapp_api_instance || 'N/A')
  }
  
  client.release()
  await pool.end()
}

main().catch(console.error)