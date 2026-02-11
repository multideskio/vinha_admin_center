'use client'

import * as React from 'react'
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

interface DeleteChurchDialogProps {
  churchId: string
  onConfirm: (id: string, reason: string) => void
  children?: React.ReactNode
}

/**
 * Dialog de confirmação de exclusão de igreja
 * Requer motivo obrigatório para auditoria
 */
export function DeleteChurchDialog({ churchId, onConfirm, children }: DeleteChurchDialogProps) {
  const [reason, setReason] = React.useState('')
  const [isOpen, setIsOpen] = React.useState(false)

  const handleConfirm = () => {
    onConfirm(churchId, reason)
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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Igreja</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação é irreversível. Por favor, forneça um motivo para a exclusão desta igreja para
            fins de auditoria.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="deletion-reason">Motivo da Exclusão</Label>
          <Textarea
            id="deletion-reason"
            placeholder="Ex: Duplicidade de cadastro, solicitação do usuário, encerramento das atividades, etc."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!reason.trim()}
            className="bg-destructive hover:bg-destructive/90"
          >
            Excluir permanentemente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
