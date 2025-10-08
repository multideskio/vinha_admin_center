/**
 * @fileoverview Rota da API para testar envio de e-mail SMTP.
 * @version 1.0
 * @date 2024-08-08
 * @author PH
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

const testEmailSchema = z.object({
  email: z.string().email(),
  config: z.object({
    host: z.string(),
    port: z.number(),
    user: z.string(),
    password: z.string(),
    from: z.string().email().optional().nullable(),
  }),
})

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json()
    const validatedData = testEmailSchema.parse(body)

    const { email, config } = validatedData

    const sesClient = new SESClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: config.user,
        secretAccessKey: config.password,
      },
    })

    const fromAddress = config.from || 'contato@multidesk.io'

    const command = new SendEmailCommand({
      Source: fromAddress,
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: 'E-mail de Teste - Vinha Admin',
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: '<b>Se você recebeu este e-mail, suas configurações de SES estão funcionando corretamente!</b>',
            Charset: 'UTF-8',
          },
          Text: {
            Data: 'Se você recebeu este e-mail, suas configurações de SES estão funcionando corretamente!',
            Charset: 'UTF-8',
          },
        },
      },
    })

    await sesClient.send(command)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: error.errors },
        { status: 400 },
      )
    }
    console.error('Erro ao enviar e-mail de teste:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor.'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
