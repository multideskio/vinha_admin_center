/**
 * Utilitário para exportação de dados em formato CSV
 */

/**
 * Exporta array de objetos para arquivo CSV
 * @param rows - Array de objetos a serem exportados
 * @param filename - Nome do arquivo (incluir .csv)
 */
export function exportToCsv(rows: Array<Record<string, unknown>>, filename: string): void {
  if (!rows || rows.length === 0) {
    console.warn('Nenhum dado para exportar')
    return
  }

  const firstRow = rows[0]
  if (!firstRow) {
    console.warn('Primeira linha está vazia')
    return
  }

  const headers = Object.keys(firstRow)
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(',')),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
