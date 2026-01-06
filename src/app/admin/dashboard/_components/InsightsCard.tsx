'use client'

import * as React from 'react'
import { Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type InsightCard = {
  type: string
  title: string
  description: string
  metric?: string | null
  text?: string
}

type InsightsCardProps = {
  insightSummary: string
  insightCards: InsightCard[]
  insightLoading: boolean
  onGenerateInsights: () => void
}

export function InsightsCard({
  insightSummary,
  insightCards,
  insightLoading,
  onGenerateInsights,
}: InsightsCardProps) {
  const typeColors = {
    success: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-700 dark:text-green-400',
      icon: 'bg-green-500/20',
    },
    warning: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-700 dark:text-yellow-400',
      icon: 'bg-yellow-500/20',
    },
    danger: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-700 dark:text-red-400',
      icon: 'bg-red-500/20',
    },
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-700 dark:text-blue-400',
      icon: 'bg-blue-500/20',
    },
  }

  return (
    <Card className="relative overflow-hidden border-2 border-videira-purple/20 shadow-lg hover:shadow-2xl transition-all duration-300">
      {/* Fundo decorativo com gradiente */}
      <div className="absolute inset-0 bg-gradient-to-br from-videira-purple/5 via-videira-blue/5 to-videira-cyan/5 pointer-events-none" />
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-videira-purple/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-videira-cyan/10 blur-3xl pointer-events-none" />

      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between relative z-10 gap-4">
        <div className="min-w-0 flex-1">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <div className="p-2 rounded-lg bg-videira-purple/15 ring-2 ring-videira-purple/30 flex-shrink-0">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-videira-purple" />
            </div>
            <span className="videira-gradient-text">Insights IA</span>
          </CardTitle>
          <CardDescription className="mt-1 text-sm">
            Resumo do momento atual e recomendações automáticas.
          </CardDescription>
        </div>
        <Button
          onClick={onGenerateInsights}
          disabled={insightLoading}
          className="videira-gradient hover:opacity-90 text-white shadow-lg whitespace-nowrap"
        >
          {insightLoading ? 'Gerando...' : 'Gerar insights'}
        </Button>
      </CardHeader>
      <CardContent className="relative z-10">
        {insightSummary || insightCards.length > 0 ? (
          <div className="space-y-4">
            {insightSummary && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-sm leading-relaxed">{insightSummary}</p>
              </div>
            )}
            {insightCards.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {insightCards.map((card, idx) => {
                  const colors = typeColors[card.type as keyof typeof typeColors] || typeColors.info
                  return (
                    <div
                      key={idx}
                      className={cn(
                        'p-4 rounded-lg border-2 transition-all hover:shadow-lg',
                        colors.bg,
                        colors.border,
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn('p-2 rounded-lg flex-shrink-0', colors.icon)}>
                          <Sparkles className={cn('h-4 w-4', colors.text)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={cn('font-semibold text-sm mb-1', colors.text)}>
                            {card.title}
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {card.description}
                          </p>
                          {card.metric && (
                            <p className={cn('text-lg font-bold mt-2', colors.text)}>
                              {card.metric}
                            </p>
                          )}
                          {card.text && (
                            <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                              {card.text}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Clique em &ldquo;Gerar insights&rdquo; para ver o resumo da IA.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
