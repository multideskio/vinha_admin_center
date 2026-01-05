/**
 * @fileoverview Modal para exibir imagens em tamanho maior
 */
'use client'

import React from 'react'
import Image from 'next/image'
import { useState } from 'react'
import { X } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from './dialog'
import { Button } from './button'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

interface ImageModalProps {
  src: string
  alt: string
  children: React.ReactNode
  className?: string
}

export function ImageModal({ src, alt, children, className }: ImageModalProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className={`cursor-pointer ${className}`}>{children}</div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-full p-0 bg-transparent border-none shadow-none">
        <VisuallyHidden>
          <DialogTitle>{alt}</DialogTitle>
        </VisuallyHidden>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          <Image
            src={src}
            alt={alt}
            width={800}
            height={600}
            className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
