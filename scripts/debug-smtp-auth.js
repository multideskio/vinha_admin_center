#!/usr/bin/env node

const { Pool } = require('pg')
const { createTransport } = require('nodemailer')
require('dotenv').config()

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()

  console.log('🔍 Debug das credenciais SMTP...')

  const result = await client.query(
    `
    SELECT smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from
    FROM other_settings 
    WHERE company_id = $1
  `,
    [process.env.COMPANY_INIT],
  )

  const config = result.rows[0]

  console.log('📋 Detalhes das credenciais:')
  console.log('- Host:', config.smtp_host)
  console.log('- Port:', config.smtp_port)
  console.log('- User:', config.smtp_user)
  console.log('- User length:', config.smtp_user?.length)
  console.log('- Pass length:', config.smtp_pass?.length)
  console.log('- From:', config.smtp_from)

  // Verificar se há caracteres especiais ou espaços
  console.log('\n🔍 Análise da senha:')
  console.log('- Primeiro char:', config.smtp_pass?.charCodeAt(0))
  console.log('- Último char:', config.smtp_pass?.charCodeAt(config.smtp_pass.length - 1))
  console.log('- Contém espaços:', config.smtp_pass?.includes(' '))
  console.log(
    '- Contém quebras de linha:',
    config.smtp_pass?.includes('\n') || config.smtp_pass?.includes('\r'),
  )

  // Tentar com senha limpa (sem espaços)
  const cleanPass = config.smtp_pass?.trim()
  const cleanUser = config.smtp_user?.trim()

  console.log('\n🧹 Testando com credenciais limpas...')
  const transporter = createTransport({
    host: config.smtp_host,
    port: config.smtp_port,
    secure: false, // true para 465, false para outras portas
    auth: {
      user: cleanUser,
      pass: cleanPass,
    },
    debug: true, // Ativar debug
    logger: true, // Ativar logs
  })

  try {
    await transporter.verify()
    console.log('✅ Credenciais limpas funcionaram!')
  } catch (error) {
    console.error('❌ Ainda com erro:', error.message)

    // Tentar diferentes configurações
    console.log('\n🔄 Tentando configurações alternativas...')

    // Teste 1: Secure = true
    const transporter2 = createTransport({
      host: config.smtp_host,
      port: 465,
      secure: true,
      auth: { user: cleanUser, pass: cleanPass },
    })

    try {
      await transporter2.verify()
      console.log('✅ Funcionou com porta 465 e secure=true!')
    } catch (error2) {
      console.error('❌ Porta 465 também falhou:', error2.message)
    }
  }

  client.release()
  await pool.end()
}

main().catch(console.error)
