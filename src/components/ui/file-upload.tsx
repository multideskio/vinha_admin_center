/**
 * @fileoverview Componente de upload de arquivos
 */

import { useState, useRef } from 'react'
import { Button } from './button'
import { Progress } from './progress'
import { useUpload } from '@/hooks/use-upload'
import { useS3Config } from '@/hooks/use-s3-config'
import { S3ConfigWarning } from './s3-config-warning'
import { Upload, X, File, Image } from 'lucide-react'
import { ImageModal } from './image-modal'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onUpload?: (result: { url: string; key: string; filename: string }) => void
  onError?: (error: string) => void
  folder?: string
  accept?: string
  maxSize?: number // em MB
  className?: string
  multiple?: boolean
}

export function FileUpload({
  onUpload,
  onError,
  folder = 'uploads',
  accept = '*/*',
  maxSize = 10,
  className,
  multiple = false,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const { upload, isUploading, progress } = useUpload()
  const { isConfigured, isLoading: configLoading } = useS3Config()

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return

    const newFiles = Array.from(fileList)
    
    // Validar tamanho
    const oversizedFiles = newFiles.filter(file => file.size > maxSize * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      onError?.(`Arquivo(s) muito grande(s). Máximo: ${maxSize}MB`)
      return
    }

    if (multiple) {
      setFiles(prev => [...prev, ...newFiles])
    } else {
      setFiles(newFiles.slice(0, 1))
    }
  }

  const handleUpload = async (file: File) => {
    try {
      const result = await upload(file, folder)
      
      if (result.success && result.url && result.key && result.filename) {
        onUpload?.({
          url: result.url,
          key: result.key,
          filename: result.filename,
        })
        
        // Remover arquivo da lista após upload
        setFiles(prev => prev.filter(f => f !== file))
      } else {
        onError?.(result.error || 'Upload failed')
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Upload failed')
    }
  }

  const removeFile = (file: File) => {
    setFiles(prev => prev.filter(f => f !== file))
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const isImage = (file: File) => file.type.startsWith('image/')

  if (!configLoading && !isConfigured) {
    return (
      <div className={cn('space-y-4', className)}>
        <S3ConfigWarning />
        <div className="opacity-50 pointer-events-none">
          <div className="border-2 border-dashed rounded-lg p-6 text-center border-gray-300">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              Upload desabilitado - Configure S3 primeiro
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          dragActive ? 'border-primary bg-primary/5' : 'border-gray-300',
          'hover:border-primary hover:bg-primary/5'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-sm text-gray-600 mb-2">
          Clique para selecionar ou arraste arquivos aqui
        </p>
        <p className="text-xs text-gray-400">
          Máximo: {maxSize}MB por arquivo
        </p>
        
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 p-3 border rounded-lg"
            >
              {isImage(file) ? (
                <ImageModal src={URL.createObjectURL(file)} alt={file.name}>
                  <Image className="h-8 w-8 text-blue-500 cursor-pointer hover:opacity-80" />
                </ImageModal>
              ) : (
                <File className="h-8 w-8 text-gray-500" />
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleUpload(file)}
                  disabled={isUploading}
                >
                  Upload
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFile(file)}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Enviando...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}
    </div>
  )
}