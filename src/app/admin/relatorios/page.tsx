
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

export default function ReportsPage() {
    const [selectedReport, setSelectedReport] = React.useState<string>('');
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [lastReport, setLastReport] = React.useState<ReportData | null>(null);
    const { toast } = useToast();

    const handleGenerateReport = async (format: 'pdf' | 'excel') => {
        if (!selectedReport) {
            toast({
                title: 'Atenção',
                description: 'Por favor, selecione um tipo de relatório para gerar.',
                variant: 'destructive',
            });
            return;
        }

        setIsGenerating(true);
        toast({
            title: 'Gerando Relatório...',
            description: 'Aguarde enquanto processamos os dados.',
        });

        try {
            const response = await fetch('/api/v1/relatorios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportType: selectedReport,
                    startDate: dateRange?.from?.toISOString(),
                    endDate: dateRange?.to?.toISOString(),
                }),
            });

            if (!response.ok) throw new Error('Falha ao gerar relatório');

            const data: ReportData = await response.json();
            data.period = dateRange?.from && dateRange?.to
                ? `${formatDate(dateRange.from, 'dd/MM/yyyy')} - ${formatDate(dateRange.to, 'dd/MM/yyyy')}`
                : 'Todos os períodos';

            setLastReport(data);

            const reportInfo = reportTypes.find(r => r.id === selectedReport);
            const filename = `${reportInfo?.name.replace(/\s+/g, '_')}_${formatDate(new Date(), 'dd-MM-yyyy')}`;

            if (format === 'pdf') {
                const blob = ReportGenerator.generatePDF(data);
                ReportGenerator.downloadFile(blob, `${filename}.pdf`);
            } else {
                const blob = ReportGenerator.generateExcel(data);
                ReportGenerator.downloadFile(blob, `${filename}.xlsx`);
            }

            toast({
                title: 'Relatório Gerado!',
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
        <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="grid gap-2 flex-1">
                <Select onValueChange={setSelectedReport} value={selectedReport}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de relatório" />
                    </SelectTrigger>
                    <SelectContent>
                        {reportTypes.map(report => (
                            <SelectItem key={report.id} value={report.id}>{report.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className={cn('justify-start text-left font-normal', !dateRange && 'text-muted-foreground')}>
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
            <div className="flex gap-2">
                <Button className='gap-2' onClick={() => handleGenerateReport('pdf')} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className='h-4 w-4 animate-spin' /> : <FileText className='h-4 w-4' />}
                    PDF
                </Button>
                <Button className='gap-2' variant="outline" onClick={() => handleGenerateReport('excel')} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className='h-4 w-4 animate-spin' /> : <FileSpreadsheet className='h-4 w-4' />}
                    Excel
                </Button>
            </div>
        </CardContent>
      </Card>

      {lastReport && (
        <Card>
          <CardHeader>
            <CardTitle>Último Relatório Gerado</CardTitle>
            <CardDescription>{lastReport.title} - {lastReport.period}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Resumo:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {lastReport.summary?.map((item, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                      <p className="text-lg font-semibold">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleGenerateReport('pdf')} disabled={isGenerating}>
                  <FileText className='h-4 w-4 mr-2' />
                  Baixar PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleGenerateReport('excel')} disabled={isGenerating}>
                  <FileSpreadsheet className='h-4 w-4 mr-2' />
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
