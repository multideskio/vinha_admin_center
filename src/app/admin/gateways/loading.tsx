import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-videira-cyan" />
      <p className="text-lg font-medium text-muted-foreground animate-pulse">
        Carregando gateways...
      </p>
    </div>
  )
}
