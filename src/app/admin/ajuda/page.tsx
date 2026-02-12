/**
 * @fileoverview Página de ajuda do painel administrativo
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LifeBuoy, Mail, BookOpen, MessageSquare } from 'lucide-react'
import { getCompanySettings } from '@/lib/company'

export default async function AjudaPage() {
  const company = await getCompanySettings()
  const supportEmail = company?.supportEmail || 'suporte@multidesk.io'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Central de Ajuda</h1>
        <p className="text-muted-foreground">
          Encontre respostas para suas dúvidas ou entre em contato com o suporte.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <LifeBuoy className="h-5 w-5 text-videira-blue" />
            <CardTitle className="text-base">Suporte Técnico</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Para problemas técnicos ou dúvidas sobre o sistema, entre em contato pelo email de
              suporte.
            </p>
            <a
              href={`mailto:${supportEmail}`}
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-videira-blue hover:underline"
            >
              <Mail className="h-4 w-4" />
              {supportEmail}
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <BookOpen className="h-5 w-5 text-videira-blue" />
            <CardTitle className="text-base">Documentação</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Consulte a documentação do sistema para guias detalhados sobre cada funcionalidade.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <MessageSquare className="h-5 w-5 text-videira-blue" />
            <CardTitle className="text-base">Perguntas Frequentes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Como cadastrar um novo usuário?</span>
                <br />
                Acesse o menu lateral e selecione a categoria desejada (Gerentes, Supervisores,
                etc).
              </li>
              <li>
                <span className="font-medium text-foreground">Como configurar pagamentos?</span>
                <br />
                Vá em Configurações {'>'} Gateways para configurar Cielo ou Bradesco.
              </li>
              <li>
                <span className="font-medium text-foreground">Como gerar relatórios?</span>
                <br />
                Acesse o Dashboard para visualizar KPIs e exportar dados.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <LifeBuoy className="h-5 w-5 text-videira-blue" />
            <CardTitle className="text-base">Versão do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Vinha Admin Center v0.3.0</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
