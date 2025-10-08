/**
 * @fileoverview Avatar clicável que abre modal com imagem maior
 */

import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { ImageModal } from './image-modal'
import { cn } from '@/lib/utils'

interface ClickableAvatarProps {
  src?: string
  alt?: string
  fallback?: string
  className?: string
  enableModal?: boolean
}

export function ClickableAvatar({ 
  src, 
  alt = 'Avatar', 
  fallback = 'U', 
  className,
  enableModal = true 
}: ClickableAvatarProps) {
  if (!src || !enableModal) {
    return (
      <Avatar className={className}>
        <AvatarImage src={src} alt={alt} />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
    )
  }

  return (
    <ImageModal src={src} alt={alt}>
      <Avatar className={cn('hover:opacity-80 transition-opacity', className)}>
        <AvatarImage src={src} alt={alt} />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
    </ImageModal>
  )
}