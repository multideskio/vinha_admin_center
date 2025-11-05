import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { emailBlacklist } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'

const COMPANY_ID = process.env.COMPANY_INIT || ''

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('active')

    let query = db
      .select()
      .from(emailBlacklist)
      .where(eq(emailBlacklist.companyId, COMPANY_ID))
      .$dynamic()

    if (isActive !== null) {
      query = query.where(
        and(
          eq(emailBlacklist.companyId, COMPANY_ID),
          eq(emailBlacklist.isActive, isActive === 'true')
        )
      )
    }

    const blacklist = await query.orderBy(desc(emailBlacklist.lastAttemptAt))

    return NextResponse.json({ blacklist })
  } catch (error) {
    console.error('Erro ao buscar blacklist:', error)
    return NextResponse.json({ error: 'Erro ao buscar blacklist' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    await db
      .update(emailBlacklist)
      .set({ isActive: false })
      .where(
        and(
          eq(emailBlacklist.companyId, COMPANY_ID),
          eq(emailBlacklist.email, email)
        )
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao remover da blacklist:', error)
    return NextResponse.json({ error: 'Erro ao remover da blacklist' }, { status: 500 })
  }
}
