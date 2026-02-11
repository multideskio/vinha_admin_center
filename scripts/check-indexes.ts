import { db } from '../src/lib/db/drizzle'
import { sql } from 'drizzle-orm'

async function checkIndexes() {
  console.log('🔍 Verificando índices existentes...\n')

  const result = await db.execute(sql`
    SELECT 
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND (
        tablename IN ('users', 'sessions', 'transactions', 'admin_profiles', 'church_profiles', 
                      'manager_profiles', 'pastor_profiles', 'supervisor_profiles', 
                      'notification_logs', 'password_reset_tokens', 'user_action_logs', 'payment_tokens')
      )
    ORDER BY tablename, indexname;
  `)

  const indexes = result.rows as Array<{
    schemaname: string
    tablename: string
    indexname: string
    indexdef: string
  }>

  // Agrupar por tabela
  const indexesByTable = indexes.reduce(
    (acc, idx) => {
      if (!acc[idx.tablename]) {
        acc[idx.tablename] = []
      }
      acc[idx.tablename].push(idx.indexname)
      return acc
    },
    {} as Record<string, string[]>,
  )

  console.log('📊 Índices por tabela:\n')
  for (const [table, idxList] of Object.entries(indexesByTable)) {
    console.log(`\n${table}:`)
    idxList.forEach((idx) => console.log(`  - ${idx}`))
  }

  console.log('\n✅ Verificação concluída!')
  process.exit(0)
}

checkIndexes().catch((error) => {
  console.error('❌ Erro ao verificar índices:', error)
  process.exit(1)
})
