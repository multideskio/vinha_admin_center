'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface DateRangePickerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: DateRange | undefined
  onChange?: (dateRange: DateRange | undefined) => void
  onDateRangeChange?: (range: { from: Date | undefined; to: Date | undefined }) => void
  disabled?: boolean
}

export function DateRangePicker({
  className,
  value,
  onChange,
  onDateRangeChange,
  disabled,
}: DateRangePickerProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false)
  const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(value)

  // Sincronizar com prop value apenas quando ela mudar externamente
  React.useEffect(() => {
    setInternalDate(value)
  }, [value])

  const handleDateSelect = (newDate: DateRange | undefined) => {
    setInternalDate(newDate)

    // Não chamar callbacks até que o usuário clique em "Aplicar"
    // Isso evita chamadas automáticas à API durante a seleção
  }

  const handleApply = () => {
    // Só chamar os callbacks quando o usuário confirmar
    onChange?.(internalDate)
    onDateRangeChange?.({
      from: internalDate?.from,
      to: internalDate?.to,
    })
    setOpen(false)
  }

  const handleClear = () => {
    const clearedDate = undefined
    setInternalDate(clearedDate)
    onChange?.(clearedDate)
    onDateRangeChange?.({ from: undefined, to: undefined })
    setOpen(false)
  }

  const handleCancel = () => {
    // Reverter para o valor original se o usuário cancelar
    setInternalDate(value)
    setOpen(false)
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            disabled={disabled}
            className={cn(
              'w-[300px] justify-start text-left font-normal',
              !value?.from && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, 'dd/MM/yyyy', { locale: ptBR })} -{' '}
                  {format(value.to, 'dd/MM/yyyy', { locale: ptBR })}
                </>
              ) : (
                format(value.from, 'dd/MM/yyyy', { locale: ptBR })
              )
            ) : (
              <span>Selecione um período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={internalDate?.from || new Date()}
            selected={internalDate}
            onSelect={handleDateSelect}
            numberOfMonths={2}
            disabled={{ after: new Date() }}
            locale={ptBR}
          />
          <div className="flex items-center justify-between gap-2 p-3 border-t">
            <Button variant="outline" size="sm" onClick={handleClear}>
              Limpar
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleApply} disabled={!internalDate?.from}>
                Aplicar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
