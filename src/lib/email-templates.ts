type EmailTemplateProps = {
  companyName: string
  title: string
  subtitle?: string
  content: string
  footer?: string
}

export function createEmailTemplate({
  companyName,
  title,
  subtitle,
  content,
  footer = 'Guarde este email para seus registros.',
}: EmailTemplateProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 60px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
          
          <tr>
            <td style="padding: 48px 48px 40px; text-align: center;">
              <h2 style="margin: 0; color: #5b21b6; font-size: 20px; font-weight: 600; letter-spacing: -0.3px;">${companyName}</h2>
            </td>
          </tr>
          
          <tr>
            <td style="text-align: center; padding: 0 48px 24px;">
              <div style="display: inline-block; width: 64px; height: 64px; background-color: #7c3aed; border-radius: 50%; line-height: 64px; font-size: 32px; color: #ffffff;">✓</div>
            </td>
          </tr>
          
          <tr>
            <td style="text-align: center; padding: 0 48px 12px;">
              <h1 style="margin: 0; color: #1e1b4b; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">${title}</h1>
            </td>
          </tr>
          
          ${subtitle ? `<tr><td style="text-align: center; padding: 0 48px 48px;"><p style="margin: 0; color: #64748b; font-size: 16px; font-weight: 500;">${subtitle}</p></td></tr>` : ''}
          
          <tr>
            <td style="padding: 0 48px 48px;">
              ${content}
            </td>
          </tr>
          
          <tr>
            <td style="text-align: center; padding: 32px 48px 48px; border-top: 1px solid #f3e8ff;">
              <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
                ${footer}
              </p>
              <p style="margin: 24px 0 0; color: #cbd5e1; font-size: 12px;">
                © ${new Date().getFullYear()} ${companyName}
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

export function createTransactionReceiptEmail(data: {
  companyName: string
  amount: number
  transactionId: string
  status: string
  date: Date
}): string {
  const content = `
    <p style="text-align: center; margin: 0 0 48px; color: #5b21b6; font-size: 48px; font-weight: 700; letter-spacing: -1px;">
      R$ ${data.amount.toFixed(2).replace('.', ',')}
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf5ff; border-radius: 12px; padding: 32px; border: 1px solid #e9d5ff;">
      <tr>
        <td style="padding: 0 0 20px;">
          <p style="margin: 0; color: #7c3aed; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">ID da Transação</p>
          <p style="margin: 6px 0 0; color: #1e1b4b; font-size: 15px; font-weight: 600; font-family: 'Courier New', monospace;">${data.transactionId}</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px 0; border-top: 1px solid #e9d5ff;">
          <p style="margin: 0; color: #7c3aed; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Data e Hora</p>
          <p style="margin: 6px 0 0; color: #1e1b4b; font-size: 15px; font-weight: 600;">${data.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} às ${data.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px 0 0; border-top: 1px solid #e9d5ff;">
          <p style="margin: 0; color: #7c3aed; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Status</p>
          <p style="margin: 6px 0 0; color: #10b981; font-size: 15px; font-weight: 600;">${data.status}</p>
        </td>
      </tr>
    </table>
  `

  return createEmailTemplate({
    companyName: data.companyName,
    title: 'Pagamento confirmado',
    subtitle: 'Você pagou',
    content,
  })
}

export function createWelcomeEmail(data: {
  companyName: string
  userName: string
  userRole: string
}): string {
  const content = `
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf5ff; border-radius: 12px; padding: 32px; border: 1px solid #e9d5ff;">
      <tr>
        <td style="padding: 0;">
          <p style="margin: 0 0 16px; color: #1e1b4b; font-size: 16px; line-height: 1.6;">
            Olá <strong>${data.userName}</strong>,
          </p>
          <p style="margin: 0 0 16px; color: #1e1b4b; font-size: 16px; line-height: 1.6;">
            Seja bem-vindo(a) ao sistema! Sua conta foi criada com sucesso como <strong>${data.userRole}</strong>.
          </p>
          <p style="margin: 0; color: #1e1b4b; font-size: 16px; line-height: 1.6;">
            Você já pode acessar o sistema e começar a utilizar todas as funcionalidades disponíveis.
          </p>
        </td>
      </tr>
    </table>
  `

  return createEmailTemplate({
    companyName: data.companyName,
    title: 'Bem-vindo!',
    content,
    footer: 'Em caso de dúvidas, entre em contato conosco.',
  })
}

export function createPasswordResetEmail(data: {
  companyName: string
  userName: string
  resetLink: string
}): string {
  const content = `
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf5ff; border-radius: 12px; padding: 32px; border: 1px solid #e9d5ff;">
      <tr>
        <td style="padding: 0 0 24px;">
          <p style="margin: 0 0 16px; color: #1e1b4b; font-size: 16px; line-height: 1.6;">
            Olá <strong>${data.userName}</strong>,
          </p>
          <p style="margin: 0; color: #1e1b4b; font-size: 16px; line-height: 1.6;">
            Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:
          </p>
        </td>
      </tr>
      <tr>
        <td style="text-align: center; padding: 0;">
          <a href="${data.resetLink}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Redefinir Senha</a>
        </td>
      </tr>
      <tr>
        <td style="padding: 24px 0 0;">
          <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
            Se você não solicitou esta alteração, ignore este email.
          </p>
        </td>
      </tr>
    </table>
  `

  return createEmailTemplate({
    companyName: data.companyName,
    title: 'Redefinir senha',
    content,
    footer: 'Este link expira em 24 horas.',
  })
}
