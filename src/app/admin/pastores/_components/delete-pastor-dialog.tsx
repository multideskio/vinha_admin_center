'use client'

import * as React from 'react'
import { AlertTriangle } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface DeletePastorDialogProps {
  pastorId: string
  onConfirm: (id: string, reason: string) => void
  children?: React.ReactNode
}

/**
 * Dialog de confirmação de exclusão de pastor
 * Requer motivo obrigatório para auditoria
 */
export function DeletePastorDialog({ pastorId, onConfirm, children }: DeletePastorDialogProps) {
  const [reason, setReason] = React.useState('')
  const [isOpen, setIsOpen] = React.useState(false)

  const handleConfirm = () => {
    onConfirm(pastorId, reason)
    setIsOpen(false)
    setReason('')
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild={!!children}>
        {children || (
          <span className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-red-600">
            Excluir
          </span>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="border-2 border-destructive/30">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <div className="p-2 rounded-lg bg-destructive/15 ring-2 ring-destructive/30">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            Confirmar Exclusão do Pastor
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação é irreversível e será registrada para auditoria. Por favor, forneça um motivo
            detalhado para a exclusão deste pastor.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3">
          <Label htmlFor="deletion-reason" className="font-semibold">
            Motivo da Exclusão *
          </Label>
          <Textarea
            id="deletion-reason"
            placeholder="Ex: Duplicidade de cadastro, solicitação do usuário, desligamento da organização, etc."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px] border-destructive/30 focus:border-destructive"
          />
          <p className="text-xs text-muted-foreground">
            Este motivo será armazenado permanentemente no sistema.
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!reason.trim()}
            className="bg-destructive hover:bg-destructive/90 font-semibold"
          >
            Confirmar Exclusão
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
