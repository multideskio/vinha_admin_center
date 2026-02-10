/**
 * Interfaces e utilitários compartilhados para a camada de serviço de relatórios.
 * Usados por todos os serviços de relatório para padronizar paginação e respostas.
 */

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: PaginationMeta
}

/**
 * Calcula os metadados de paginação a partir dos parâmetros fornecidos.
 *
 * @param page - Número da página atual (>= 1)
 * @param limit - Quantidade de itens por página (>= 1)
 * @param total - Total de registros disponíveis (>= 0)
 * @returns Objeto PaginationMeta com totalPages, hasNext e hasPrev calculados
 */
export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit)
  const hasNext = page < totalPages
  const hasPrev = page > 1

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
  }
}
