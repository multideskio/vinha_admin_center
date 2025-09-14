import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { regions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { validateRequest } from '@/lib/auth'
import { getErrorMessage } from '@/lib/error-types'

const regionSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  color: z
    .string()
    .min(7, { message: 'A cor deve estar no formato hexadecimal.' })
    .regex(/^#[0-9a-fA-F]{6}$/, {
      message: 'Cor inválida. Use o formato #RRGGBB.',
    }),
})

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = params

  try {
    const body = await request.json()
    const validatedData = regionSchema.parse(body)

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
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = params

  try {
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
