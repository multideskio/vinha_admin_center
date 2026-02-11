'use client'

import * as React from 'react'
import { Download, ListFilter, RefreshCw, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { STATUS_MAP } from '@/lib/constants/transaction-maps'
import { useDebounce } from '@/hooks/use-debounce'
import type { TransactionStatus } from '@/types/transaction'

type TransactionFiltersProps = {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: TransactionStatus[]
  onStatusFilterChange: (status: TransactionStatus) => void
  dateRange: { from: Date | undefined; to: Date | undefined }
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void
  onRefresh: () => void
  onExport: () => void
  totalResults: number
}

export function TransactionFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  dateRange,
  onDateRangeChange,
  onRefresh,
  onExport,
  totalResults,
}: TransactionFiltersProps) {
  const [searchInput, setSearchInput] = React.useState(searchTerm)
  const debouncedSearch = useDebounce(searchInput, 500)

  // Atualizar searchTerm quando debounce completar
  React.useEffect(() => {
    onSearchChange(debouncedSearch)
  }, [debouncedSearch, onSearchChange])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{totalResults} transações encontradas</p>
        <Button
          onClick={onRefresh}
          size="icon"
          className="bg-white dark:bg-background border-2 border-videira-blue text-videira-blue hover:bg-videira-blue hover:text-white transition-all shadow-sm hover:shadow-md"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por contribuinte ou email..."
            className="pl-8 w-full"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                className="bg-white dark:bg-background border-2 border-videira-purple text-videira-purple hover:bg-videira-purple hover:text-white transition-all shadow-sm hover:shadow-md font-semibold gap-2"
              >
                <ListFilter className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">
                  Filtro {statusFilter.length > 0 && `(${statusFilter.length})`}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrar por Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.entries(STATUS_MAP).map(([key, { text }]) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={statusFilter.includes(key as TransactionStatus)}
                  onCheckedChange={() => onStatusFilterChange(key as TransactionStatus)}
                >
                  {text}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="sm"
            onClick={onExport}
            className="bg-white dark:bg-background border-2 border-videira-cyan text-videira-cyan hover:bg-videira-cyan hover:text-white transition-all shadow-sm hover:shadow-md font-semibold gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Exportar CSV</span>
          </Button>
        </div>
        <DateRangePicker
          value={{ from: dateRange.from, to: dateRange.to }}
          onDateRangeChange={onDateRangeChange}
        />
      </div>
    </div>
  )
}
