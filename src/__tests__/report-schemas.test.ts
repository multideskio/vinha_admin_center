import { describe, it, expect } from 'vitest'
import {
  periodSchema,
  paginationSchema,
  financialReportSchema,
  contributionsReportSchema,
  membershipReportSchema,
  defaultersReportSchema,
  churchesReportSchema,
  generalReportSchema,
} from '@/lib/schemas/report-schemas'

// =============================================================================
// periodSchema
// =============================================================================

describe('periodSchema', () => {
  it('deve aceitar período vazio (ambos opcionais)', () => {
    const result = periodSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('deve aceitar apenas from', () => {
    const result = periodSchema.safeParse({ from: '2024-01-01T00:00:00.000Z' })
    expect(result.success).toBe(true)
  })

  it('deve aceitar apenas to', () => {
    const result = periodSchema.safeParse({ to: '2024-06-01T00:00:00.000Z' })
    expect(result.success).toBe(true)
  })

  it('deve aceitar período válido (from < to)', () => {
    const result = periodSchema.safeParse({
      from: '2024-01-01T00:00:00.000Z',
      to: '2024-06-01T00:00:00.000Z',
    })
    expect(result.success).toBe(true)
  })

  it('deve aceitar período com mesma data (from == to)', () => {
    const result = periodSchema.safeParse({
      from: '2024-01-01T00:00:00.000Z',
      to: '2024-01-01T00:00:00.000Z',
    })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar data inicial posterior à data final', () => {
    const result = periodSchema.safeParse({
      from: '2024-06-01T00:00:00.000Z',
      to: '2024-01-01T00:00:00.000Z',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message)
      expect(messages).toContain('Data inicial deve ser anterior à data final')
    }
  })

  it('deve rejeitar período superior a 365 dias', () => {
    const result = periodSchema.safeParse({
      from: '2023-01-01T00:00:00.000Z',
      to: '2024-06-01T00:00:00.000Z',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message)
      expect(messages).toContain('Período máximo permitido é de 365 dias')
    }
  })

  it('deve aceitar período de exatamente 365 dias', () => {
    const result = periodSchema.safeParse({
      from: '2024-01-01T00:00:00.000Z',
      to: '2024-12-31T00:00:00.000Z',
    })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar formato de data inválido', () => {
    const result = periodSchema.safeParse({
      from: 'data-invalida',
      to: '2024-06-01T00:00:00.000Z',
    })
    expect(result.success).toBe(false)
  })
})

// =============================================================================
// paginationSchema
// =============================================================================

describe('paginationSchema', () => {
  it('deve usar valores padrão quando nenhum parâmetro é fornecido', () => {
    const result = paginationSchema.parse({})
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
  })

  it('deve aceitar valores válidos', () => {
    const result = paginationSchema.parse({ page: 5, limit: 50 })
    expect(result.page).toBe(5)
    expect(result.limit).toBe(50)
  })

  it('deve coercer strings para números (query string)', () => {
    const result = paginationSchema.parse({ page: '3', limit: '25' })
    expect(result.page).toBe(3)
    expect(result.limit).toBe(25)
  })

  it('deve rejeitar page < 1', () => {
    const result = paginationSchema.safeParse({ page: 0 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message)
      expect(messages).toContain('Página deve ser maior ou igual a 1')
    }
  })

  it('deve rejeitar page negativa', () => {
    const result = paginationSchema.safeParse({ page: -1 })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar limit < 1', () => {
    const result = paginationSchema.safeParse({ limit: 0 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message)
      expect(messages).toContain('Limite deve ser maior ou igual a 1')
    }
  })

  it('deve rejeitar limit > 100', () => {
    const result = paginationSchema.safeParse({ limit: 101 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message)
      expect(messages).toContain('Limite deve ser menor ou igual a 100')
    }
  })

  it('deve aceitar limit = 1 (mínimo)', () => {
    const result = paginationSchema.parse({ limit: 1 })
    expect(result.limit).toBe(1)
  })

  it('deve aceitar limit = 100 (máximo)', () => {
    const result = paginationSchema.parse({ limit: 100 })
    expect(result.limit).toBe(100)
  })

  it('deve rejeitar valores decimais', () => {
    const result = paginationSchema.safeParse({ page: 1.5 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message)
      expect(messages).toContain('Página deve ser um número inteiro')
    }
  })
})

// =============================================================================
// financialReportSchema
// =============================================================================

describe('financialReportSchema', () => {
  it('deve usar valores padrão quando nenhum parâmetro é fornecido', () => {
    const result = financialReportSchema.parse({})
    expect(result.method).toBe('all')
    expect(result.status).toBe('all')
    expect(result.page).toBe(1)
    expect(result.limit).toBe(50)
  })

  it('deve aceitar todos os métodos de pagamento válidos', () => {
    for (const method of ['all', 'pix', 'credit_card', 'boleto']) {
      const result = financialReportSchema.safeParse({ method })
      expect(result.success).toBe(true)
    }
  })

  it('deve aceitar todos os status válidos', () => {
    for (const status of ['all', 'approved', 'pending', 'refused', 'refunded']) {
      const result = financialReportSchema.safeParse({ status })
      expect(result.success).toBe(true)
    }
  })

  it('deve rejeitar método de pagamento inválido', () => {
    const result = financialReportSchema.safeParse({ method: 'dinheiro' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message)
      expect(messages[0]).toContain('Método de pagamento inválido')
      expect(messages[0]).toContain('Valores permitidos')
    }
  })

  it('deve rejeitar status inválido', () => {
    const result = financialReportSchema.safeParse({ status: 'cancelado' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message)
      expect(messages[0]).toContain('Status inválido')
      expect(messages[0]).toContain('Valores permitidos')
    }
  })

  it('deve aceitar parâmetros completos', () => {
    const result = financialReportSchema.parse({
      from: '2024-01-01',
      to: '2024-06-01',
      method: 'pix',
      status: 'approved',
      page: '2',
      limit: '30',
    })
    expect(result.from).toBe('2024-01-01')
    expect(result.to).toBe('2024-06-01')
    expect(result.method).toBe('pix')
    expect(result.status).toBe('approved')
    expect(result.page).toBe(2)
    expect(result.limit).toBe(30)
  })
})

// =============================================================================
// contributionsReportSchema
// =============================================================================

describe('contributionsReportSchema', () => {
  it('deve usar valores padrão', () => {
    const result = contributionsReportSchema.parse({})
    expect(result.contributorType).toBe('all')
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
  })

  it('deve aceitar todos os tipos de contribuinte válidos', () => {
    for (const contributorType of ['all', 'pastor', 'church_account']) {
      const result = contributionsReportSchema.safeParse({ contributorType })
      expect(result.success).toBe(true)
    }
  })

  it('deve rejeitar tipo de contribuinte inválido', () => {
    const result = contributionsReportSchema.safeParse({ contributorType: 'membro' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message)
      expect(messages[0]).toContain('Tipo de contribuinte inválido')
    }
  })
})

// =============================================================================
// membershipReportSchema
// =============================================================================

describe('membershipReportSchema', () => {
  it('deve usar valores padrão', () => {
    const result = membershipReportSchema.parse({})
    expect(result.role).toBe('all')
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
  })

  it('deve aceitar todos os roles válidos', () => {
    for (const role of ['all', 'admin', 'manager', 'supervisor', 'pastor', 'church_account']) {
      const result = membershipReportSchema.safeParse({ role })
      expect(result.success).toBe(true)
    }
  })

  it('deve rejeitar role inválido', () => {
    const result = membershipReportSchema.safeParse({ role: 'visitante' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message)
      expect(messages[0]).toContain('Role inválido')
    }
  })
})

// =============================================================================
// defaultersReportSchema
// =============================================================================

describe('defaultersReportSchema', () => {
  it('deve usar valores padrão', () => {
    const result = defaultersReportSchema.parse({})
    expect(result.type).toBe('all')
    expect(result.sortBy).toBe('daysLate')
    expect(result.sortOrder).toBe('desc')
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
  })

  it('deve aceitar todos os tipos de inadimplente válidos', () => {
    for (const type of ['all', 'pastor', 'church']) {
      const result = defaultersReportSchema.safeParse({ type })
      expect(result.success).toBe(true)
    }
  })

  it('deve rejeitar tipo de inadimplente inválido', () => {
    const result = defaultersReportSchema.safeParse({ type: 'supervisor' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message)
      expect(messages[0]).toContain('Tipo de inadimplente inválido')
    }
  })

  it('deve aceitar campo de busca opcional', () => {
    const result = defaultersReportSchema.parse({ search: 'João' })
    expect(result.search).toBe('João')
  })

  it('deve rejeitar sortBy inválido', () => {
    const result = defaultersReportSchema.safeParse({ sortBy: 'amount' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message)
      expect(messages[0]).toContain('Campo de ordenação inválido')
    }
  })

  it('deve rejeitar sortOrder inválido', () => {
    const result = defaultersReportSchema.safeParse({ sortOrder: 'random' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message)
      expect(messages[0]).toContain('Ordem de classificação inválida')
    }
  })
})

// =============================================================================
// churchesReportSchema
// =============================================================================

describe('churchesReportSchema', () => {
  it('deve aceitar parâmetros vazios', () => {
    const result = churchesReportSchema.parse({})
    expect(result.from).toBeUndefined()
    expect(result.to).toBeUndefined()
    expect(result.supervisorId).toBeUndefined()
  })

  it('deve aceitar UUID válido para supervisorId', () => {
    const result = churchesReportSchema.parse({
      supervisorId: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.supervisorId).toBe('550e8400-e29b-41d4-a716-446655440000')
  })

  it('deve rejeitar UUID inválido para supervisorId', () => {
    const result = churchesReportSchema.safeParse({ supervisorId: 'nao-e-uuid' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message)
      expect(messages[0]).toContain('UUID válido')
    }
  })

  it('deve aceitar período com from e to', () => {
    const result = churchesReportSchema.parse({
      from: '2024-01-01',
      to: '2024-06-01',
    })
    expect(result.from).toBe('2024-01-01')
    expect(result.to).toBe('2024-06-01')
  })
})

// =============================================================================
// generalReportSchema
// =============================================================================

describe('generalReportSchema', () => {
  it('deve aceitar todos os tipos de relatório válidos', () => {
    for (const reportType of ['fin-01', 'mem-01', 'ch-01', 'con-01', 'def-01']) {
      const result = generalReportSchema.safeParse({ reportType })
      expect(result.success).toBe(true)
    }
  })

  it('deve rejeitar tipo de relatório inválido', () => {
    const result = generalReportSchema.safeParse({ reportType: 'inv-01' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message)
      expect(messages[0]).toContain('Tipo de relatório inválido')
      expect(messages[0]).toContain('Valores permitidos')
    }
  })

  it('deve rejeitar quando reportType não é fornecido', () => {
    const result = generalReportSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('deve aceitar métodos de pagamento opcionais', () => {
    const result = generalReportSchema.parse({
      reportType: 'fin-01',
      paymentMethod: 'pix',
    })
    expect(result.paymentMethod).toBe('pix')
  })

  it('deve rejeitar método de pagamento inválido', () => {
    const result = generalReportSchema.safeParse({
      reportType: 'fin-01',
      paymentMethod: 'dinheiro',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message)
      expect(messages[0]).toContain('Método de pagamento inválido')
    }
  })

  it('deve aceitar status de pagamento opcionais', () => {
    const result = generalReportSchema.parse({
      reportType: 'fin-01',
      paymentStatus: 'approved',
    })
    expect(result.paymentStatus).toBe('approved')
  })

  it('deve rejeitar status de pagamento inválido', () => {
    const result = generalReportSchema.safeParse({
      reportType: 'fin-01',
      paymentStatus: 'cancelado',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message)
      expect(messages[0]).toContain('Status de pagamento inválido')
    }
  })

  it('deve aceitar parâmetros completos', () => {
    const result = generalReportSchema.parse({
      reportType: 'fin-01',
      startDate: '2024-01-01',
      endDate: '2024-06-01',
      paymentMethod: 'credit_card',
      paymentStatus: 'pending',
    })
    expect(result.reportType).toBe('fin-01')
    expect(result.startDate).toBe('2024-01-01')
    expect(result.endDate).toBe('2024-06-01')
    expect(result.paymentMethod).toBe('credit_card')
    expect(result.paymentStatus).toBe('pending')
  })
})

// =============================================================================
// Mensagens de erro em pt-BR
// =============================================================================

describe('Mensagens de erro em pt-BR', () => {
  it('periodSchema deve retornar mensagem em pt-BR para datas invertidas', () => {
    const result = periodSchema.safeParse({
      from: '2024-12-01T00:00:00.000Z',
      to: '2024-01-01T00:00:00.000Z',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const allMessages = result.error.errors.map((e) => e.message).join(' ')
      expect(allMessages).toMatch(/anterior/)
    }
  })

  it('periodSchema deve retornar mensagem em pt-BR para período excedido', () => {
    const result = periodSchema.safeParse({
      from: '2022-01-01T00:00:00.000Z',
      to: '2024-01-01T00:00:00.000Z',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const allMessages = result.error.errors.map((e) => e.message).join(' ')
      expect(allMessages).toMatch(/365 dias/)
    }
  })

  it('paginationSchema deve retornar mensagem em pt-BR para page inválida', () => {
    const result = paginationSchema.safeParse({ page: 0 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const allMessages = result.error.errors.map((e) => e.message).join(' ')
      expect(allMessages).toMatch(/Página/)
    }
  })

  it('paginationSchema deve retornar mensagem em pt-BR para limit inválido', () => {
    const result = paginationSchema.safeParse({ limit: 200 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const allMessages = result.error.errors.map((e) => e.message).join(' ')
      expect(allMessages).toMatch(/Limite/)
    }
  })

  it('financialReportSchema deve listar valores permitidos na mensagem de erro', () => {
    const result = financialReportSchema.safeParse({ method: 'invalido' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const allMessages = result.error.errors.map((e) => e.message).join(' ')
      expect(allMessages).toMatch(/Valores permitidos/)
      expect(allMessages).toMatch(/pix/)
    }
  })
})
