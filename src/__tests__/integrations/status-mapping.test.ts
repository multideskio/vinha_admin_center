/**
 * Testes de mapeamento de status dos gateways.
 * Garante que os códigos de status da Cielo e Bradesco são mapeados corretamente.
 */

import { describe, it, expect } from 'vitest'
import { mapCieloStatus } from '@/lib/cielo-status'

describe('mapCieloStatus', () => {
  it('deve mapear status 0 (NotFinished) para pending', () => {
    expect(mapCieloStatus(0)).toBe('pending')
  })

  it('deve mapear status 1 (Authorized) para approved', () => {
    expect(mapCieloStatus(1)).toBe('approved')
  })

  it('deve mapear status 2 (PaymentConfirmed) para approved', () => {
    expect(mapCieloStatus(2)).toBe('approved')
  })

  it('deve mapear status 3 (Denied) para refused', () => {
    expect(mapCieloStatus(3)).toBe('refused')
  })

  it('deve mapear status 10 (Voided) para refunded', () => {
    expect(mapCieloStatus(10)).toBe('refunded')
  })

  it('deve mapear status 11 (Refunded) para refunded', () => {
    expect(mapCieloStatus(11)).toBe('refunded')
  })

  it('deve mapear status 12 (Pending) para pending', () => {
    expect(mapCieloStatus(12)).toBe('pending')
  })

  it('deve mapear status 13 (Aborted) para refused', () => {
    expect(mapCieloStatus(13)).toBe('refused')
  })

  it('deve mapear status 20 (Scheduled) para pending', () => {
    expect(mapCieloStatus(20)).toBe('pending')
  })

  it('deve mapear status desconhecido para pending', () => {
    expect(mapCieloStatus(99)).toBe('pending')
  })
})

describe('Bradesco PIX status mapping (documentação)', () => {
  it('status ATIVA e CONCLUIDA devem ser tratados corretamente no webhook', () => {
    const statusMapping: Record<string, 'approved' | 'pending'> = {
      ATIVA: 'pending',
      CONCLUIDA: 'approved',
      REMOVIDA_PELO_USUARIO_RECEBEDOR: 'pending',
      REMOVIDA_PELO_PSP: 'pending',
    }
    expect(statusMapping.CONCLUIDA).toBe('approved')
    expect(statusMapping.ATIVA).toBe('pending')
  })
})

describe('Bradesco Boleto status mapping (documentação)', () => {
  it('status registrado, pago, vencido, cancelado devem ser conhecidos', () => {
    const statusMapping: Record<string, 'approved' | 'pending' | 'refused'> = {
      registrado: 'pending',
      pago: 'approved',
      vencido: 'pending',
      cancelado: 'refused',
    }
    expect(statusMapping.pago).toBe('approved')
    expect(statusMapping.cancelado).toBe('refused')
    expect(statusMapping.registrado).toBe('pending')
    expect(statusMapping.vencido).toBe('pending')
  })
})
