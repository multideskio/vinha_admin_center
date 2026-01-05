/**
 * @fileoverview Hook para verificar configuração S3
 */

import { useState, useEffect } from 'react'

interface S3Config {
  endpoint?: string
  bucket?: string
  region?: string
  accessKeyId?: string
  secretAccessKey?: string
  forcePathStyle?: boolean
}

interface UseS3ConfigReturn {
  isConfigured: boolean
  isLoading: boolean
  config: S3Config | null
  checkConfig: () => Promise<void>
}

export function useS3Config(): UseS3ConfigReturn {
  const [isConfigured, setIsConfigured] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [config, setConfig] = useState<S3Config | null>(null)

  const checkConfig = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/settings/s3')
      if (response.ok) {
        const data = await response.json()
        const s3Config = data.config

        setConfig(s3Config)

        // Verificar se todas as configurações essenciais estão presentes
        const isComplete = !!(
          s3Config?.endpoint &&
          s3Config?.accessKeyId &&
          s3Config?.secretAccessKey
        )

        setIsConfigured(isComplete)
      } else {
        setIsConfigured(false)
        setConfig(null)
      }
    } catch (error) {
      console.error('Error checking S3 config:', error)
      setIsConfigured(false)
      setConfig(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkConfig()
  }, [])

  return {
    isConfigured,
    isLoading,
    config,
    checkConfig,
  }
}
