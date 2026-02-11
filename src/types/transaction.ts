// src/types/transaction.ts
import { z } from 'zod'

/**
 * Schemas e tipos para transações
 */

// Schemas Zod
export const paymentMethodSchema = z.enum(['pix', 'credit_card', 'boleto'])
export const transactionStatusSchema = z.enum(['approved', 'pending', 'refused', 'refunded'])

export const transactionSchema = z.object({
  id: z.string(),
  contributor: z.string(),
  contributorEmail: z.string().email(),
  contributorId: z.string().optional(),
  church: z.string().nullable(),
  amount: z.number().positive(),
  method: paymentMethodSchema,
  status: transactionStatusSchema,
  date: z.string(),
  paidAt: z.string().nullable(),
  refundRequestReason: z.string().nullable().optional(),
  isFraud: z.boolean().optional(),
})

export const transactionsApiResponseSchema = z.object({
  transactions: z.array(transactionSchema),
  pagination: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number().optional(),
      hasMore: z.boolean(),
    })
    .optional(),
})

// Schema para detalhes de transação (página individual)
export const transactionDetailsSchema = z.object({
  id: z.string(),
  date: z.string(),
  amount: z.number().positive(),
  status: transactionStatusSchema,
  gateway: z.string().default('Cielo'),
  contributor: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string().email(),
      phone: z.string().nullable(),
      role: z.string(),
    })
    .nullable(),
  church: z
    .object({
      name: z.string(),
      address: z.string().nullable(),
    })
    .nullable(),
  payment: z
    .object({
      method: z.string(),
      details: z.string(),
    })
    .nullable(),
  refundRequestReason: z.string().nullable(),
  isFraud: z.boolean().default(false),
  fraudMarkedAt: z.string().nullable(),
  fraudReason: z.string().nullable(),
})

// Tipos TypeScript derivados
export type Transaction = z.infer<typeof transactionSchema>
export type PaymentMethod = z.infer<typeof paymentMethodSchema>
export type TransactionStatus = z.infer<typeof transactionStatusSchema>
export type TransactionsApiResponse = z.infer<typeof transactionsApiResponseSchema>
export type TransactionDetails = z.infer<typeof transactionDetailsSchema>
