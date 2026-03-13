'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Mail, Phone, UserCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Contributor {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
}

interface TransactionContributorCardProps {
  contributor: Contributor
}

/**
 * Card com dados do contribuinte
 */
export function TransactionContributorCard({ contributor }: TransactionContributorCardProps) {
  // Mapear role para texto em português
  const roleDisplay: Record<string, string> = {
    admin: 'Administrador',
    manager: 'Gerente',
    supervisor: 'Supervisor',
    pastor: 'Pastor',
    church_account: 'Igreja',
  }

  // Mapear role para rota correta
  const roleToRoute: Record<string, string> = {
    admin: 'administradores',
    manager: 'gerentes',
    supervisor: 'supervisores',
    pastor: 'pastores',
    church_account: 'igrejas',
  }

  const profileRoute = roleToRoute[contributor.role]
  const profileUrl = profileRoute ? `/admin/${profileRoute}/${contributor.id}` : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Contribuinte
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Nome</p>
          <p className="font-medium">{contributor.name}</p>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            Email
          </p>
          <p className="text-sm">{contributor.email}</p>
        </div>

        {contributor.phone && (
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              Telefone
            </p>
            <p className="text-sm">{contributor.phone}</p>
          </div>
        )}

        <div>
          <p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <UserCircle className="h-4 w-4" />
            Tipo de Conta
          </p>
          <p className="text-sm font-medium">{roleDisplay[contributor.role] || contributor.role}</p>
        </div>

        {profileUrl && (
          <Button asChild variant="outline" className="w-full">
            <Link href={profileUrl}>Ver Perfil Completo</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
