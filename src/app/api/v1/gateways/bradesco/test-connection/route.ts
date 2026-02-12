/**
 * @fileoverview Endpoint para testar conexão com a API do Bradesco.
 * Tenta obter um token OAuth2 para validar credenciais e certificado.
 */

import { NextResponse } from 'next/server'
import { validateRequest } from '@/lib/jwt'
import {
  getBradescoToken,
  getBradescoPixConfig,
  getBradescoCobrancaToken,
  getBradescoBoletoConfig,
} from '@/lib/bradesco'

export async function POST(): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    // Testar conexão PIX
    const pixConfig = await getBradescoPixConfig()
    const pixStartTime = Date.now()
    const pixToken = await getBradescoToken()
    const pixElapsed = Date.now() - pixStartTime

    // Testar conexão Boleto
    await getBradescoBoletoConfig()
    const boletoStartTime = Date.now()
    const boletoToken = await getBradescoCobrancaToken()
    const boletoElapsed = Date.now() - boletoStartTime

    return NextResponse.json({
      success: true,
      message: 'Conexão com o Bradesco estabelecida com sucesso!',
      details: {
        environment: pixConfig.environment,
        pix: {
          tokenObtained: !!pixToken.accessToken,
          tokenPreview: pixToken.accessToken ? `${pixToken.accessToken.substring(0, 20)}...` : null,
          responseTimeMs: pixElapsed,
          expiresIn: Math.round((pixToken.expiresAt - Date.now()) / 1000),
        },
        boleto: {
          tokenObtained: !!boletoToken.accessToken,
          tokenPreview: boletoToken.accessToken
            ? `${boletoToken.accessToken.substring(0, 20)}...`
            : null,
          responseTimeMs: boletoElapsed,
          expiresIn: Math.round((boletoToken.expiresAt - Date.now()) / 1000),
        },
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
