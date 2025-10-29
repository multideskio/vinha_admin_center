/**
 * @fileoverview Componente de upload de avatar
 */

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Camera } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ClickableImage } from '@/components/ui/clickable-image'
import { S3ConfigWarning } from '@/components/ui/s3-config-warning'
import { useS3Config } from '@/hooks/use-s3-config'
import { useUpload } from '@/hooks/use-upload'

interface AvatarUploadProps {
  currentAvatarUrl?: string
  fallback?: string
  onUploadComplete?: (url: string) => void
  userId?: string
  folder?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
}

export function AvatarUpload({
  currentAvatarUrl,
  onUploadComplete,
  folder = 'avatars',
  size = 'md',
}: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const { upload, isUploading } = useUpload()
  const { toast } = useToast()
  const { isConfigured, isLoading: configLoading } = useS3Config()

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!isConfigured) {
      toast({
        title: 'S3 não configurado',
        description: 'Configure as credenciais S3 antes de fazer upload.',
        variant: 'destructive',
      })
      return
    }

    try {
      const result = await upload(file, folder)

      if (result.success && result.url) {
        setPreviewUrl(result.url)
        onUploadComplete?.(result.url)
        
        toast({
          title: 'Sucesso',
          description: 'Avatar atualizado com sucesso!',
          variant: 'success',
        })
      } else {
        throw new Error(result.error || 'Falha no upload')
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao fazer upload da imagem.',
        variant: 'destructive',
      })
    }
  }

  if (!configLoading && !isConfigured) {
    return (
      <div className="space-y-4">
        <div className="relative opacity-50">
          <ClickableImage
            src={previewUrl || currentAvatarUrl || 'https://placehold.co/96x96.png'}
            alt="Avatar"
            className={`${sizeClasses[size]} rounded-full object-cover`}
            width={size === 'sm' ? 64 : size === 'md' ? 96 : 128}
            height={size === 'sm' ? 64 : size === 'md' ? 96 : 128}
          />
          
          <div className="absolute bottom-0 right-0">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-background border border-border">
              <Camera className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
        <S3ConfigWarning />
      </div>
    )
  }

  const displayUrl = previewUrl || currentAvatarUrl || 'https://placehold.co/96x96.png'

  return (
    <div className="relative">
      <ClickableImage
        src={displayUrl}
        alt="Avatar"
        className={`${sizeClasses[size]} rounded-full object-cover`}
        width={size === 'sm' ? 64 : size === 'md' ? 96 : 128}
        height={size === 'sm' ? 64 : size === 'md' ? 96 : 128}
      />
      
      <Label 
        htmlFor="avatar-upload" 
        className="absolute bottom-0 right-0 cursor-pointer"
      >
        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-background border border-border hover:bg-muted">
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <span className="sr-only">Trocar foto</span>
      </Label>
      
      <Input
        id="avatar-upload"
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading || !isConfigured}
      />
    </div>
  )
}