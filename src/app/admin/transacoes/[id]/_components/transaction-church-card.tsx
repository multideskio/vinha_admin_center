'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Church, MapPin } from 'lucide-react'

interface Church {
  name: string
  address: string | null
}

interface TransactionChurchCardProps {
  church: Church
}

/**
 * Card com dados da igreja de origem
 */
export function TransactionChurchCard({ church }: TransactionChurchCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Church className="h-5 w-5" />
          Igreja de Origem
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Nome da Igreja</p>
          <p className="font-medium">{church.name}</p>
        </div>

        {church.address && (
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Endereço
            </p>
            <p className="text-sm">{church.address}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
