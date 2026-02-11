/**
 * Componente de badges de segurança para o sistema de contribuições
 */

import React from 'react'
import { cn } from '@/lib/utils'
import { SecurityBadgesProps } from '../types'

export default function SecurityBadges({ className }: SecurityBadgesProps) {
  const [gateway, setGateway] = React.useState<string>('')

  React.useEffect(() => {
    const fetchGateway = async () => {
      try {
        const response = await fetch('/api/v1/payment-methods')
        if (response.ok) {
          const data: { gateway?: string } = await response.json()
          setGateway(data.gateway || '')
        }
      } catch (error) {
        console.error('Failed to fetch gateway info:', error)
      }
    }
    fetchGateway()
  }, [])

  return (
    <div
      className={cn(
        'bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border border-green-200 dark:border-green-800 rounded-lg p-3',
        className,
      )}
    >
      <div className="flex items-center justify-center gap-6 text-xs">
        {/* SSL Badge */}
        <div className="flex items-center gap-1 text-green-700 dark:text-green-300">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium">SSL 256-bit</span>
        </div>

        {/* PCI Compliance Badge */}
        <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium">PCI Compliant</span>
        </div>

        {/* Gateway Badge — dinâmico */}
        <div className="flex items-center gap-1 text-purple-700 dark:text-purple-300">
          <div className="h-4 w-4 bg-purple-600 rounded text-white text-xs flex items-center justify-center font-bold">
            {gateway === 'Bradesco' ? 'B' : 'C'}
          </div>
          <span className="font-medium">Gateway {gateway || 'Pagamento'}</span>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-2">
        🔒 Dados protegidos por criptografia • Não armazenamos informações de cartão
      </p>
    </div>
  )
}
