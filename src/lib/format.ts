/**
 * Utilitários de formatação
 */

// Singleton para formatação de moeda
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const currencyFormatterCompact = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

/**
 * Formata valor monetário em Real brasileiro
 * @param value - Valor numérico a ser formatado
 * @param compact - Se true, remove centavos (padrão: false)
 * @returns String formatada (ex: "R$ 1.234,56" ou "R$ 1.235")
 */
export function formatCurrency(value: number, compact = false): string {
  return compact ? currencyFormatterCompact.format(value) : currencyFormatter.format(value)
}
