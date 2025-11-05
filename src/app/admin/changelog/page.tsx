import { promises as fs } from 'fs'
import path from 'path'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Sparkles } from 'lucide-react'

export default async function ChangelogPage() {
  const filePath = path.join(process.cwd(), 'docs', 'CHANGELOG.md')
  const content = await fs.readFile(filePath, 'utf8')

  return (
    <div className="flex flex-col gap-6">
      {/* Header Moderno com Gradiente Videira */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 videira-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />
        
        <div className="relative z-10 p-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <span className="text-white/80 text-sm font-semibold uppercase tracking-wider">
                v0.2.0
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-3">
              📝 Changelog
            </h1>
            <p className="text-base text-white/90 mt-2 font-medium">
              Histórico completo de mudanças e atualizações do sistema
            </p>
          </div>
        </div>
      </div>

      {/* Card de Conteúdo */}
      <Card className="shadow-lg border-t-4 border-t-videira-blue">
        <CardContent className="pt-6">
          <div className="prose prose-slate dark:prose-invert max-w-none
            prose-headings:text-foreground
            prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-4 prose-h1:mt-8
            prose-h2:text-2xl prose-h2:font-bold prose-h2:mb-3 prose-h2:mt-6 prose-h2:text-videira-blue
            prose-h3:text-xl prose-h3:font-semibold prose-h3:mb-2 prose-h3:mt-4 prose-h3:text-videira-purple
            prose-h4:text-lg prose-h4:font-semibold prose-h4:mb-2 prose-h4:text-videira-cyan
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-a:text-videira-blue prose-a:no-underline hover:prose-a:underline
            prose-strong:text-foreground prose-strong:font-bold
            prose-code:text-videira-purple prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-muted prose-pre:border prose-pre:border-border
            prose-ul:my-4 prose-li:my-1
            prose-table:border-collapse prose-table:w-full
            prose-th:bg-videira-blue/10 prose-th:border prose-th:p-2
            prose-td:border prose-td:p-2
            prose-blockquote:border-l-4 prose-blockquote:border-l-videira-purple prose-blockquote:pl-4 prose-blockquote:italic
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pb-4">
        <Sparkles className="h-4 w-4 text-videira-purple" />
        <span>Vinha Admin Center - Sempre evoluindo</span>
      </div>
    </div>
  )
}
