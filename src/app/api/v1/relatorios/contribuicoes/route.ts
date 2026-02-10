/**
 * @fileoverview API de relatório de contribuições (rota fina)
 * @description Valida JWT, aplica rate limit, valida input com Zod,
 * delega ao serviço e registra audit log. Toda lógica de negócio
 * está em @/lib/report-services/contributions-report.ts
 *
 * Segurança: ✅ JWT + role admin, ✅ Rate limiting, ✅ Validação Zod
 * Auditoria: ✅ Audit log assíncrono
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validateRequest } from '@/lib/jwt'
import { rateLimit } from '@/lib/rate-limit'
import { logUserAction } from '@/lib/action-logger'
import { contributionsReportSchema } from '@/lib/schemas/report-schemas'
import { generateContributionsReport } from '@/lib/report-services/contributions-report'
import type { UserRole } from '@/lib/types'

export async function GET(request: NextRequest) {
  // 1. Autenticação
  const { user } = await validateRequest()
  if (!user || (user.role as UserRole) !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  // 2. Rate limiting
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const rl = await rateLimit('relatorio-contribuicoes', ip, 30, 60)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    )
  }

  try {
    // 3. Validação Zod dos parâmetros de query
    const params = Object.fromEntries(new URL(request.url).searchParams)
    const validated = contributionsReportSchema.parse(params)

    // 4. Delegar ao serviço
    const result = await generateContributionsReport(user.companyId, validated)

    // 5. Audit log assíncrono (fire-and-forget)
    logUserAction(
      user.id,
      'generate_report',
      'report',
      'contribuicoes',
      JSON.stringify(validated),
    ).catch((err) => console.error('[AUDIT_LOG_ERROR]', err))

    return NextResponse.json(result)
  } catch (error) {
    // Erros de validação Zod → 400
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Parâmetros inválidos',
          detalhes: error.errors.map((e) => e.message),
        },
        { status: 400 },
      )
    }

    // Erros internos → 500
    console.error('[RELATORIO_CONTRIBUICOES_ERROR]', error)
    return NextResponse.json(
      { error: 'Erro ao gerar relatório de contribuições. Tente novamente.' },
      { status: 500 },
    )
  }
}
