/**
 * @fileoverview Hook para upload de arquivos
 */

import { useState } from 'react'

interface UploadResult {
  success: boolean
  url?: string
  key?: string
  filename?: string
  size?: number
  type?: string
  error?: string
}

interface UseUploadReturn {
  upload: (file: File, folder?: string) => Promise<UploadResult>
  deleteFile: (key: string) => Promise<boolean>
  isUploading: boolean
  progress: number
}

export function useUpload(): UseUploadReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const upload = async (file: File, folder: string = 'uploads'): Promise<UploadResult> => {
    setIsUploading(true)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)
      formData.append('filename', file.name)

      const response = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      setProgress(100)
      return result
    } catch (error) {
      console.error('Upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }
    } finally {
      setIsUploading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  const deleteFile = async (key: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/v1/upload?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      })

      const result = await response.json()
      return result.success || false
    } catch (error) {
      console.error('Delete error:', error)
      return false
    }
  }

  return {
    upload,
    deleteFile,
    isUploading,
    progress,
  }
}
