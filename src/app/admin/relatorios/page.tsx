
'use client';

import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const reports = [
    { id: 'fin-01', name: 'Relatório Financeiro Completo', description: 'Detalhes de todas as transações, arrecadações e despesas.'},
    { id: 'mem-01', name: 'Relatório de Membresia', description: 'Dados demográficos, de engajamento e crescimento de membros.'},
    { id: 'ch-01', name: 'Relatório de Igrejas por Região', description: 'Performance e estatísticas de todas as igrejas, agrupadas por região.'},
    { id: 'con-01', name: 'Relatório de Contribuições por Tipo', description: 'Análise detalhada de dízimos e ofertas.'},
]

export default function ReportsPage() {
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
                <Select>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de relatório" />
                    </SelectTrigger>
                    <SelectContent>
                        {reports.map(report => (
                            <SelectItem key={report.id} value={report.id}>{report.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="grid gap-2">
                <DateRangePicker />
            </div>
            <Button className='gap-2'>
                <Download className='h-4 w-4' />
                Gerar Relatório
            </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Relatórios Gerados</CardTitle>
            <CardDescription>Histórico de relatórios gerados anteriormente.</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className='space-y-4'>
                {reports.map(report => (
                    <li key={report.id} className='flex items-center justify-between p-4 border rounded-lg'>
                        <div className='flex items-center gap-4'>
                            <FileText className='h-6 w-6 text-muted-foreground' />
                            <div>
                                <p className='font-semibold'>{report.name}</p>
                                <p className='text-sm text-muted-foreground'>{report.description}</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm">
                            <Download className='h-4 w-4 mr-2' />
                            Baixar Novamente
                        </Button>
                    </li>
                ))}
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
