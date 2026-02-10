import { describe, it, expect } from 'vitest'
import { buildPaginationMeta } from '@/lib/report-services/types'
import type { PaginationMeta } from '@/lib/report-services/types'

describe('buildPaginationMeta', () => {
  it('deve retornar totalPages=0, hasNext=false, hasPrev=false quando total=0', () => {
    const result: PaginationMeta = buildPaginationMeta(1, 20, 0)

    expect(result).toEqual({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    })
  })

  it('deve calcular corretamente para a primeira página com itens', () => {
    const result = buildPaginationMeta(1, 20, 50)

    expect(result).toEqual({
      page: 1,
      limit: 20,
      total: 50,
      totalPages: 3,
      hasNext: true,
      hasPrev: false,
    })
  })

  it('deve calcular corretamente para a última página', () => {
    const result = buildPaginationMeta(3, 20, 50)

    expect(result).toEqual({
      page: 3,
      limit: 20,
      total: 50,
      totalPages: 3,
      hasNext: false,
      hasPrev: true,
    })
  })

  it('deve calcular corretamente para uma página intermediária', () => {
    const result = buildPaginationMeta(2, 20, 50)

    expect(result).toEqual({
      page: 2,
      limit: 20,
      total: 50,
      totalPages: 3,
      hasNext: true,
      hasPrev: true,
    })
  })

  it('deve retornar hasNext=false e hasPrev=false quando há apenas uma página', () => {
    const result = buildPaginationMeta(1, 20, 15)

    expect(result).toEqual({
      page: 1,
      limit: 20,
      total: 15,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    })
  })

  it('deve arredondar totalPages para cima quando total não é múltiplo de limit', () => {
    const result = buildPaginationMeta(1, 10, 25)

    expect(result.totalPages).toBe(3)
  })

  it('deve calcular totalPages exato quando total é múltiplo de limit', () => {
    const result = buildPaginationMeta(1, 10, 30)

    expect(result.totalPages).toBe(3)
  })

  it('deve retornar totalPages=1 quando total é igual ao limit', () => {
    const result = buildPaginationMeta(1, 20, 20)

    expect(result).toEqual({
      page: 1,
      limit: 20,
      total: 20,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    })
  })

  it('deve retornar totalPages=1 quando total é 1 e limit é 1', () => {
    const result = buildPaginationMeta(1, 1, 1)

    expect(result).toEqual({
      page: 1,
      limit: 1,
      total: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    })
  })

  it('deve lidar com limit grande e total pequeno', () => {
    const result = buildPaginationMeta(1, 100, 5)

    expect(result).toEqual({
      page: 1,
      limit: 100,
      total: 5,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    })
  })
})
