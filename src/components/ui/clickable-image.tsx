/**
 * @fileoverview Componente de imagem clicável que abre modal
 */

'use client'

import React from 'react'
import Image from 'next/image'
import { ImageModal } from './image-modal'
import { cn } from '@/lib/utils'

interface ClickableImageProps {
  src: string
  alt: string
  className?: string
  enableModal?: boolean
  children?: React.ReactNode
  width?: number
  height?: number
}

export function ClickableImage({ 
  src, 
  alt, 
  className,
  enableModal = true,
  children,
  width = 500,
  height = 300
}: ClickableImageProps) {
  if (!enableModal) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
      />
    )
  }

  if (children) {
    return (
      <ImageModal src={src} alt={alt}>
        {children}
      </ImageModal>
    )
  }

  return (
    <ImageModal src={src} alt={alt}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn('cursor-pointer hover:opacity-80 transition-opacity', className)}
      />
    </ImageModal>
  )
}