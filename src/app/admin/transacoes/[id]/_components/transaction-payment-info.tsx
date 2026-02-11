'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, Hash, Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface TransactionPaymentInfoProps {
  method: string
  details: string
  gateway: string
}

/**
 * Card com informações de pagamento
 */
export function TransactionPaymentInfo({ method, details, gateway }: TransactionPaymentInfoProps) {
  // Mapear método de pagamento para exibição
  const methodDisplay: Record<string, { text: string; color: string }> = {
    pix: { text: 'PIX', color: 'bg-videira-cyan/15 text-videira-cyan border-videira-cyan/30' },
    credit_card: {
      text: 'Cartão de Crédito',
      color: 'bg-videira-blue/15 text-videira-blue border-videira-blue/30',
    },
    boleto: {
      text: 'Boleto',
      color: 'bg-videira-purple/15 text-videira-purple border-videira-purple/30',
    },
  }

  const methodConfig = methodDisplay[method] || {
    text: method,
    color: 'bg-gray-100 text-gray-700 border-gray-300',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Informações de Pagamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Método de Pagamento</p>
          <Badge className={methodConfig.color} variant="outline">
            {methodConfig.text}
          </Badge>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Hash className="h-4 w-4" />
            ID do Gateway
          </p>
          <p className="break-all font-mono text-sm">{details}</p>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            Gateway de Pagamento
          </p>
          <p className="font-medium">{gateway}</p>
        </div>
      </CardContent>
    </Card>
  )
}
