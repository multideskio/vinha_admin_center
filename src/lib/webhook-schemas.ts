/**
 * Schemas Zod para validação de webhooks de gateways de pagamento.
 * Exportados para uso em rotas e testes de contrato.
 */

import { z } from 'zod'

/** Schema para webhook da Cielo - PaymentId e ChangeType 1-6 */
export const cieloWebhookSchema = z.object({
  PaymentId: z.string().uuid(),
  ChangeType: z.number().int().min(1).max(6),
})

/** Schema para webhook PIX do Bradesco (padrão BACEN) */
export const bradescoPixWebhookSchema = z.object({
  pix: z
    .array(
      z.object({
        endToEndId: z.string(),
        txid: z.string(),
        valor: z.string(),
        horario: z.string(),
        infoPagador: z.string().optional(),
      }),
    )
    .min(1),
})

/** Schema para webhook Boleto do Bradesco */
export const bradescoBoletoWebhookSchema = z.object({
  nossoNumero: z.string(),
  status: z.string(),
  valorPago: z.number().optional(),
  dataPagamento: z.string().optional(),
})

export type CieloWebhookPayload = z.infer<typeof cieloWebhookSchema>
export type BradescoPixWebhookPayload = z.infer<typeof bradescoPixWebhookSchema>
export type BradescoBoletoWebhookPayload = z.infer<typeof bradescoBoletoWebhookSchema>
