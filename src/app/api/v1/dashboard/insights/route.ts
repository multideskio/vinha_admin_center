import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { otherSettings, users, transactions } from '@/db/schema'
import { eq, count, sum, and, isNull, gte, lt, desc } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import { startOfMonth, subMonths } from 'date-fns'
import { getCache, setCache } from '@/lib/cache'

export async function GET(request: NextRequest) {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')

    // ✅ Cache de 10 minutos para insights (chamada OpenAI é cara)
    const cacheKey = `insights:${user.companyId}:from:${from || 'null'}:to:${to || 'null'}`
    const cached = await getCache(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const now = new Date()
    const startDate = from ? new Date(from) : startOfMonth(now)
    const endDate = to ? new Date(to) : now
    const startOfCurrentMonth = startOfMonth(now)
    const startOfPreviousMonth = startOfMonth(subMonths(now, 1))

    // Buscar dados básicos para insights
    const [
      totalMembersResult,
      totalTransactionsResult,
      revenueCurrentMonthResult,
      revenuePreviousMonthResult,
      recentTransactionsResult,
    ] = await Promise.all([
      // Total de membros
      db.select({ value: count() }).from(users).where(isNull(users.deletedAt)),

      // Total de transações
      db.select({ value: count() }).from(transactions),

      // Receita mês atual
      db
        .select({ value: sum(transactions.amount) })
        .from(transactions)
        .where(
          and(
            eq(transactions.status, 'approved'),
            gte(transactions.createdAt, startDate),
            lt(transactions.createdAt, endDate),
          ),
        ),

      // Receita mês anterior
      db
        .select({ value: sum(transactions.amount) })
        .from(transactions)
        .where(
          and(
            eq(transactions.status, 'approved'),
            gte(transactions.createdAt, startOfPreviousMonth),
            lt(transactions.createdAt, startOfCurrentMonth),
          ),
        ),

      // Transações recentes
      db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          status: transactions.status,
          createdAt: transactions.createdAt,
        })
        .from(transactions)
        .where(and(gte(transactions.createdAt, startDate), lt(transactions.createdAt, endDate)))
        .orderBy(desc(transactions.createdAt))
        .limit(5),
    ])

    const dashboard = {
      totalMembers: totalMembersResult[0]?.value || 0,
      totalTransactions: totalTransactionsResult[0]?.value || 0,
      revenueCurrentMonth: parseFloat(revenueCurrentMonthResult[0]?.value || '0'),
      revenuePreviousMonth: parseFloat(revenuePreviousMonthResult[0]?.value || '0'),
      recentTransactions: recentTransactionsResult.length,
      dateRange: { from: startDate.toISOString(), to: endDate.toISOString() },
    }

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
    const userPrompt = `Analise os dados do sistema e retorne APENAS um JSON válido (sem markdown) com esta estrutura:
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

Dados do sistema:
- Total de membros: ${dashboard.totalMembers}
- Total de transações: ${dashboard.totalTransactions}
- Receita mês atual: R$ ${dashboard.revenueCurrentMonth.toFixed(2)}
- Receita mês anterior: R$ ${dashboard.revenuePreviousMonth.toFixed(2)}
- Transações recentes: ${dashboard.recentTransactions}
- Período analisado: ${dashboard.dateRange.from} até ${dashboard.dateRange.to}`

    const aiController = new AbortController()
    const aiTimeoutId = setTimeout(() => aiController.abort(), 30_000)
    let aiRes: Response
    try {
      aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
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
        signal: aiController.signal,
      })
      clearTimeout(aiTimeoutId)
    } catch (fetchError) {
      clearTimeout(aiTimeoutId)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('[OPENAI_TIMEOUT] Timeout ao gerar insights do dashboard')
        return NextResponse.json(
          { error: 'Timeout ao comunicar com a API da OpenAI' },
          { status: 504 },
        )
      }
      throw fetchError
    }

    if (!aiRes.ok) {
      const errText = await aiRes.text()
      console.error('Falha na API OpenAI:', aiRes.status, errText)
      return NextResponse.json({ error: 'Falha na OpenAI', details: errText }, { status: 500 })
    }

    const aiJson = await aiRes.json()
    const content = aiJson.choices?.[0]?.message?.content?.trim() || ''

    // Parse JSON response
    let summary = ''
    let cards: Array<{
      type: string
      title: string
      description: string
      metric?: string | null
      text?: string
    }> = []
    try {
      const parsed = JSON.parse(content)
      summary = parsed.summary || ''
      cards = parsed.cards || []
    } catch (parseError) {
      console.error('Erro ao parsear resposta da OpenAI:', parseError)

      // Fallback se OpenAI retornar texto ao invés de JSON
      summary = content.substring(0, 300)
      cards = [
        {
          type: 'info',
          title: 'Análise Gerada',
          description: content.substring(0, 200),
          metric: null,
          text: content,
        },
      ]
    }

    const result = { summary, cards }
    await setCache(cacheKey, result, 600) // 10 minutos
    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro ao gerar insights:', error)
    return NextResponse.json(
      {
        error: 'Erro interno',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    )
  }
}
