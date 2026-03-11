import { describe, it, expect } from 'vitest'
import { deleteSchemaRequired, deleteSchemaOptional } from '@/lib/types'
import { getErrorMessage } from '@/lib/error-types'

// =============================================================================
// deleteSchemaRequired
// =============================================================================

describe('deleteSchemaRequired', () => {
  it('deve aceitar motivo de exclusão válido', () => {
    const result = deleteSchemaRequired.safeParse({
      deletionReason: 'Usuário solicitou exclusão da conta.',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.deletionReason).toBe('Usuário solicitou exclusão da conta.')
    }
  })

  it('deve rejeitar motivo vazio', () => {
    const result = deleteSchemaRequired.safeParse({ deletionReason: '' })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar motivo ausente', () => {
    const result = deleteSchemaRequired.safeParse({})
    expect(result.success).toBe(false)
  })

  it('deve rejeitar tipo inválido (não-string)', () => {
    const result = deleteSchemaRequired.safeParse({ deletionReason: 123 })
    expect(result.success).toBe(false)
  })
})

// =============================================================================
// deleteSchemaOptional
// =============================================================================

describe('deleteSchemaOptional', () => {
  it('deve aceitar motivo de exclusão presente', () => {
    const result = deleteSchemaOptional.safeParse({
      deletionReason: 'Motivo informado',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.deletionReason).toBe('Motivo informado')
    }
  })

  it('deve aceitar motivo ausente (opcional)', () => {
    const result = deleteSchemaOptional.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.deletionReason).toBeUndefined()
    }
  })

  it('deve aceitar motivo vazio (opcional)', () => {
    const result = deleteSchemaOptional.safeParse({ deletionReason: '' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.deletionReason).toBe('')
    }
  })
})

// =============================================================================
// getErrorMessage (error-types)
// =============================================================================

describe('getErrorMessage', () => {
  it('deve extrair mensagem de Error', () => {
    const error = new Error('Mensagem de teste')
    expect(getErrorMessage(error)).toBe('Mensagem de teste')
  })

  it('deve retornar string quando error é string', () => {
    expect(getErrorMessage('Erro em texto')).toBe('Erro em texto')
  })

  it('deve retornar "Erro desconhecido" para tipos não tratados', () => {
    expect(getErrorMessage(null)).toBe('Erro desconhecido')
    expect(getErrorMessage(undefined)).toBe('Erro desconhecido')
    expect(getErrorMessage(42)).toBe('Erro desconhecido')
  })
})
