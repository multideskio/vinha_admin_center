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
    const userPrompt = `Analise o JSON do dashboard e retorne APENAS um JSON válido (sem markdown) com esta estrutura:
{
  "summary": "Resumo geral em 2-3 linhas",
  "cards": [
    {"type": "success|warning|danger|info", "title": "Título", "description": "Descrição curta", "metric": "Métrica opcional", "text": "Texto detalhado opcional"},
    ...
  ]
}

Crie 3-4 cards:
- 1 card com resumo geral (type: info)
- 1-2 cards com oportunidades/destaques positivos (type: success)
- 1-2 cards com alertas/riscos (type: warning ou danger se crítico)
- Adicione "text" com detalhes quando relevante

Dados:
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
        max_tokens: 600,
      }),
    })
    if (!aiRes.ok) {
      const errText = await aiRes.text()
      return NextResponse.json({ error: 'Falha na OpenAI', details: errText }, { status: 500 })
    }
    const aiJson = await aiRes.json()
    const content = aiJson.choices?.[0]?.message?.content?.trim() || ''
    
    // Parse JSON response
    let summary = ''
    let cards
    try {
      const parsed = JSON.parse(content)
      summary = parsed.summary || ''
      cards = parsed.cards || []
    } catch {
      // Fallback se OpenAI retornar texto ao invés de JSON
      summary = content.substring(0, 300)
      cards = [{
        type: 'info',
        title: 'Análise Gerada',
        description: content.substring(0, 200),
        metric: null,
        text: content
      }]
    }

    return NextResponse.json({ summary, cards })
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
