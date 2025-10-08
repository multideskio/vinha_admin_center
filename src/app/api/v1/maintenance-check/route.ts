import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { companies } from '@/db/schema'
import { eq } from 'drizzle-orm'

const COMPANY_ID = process.env.COMPANY_INIT!

export async function GET() {
  try {
    const [company] = await db
      .select({ maintenanceMode: companies.maintenanceMode })
      .from(companies)
      .where(eq(companies.id, COMPANY_ID))
      .limit(1)

    return NextResponse.json({ maintenanceMode: company?.maintenanceMode || false })
  } catch (error) {
    console.error('Maintenance check error:', error)
    return NextResponse.json({ maintenanceMode: false })
  }
}
