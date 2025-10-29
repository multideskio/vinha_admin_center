import { NextResponse } from 'next/server'
import { validateRequest } from '@/lib/jwt'
import { logUserAction } from '@/lib/action-logger'
import { db } from '@/db/drizzle'
import { transactions, users, notificationLogs, otherSettings, companies } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { sendEmail } from '@/lib/email'
import { createTransactionReceiptEmail } from '@/lib/email-templates'

const COMPANY_ID = process.env.COMPANY_INIT || ''

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  const { user } = await validateRequest()

  console.log('[RESEND_RECEIPT] Iniciando reenvio de comprovante', { transactionId: params.id, userId: user?.id })

  if (!user || user.role !== 'supervisor') {
    console.log('[RESEND_RECEIPT] Acesso negado', { user: user?.id, role: user?.role })
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = params

  try {
    console.log('[RESEND_RECEIPT] Buscando transação no banco', { id })
    const [transaction] = await db
      .select({
        id: transactions.id,
        contributorId: transactions.contributorId,
        amount: transactions.amount,
        status: transactions.status,
        gatewayTransactionId: transactions.gatewayTransactionId,
      })
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1)

    if (!transaction) {
      console.log('[RESEND_RECEIPT] Transação não encontrada', { id })
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
    }

    console.log('[RESEND_RECEIPT] Transação encontrada', transaction)

    console.log('[RESEND_RECEIPT] Buscando contribuidor', { contributorId: transaction.contributorId })
    const [contributor] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, transaction.contributorId))
      .limit(1)

    if (!contributor) {
      console.log('[RESEND_RECEIPT] Contribuidor não encontrado', { contributorId: transaction.contributorId })
      return NextResponse.json({ error: 'Contribuidor não encontrado' }, { status: 404 })
    }

    console.log('[RESEND_RECEIPT] Contribuidor encontrado', { email: contributor.email })

    // Buscar configurações SMTP
    const [settings] = await db
      .select()
      .from(otherSettings)
      .where(eq(otherSettings.companyId, COMPANY_ID))
      .limit(1)

    if (!settings?.smtpHost) {
      console.log('[RESEND_RECEIPT] Configurações SMTP não encontradas')
      return NextResponse.json({ error: 'Configurações de email não encontradas' }, { status: 500 })
    }

    console.log('[RESEND_RECEIPT] Configurações SMTP encontradas', { 
      host: settings.smtpHost,
      port: settings.smtpPort,
      user: settings.smtpUser,
      hasPassword: !!settings.smtpPass,
      from: settings.smtpFrom
    })

    const [company] = await db.select().from(companies).where(eq(companies.id, COMPANY_ID)).limit(1)

    // Enviar email
    console.log('[RESEND_RECEIPT] Tentando enviar email', { to: contributor.email })
    try {
      const emailHtml = createTransactionReceiptEmail({
        companyName: company?.name || 'Vinha Ministérios',
        amount: Number(transaction.amount),
        transactionId: transaction.gatewayTransactionId || transaction.id,
        status: transaction.status === 'approved' ? 'Aprovado' : transaction.status,
        date: new Date(),
      })

      await sendEmail({
        to: contributor.email,
        subject: `✅ Comprovante de Pagamento - ${company?.name || 'Vinha Ministérios'}`,
        html: emailHtml,

      })

      console.log('[RESEND_RECEIPT] Email enviado com sucesso')

      await db.insert(notificationLogs).values({
        companyId: COMPANY_ID,
        userId: transaction.contributorId,
        notificationType: 'receipt_resend',
        channel: 'email',
        status: 'sent',
        messageContent: `Comprovante reenviado para ${contributor.email}`,
      })
    } catch (emailError) {
      console.error('[RESEND_RECEIPT] Erro ao enviar email:', emailError)

      await db.insert(notificationLogs).values({
        companyId: COMPANY_ID,
        userId: transaction.contributorId,
        notificationType: 'receipt_resend',
        channel: 'email',
        status: 'failed',
        messageContent: `Tentativa de reenvio para ${contributor.email}`,
        errorMessage: emailError instanceof Error ? emailError.message : 'Erro desconhecido',
      })

      throw emailError
    }

    await logUserAction(
      user.id,
      'resend_receipt',
      'transaction',
      id,
      `Comprovante reenviado para ${contributor.email}`
    )

    console.log('[RESEND_RECEIPT] Processo concluído com sucesso')

    return NextResponse.json({ 
      success: true, 
      message: `Comprovante reenviado para ${contributor.email}` 
    })
  } catch (error) {
    console.error('[RESEND_RECEIPT] Erro geral:', error)
    return NextResponse.json({ 
      error: 'Erro ao reenviar comprovante',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
