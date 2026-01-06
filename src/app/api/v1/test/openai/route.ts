import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { otherSettings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'

export async function GET() {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    console.log('[OPENAI_TEST] Testing OpenAI configuration for company:', user.companyId)

    // 1. Verificar se a chave existe no banco
    const [settings] = await db
      .select({ openaiApiKey: otherSettings.openaiApiKey })
      .from(otherSettings)
      .where(eq(otherSettings.companyId, user.companyId))
      .limit(1)

    const apiKey = settings?.openaiApiKey
    console.log('[OPENAI_TEST] API key found:', !!apiKey, 'length:', apiKey?.length || 0)

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Chave OpenAI não configurada no banco de dados',
        details: {
          companyId: user.companyId,
          hasSettings: !!settings,
          hasApiKey: false,
        },
      })
    }

    // 2. Testar a chave com uma chamada simples
    console.log('[OPENAI_TEST] Testing API key with simple call')

    const testRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: 'Responda apenas "OK" se você conseguir me ouvir.',
          },
        ],
        max_tokens: 10,
        temperature: 0,
      }),
    })

    console.log('[OPENAI_TEST] OpenAI response status:', testRes.status)

    if (!testRes.ok) {
      const errorText = await testRes.text()
      console.error('[OPENAI_TEST] OpenAI API error:', errorText)

      return NextResponse.json({
        success: false,
        error: 'Falha na chamada da API OpenAI',
        details: {
          status: testRes.status,
          statusText: testRes.statusText,
          response: errorText,
          hasApiKey: true,
          keyLength: apiKey.length,
          keyPrefix: apiKey.substring(0, 7) + '...',
        },
      })
    }

    const testJson = await testRes.json()
    const response = testJson.choices?.[0]?.message?.content || ''

    console.log('[OPENAI_TEST] OpenAI response:', response)

    return NextResponse.json({
      success: true,
      message: 'Chave OpenAI funcionando corretamente',
      details: {
        companyId: user.companyId,
        hasApiKey: true,
        keyLength: apiKey.length,
        keyPrefix: apiKey.substring(0, 7) + '...',
        testResponse: response,
        model: 'gpt-4o-mini',
      },
    })
  } catch (error) {
    console.error('[OPENAI_TEST] Unexpected error:', error)

    return NextResponse.json({
      success: false,
      error: 'Erro interno no teste',
      details: {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined,
      },
    })
  }
}