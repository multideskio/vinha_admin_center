/**
 * @fileoverview Endpoint para testar conexão com a API do Bradesco.
 * Tenta obter um token OAuth2 para validar credenciais e certificado.
 */

import { NextResponse } from 'next/server'
import { validateRequest } from '@/lib/jwt'
import { getBradescoToken, getBradescoConfig } from '@/lib/bradesco'

export async function POST(): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const config = await getBradescoConfig()
    const startTime = Date.now()
    const token = await getBradescoToken()
    const elapsed = Date.now() - startTime

    return NextResponse.json({
      success: true,
      message: 'Conexão com o Bradesco estabelecida com sucesso!',
      details: {
        environment: config.environment,
        tokenObtained: !!token.accessToken,
        tokenPreview: token.accessToken ? `${token.accessToken.substring(0, 20)}...` : null,
        responseTimeMs: elapsed,
        expiresIn: Math.round((token.expiresAt - Date.now()) / 1000),
      },
    })
  } catch (error) {
    console.error('[BRADESCO_TEST_CONNECTION] Falha no teste de conexão:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Falha ao conectar com o Bradesco.',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 502 },
    )
  }
}
