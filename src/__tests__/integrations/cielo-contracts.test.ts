/**
 * Testes de contrato para integração Cielo.
 * Valida que os schemas Zod aceitam os payloads esperados pela documentação.
 */

import { describe, it, expect } from 'vitest'
import { cieloWebhookSchema } from '@/lib/webhook-schemas'

describe('Cielo - Webhook Schema', () => {
  it('deve aceitar payload válido com PaymentId UUID e ChangeType 1', () => {
    const payload = {
      PaymentId: '550e8400-e29b-41d4-a716-446655440000',
      ChangeType: 1,
    }
    const result = cieloWebhookSchema.safeParse(payload)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.PaymentId).toBe(payload.PaymentId)
      expect(result.data.ChangeType).toBe(1)
    }
  })

  it('deve aceitar todos os ChangeType válidos (1-6)', () => {
    for (let changeType = 1; changeType <= 6; changeType++) {
      const payload = {
        PaymentId: '550e8400-e29b-41d4-a716-446655440000',
        ChangeType: changeType,
      }
      const result = cieloWebhookSchema.safeParse(payload)
      expect(result.success).toBe(true)
    }
  })

  it('deve rejeitar PaymentId que não é UUID', () => {
    const payload = {
      PaymentId: 'invalid-id',
      ChangeType: 1,
    }
    const result = cieloWebhookSchema.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it('deve rejeitar ChangeType fora do range 1-6', () => {
    const payload = {
      PaymentId: '550e8400-e29b-41d4-a716-446655440000',
      ChangeType: 0,
    }
    expect(cieloWebhookSchema.safeParse(payload).success).toBe(false)

    const payload7 = { ...payload, ChangeType: 7 }
    expect(cieloWebhookSchema.safeParse(payload7).success).toBe(false)
  })

  it('deve rejeitar payload sem PaymentId', () => {
    const payload = { ChangeType: 1 }
    const result = cieloWebhookSchema.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it('deve rejeitar payload sem ChangeType', () => {
    const payload = {
      PaymentId: '550e8400-e29b-41d4-a716-446655440000',
    }
    const result = cieloWebhookSchema.safeParse(payload)
    expect(result.success).toBe(false)
  })
})
