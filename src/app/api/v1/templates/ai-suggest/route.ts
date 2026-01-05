import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { otherSettings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { eventTrigger, daysOffset, variables, tone } = body as {
      eventTrigger:
        | 'user_registered'
        | 'payment_received'
        | 'payment_due_reminder'
        | 'payment_overdue'
      daysOffset?: number
      variables?: string[]
      tone?: string
    }

    const [settings] = await db
      .select()
      .from(otherSettings)
      .where(eq(otherSettings.companyId, user.companyId))
      .limit(1)
    const apiKey = settings?.openaiApiKey
    if (!apiKey) {
      return NextResponse.json({ error: 'Chave da OpenAI não configurada.' }, { status: 400 })
    }

    const vars =
      variables && variables.length
        ? variables.join(', ')
        : '{nome_usuario}, {data_vencimento}, {link_pagamento}'
    const ptTone = tone || 'respeitoso, claro e objetivo'

    const system = `Você é um assistente que escreve mensagens curtas e eficazes em PT-BR para um sistema de gestão de igrejas. As mensagens devem aceitar variáveis delimitadas por chaves, que serão substituídas pelo sistema (ex.: {nome_usuario}). Evite links se não fornecidos nas variáveis.`

    const userPrompt = `Gere um texto de mensagem para o evento: ${eventTrigger}.
Dias de offset (caso aplicável): ${daysOffset ?? 0}.
Variáveis disponíveis: ${vars}.
Tom desejado: ${ptTone}.
Regras:
- Mensagem curta (2-4 linhas), cordial e direta.
- Se for lembrete (payment_due_reminder): avise sobre vencimento e, se houver {link_pagamento}, incentive a pagar.
- Se for atraso (payment_overdue): seja gentil, encoraje regularização e agradeça.
- Se for recebido (payment_received): agradeça e confirme valor.
- Use somente as variáveis listadas.
- Não adicione variáveis que não estejam na lista.
- Não inclua HTML; texto puro.
Retorne apenas o texto final.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 180,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return NextResponse.json({ error: 'Falha na OpenAI', details: errText }, { status: 500 })
    }

    const data = await response.json()
    const suggestion = data.choices?.[0]?.message?.content?.trim() || ''

    return NextResponse.json({ suggestion })
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
