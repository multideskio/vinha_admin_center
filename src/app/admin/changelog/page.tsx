import { promises as fs } from 'fs'
import path from 'path'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default async function ChangelogPage() {
  const filePath = path.join(process.cwd(), 'docs', 'CHANGELOG.md')
  const content = await fs.readFile(filePath, 'utf8')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">📝 Changelog</h1>
        <p className="text-muted-foreground">Histórico de mudanças e atualizações do sistema</p>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  )
}
