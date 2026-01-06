import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { otherSettings, users, transactions } from '@/db/schema'
import { eq, count, sum, and, isNull, gte, lt, desc } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import { startOfMonth, subMonths } from 'date-fns'

export async function GET(request: NextRequest) {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  console.log(
    '[INSIGHTS_DEBUG] Starting insights generation for user:',
    user.id,
    'company:',
    user.companyId,
  )

  try {
    const url = new URL(request.url)
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')

    console.log('[INSIGHTS_DEBUG] Date range:', { from, to })

    // Em vez de fazer fetch interno, vamos buscar os dados diretamente do banco
    const now = new Date()
    const startDate = from ? new Date(from) : startOfMonth(now)
    const endDate = to ? new Date(to) : now
    const startOfCurrentMonth = startOfMonth(now)
    const startOfPreviousMonth = startOfMonth(subMonths(now, 1))

    console.log('[INSIGHTS_DEBUG] Fetching dashboard data directly from database')

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

    console.log('[INSIGHTS_DEBUG] Dashboard data loaded successfully:', dashboard)

    // Chave OpenAI
    console.log('[INSIGHTS_DEBUG] Fetching OpenAI settings for company:', user.companyId)

    const [settings] = await db
      .select({ openaiApiKey: otherSettings.openaiApiKey })
      .from(otherSettings)
      .where(eq(otherSettings.companyId, user.companyId))
      .limit(1)

    const apiKey = settings?.openaiApiKey
    console.log('[INSIGHTS_DEBUG] OpenAI key found:', !!apiKey, 'length:', apiKey?.length || 0)

    if (!apiKey) {
      console.error('[INSIGHTS_DEBUG] No OpenAI API key configured for company:', user.companyId)
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

    console.log('[INSIGHTS_DEBUG] Calling OpenAI API with model: gpt-4o-mini')

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

    console.log('[INSIGHTS_DEBUG] OpenAI response status:', aiRes.status)

    if (!aiRes.ok) {
      const errText = await aiRes.text()
      console.error('[INSIGHTS_DEBUG] OpenAI API failed:', aiRes.status, errText)
      return NextResponse.json({ error: 'Falha na OpenAI', details: errText }, { status: 500 })
    }

    const aiJson = await aiRes.json()
    const content = aiJson.choices?.[0]?.message?.content?.trim() || ''

    console.log('[INSIGHTS_DEBUG] OpenAI response content length:', content.length)
    console.log('[INSIGHTS_DEBUG] OpenAI response preview:', content.substring(0, 200))

    // Parse JSON response
    let summary = ''
    let cards
    try {
      const parsed = JSON.parse(content)
      summary = parsed.summary || ''
      cards = parsed.cards || []
      console.log('[INSIGHTS_DEBUG] Successfully parsed JSON response, cards count:', cards.length)
    } catch (parseError) {
      console.error('[INSIGHTS_DEBUG] Failed to parse OpenAI JSON response:', parseError)
      console.log('[INSIGHTS_DEBUG] Raw content:', content)

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

    console.log('[INSIGHTS_DEBUG] Returning insights successfully')
    return NextResponse.json({ summary, cards })
  } catch (error) {
    console.error('[INSIGHTS_DEBUG] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Erro interno',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    )
  }
}
