import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { otherSettings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  try {
    const url = new URL(request.url)
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')

    // Buscar dados do dashboard reaproveitando a rota existente, preservando a sessão (cookies)
    const dashboardUrl = new URL('/api/v1/dashboard/admin', request.url)
    if (from) dashboardUrl.searchParams.set('from', from)
    if (to) dashboardUrl.searchParams.set('to', to)

    const dashRes = await fetch(dashboardUrl, {
      headers: { cookie: request.headers.get('cookie') || '' },
      cache: 'no-store',
    })
    if (!dashRes.ok) {
      const errText = await dashRes.text()
      return NextResponse.json({ error: 'Falha ao carregar dados do dashboard', details: errText }, { status: 500 })
    }
    const dashboard = await dashRes.json()

    // Chave OpenAI
    const [settings] = await db
      .select({ openaiApiKey: otherSettings.openaiApiKey })
      .from(otherSettings)
      .where(eq(otherSettings.companyId, user.companyId))
      .limit(1)
    const apiKey = settings?.openaiApiKey
    if (!apiKey) {
      return NextResponse.json({ error: 'Chave OpenAI não configurada.' }, { status: 400 })
    }

    const system = 'Você é um analista financeiro e operacional, escreve em PT-BR, claro e conciso.'
    const userPrompt = `Com base no JSON abaixo do dashboard, produza um resumo curto (3-5 linhas) e 3 recomendações acionáveis.
- Destaque variações mês a mês.
- Aponte riscos (inadimplência) e oportunidades (regiões/métodos).
- Seja direto e use bullet points nas recomendações.
JSON:
${JSON.stringify(dashboard)}`

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 400,
      }),
    })
    if (!aiRes.ok) {
      const errText = await aiRes.text()
      return NextResponse.json({ error: 'Falha na OpenAI', details: errText }, { status: 500 })
    }
    const aiJson = await aiRes.json()
    const insight = aiJson.choices?.[0]?.message?.content?.trim() || ''

    return NextResponse.json({ insight })
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
