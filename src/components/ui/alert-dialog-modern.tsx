/**
 * @fileoverview Modal de alerta moderno para confirmações
 * @version 1.0
 * @date 2025-01-06
 */

'use client'

import * as React from 'react'
import { AlertTriangle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface ModernAlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive' | 'warning'
  onConfirm: () => void | Promise<void>
  isLoading?: boolean
}

export function ModernAlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  onConfirm,
  isLoading = false,
}: ModernAlertDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
  }

  const variantConfig = {
    default: {
      icon: Check,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100 dark:bg-blue-900/20',
      confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    destructive: {
      icon: AlertTriangle,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100 dark:bg-red-900/20',
      confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/20',
      confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    },
  }

  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden [&>button]:hidden">
        {/* Header com ícone */}
        <div className="flex items-center gap-4 p-6 pb-4">
          <div className={cn('p-3 rounded-full', config.iconBg)}>
            <Icon className={cn('h-6 w-6', config.iconColor)} />
          </div>
          <div className="flex-1">
            <DialogTitle className="text-xl font-semibold text-foreground">{title}</DialogTitle>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="px-6 pb-6">
          <DialogDescription className="text-base text-muted-foreground leading-relaxed">
            {description}
          </DialogDescription>
        </div>

        {/* Footer com botões */}
        <DialogFooter className="px-6 py-4 bg-muted/30 border-t">
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className={cn('flex-1 sm:flex-none', config.confirmButton)}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processando...
                </>
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
