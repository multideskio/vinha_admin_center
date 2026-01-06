#!/usr/bin/env node

const { createTransport } = require('nodemailer')
const { Pool } = require('pg')
require('dotenv').config()

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()
  
  console.log('📧 Testando envio de email...')
  
  // Buscar configurações SMTP
  const settings = await client.query(`
    SELECT smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from
    FROM other_settings 
    WHERE company_id = $1
  `, [process.env.COMPANY_INIT])
  
  if (settings.rows.length === 0) {
    console.log('❌ Configurações SMTP não encontradas')
    return
  }
  
  const config = settings.rows[0]
  console.log('Configurações SMTP:')
  console.log('- Host:', config.smtp_host)
  console.log('- Port:', config.smtp_port)
  console.log('- User:', config.smtp_user)
  console.log('- From:', config.smtp_from)
  console.log('- Pass:', config.smtp_pass ? '***configurado***' : '❌ NÃO CONFIGURADO')
  
  if (!config.smtp_pass) {
    console.log('❌ Senha SMTP não configurada!')
    client.release()
    await pool.end()
    return
  }
  
  // Criar transporter
  const transporter = createTransport({
    host: config.smtp_host,
    port: config.smtp_port,
    secure: config.smtp_port === 465,
    auth: {
      user: config.smtp_user,
      pass: config.smtp_pass,
    },
  })
  
  try {
    // Testar conexão
    console.log('🔗 Testando conexão SMTP...')
    await transporter.verify()
    console.log('✅ Conexão SMTP OK')
    
    // Enviar email de teste
    console.log('📤 Enviando email de teste...')
    const info = await transporter.sendMail({
      from: config.smtp_from,
      to: 'multidesk.io@gmail.com',
      subject: 'Teste de Email - Vinha Admin',
      html: '<h2>✅ Email funcionando!</h2><p>Este é um teste do sistema de notificações.</p>',
    })
    
    console.log('✅ Email enviado com sucesso!')
    console.log('Message ID:', info.messageId)
    
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.message)
    if (error.code) console.error('Código do erro:', error.code)
    if (error.response) console.error('Resposta do servidor:', error.response)
  }
  
  client.release()
  await pool.end()
}

main().catch(console.error)