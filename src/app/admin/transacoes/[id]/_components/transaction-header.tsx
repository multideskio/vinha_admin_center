'use client'

import { ArrowLeft, Copy, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

interface TransactionHeaderProps {
  transactionId: string
}

/**
 * Header da página de detalhes com gradiente e ações
 */
export function TransactionHeader({ transactionId }: TransactionHeaderProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(transactionId)
      setCopied(true)
      toast({
        title: 'ID Copiado',
        description: 'ID da transação copiado para a área de transferência',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: 'Erro ao Copiar',
        description: 'Não foi possível copiar o ID',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-videira-blue via-videira-purple to-videira-pink p-6 text-white">
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detalhes da Transação</h1>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-sm text-white/80">ID: {transactionId}</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyId}
                className="h-6 w-6 text-white hover:bg-white/20"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent" />
    </div>
  )
}
