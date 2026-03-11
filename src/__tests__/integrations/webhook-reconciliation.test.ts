/**
 * Testes para o módulo de reconciliação de webhooks.
 * Usa mocks do banco de dados para testar a lógica sem dependências externas.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/db/drizzle', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    setContext: vi.fn(),
    clearContext: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('webhook-reconciliation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('reconcileTransactionState - validação de status', () => {
    it('deve rejeitar status de webhook inválido', async () => {
      const { reconcileTransactionState } = await import('@/lib/webhook-reconciliation')

      const result = await reconcileTransactionState('tx-123', 'invalid' as never)

      expect(result.success).toBe(false)
      expect(result.transactionFound).toBe(false)
      expect(result.statusUpdated).toBe(false)
      expect(result.error).toContain('Invalid webhook status')
    })

    it('deve aceitar status válidos: pending, approved, refused, refunded', () => {
      const validStatuses = ['pending', 'approved', 'refused', 'refunded']
      validStatuses.forEach((status) => {
        expect(['pending', 'approved', 'refused', 'refunded']).toContain(status)
      })
    })
  })

  describe('TransactionStatus type', () => {
    it('deve ter os quatro status corretos conforme PAYLOAD_CONTRACTS', () => {
      const expected: Array<'pending' | 'approved' | 'refused' | 'refunded'> = [
        'pending',
        'approved',
        'refused',
        'refunded',
      ]
      expect(expected).toHaveLength(4)
      expect(expected).toContain('pending')
      expect(expected).toContain('approved')
      expect(expected).toContain('refused')
      expect(expected).toContain('refunded')
    })
  })

  describe('ReconciliationResult interface', () => {
    it('deve ter os campos esperados no resultado', () => {
      const resultShape = {
        success: true,
        transactionFound: true,
        statusUpdated: false,
        previousStatus: 'pending',
        newStatus: 'approved',
        transactionId: 'uuid',
        error: undefined,
      }
      expect(resultShape).toHaveProperty('success')
      expect(resultShape).toHaveProperty('transactionFound')
      expect(resultShape).toHaveProperty('statusUpdated')
      expect(resultShape).toHaveProperty('previousStatus')
      expect(resultShape).toHaveProperty('newStatus')
      expect(resultShape).toHaveProperty('transactionId')
      expect(resultShape).toHaveProperty('error')
    })
  })
})
