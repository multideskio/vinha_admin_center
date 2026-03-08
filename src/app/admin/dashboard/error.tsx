'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Erro no dashboard:', error)
  }, [error])

  return (
    <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
      </div>
      <div>
        <h2 className="text-xl font-bold tracking-tight">Ops! Algo deu errado.</h2>
        <p className="mt-2 text-muted-foreground max-w-md mx-auto">
          Não foi possível carregar os dados do painel no momento.
        </p>
      </div>
      <Button
        onClick={() => reset()}
        className="mt-4 bg-videira-blue hover:bg-videira-blue/90 font-semibold"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Tentar Novamente
      </Button>
    </div>
  )
}
