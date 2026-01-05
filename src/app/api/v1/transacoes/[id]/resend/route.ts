import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { transactions, users, otherSettings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import { EmailService } from '@/lib/notifications'

const COMPANY_ID = process.env.COMPANY_INIT || ''

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const { id } = await params

    const [transaction] = await db
      .select({
        id: transactions.id,
        status: transactions.status,
        amount: transactions.amount,
        contributorId: transactions.contributorId,
        email: users.email,
      })
      .from(transactions)
      .innerJoin(users, eq(transactions.contributorId, users.id))
      .where(eq(transactions.id, id))
      .limit(1)

    if (!transaction) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
    }

    if (transaction.status !== 'approved') {
      return NextResponse.json(
        { error: 'Apenas transações aprovadas podem ter comprovante reenviado' },
        { status: 400 },
      )
    }

    // Buscar configurações de email
    const [settings] = await db
      .select()
      .from(otherSettings)
      .where(eq(otherSettings.companyId, COMPANY_ID))
      .limit(1)

    if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPass) {
      return NextResponse.json({ error: 'Configurações de email não encontradas' }, { status: 500 })
    }

    // Enviar email com comprovante
    const emailService = new EmailService({
      sesRegion: 'us-east-1',
      sesAccessKeyId: settings.smtpUser,
      sesSecretAccessKey: settings.smtpPass,
      fromEmail: settings.smtpFrom || settings.smtpUser,
    })

    const emailSent = await emailService.sendEmail({
      to: transaction.email,
      subject: 'Comprovante de Contribuição',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                  <tr>
                    <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px;">💰 Comprovante de Contribuição</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="margin: 0 0 20px; font-size: 16px; color: #333333;">Olá,</p>
                      <p style="margin: 0 0 30px; font-size: 16px; color: #333333;">Segue o comprovante da sua contribuição:</p>
                      
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <tr>
                          <td style="padding: 25px;">
                            <table width="100%" cellpadding="8" cellspacing="0">
                              <tr>
                                <td style="font-size: 14px; color: #718096; padding: 8px 0;">ID da Transação:</td>
                                <td style="font-size: 14px; color: #2d3748; font-weight: bold; text-align: right; padding: 8px 0;">${transaction.id}</td>
                              </tr>
                              <tr>
                                <td style="font-size: 14px; color: #718096; padding: 8px 0;">Valor:</td>
                                <td style="font-size: 18px; color: #38a169; font-weight: bold; text-align: right; padding: 8px 0;">R$ ${parseFloat(transaction.amount).toFixed(2)}</td>
                              </tr>
                              <tr>
                                <td style="font-size: 14px; color: #718096; padding: 8px 0;">Status:</td>
                                <td style="text-align: right; padding: 8px 0;">
                                  <span style="display: inline-block; background-color: #c6f6d5; color: #22543d; padding: 6px 12px; border-radius: 4px; font-size: 14px; font-weight: 600;">✅ Aprovada</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 30px 0 0; font-size: 16px; color: #333333; text-align: center;">Obrigado pela sua contribuição! 🙏</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 30px; background-color: #f7fafc; border-top: 1px solid #e2e8f0;">
                      <p style="margin: 0; font-size: 12px; color: #718096; text-align: center;">Esta é uma mensagem automática do sistema</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    })

    if (!emailSent) {
      return NextResponse.json({ error: 'Falha ao enviar email' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Comprovante reenviado com sucesso',
    })
  } catch (error) {
    console.error('Error resending receipt:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao reenviar comprovante' },
      { status: 500 },
    )
  }
}
