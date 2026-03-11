/**
 * Testes de contrato para integração Bradesco (PIX e Boleto).
 * Valida que os schemas Zod aceitam os payloads esperados pela documentação.
 */

import { describe, it, expect } from 'vitest'
import { bradescoPixWebhookSchema, bradescoBoletoWebhookSchema } from '@/lib/webhook-schemas'

describe('Bradesco PIX - Webhook Schema', () => {
  it('deve aceitar payload PIX válido com array pix', () => {
    const payload = {
      pix: [
        {
          endToEndId: 'E12345678202401151200abc123',
          txid: 'txid-123456',
          valor: '100.00',
          horario: '2024-01-15T12:00:00.000Z',
        },
      ],
    }
    const result = bradescoPixWebhookSchema.safeParse(payload)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.pix).toHaveLength(1)
      const first = result.data.pix[0]
      expect(first?.txid).toBe('txid-123456')
      expect(first?.valor).toBe('100.00')
    }
  })

  it('deve aceitar payload PIX com infoPagador opcional', () => {
    const payload = {
      pix: [
        {
          endToEndId: 'E123',
          txid: 'txid-456',
          valor: '50.00',
          horario: '2024-01-15T12:00:00.000Z',
          infoPagador: 'Nome do Pagador',
        },
      ],
    }
    const result = bradescoPixWebhookSchema.safeParse(payload)
    expect(result.success).toBe(true)
  })

  it('deve aceitar payload PIX com múltiplos itens no array', () => {
    const payload = {
      pix: [
        {
          endToEndId: 'E1',
          txid: 'txid-1',
          valor: '10.00',
          horario: '2024-01-15T12:00:00.000Z',
        },
        {
          endToEndId: 'E2',
          txid: 'txid-2',
          valor: '20.00',
          horario: '2024-01-15T12:01:00.000Z',
        },
      ],
    }
    const result = bradescoPixWebhookSchema.safeParse(payload)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.pix).toHaveLength(2)
  })

  it('deve rejeitar payload PIX com array vazio', () => {
    const payload = { pix: [] }
    const result = bradescoPixWebhookSchema.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it('deve rejeitar payload PIX sem campo pix', () => {
    const payload = { nossoNumero: '123' }
    const result = bradescoPixWebhookSchema.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it('deve rejeitar payload PIX com item sem txid', () => {
    const payload = {
      pix: [
        {
          endToEndId: 'E1',
          valor: '10.00',
          horario: '2024-01-15T12:00:00.000Z',
        },
      ],
    }
    const result = bradescoPixWebhookSchema.safeParse(payload)
    expect(result.success).toBe(false)
  })
})

describe('Bradesco Boleto - Webhook Schema', () => {
  it('deve aceitar payload boleto válido mínimo', () => {
    const payload = {
      nossoNumero: '12345678',
      status: 'pago',
    }
    const result = bradescoBoletoWebhookSchema.safeParse(payload)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.nossoNumero).toBe('12345678')
      expect(result.data.status).toBe('pago')
    }
  })

  it('deve aceitar payload boleto completo com valorPago e dataPagamento', () => {
    const payload = {
      nossoNumero: '12345678',
      status: 'pago',
      valorPago: 100.5,
      dataPagamento: '2024-01-15',
    }
    const result = bradescoBoletoWebhookSchema.safeParse(payload)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.valorPago).toBe(100.5)
      expect(result.data.dataPagamento).toBe('2024-01-15')
    }
  })

  it('deve aceitar status como string (registrado, pago, vencido, cancelado)', () => {
    const statuses = ['registrado', 'pago', 'vencido', 'cancelado', 'baixado']
    for (const status of statuses) {
      const payload = { nossoNumero: '123', status }
      const result = bradescoBoletoWebhookSchema.safeParse(payload)
      expect(result.success).toBe(true)
    }
  })

  it('deve rejeitar payload boleto sem nossoNumero', () => {
    const payload = { status: 'pago' }
    const result = bradescoBoletoWebhookSchema.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it('deve rejeitar payload boleto sem status', () => {
    const payload = { nossoNumero: '12345678' }
    const result = bradescoBoletoWebhookSchema.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it('deve rejeitar valorPago não numérico', () => {
    const payload = {
      nossoNumero: '123',
      status: 'pago',
      valorPago: '100', // string em vez de number
    }
    const result = bradescoBoletoWebhookSchema.safeParse(payload)
    expect(result.success).toBe(false)
  })
})
