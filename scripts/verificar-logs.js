#!/usr/bin/env node

/**
 * Script para verificar logs de notificação e identificar problemas
 * Uso: node scripts/verificar-logs.js
 */

const { Pool } = require('pg')
require('dotenv').config()

async function main() {
  let client
  try {
    console.log('🔍 Verificando logs de notificação...')

    // Conectar ao banco
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL não encontrada no .env')
    }

    const pool = new Pool({ connectionString })
    client = await pool.connect()

    // Data de hoje
    const todayStr = new Date().toISOString().split('T')[0]
    console.log(`📅 Verificando logs do dia: ${todayStr}`)

    // Verificar logs de hoje
    const result = await client.query(
      `
      SELECT 
        notification_type,
        channel,
        status,
        COUNT(*) as count,
        MAX(sent_at) as last_sent
      FROM notification_logs 
      WHERE DATE(sent_at) = $1
      GROUP BY notification_type, channel, status
      ORDER BY notification_type, channel, status
    `,
      [todayStr],
    )

    console.log('\n📊 Resumo dos logs de hoje:')
    console.log('─'.repeat(80))

    if (result.rows.length === 0) {
      console.log('❌ Nenhum log encontrado para hoje')
    } else {
      result.rows.forEach((row) => {
        const status = row.status === 'sent' ? '✅' : '❌'
        console.log(
          `${status} ${row.notification_type} | ${row.channel} | ${row.status} | ${row.count} logs | Último: ${row.last_sent}`,
        )
      })
    }

    // Verificar configurações de notificação
    console.log('\n🔧 Verificando configurações de notificação...')
    const settings = await client.query(
      `
      SELECT 
        whatsapp_api_url,
        whatsapp_api_key,
        whatsapp_api_instance,
        smtp_host,
        smtp_port,
        smtp_user,
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
      console.log('WhatsApp configurado:', config.whatsapp_api_url ? '✅' : '❌')
      console.log('SMTP configurado:', config.smtp_host ? '✅' : '❌')
    }

    // Verificar regras ativas
    console.log('\n📋 Verificando regras de notificação ativas...')
    const rules = await client.query(
      `
      SELECT 
        id,
        event_trigger,
        days_offset,
        send_via_email,
        send_via_whatsapp,
        is_active
      FROM notification_rules 
      WHERE company_id = $1 AND is_active = true
    `,
      [process.env.COMPANY_INIT],
    )

    if (rules.rows.length === 0) {
      console.log('❌ Nenhuma regra ativa encontrada')
    } else {
      rules.rows.forEach((rule) => {
        console.log(
          `📌 ${rule.event_trigger} | Offset: ${rule.days_offset} dias | Email: ${rule.send_via_email ? '✅' : '❌'} | WhatsApp: ${rule.send_via_whatsapp ? '✅' : '❌'}`,
        )
      })
    }

    // Verificar usuários elegíveis para hoje
    const today = new Date()
    const dayOfMonth = today.getDate()

    console.log(`\n👥 Verificando usuários com dízimo no dia ${dayOfMonth}...`)
    const users = await client.query(
      `
      SELECT 
        id,
        email,
        phone,
        tithe_day,
        status
      FROM users 
      WHERE company_id = $1 AND tithe_day = $2 AND status = 'active'
      LIMIT 10
    `,
      [process.env.COMPANY_INIT, dayOfMonth],
    )

    console.log(`Encontrados ${users.rows.length} usuários elegíveis`)
    users.rows.forEach((user) => {
      console.log(`👤 ${user.email} | Telefone: ${user.phone || 'N/A'} | Dia: ${user.tithe_day}`)
    })

    client.release()
    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro ao verificar logs:', error.message)
    if (client) client.release()
    process.exit(1)
  }
}

main()
