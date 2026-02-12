'use client'

import * as React from 'react'
import { UserCog, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { impersonateUser } from '@/actions/impersonation'
import { useRouter } from 'next/navigation'

interface ImpersonateButtonProps {
  targetUserId: string
  targetUserName: string
  targetUserRole: string
  currentUserRole: 'admin' | 'manager'
}

/**
 * Botão para iniciar impersonation de um usuário
 * Apenas visível para admins e managers
 */
export function ImpersonateButton({
  targetUserId,
  targetUserName,
  targetUserRole,
  currentUserRole,
}: ImpersonateButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Apenas admin e manager podem impersonar
  if (currentUserRole !== 'admin' && currentUserRole !== 'manager') {
    return null
  }

  const handleImpersonate = async () => {
    setIsLoading(true)
    try {
      const result = await impersonateUser({ targetUserId })

      if (!result.success) {
        throw new Error(result.error || 'Falha ao fazer login como usuário')
      }

      toast({
        title: 'Sucesso',
        description: `Você está agora logado como ${targetUserName}`,
        variant: 'success',
      })

      // Redirecionar para o dashboard do usuário alvo
      const redirectMap: Record<string, string> = {
        admin: '/admin/dashboard',
        manager: '/manager/dashboard',
        supervisor: '/supervisor/dashboard',
        pastor: '/pastor/dashboard',
        igreja: '/igreja/dashboard',
        church_account: '/igreja/dashboard',
      }

      const redirectPath = redirectMap[result.targetRole || targetUserRole] || '/admin/dashboard'
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
      setIsOpen(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          className="bg-white dark:bg-background border-2 border-warning text-warning hover:bg-warning hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
        >
          <UserCog className="h-4 w-4 mr-1" />
          Logar como Usuário
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-2 border-warning/30">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-warning">
            <div className="p-2 rounded-lg bg-warning/15 ring-2 ring-warning/30">
              <UserCog className="h-5 w-5 text-warning" />
            </div>
            Confirmar Login como Usuário
          </AlertDialogTitle>
          <AlertDialogDescription>
            Você está prestes a fazer login como <strong>{targetUserName}</strong> para fornecer
            suporte. Esta ação será registrada para auditoria.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3 py-4">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm font-semibold">O que acontecerá:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Você verá a interface como se fosse o usuário</li>
              <li>Poderá realizar ações em nome do usuário</li>
              <li>Um banner indicará que você está em modo suporte</li>
              <li>Você poderá voltar à sua conta a qualquer momento</li>
            </ul>
          </div>
          <div className="rounded-lg bg-warning/10 border border-warning/30 p-4">
            <p className="text-sm font-semibold text-warning">⚠️ Importante:</p>
            <p className="text-sm text-muted-foreground mt-1">
              Use esta funcionalidade apenas para suporte legítimo. Todas as ações serão
              registradas.
            </p>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleImpersonate}
            disabled={isLoading}
            className="bg-warning hover:bg-warning/90 font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <UserCog className="mr-2 h-4 w-4" />
                Confirmar Login
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
