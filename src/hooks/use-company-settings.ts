/**
 * @fileoverview Hook para gerenciar configurações da empresa
 * @date 2026-01-05
 */

import { useState, useEffect } from 'react'
import type { CompanySettings } from '@/lib/company'

interface UseCompanySettingsReturn {
  settings: CompanySettings | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Hook para carregar e gerenciar configurações da empresa
 */
export function useCompanySettings(): UseCompanySettingsReturn {
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      // Usar API pública que não requer autenticação
      const response = await fetch('/api/v1/company/public')
      if (!response.ok) {
        throw new Error('Falha ao carregar configurações da empresa')
      }

      const data = await response.json()
      setSettings(data.company)
    } catch (err) {
      console.error('Erro ao carregar configurações da empresa:', err)
      setError(err instanceof Error ? err : new Error('Erro desconhecido'))

      // Em caso de erro, usar configurações padrão
      setSettings({
        id: 'default',
        name: 'Vinha Admin Center',
        logoUrl: null,
        maintenanceMode: false,
        createdAt: new Date(),
        updatedAt: null,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings,
  }
}
