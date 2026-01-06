/**
 * Utilitários para trabalhar com datas no timezone do Brasil (America/Sao_Paulo)
 */

// Timezone do Brasil
export const BRAZIL_TIMEZONE = 'America/Sao_Paulo'

/**
 * Obtém a data atual no timezone do Brasil
 */
export function getBrazilDate(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }))
}

/**
 * Converte uma data para o timezone do Brasil
 */
export function toBrazilDate(date: Date | string): Date {
  const inputDate = typeof date === 'string' ? new Date(date) : date
  return new Date(inputDate.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }))
}

/**
 * Calcula a diferença em dias entre duas datas considerando o timezone do Brasil
 */
export function getDaysDifference(date1: Date | string, date2: Date | string): number {
  const brazilDate1 = toBrazilDate(date1)
  const brazilDate2 = toBrazilDate(date2)

  // Zerar as horas para calcular apenas a diferença de dias
  const startOfDay1 = new Date(
    brazilDate1.getFullYear(),
    brazilDate1.getMonth(),
    brazilDate1.getDate(),
  )
  const startOfDay2 = new Date(
    brazilDate2.getFullYear(),
    brazilDate2.getMonth(),
    brazilDate2.getDate(),
  )

  const diffTime = Math.abs(startOfDay2.getTime() - startOfDay1.getTime())
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Calcula quantos dias se passaram desde uma data até hoje (timezone Brasil)
 */
export function getDaysSince(date: Date | string): number {
  const now = getBrazilDate()
  const inputDate = toBrazilDate(date)

  // Se a data é no futuro, retorna 0
  if (inputDate > now) {
    return 0
  }

  return getDaysDifference(inputDate, now)
}

/**
 * Formata uma data para o padrão brasileiro (dd/MM/yyyy)
 */
export function formatBrazilDate(date: Date | string): string {
  const brazilDate = toBrazilDate(date)
  return brazilDate.toLocaleDateString('pt-BR')
}

/**
 * Formata uma data e hora para o padrão brasileiro (dd/MM/yyyy HH:mm:ss)
 */
export function formatBrazilDateTime(date: Date | string): string {
  const brazilDate = toBrazilDate(date)
  return brazilDate.toLocaleString('pt-BR')
}

/**
 * Obtém o início do mês no timezone do Brasil
 */
export function getBrazilStartOfMonth(date?: Date): Date {
  const brazilDate = date ? toBrazilDate(date) : getBrazilDate()
  return new Date(brazilDate.getFullYear(), brazilDate.getMonth(), 1)
}

/**
 * Obtém o fim do mês no timezone do Brasil
 */
export function getBrazilEndOfMonth(date?: Date): Date {
  const brazilDate = date ? toBrazilDate(date) : getBrazilDate()
  return new Date(brazilDate.getFullYear(), brazilDate.getMonth() + 1, 0, 23, 59, 59, 999)
}

/**
 * Subtrai meses de uma data no timezone do Brasil
 */
export function subtractMonthsBrazil(date: Date, months: number): Date {
  const brazilDate = toBrazilDate(date)
  const result = new Date(brazilDate)
  result.setMonth(result.getMonth() - months)
  return result
}

/**
 * Adiciona dias a uma data no timezone do Brasil
 */
export function addDaysBrazil(date: Date, days: number): Date {
  const brazilDate = toBrazilDate(date)
  const result = new Date(brazilDate)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Verifica se uma data está no passado (timezone Brasil)
 */
export function isInPast(date: Date | string): boolean {
  const now = getBrazilDate()
  const inputDate = toBrazilDate(date)
  return inputDate < now
}

/**
 * Verifica se duas datas são do mesmo dia (timezone Brasil)
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const brazilDate1 = toBrazilDate(date1)
  const brazilDate2 = toBrazilDate(date2)

  return (
    brazilDate1.getFullYear() === brazilDate2.getFullYear() &&
    brazilDate1.getMonth() === brazilDate2.getMonth() &&
    brazilDate1.getDate() === brazilDate2.getDate()
  )
}
