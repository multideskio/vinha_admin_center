#!/usr/bin/env node

/**
 * Script para limpar logs de notificação de lembretes do dia atual
 * Uso: npm run script/limpa-notificacao
 */

const { Pool } = require('pg')
require('dotenv').config()

async function main() {
  let client
  try {
    console.log('🧹 Iniciando limpeza dos logs de notificação...')

    // Conectar ao banco
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL não encontrada no .env')
    }

    const pool = new Pool({ connectionString })
    client = await pool.connect()

    // Data de hoje no formato brasileiro
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0] // YYYY-MM-DD
    console.log(`📅 Limpando logs do dia: ${todayStr}`)

    // Deletar todos os logs de notificação de hoje
    const result1 = await client.query(`DELETE FROM notification_logs WHERE DATE(sent_at) = $1`, [
      todayStr,
    ])

    console.log(`✅ ${result1.rowCount} logs de notificação removidos com sucesso!`)
    console.log('🚀 Agora você pode testar o envio de lembretes novamente.')

    client.release()
    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro ao limpar logs:', error.message)
    if (client) client.release()
    process.exit(1)
  }
}

main()
