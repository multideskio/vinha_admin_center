/**
 * @fileoverview Hook centralizado para carregamento de dados de layout
 * @version 2.0 - Refatorado para usar API routes
 * @date 2025-01-28
 * @author Sistema de Padronização
 */

import { useState, useEffect } from 'react'

export interface LayoutData {
  user: {
    id: string
    email: string
    role: string
    avatarUrl?: string | null
  }
  profile: {
    firstName?: string | null
    lastName?: string | null
  }
  company: {
    name?: string | null
    logoUrl?: string | null
  }
  displayName: string
  userFallback: string
}

interface UseLayoutDataReturn {
  data: LayoutData | null
  loading: boolean
  error: Error | null
}

/**
 * Hook para carregar dados necessários para layouts padronizados
 * Usa API routes para evitar importação de DB no cliente
 */
export function useLayoutData(userId: string, role: string): UseLayoutDataReturn {
  const [data, setData] = useState<LayoutData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function loadLayoutData() {
      try {
        setLoading(true)
        setError(null)

        // Chama API route para carregar dados
        const response = await fetch(`/api/v1/layout-data?userId=${userId}&role=${role}`)
        
        if (!response.ok) {
          throw new Error('Falha ao carregar dados do layout')
        }

        const layoutData: LayoutData = await response.json()
        setData(layoutData)
      } catch (err) {
        console.error('Erro ao carregar dados do layout:', err)
        setError(err instanceof Error ? err : new Error('Erro desconhecido'))
      } finally {
        setLoading(false)
      }
    }

    if (userId && role) {
      loadLayoutData()
    }
  }, [userId, role])

  return { data, loading, error }
}

