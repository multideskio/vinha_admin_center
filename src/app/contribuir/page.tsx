/**
 * Página pública de contribuição via link de pagamento
 * Valida o token da URL, autentica o usuário e redireciona
 * para a página de contribuição correta baseada no role.
 */

'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

interface ValidateResponse {
  success?: boolean
  error?: string
  user?: { name: string; role: string }
  redirectUrl?: string
}

function ContribuirContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-token'>('loading')
  const [message, setMessage] = useState('')
  const [userName, setUserName] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('no-token')
      return
    }

    const validateToken = async () => {
      try {
        const response = await fetch('/api/v1/payment-link/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        const data: ValidateResponse = await response.json()

        if (!response.ok || !data.success) {
          setStatus('error')
          setMessage(data.error || 'Token inválido ou expirado')
          return
        }

        setStatus('success')
        setUserName(data.user?.name || '')
        setMessage('Autenticação realizada com sucesso! Redirecionando...')

        // Redirecionar após breve delay para o usuário ver a confirmação
        setTimeout(() => {
          router.push(data.redirectUrl || '/auth/login')
        }, 1500)
      } catch (error) {
        console.error('[CONTRIBUIR] Erro ao validar token:', error)
        setStatus('error')
        setMessage('Erro ao processar o link. Tente novamente.')
      }
    }

    validateToken()
  }, [token, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Link de Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
              <p className="text-muted-foreground">Validando seu link de pagamento...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              {userName && <p className="text-lg font-medium">Olá, {userName}!</p>}
              <p className="text-muted-foreground text-center">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="h-10 w-10 text-red-500" />
              <p className="text-red-600 dark:text-red-400 text-center">{message}</p>
              <p className="text-sm text-muted-foreground text-center">
                O link pode ter expirado. Solicite um novo lembrete ou faça login normalmente.
              </p>
              <Button onClick={() => router.push('/auth/login')} className="mt-2">
                Ir para o Login
              </Button>
            </>
          )}

          {status === 'no-token' && (
            <>
              <AlertCircle className="h-10 w-10 text-yellow-500" />
              <p className="text-muted-foreground text-center">
                Nenhum token de pagamento encontrado na URL.
              </p>
              <p className="text-sm text-muted-foreground text-center">
                Acesse o link enviado por email ou WhatsApp, ou faça login normalmente.
              </p>
              <Button onClick={() => router.push('/auth/login')} className="mt-2">
                Ir para o Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ContribuirPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        </div>
      }
    >
      <ContribuirContent />
    </Suspense>
  )
}
