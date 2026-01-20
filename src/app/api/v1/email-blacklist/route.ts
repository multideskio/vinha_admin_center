import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { emailBlacklist } from '@/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import { z } from 'zod'
import { env } from '@/lib/env'

const COMPANY_ID = env.COMPANY_INIT
const companyId: string = COMPANY_ID

const blacklistAddSchema = z.object({
  email: z.string().email('Email inválido'),
  reason: z.enum(['bounce', 'complaint', 'manual']).optional(),
  errorMessage: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    // Validar autenticação
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('active')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = db
      .select()
      .from(emailBlacklist)
      .where(eq(emailBlacklist.companyId, companyId))
      .$dynamic()

    if (isActive !== null) {
      query = query.where(
        and(
          eq(emailBlacklist.companyId, companyId),
          eq(emailBlacklist.isActive, isActive === 'true'),
        ),
      )
    }

    const blacklist = await query
      .orderBy(desc(emailBlacklist.lastAttemptAt))
      .limit(limit)
      .offset(offset)

    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(emailBlacklist)
      .where(
        isActive !== null
          ? and(
              eq(emailBlacklist.companyId, companyId),
              eq(emailBlacklist.isActive, isActive === 'true'),
            )
          : eq(emailBlacklist.companyId, companyId),
      )

    return NextResponse.json({ blacklist, total: countResult[0]?.count || 0 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro ao buscar blacklist:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: 'Erro ao buscar blacklist', details: errorMessage },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validar autenticação
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()

    // Validar com Zod
    const validationResult = blacklistAddSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.errors },
        { status: 400 },
      )
    }

    const { email, reason, errorMessage } = validationResult.data

    const existing = await db
      .select()
      .from(emailBlacklist)
      .where(
        and(eq(emailBlacklist.companyId, companyId), eq(emailBlacklist.email, email.toLowerCase())),
      )
      .limit(1)

    if (existing.length > 0 && existing[0]) {
      await db
        .update(emailBlacklist)
        .set({
          isActive: true,
          lastAttemptAt: new Date(),
          attemptCount: existing[0].attemptCount + 1,
          reason: reason || existing[0].reason,
          errorMessage: errorMessage || existing[0].errorMessage,
        })
        .where(eq(emailBlacklist.id, existing[0].id))
    } else {
      await db.insert(emailBlacklist).values({
        companyId: companyId,
        email: email.toLowerCase(),
        reason: reason || 'manual',
        errorMessage: errorMessage || 'Adicionado manualmente',
        firstFailedAt: new Date(),
        lastAttemptAt: new Date(),
        attemptCount: 1,
        isActive: true,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro ao adicionar à blacklist:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: 'Erro ao adicionar à blacklist', details: errorMessage },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Validar autenticação
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    await db
      .update(emailBlacklist)
      .set({ isActive: false })
      .where(and(eq(emailBlacklist.companyId, companyId), eq(emailBlacklist.email, email)))

    return NextResponse.json({ success: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro ao remover da blacklist:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: 'Erro ao remover da blacklist', details: errorMessage },
      { status: 500 },
    )
  }
}
