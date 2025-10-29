import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { managerProfiles } from '@/db/schema'
import { validateRequest } from '@/lib/jwt'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const { user } = await validateRequest()

    if (!user || user.role !== 'manager') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const [profile] = await db
      .select()
      .from(managerProfiles)
      .where(eq(managerProfiles.userId, user.id))
      .limit(1)

    if (!profile) {
      return NextResponse.json({ complete: false })
    }

    const complete = !!(
      profile.firstName &&
      profile.lastName &&
      profile.cpf &&
      profile.cep &&
      profile.state &&
      profile.city &&
      profile.address
    )

    return NextResponse.json({ complete })
  } catch (error) {
    console.error('Error checking profile status:', error)
    return NextResponse.json({ complete: false })
  }
}
