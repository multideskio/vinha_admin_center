
'use client';

import * as React from 'react';
import { Download, FileDown, Filter, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';

type Report = {
  id: string;
  generationDate: string;
  type: string;
  filters: string;
  format: 'PDF' | 'Excel' | 'CSV';
  status: 'Concluído' | 'Processando' | 'Falhou';
};

const recentReports: Report[] = [
  {
    id: 'REP-001',
    generationDate: '2024-07-28 10:30',
    type: 'Financeiro - Entradas',
    filters: 'Período: 01/07/24 - 28/07/24; Região: Sul',
    format: 'PDF',
    status: 'Concluído',
  },
  {
    id: 'REP-002',
    generationDate: '2024-07-27 15:45',
    type: 'Membros - Ativos',
    filters: 'Todos',
    format: 'Excel',
    status: 'Concluído',
  },
  {
    id: 'REP-003',
    generationDate: '2024-07-26 09:00',
    type: 'Cadastro - Igrejas',
    filters: 'Região: Nordeste',
    format: 'CSV',
    status: 'Processando',
  },
    {
    id: 'REP-004',
    generationDate: '2024-07-25 11:20',
    type: 'Financeiro - Saídas',
    filters: 'Período: 01/06/24 - 30/06/24',
    format: 'PDF',
    status: 'Falhou',
  },
];

const reportTypes = [
    'Financeiro - Entradas',
    'Financeiro - Saídas',
    'Membros - Ativos',
    'Membros - Inativos',
    'Cadastro - Igrejas',
    'Cadastro - Pastores',
];

const groupLevels = ['Região', 'Gerente', 'Supervisor', 'Igreja'];
const formats = ['PDF', 'Excel (XLSX)', 'CSV'];

export default function RelatoriosPage() {
  const [selectedReportType, setSelectedReportType] = React.useState<string>('');
  const [selectedGroupLevel, setSelectedGroupLevel] = React.useState<string>('');
  const [selectedFormat, setSelectedFormat] = React.useState<string>('');

  const handleGenerateReport = () => {
    // Lógica para gerar o relatório
    console.log({
        type: selectedReportType,
        level: selectedGroupLevel,
        format: selectedFormat,
        // Adicionar data
    })
  }

  const handleClearFilters = () => {
    setSelectedReportType('');
    setSelectedGroupLevel('');
    setSelectedFormat('');
    // Limpar data range
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Geração de Relatórios
        </h1>
        <p className="text-sm text-muted-foreground">
          Selecione os filtros para gerar e baixar relatórios personalizados.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Escolha os parâmetros para o seu relatório.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="report-type" className="text-sm font-medium">
                Tipo de Relatório
              </label>
              <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                <SelectTrigger id="report-type">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col space-y-1.5">
                <label htmlFor="date-range" className="text-sm font-medium">Período</label>
                <DateRangePicker />
            </div>

            <div className="flex flex-col space-y-1.5">
              <label htmlFor="group-level" className="text-sm font-medium">
                Nível de Agrupamento
              </label>
              <Select value={selectedGroupLevel} onValueChange={setSelectedGroupLevel}>
                <SelectTrigger id="group-level">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {groupLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col space-y-1.5">
              <label htmlFor="format" className="text-sm font-medium">
                Formato
              </label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger id="format">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {formats.map((format) => (
                    <SelectItem key={format} value={format}>
                      {format}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={handleClearFilters}>
              <X className="mr-2 h-4 w-4" />
              Limpar Filtros
            </Button>
            <Button onClick={handleGenerateReport}>
              <FileDown className="mr-2 h-4 w-4" />
              Gerar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Relatórios Gerados Recentemente</CardTitle>
          <CardDescription>
            Visualize e baixe os relatórios que você gerou.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden md:table-cell">Filtros</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className='text-right'>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{report.generationDate}</TableCell>
                  <TableCell className="font-medium">{report.type}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground max-w-xs truncate">
                    {report.filters}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={
                        report.status === 'Concluído' ? 'default' : report.status === 'Processando' ? 'secondary' : 'destructive'
                    }
                    className={
                        report.status === 'Concluído' ? 'bg-green-500/20 text-green-700 border-green-400'
                        : report.status === 'Processando' ? 'bg-amber-500/20 text-amber-700 border-amber-400'
                        : 'bg-red-500/20 text-red-700 border-red-400'
                    }
                    >
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={report.status !== 'Concluído'}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Baixar ({report.format})
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
