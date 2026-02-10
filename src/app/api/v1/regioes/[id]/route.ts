import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { regions, supervisorProfiles, users } from '@/db/schema'
import { eq, and, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import { validateRequest } from '@/lib/jwt'
import { getErrorMessage } from '@/lib/error-types'
import { invalidateCache } from '@/lib/cache'
import { env } from '@/lib/env'

const regionSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  color: z
    .string()
    .min(7, { message: 'A cor deve estar no formato hexadecimal.' })
    .regex(/^#[0-9a-fA-F]{6}$/, {
      message: 'Cor inválida. Use o formato #RRGGBB.',
    }),
})

const VALIDATED_COMPANY_ID = env.COMPANY_INIT

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const params = await props.params
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Acesso negado. Apenas administradores podem alterar regiões.' },
      { status: 403 },
    )
  }

  const { id } = params

  try {
    const body = await request.json()
    const validatedData = regionSchema.parse(body)

    // Validação de unicidade de nome (excluindo a região atual)
    const existingRegion = await db
      .select()
      .from(regions)
      .where(and(eq(regions.name, validatedData.name), isNull(regions.deletedAt)))

    if (existingRegion.length > 0 && existingRegion[0]?.id !== id) {
      return NextResponse.json({ error: 'Já existe uma região com este nome.' }, { status: 409 })
    }

    const updatedRegion = await db
      .update(regions)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(regions.id, id))
      .returning()

    if (updatedRegion.length === 0) {
      return NextResponse.json({ error: 'Região não encontrada.' }, { status: 404 })
    }

    // Invalidar cache de regiões após atualização
    await invalidateCache(`regioes:${VALIDATED_COMPANY_ID}:*`)

    return NextResponse.json({ success: true, region: updatedRegion[0] })
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: error.errors },
        { status: 400 },
      )
    }
    console.error('Erro ao atualizar região:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar região', details: errorMessage },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const params = await props.params
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Acesso negado. Apenas administradores podem excluir regiões.' },
      { status: 403 },
    )
  }

  const { id } = params

  try {
    // Verificar dependências antes de deletar
    const supervisorsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(supervisorProfiles)
      .leftJoin(users, eq(supervisorProfiles.userId, users.id))
      .where(and(eq(supervisorProfiles.regionId, id), isNull(users.deletedAt)))

    if (supervisorsCount[0]?.count && supervisorsCount[0].count > 0) {
      return NextResponse.json(
        {
          error: `Não é possível excluir esta região. Existem ${supervisorsCount[0].count} supervisor(es) vinculado(s) a ela.`,
          details: `Remova ou transfira os supervisores antes de excluir a região.`,
        },
        { status: 409 },
      )
    }

    const deletedRegion = await db
      .update(regions)
      .set({
        deletedAt: new Date(),
        deletedBy: user.id,
      })
      .where(eq(regions.id, id))
      .returning()

    if (deletedRegion.length === 0) {
      return NextResponse.json({ error: 'Região não encontrada.' }, { status: 404 })
    }

    // Invalidar cache de regiões após exclusão
    await invalidateCache(`regioes:${VALIDATED_COMPANY_ID}:*`)

    return NextResponse.json({ success: true, message: 'Região excluída com sucesso.' })
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error)
    console.error('Erro ao excluir região:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir região', details: errorMessage },
      { status: 500 },
    )
  }
}
