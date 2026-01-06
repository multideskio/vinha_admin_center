#!/usr/bin/env node

const { Pool } = require('pg')
const { createTransport } = require('nodemailer')
require('dotenv').config()

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()

  console.log('🧪 Testando NotificationService com configurações do banco...')

  // Buscar configurações exatamente como o NotificationService faz
  const result = await client.query(
    `
    SELECT 
      whatsapp_api_url,
      whatsapp_api_key, 
      whatsapp_api_instance,
      smtp_host,
      smtp_port,
      smtp_user,
      smtp_pass,
      smtp_from
    FROM other_settings 
    WHERE company_id = $1
    LIMIT 1
  `,
    [process.env.COMPANY_INIT],
  )

  if (!result.rows.length) {
    console.log('❌ Configurações não encontradas')
    return
  }

  const config = result.rows[0]
  console.log('📋 Configurações encontradas:')
  console.log('- SMTP Host:', config.smtp_host)
  console.log('- SMTP Port:', config.smtp_port)
  console.log('- SMTP User:', config.smtp_user)
  console.log('- SMTP From:', config.smtp_from)
  console.log('- SMTP Pass:', config.smtp_pass ? '***configurado***' : '❌ AUSENTE')

  if (!config.smtp_pass) {
    console.log('❌ Senha SMTP não encontrada!')
    client.release()
    await pool.end()
    return
  }

  // Criar transporter exatamente como o EmailService faz
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
    console.log('🔗 Testando conexão SMTP...')
    await transporter.verify()
    console.log('✅ Conexão SMTP verificada com sucesso!')

    console.log('📤 Enviando email de teste...')
    const info = await transporter.sendMail({
      from: config.smtp_from,
      to: 'multidesk.io@gmail.com',
      subject: 'Teste NotificationService - Vinha Admin',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">✅ Sistema de Email Funcionando!</h2>
          <p>Este email foi enviado usando as configurações do banco de dados.</p>
          <p><strong>Configurações utilizadas:</strong></p>
          <ul>
            <li>Host: ${config.smtp_host}</li>
            <li>Port: ${config.smtp_port}</li>
            <li>User: ${config.smtp_user}</li>
            <li>From: ${config.smtp_from}</li>
          </ul>
          <p>Teste realizado em: ${new Date().toLocaleString('pt-BR')}</p>
        </div>
      `,
    })

    console.log('✅ Email enviado com sucesso!')
    console.log('📧 Message ID:', info.messageId)
    console.log('📬 Accepted:', info.accepted)
    console.log('📭 Rejected:', info.rejected)
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
    if (error.code) console.error('🔴 Código:', error.code)
    if (error.response) console.error('🔴 Resposta:', error.response)
    if (error.responseCode) console.error('🔴 Response Code:', error.responseCode)
  }

  client.release()
  await pool.end()
}

main().catch(console.error)
