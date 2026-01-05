/**
 * @fileoverview Gerador de relatórios em PDF e Excel
 * @version 2.0 - Migrado para exceljs por segurança
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExcelJS from 'exceljs'

export type ReportData = {
  title: string
  period: string
  headers: string[]
  rows: (string | number)[][]
  summary?: { label: string; value: string | number }[]
}

export const ReportGenerator = {
  generatePDF(data: ReportData): Blob {
    const doc = new jsPDF()

    // Título
    doc.setFontSize(18)
    doc.text(data.title, 14, 20)

    // Período
    doc.setFontSize(11)
    doc.text(`Período: ${data.period}`, 14, 30)

    // Tabela
    autoTable(doc, {
      head: [data.headers],
      body: data.rows,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [66, 139, 202] },
    })

    // Resumo
    if (data.summary && data.summary.length > 0) {
      const finalY =
        (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 40
      doc.setFontSize(12)
      doc.text('Resumo:', 14, finalY + 10)

      data.summary.forEach((item, index) => {
        doc.setFontSize(10)
        doc.text(`${item.label}: ${item.value}`, 14, finalY + 20 + index * 7)
      })
    }

    return doc.output('blob')
  },

  async generateExcel(data: ReportData): Promise<Blob> {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Relatório')

    // Título
    worksheet.addRow([data.title])
    worksheet.getCell('A1').font = { bold: true, size: 16 }

    // Período
    worksheet.addRow([`Período: ${data.period}`])
    worksheet.getCell('A2').font = { italic: true }

    // Linha vazia
    worksheet.addRow([])

    // Cabeçalhos
    const headerRow = worksheet.addRow(data.headers)
    headerRow.eachCell((cell) => {
      cell.font = { bold: true }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF428BCA' },
      }
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    })

    // Dados
    data.rows.forEach((row) => {
      worksheet.addRow(row)
    })

    // Resumo
    if (data.summary && data.summary.length > 0) {
      worksheet.addRow([]) // Linha vazia
      const summaryHeaderRow = worksheet.addRow(['Resumo'])
      summaryHeaderRow.getCell(1).font = { bold: true, size: 14 }

      data.summary.forEach((item) => {
        worksheet.addRow([item.label, item.value])
      })
    }

    // Auto-ajustar largura das colunas
    worksheet.columns.forEach((column) => {
      if (column.values) {
        const lengths = column.values.map((v) => (v ? v.toString().length : 0))
        const maxLength = Math.max(...lengths.filter((v) => typeof v === 'number'))
        column.width = Math.min(Math.max(maxLength + 2, 10), 50)
      }
    })

    // Gerar buffer
    const buffer = await workbook.xlsx.writeBuffer()
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
  },

  downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  },
}
