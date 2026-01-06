#!/usr/bin/env node

const { Pool } = require('pg')
require('dotenv').config()

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()
  
  console.log('Verificando usuários com dízimo no dia 10...')
  const users = await client.query(`
    SELECT id, email, phone, tithe_day, status
    FROM users 
    WHERE company_id = $1 AND tithe_day = 10 AND status = 'active'
  `, [process.env.COMPANY_INIT])
  
  console.log(`Encontrados ${users.rows.length} usuários:`)
  users.rows.forEach(u => console.log(`- ${u.email} | Telefone: ${u.phone || 'N/A'}`))
  
  client.release()
  await pool.end()
}

main().catch(console.error)