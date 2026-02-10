/**
 * @fileoverview API de relatório geral (rota fina)
 * @description Valida JWT, aplica rate limit, valida input com Zod,
 * delega ao serviço e registra audit log. Toda lógica de negócio
 * está em @/lib/report-services/general-report.ts
 *
 * Segurança: ✅ JWT + role admin, ✅ Rate limiting, ✅ Validação Zod
 * Auditoria: ✅ Audit log assíncrono
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { validateRequest } from '@/lib/jwt'
import { rateLimit } from '@/lib/rate-limit'
import { logUserAction } from '@/lib/action-logger'
import { generalReportSchema } from '@/lib/schemas/report-schemas'
import { generateGeneralReport } from '@/lib/report-services/general-report'
import type { UserRole } from '@/lib/types'

export async function POST(request: Request) {
  // 1. Autenticação
  const { user } = await validateRequest()
  if (!user || (user.role as UserRole) !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  // 2. Rate limiting
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const rl = await rateLimit('relatorio-geral', ip, 30, 60)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    )
  }

  try {
    // 3. Parse do body e validação Zod
    let body: unknown
    try {
      body = await request.json()
    } catch (error) {
      console.warn('[RELATORIOS_JSON_PARSE] Corpo da requisição não é JSON válido')
      return NextResponse.json(
        { error: 'Corpo da requisição deve ser um JSON válido.' },
        { status: 400 },
      )
    }

    const validated = generalReportSchema.parse(body)

    // 4. Delegar ao serviço
    const result = await generateGeneralReport(user.companyId, validated)

    // 5. Audit log assíncrono (fire-and-forget)
    logUserAction(
      user.id,
      'generate_report',
      'report',
      validated.reportType,
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
    console.error('[RELATORIO_GERAL_ERROR]', error)
    return NextResponse.json(
      { error: 'Erro ao gerar relatório. Tente novamente.' },
      { status: 500 },
    )
  }
}
