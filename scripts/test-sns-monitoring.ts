/**
 * Script de teste para monitoramento SNS
 * Testa bounces, complaints e verificação de blacklist
 */

import { sendEmail } from '@/lib/email'
import { db } from '@/db/drizzle'
import { emailBlacklist } from '@/db/schema'
import { eq } from 'drizzle-orm'

const COMPANY_ID = process.env.COMPANY_INIT || ''

async function testBounce() {
  console.log('\n🧪 Testando Bounce...')
  try {
    await sendEmail({
      to: 'bounce@simulator.amazonses.com',
      subject: 'Teste de Bounce',
      html: '<p>Este email vai gerar um bounce</p>',
      userId: COMPANY_ID,
      notificationType: 'test_bounce',
    })
    console.log('✅ Email enviado (aguarde notificação SNS)')
  } catch (error: unknown) {
    console.log('❌ Erro esperado:', error instanceof Error ? error.message : String(error))
  }
}

async function testComplaint() {
  console.log('\n🧪 Testando Complaint...')
  try {
    await sendEmail({
      to: 'complaint@simulator.amazonses.com',
      subject: 'Teste de Complaint',
      html: '<p>Este email vai gerar um complaint</p>',
      userId: COMPANY_ID,
      notificationType: 'test_complaint',
    })
    console.log('✅ Email enviado (aguarde notificação SNS)')
  } catch (error: unknown) {
    console.log('❌ Erro esperado:', error instanceof Error ? error.message : String(error))
  }
}

async function testBlacklist() {
  console.log('\n🧪 Testando Blacklist...')

  // Adicionar email de teste à blacklist
  const testEmail = 'blacklisted@test.com'

  await db.insert(emailBlacklist).values({
    companyId: COMPANY_ID,
    email: testEmail,
    reason: 'test',
    errorCode: 'TEST',
    errorMessage: 'Email de teste',
    firstFailedAt: new Date(),
    lastAttemptAt: new Date(),
    attemptCount: 1,
    isActive: true,
  })

  console.log(`✅ Email ${testEmail} adicionado à blacklist`)

  // Tentar enviar para email blacklisted
  try {
    await sendEmail({
      to: testEmail,
      subject: 'Teste Blacklist',
      html: '<p>Este email não deve ser enviado</p>',
      userId: COMPANY_ID,
      notificationType: 'test_blacklist',
    })
    console.log('❌ ERRO: Email foi enviado (não deveria)')
  } catch (error: unknown) {
    console.log(
      '✅ Email bloqueado corretamente:',
      error instanceof Error ? error.message : String(error),
    )
  }

  // Limpar teste
  await db.delete(emailBlacklist).where(eq(emailBlacklist.email, testEmail))

  console.log('✅ Email removido da blacklist')
}

async function checkBlacklist() {
  console.log('\n📋 Emails na Blacklist:')

  const blacklisted = await db
    .select()
    .from(emailBlacklist)
    .where(eq(emailBlacklist.companyId, COMPANY_ID))

  if (blacklisted.length === 0) {
    console.log('   Nenhum email na blacklist')
  } else {
    blacklisted.forEach((item) => {
      console.log(`   • ${item.email} - ${item.reason} (${item.attemptCount}x)`)
    })
  }
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🧪 Teste de Monitoramento SNS - Vinha Admin Center')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  await testBlacklist()
  await testBounce()
  await testComplaint()
  await checkBlacklist()

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ Testes concluídos!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n⚠️  Aguarde alguns segundos para as notificações SNS chegarem')
  console.log('📊 Verifique os logs em: notification_logs')
  console.log('📋 Verifique a blacklist em: email_blacklist')
}

main().catch(console.error)
