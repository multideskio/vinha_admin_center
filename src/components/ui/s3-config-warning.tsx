/**
 * @fileoverview Componente de aviso para configuração S3
 */

import { AlertTriangle, Settings } from 'lucide-react'
import { Alert, AlertDescription } from './alert'
import { Button } from './button'
import Link from 'next/link'

interface S3ConfigWarningProps {
  className?: string
}

export function S3ConfigWarning({ className }: S3ConfigWarningProps) {
  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>
          <strong>S3 não configurado.</strong> Configure as credenciais S3 para habilitar upload de
          arquivos.
        </span>
        <Button asChild size="sm" variant="outline">
          <Link href="/admin/configuracoes/s3">
            <Settings className="h-4 w-4 mr-2" />
            Configurar S3
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
