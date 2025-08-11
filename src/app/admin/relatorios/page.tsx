
'use client';

import * as React from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const reportTypes = [
    { id: 'fin-01', name: 'Relatório Financeiro Completo', description: 'Detalhes de todas as transações, arrecadações e despesas.'},
    { id: 'mem-01', name: 'Relatório de Membresia', description: 'Dados demográficos, de engajamento e crescimento de membros.'},
    { id: 'ch-01', name: 'Relatório de Igrejas por Região', description: 'Performance e estatísticas de todas as igrejas, agrupadas por região.'},
    { id: 'con-01', name: 'Relatório de Contribuições por Tipo', description: 'Análise detalhada de dízimos e ofertas.'},
];

type GeneratedReport = {
    id: string;
    name: string;
    description: string;
    generatedAt: Date;
    period: string;
}

export default function ReportsPage() {
    const [selectedReport, setSelectedReport] = React.useState<string>('');
    const [generatedReports, setGeneratedReports] = React.useState<GeneratedReport[]>([]);
    const [isGenerating, setIsGenerating] = React.useState(false);
    const { toast } = useToast();

    const handleGenerateReport = () => {
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

        // Simula a geração de um relatório
        setTimeout(() => {
            const reportInfo = reportTypes.find(r => r.id === selectedReport);
            if(reportInfo) {
                const newReport: GeneratedReport = {
                    id: `rep-${Date.now()}`,
                    name: reportInfo.name,
                    description: reportInfo.description,
                    generatedAt: new Date(),
                    period: '01/07/2024 - 31/07/2024' // Placeholder
                }
                setGeneratedReports(prev => [newReport, ...prev]);
                toast({
                    title: 'Relatório Gerado!',
                    description: `${reportInfo.name} está pronto para download.`,
                    variant: 'success'
                });
            }
            setIsGenerating(false);
        }, 2000);
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
                <DateRangePicker />
            </div>
            <Button className='gap-2' onClick={handleGenerateReport} disabled={isGenerating}>
                {isGenerating ? <Loader2 className='h-4 w-4 animate-spin' /> : <Download className='h-4 w-4' />}
                {isGenerating ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Relatórios Gerados</CardTitle>
            <CardDescription>Histórico de relatórios gerados anteriormente.</CardDescription>
        </CardHeader>
        <CardContent>
            {generatedReports.length > 0 ? (
                 <ul className='space-y-4'>
                    {generatedReports.map(report => (
                        <li key={report.id} className='flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4'>
                            <div className='flex items-center gap-4'>
                                <FileText className='h-6 w-6 text-muted-foreground flex-shrink-0' />
                                <div>
                                    <p className='font-semibold'>{report.name}</p>
                                    <p className='text-sm text-muted-foreground'>
                                        Período: {report.period} - Gerado em: {format(report.generatedAt, 'dd/MM/yyyy HH:mm')}
                                    </p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className='w-full sm:w-auto'>
                                <Download className='h-4 w-4 mr-2' />
                                Baixar Novamente
                            </Button>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center text-muted-foreground p-12">
                    <h3 className="text-lg font-semibold">Nenhum relatório gerado</h3>
                    <p>Use a seção acima para gerar seu primeiro relatório.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
