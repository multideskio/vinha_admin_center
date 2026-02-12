'use client'

import * as React from 'react'
import { AlertTriangle, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { stopImpersonation } from '@/actions/impersonation'
import { useRouter } from 'next/navigation'

interface ImpersonationBannerProps {
  isImpersonating: boolean
}

/**
 * Banner que aparece no topo da página quando o admin/manager está logado como outro usuário
 */
export function ImpersonationBanner({ isImpersonating }: ImpersonationBannerProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  if (!isImpersonating) {
    return null
  }

  const handleStopImpersonation = async () => {
    setIsLoading(true)
    try {
      const result = await stopImpersonation()

      if (!result.success) {
        throw new Error(result.error || 'Falha ao retornar à conta original')
      }

      toast({
        title: 'Sucesso',
        description: 'Você voltou à sua conta original',
        variant: 'success',
      })

      // Redirecionar baseado no role original
      const redirectMap: Record<string, string> = {
        admin: '/admin/dashboard',
        manager: '/gerente/dashboard',
        supervisor: '/supervisor/dashboard',
        pastor: '/pastor/dashboard',
        igreja: '/igreja/dashboard',
      }

      const redirectPath = redirectMap[result.originalRole || 'admin'] || '/admin/dashboard'
      router.push(redirectPath)
      router.refresh()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Alert className="mb-6 bg-warning/10 border-2 border-warning shadow-lg">
      <AlertTriangle className="h-5 w-5 text-warning" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-warning">Modo Suporte Ativo</span>
          <span className="text-sm text-muted-foreground">
            Você está visualizando a conta de outro usuário
          </span>
        </div>
        <Button
          onClick={handleStopImpersonation}
          disabled={isLoading}
          size="sm"
          variant="outline"
          className="border-warning text-warning hover:bg-warning hover:text-white font-semibold"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isLoading ? 'Saindo...' : 'Voltar à Minha Conta'}
        </Button>
      </AlertDescription>
    </Alert>
  )
}
