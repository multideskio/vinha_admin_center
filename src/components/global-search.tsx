/**
 * @fileoverview Componente de busca global para supervisores
 * @version 1.0
 * @date 2025-01-28
 */

'use client'

import * as React from 'react'
import { Search, User, Church, ArrowRightLeft, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/use-debounce'

interface SearchResult {
  id: string
  type: 'pastor' | 'igreja' | 'transacao'
  title: string
  subtitle: string
  description: string
  href: string
}

interface GlobalSearchProps {
  role: string
  className?: string
}

const typeIcons = {
  pastor: User,
  igreja: Church,
  transacao: ArrowRightLeft,
}

const typeLabels = {
  pastor: 'Pastor',
  igreja: 'Igreja',
  transacao: 'Transação',
}

export function GlobalSearch({ role, className }: GlobalSearchProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)

  const debouncedQuery = useDebounce(query, 300)

  React.useEffect(() => {
    if (debouncedQuery.length < 3) {
      setResults([])
      return
    }

    const searchGlobal = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `/api/v1/${role}/search?q=${encodeURIComponent(debouncedQuery)}`,
        )
        if (response.ok) {
          const data = await response.json()
          setResults(data.results || [])
        }
      } catch (error) {
        console.error('Erro na busca:', error)
      } finally {
        setLoading(false)
      }
    }

    searchGlobal()
  }, [debouncedQuery, role])

  const handleSelect = (href: string) => {
    setOpen(false)
    setQuery('')
    router.push(href)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen && inputRef.current) {
      // Pequeno delay para garantir que o popover esteja renderizado
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }

  const groupedResults = results.reduce(
    (acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = []
      }
      acc[result.type]!.push(result)
      return acc
    },
    {} as Record<string, SearchResult[]>,
  )

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground z-10" />
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Input
            ref={inputRef}
            type="search"
            placeholder="Buscar pastores, igrejas, transações..."
            className="w-full appearance-none bg-background pl-8 shadow-none md:w-auto"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
          />
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="p-2">
            {query.length < 3 && (
              <div className="p-4 text-sm text-muted-foreground text-center">
                Digite pelo menos 3 caracteres para buscar
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Buscando...
              </div>
            )}

            {!loading && query.length >= 3 && results.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground text-center">
                Nenhum resultado encontrado
              </div>
            )}

            {!loading &&
              Object.entries(groupedResults).map(([type, items], groupIndex) => {
                const Icon = typeIcons[type as keyof typeof typeIcons]
                const label = typeLabels[type as keyof typeof typeLabels]

                return (
                  <div key={type}>
                    {groupIndex > 0 && <Separator className="my-2" />}
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {label}s ({items.length})
                    </div>
                    <div className="space-y-1">
                      {items.map((item) => (
                        <Button
                          key={item.id}
                          variant="ghost"
                          className="w-full justify-start h-auto p-3 text-left"
                          onClick={() => handleSelect(item.href)}
                        >
                          <Icon className="h-4 w-4 text-muted-foreground mr-3 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{item.title}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {item.subtitle}
                            </div>
                            <div className="text-xs text-muted-foreground">{item.description}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )
              })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
