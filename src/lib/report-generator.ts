/**
 * @fileoverview Gerador de relatórios em PDF e Excel
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export type ReportData = {
  title: string
  period: string
  headers: string[]
  rows: (string | number)[][]
  summary?: { label: string; value: string | number }[]
}

export class ReportGenerator {
  static generatePDF(data: ReportData): Blob {
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
      const finalY = (doc as any).lastAutoTable.finalY || 40
      doc.setFontSize(12)
      doc.text('Resumo:', 14, finalY + 10)
      
      data.summary.forEach((item, index) => {
        doc.setFontSize(10)
        doc.text(`${item.label}: ${item.value}`, 14, finalY + 20 + (index * 7))
      })
    }
    
    return doc.output('blob')
  }
  
  static generateExcel(data: ReportData): Blob {
    const ws = XLSX.utils.aoa_to_sheet([
      [data.title],
      [`Período: ${data.period}`],
      [],
      data.headers,
      ...data.rows,
    ])
    
    if (data.summary && data.summary.length > 0) {
      const summaryRows = data.summary.map(item => [item.label, item.value])
      XLSX.utils.sheet_add_aoa(ws, [[], ['Resumo'], ...summaryRows], { origin: -1 })
    }
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório')
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  }
  
  static downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}
