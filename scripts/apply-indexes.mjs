import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const { Pool } = pg

async function applyIndexes() {
  console.log('🚀 Aplicando índices de performance...\n')

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    // Ler o arquivo SQL
    const sqlPath = join(__dirname, 'apply-missing-indexes.sql')
    const sql = readFileSync(sqlPath, 'utf-8')

    // Dividir em statements individuais
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith('--'))

    console.log(`📝 Executando ${statements.length} comandos...\n`)

    let created = 0
    let skipped = 0

    for (const statement of statements) {
      try {
        await pool.query(statement)
        const indexName = statement.match(/IF NOT EXISTS (\w+)/)?.[1]
        console.log(`✅ ${indexName}`)
        created++
      } catch (error) {
        if (error.code === '42P07') {
          // Índice já existe
          const indexName = statement.match(/IF NOT EXISTS (\w+)/)?.[1]
          console.log(`⏭️  ${indexName} (já existe)`)
          skipped++
        } else {
          throw error
        }
      }
    }

    console.log(`\n📊 Resumo:`)
    console.log(`   ✅ Criados: ${created}`)
    console.log(`   ⏭️  Ignorados: ${skipped}`)
    console.log(`   📝 Total: ${statements.length}`)
    console.log('\n✨ Índices aplicados com sucesso!')
  } catch (error) {
    console.error('❌ Erro ao aplicar índices:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

applyIndexes()
