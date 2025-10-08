import { db } from '@/db'
import { companies } from '@/db/schema'
import { eq } from 'drizzle-orm'

const COMPANY_ID = process.env.COMPANY_INIT

export async function getCompanySettings() {
  if (!COMPANY_ID) {
    return null
  }

  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, COMPANY_ID))
    .limit(1)

  return company || null
}
