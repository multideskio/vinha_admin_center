'use client'

import * as React from 'react'
import { ShieldBan, ShieldCheck, Loader2, AlertTriangle } from 'lucide-react'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { blockUser, unblockUser, checkBlockStatus } from '@/actions/user-blocking'

interface BlockUserButtonProps {
  targetUserId: string
  targetUserName: string
}

/**
 * Botão para bloquear/desbloquear login de um usuário
 * Apenas visível para admins
 */
export function BlockUserButton({ targetUserId, targetUserName }: BlockUserButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = React.useState(true)
  const [isOpen, setIsOpen] = React.useState(false)
  const [reason, setReason] = React.useState('')
  const [isBlocked, setIsBlocked] = React.useState(false)
  const [blockInfo, setBlockInfo] = React.useState<{
    blockedAt?: Date | null
    blockReason?: string | null
  }>({})
  const { toast } = useToast()

  // Verificar status de bloqueio ao montar
  React.useEffect(() => {
    async function fetchBlockStatus() {
      try {
        const status = await checkBlockStatus(targetUserId)
        setIsBlocked(status.isBlocked)
        setBlockInfo({
          blockedAt: status.blockedAt,
          blockReason: status.blockReason,
        })
      } catch (error) {
        console.error('[BLOCK_STATUS_ERROR]', error)
      } finally {
        setIsCheckingStatus(false)
      }
    }

    fetchBlockStatus()
  }, [targetUserId])

  // Bloquear usuário
  const handleBlock = async () => {
    if (reason.length < 5) return

    setIsLoading(true)
    try {
      const result = await blockUser({ targetUserId, reason })

      if (!result.success) {
        throw new Error(result.error || 'Falha ao bloquear usuário')
      }

      setIsBlocked(true)
      setBlockInfo({
        blockedAt: new Date(),
        blockReason: reason,
      })
      setReason('')

      toast({
        title: 'Usuário bloqueado',
        description: `${targetUserName} foi bloqueado com sucesso.`,
        variant: 'destructive',
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: 'Erro ao bloquear',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setIsOpen(false)
    }
  }

  // Desbloquear usuário
  const handleUnblock = async () => {
    setIsLoading(true)
    try {
      const result = await unblockUser({ targetUserId })

      if (!result.success) {
        throw new Error(result.error || 'Falha ao desbloquear usuário')
      }

      setIsBlocked(false)
      setBlockInfo({})

      toast({
        title: 'Usuário desbloqueado',
        description: `${targetUserName} foi desbloqueado com sucesso.`,
        variant: 'success',
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: 'Erro ao desbloquear',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setIsOpen(false)
    }
  }

  // Estado de carregamento inicial
  if (isCheckingStatus) {
    return (
      <Button size="sm" disabled className="opacity-50">
        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        Verificando...
      </Button>
    )
  }

  // Usuário está bloqueado — mostrar Alert com info e botão de desbloquear
  if (isBlocked) {
    const formattedDate = blockInfo.blockedAt
      ? new Date(blockInfo.blockedAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Data não disponível'

    return (
      <div className="space-y-3">
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
          <ShieldBan className="h-4 w-4" />
          <AlertDescription className="space-y-1">
            <p className="font-semibold">Usuário Bloqueado</p>
            {blockInfo.blockReason && (
              <p className="text-sm">
                <span className="font-medium">Motivo:</span> {blockInfo.blockReason}
              </p>
            )}
            <p className="text-sm text-muted-foreground">Bloqueado em: {formattedDate}</p>
          </AlertDescription>
        </Alert>

        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              className="bg-white dark:bg-background border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
            >
              <ShieldCheck className="h-4 w-4 mr-1" />
              Desbloquear Usuário
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="border-2 border-green-600/30">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-green-600">
                <div className="p-2 rounded-lg bg-green-600/15 ring-2 ring-green-600/30">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                </div>
                Confirmar Desbloqueio
              </AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a desbloquear <strong>{targetUserName}</strong>. O usuário poderá
                fazer login novamente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-3 py-4">
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <p className="text-sm font-semibold">O que acontecerá:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>O usuário poderá fazer login normalmente</li>
                  <li>O motivo do bloqueio será removido</li>
                  <li>Esta ação será registrada para auditoria</li>
                </ul>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleUnblock}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Confirmar Desbloqueio
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  // Usuário NÃO está bloqueado — mostrar botão de bloquear
  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) setReason('')
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          className="bg-white dark:bg-background border-2 border-destructive text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
        >
          <ShieldBan className="h-4 w-4 mr-1" />
          Bloquear Usuário
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-2 border-destructive/30">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <div className="p-2 rounded-lg bg-destructive/15 ring-2 ring-destructive/30">
              <ShieldBan className="h-5 w-5 text-destructive" />
            </div>
            Confirmar Bloqueio
          </AlertDialogTitle>
          <AlertDialogDescription>
            Você está prestes a bloquear <strong>{targetUserName}</strong>. O usuário não conseguirá
            fazer login enquanto estiver bloqueado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3 py-4">
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4">
            <p className="text-sm font-semibold text-destructive flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              Atenção
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Esta ação impedirá o usuário de acessar o sistema. Todas as sessões ativas serão
              encerradas.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="block-reason" className="text-sm font-medium">
              Motivo do bloqueio <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="block-reason"
              placeholder="Informe o motivo do bloqueio (mínimo 5 caracteres)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px] resize-none"
              aria-describedby="block-reason-hint"
            />
            <p id="block-reason-hint" className="text-xs text-muted-foreground">
              {reason.length}/5 caracteres mínimos
            </p>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleBlock}
            disabled={isLoading || reason.length < 5}
            className="bg-destructive hover:bg-destructive/90 font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <ShieldBan className="mr-2 h-4 w-4" />
                Confirmar Bloqueio
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
