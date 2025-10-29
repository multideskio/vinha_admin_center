
'use client';

import * as React from 'react';
import { FileText, Loader2, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format as formatDate } from 'date-fns';
import { ReportGenerator, ReportData } from '@/lib/report-generator';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';

const reportTypes = [
    { id: 'fin-01', name: 'Relatório Financeiro Completo', description: 'Detalhes de todas as transações, arrecadações e despesas.'},
    { id: 'mem-01', name: 'Relatório de Membresia', description: 'Dados demográficos, de engajamento e crescimento de membros.'},
    { id: 'ch-01', name: 'Relatório de Igrejas por Região', description: 'Performance e estatísticas de todas as igrejas, agrupadas por região.'},
    { id: 'con-01', name: 'Relatório de Contribuições por Tipo', description: 'Análise detalhada de dízimos e ofertas.'},
];

const paymentMethods = [
    { value: 'all', label: 'Todos' },
    { value: 'pix', label: 'PIX' },
    { value: 'credit_card', label: 'Cartão de Crédito' },
    { value: 'boleto', label: 'Boleto' },
];

const paymentStatuses = [
    { value: 'all', label: 'Todos' },
    { value: 'approved', label: 'Aprovado' },
    { value: 'pending', label: 'Pendente' },
    { value: 'refused', label: 'Recusado' },
    { value: 'refunded', label: 'Reembolsado' },
];



export default function ReportsPage() {
    const [selectedReport, setSelectedReport] = React.useState<string>('');
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
    const [paymentMethod, setPaymentMethod] = React.useState<string>('all');
    const [paymentStatus, setPaymentStatus] = React.useState<string>('all');
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [previewData, setPreviewData] = React.useState<ReportData | null>(null);
    const { toast } = useToast();

    const handlePreview = async () => {
        if (!selectedReport) {
            toast({
                title: 'Atenção',
                description: 'Por favor, selecione um tipo de relatório.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/v1/relatorios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportType: selectedReport,
                    startDate: dateRange?.from?.toISOString(),
                    endDate: dateRange?.to?.toISOString(),
                    paymentMethod: paymentMethod !== 'all' ? paymentMethod : undefined,
                    paymentStatus: paymentStatus !== 'all' ? paymentStatus : undefined,
                }),
            });

            if (!response.ok) throw new Error('Falha ao gerar relatório');

            const data: ReportData = await response.json();
            data.period = dateRange?.from && dateRange?.to
                ? `${formatDate(dateRange.from, 'dd/MM/yyyy')} - ${formatDate(dateRange.to, 'dd/MM/yyyy')}`
                : 'Todos os períodos';

            setPreviewData(data);
            toast({
                title: 'Preview Gerado!',
                description: 'Visualize os dados antes de baixar.',
                variant: 'success',
            });
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Não foi possível gerar o preview.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateReport = async (format: 'pdf' | 'excel') => {
        if (!previewData) {
            toast({
                title: 'Atenção',
                description: 'Gere o preview primeiro.',
                variant: 'destructive',
            });
            return;
        }

        setIsGenerating(true);
        try {

            const reportInfo = reportTypes.find(r => r.id === selectedReport);
            const filename = `${reportInfo?.name.replace(/\s+/g, '_')}_${formatDate(new Date(), 'dd-MM-yyyy')}`;

            if (format === 'pdf') {
                const blob = ReportGenerator.generatePDF(previewData);
                ReportGenerator.downloadFile(blob, `${filename}.pdf`);
            } else {
                const blob = await ReportGenerator.generateExcel(previewData);
                ReportGenerator.downloadFile(blob, `${filename}.xlsx`);
            }

            toast({
                title: 'Relatório Baixado!',
                description: `${reportInfo?.name} foi baixado com sucesso.`,
                variant: 'success',
            });
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Não foi possível gerar o relatório.',
                variant: 'destructive',
            });
        } finally {
            setIsGenerating(false);
        }
    };

  return (
    <div className="grid gap-6">
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Relatórios
            </h1>
            <p className="text-sm text-muted-foreground">
                Gere e exporte relatórios detalhados da plataforma.
            </p>
            </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Gerar Novo Relatório</CardTitle>
            <CardDescription>Selecione o tipo de relatório e o período desejado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo de Relatório</label>
                    <Select onValueChange={setSelectedReport} value={selectedReport}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            {reportTypes.map(report => (
                                <SelectItem key={report.id} value={report.id}>{report.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Período</label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !dateRange && 'text-muted-foreground')}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {formatDate(dateRange.from, 'dd/MM/yyyy')} - {formatDate(dateRange.to, 'dd/MM/yyyy')}
                                        </>
                                    ) : (
                                        formatDate(dateRange.from, 'dd/MM/yyyy')
                                    )
                                ) : (
                                    <span>Selecione o período</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Método de Pagamento</label>
                    <Select onValueChange={setPaymentMethod} value={paymentMethod}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {paymentMethods.map(method => (
                                <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Status do Pagamento</label>
                    <Select onValueChange={setPaymentStatus} value={paymentStatus}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {paymentStatuses.map(status => (
                                <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex gap-2">
                <Button onClick={handlePreview} disabled={isLoading}>
                    {isLoading ? <Loader2 className='h-4 w-4 animate-spin mr-2' /> : null}
                    Gerar Preview
                </Button>
            </div>
        </CardContent>
      </Card>

      {previewData && (
        <Card>
          <CardHeader>
            <CardTitle>Preview do Relatório</CardTitle>
            <CardDescription>{previewData.title} - {previewData.period}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Resumo:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {previewData.summary?.map((item, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                      <p className="text-lg font-semibold">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Dados ({previewData.rows?.length || 0} registros):</h4>
                <div className="border rounded-lg overflow-auto max-h-96">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        {previewData.headers?.map((header, index) => (
                          <th key={index} className="px-4 py-2 text-left text-sm font-medium">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.rows?.slice(0, 50).map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-t">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-4 py-2 text-sm">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(previewData.rows?.length || 0) > 50 && (
                    <div className="p-4 text-center text-sm text-muted-foreground border-t">
                      Mostrando 50 de {previewData.rows?.length} registros. Baixe o relatório completo.
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleGenerateReport('pdf')} disabled={isGenerating}>
                  {isGenerating ? <Loader2 className='h-4 w-4 animate-spin mr-2' /> : <FileText className='h-4 w-4 mr-2' />}
                  Baixar PDF
                </Button>
                <Button variant="outline" onClick={() => handleGenerateReport('excel')} disabled={isGenerating}>
                  {isGenerating ? <Loader2 className='h-4 w-4 animate-spin mr-2' /> : <FileSpreadsheet className='h-4 w-4 mr-2' />}
                  Baixar Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
