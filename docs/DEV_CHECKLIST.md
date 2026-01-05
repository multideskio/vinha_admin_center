# ✅ Developer Checklist - Vinha Admin Center

Este documento fornece checklists rápidos para diferentes tipos de tarefas de desenvolvimento.

---

## 📋 Checklist: Antes de Iniciar Qualquer Task

- [ ] Ler `.cursorrules` para contexto do projeto
- [ ] Verificar `KNOWN_BUGS.md` para bugs na área que vou trabalhar
- [ ] Verificar se há issues abertas relacionadas
- [ ] Criar branch a partir de `main` ou `develop`
- [ ] Atualizar dependências locais (`npm install`)

---

## 🆕 Checklist: Criar Nova Feature

### Planejamento

- [ ] Feature está documentada em issue/ticket
- [ ] Requisitos estão claros
- [ ] Design/UX aprovado (se aplicável)
- [ ] Impacto em outras features avaliado

### Desenvolvimento

- [ ] Criar estrutura de arquivos seguindo padrões do projeto
- [ ] Implementar tipos TypeScript (sem `any`)
- [ ] Adicionar validação de input (Zod para APIs)
- [ ] Implementar error handling adequado
- [ ] Adicionar logging apropriado
- [ ] Seguir padrões de autenticação do projeto
- [ ] Validar environment variables necessárias

### Código

- [ ] Código segue convenções de nome do projeto
- [ ] Componentes são reutilizáveis quando possível
- [ ] Sem código duplicado
- [ ] Sem hardcoded values (usar env vars ou config)
- [ ] Comentários em código complexo

### Segurança

- [ ] Input sanitizado
- [ ] Output escaped
- [ ] Autenticação/autorização implementada
- [ ] Rate limiting considerado (APIs públicas)
- [ ] Dados sensíveis não logados

### Performance

- [ ] Queries otimizadas (usar `.limit()` quando aplicável)
- [ ] Imagens otimizadas
- [ ] Componentes React otimizados (memoization se necessário)
- [ ] Lazy loading considerado

### Testes

- [ ] Testar happy path
- [ ] Testar edge cases
- [ ] Testar error handling
- [ ] Testar com diferentes roles de usuário
- [ ] Testar responsividade (mobile/tablet/desktop)

### Documentação

- [ ] Adicionar JSDoc em funções complexas
- [ ] Atualizar README se necessário
- [ ] Adicionar em `/docs` se feature complexa
- [ ] Atualizar `.cursorrules` se adicionar padrão novo

---

## 🐛 Checklist: Corrigir Bug

### Investigação

- [ ] Bug está documentado em `KNOWN_BUGS.md`?
- [ ] Reproduzi o bug localmente
- [ ] Identifiquei a causa raiz
- [ ] Entendo o impacto do bug

### Correção

- [ ] Implementei fix mínimo necessário
- [ ] Fix não introduz novos bugs
- [ ] Fix não quebra outras funcionalidades
- [ ] Adicionei validações para prevenir bug no futuro
- [ ] Adicionei logging se necessário

### Validação

- [ ] Bug não ocorre mais
- [ ] Funcionalidades relacionadas ainda funcionam
- [ ] Testei edge cases
- [ ] Code review feito

### Documentação

- [ ] Atualizei `KNOWN_BUGS.md` (marcar como resolvido)
- [ ] Atualizei `.cursorrules` se aplicável
- [ ] Adicionei comentários explicando o fix
- [ ] Commit message clara (ex: `fix: corrige autenticação duplicada (#2)`)

---

## 🔌 Checklist: Criar Nova API Route

### Setup

- [ ] Arquivo em `/src/app/api/v1/[rota]/route.ts`
- [ ] Imports necessários adicionados
- [ ] Tipos definidos com Zod ou TypeScript

### Implementação

```typescript
// Template
export async function GET/POST/PUT/DELETE(request: NextRequest) {
  try {
    // 1. Autenticação
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validação de input
    const validatedData = schema.parse(data)

    // 3. Autorização (role-based)
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 4. Lógica de negócio
    const result = await businessLogic()

    // 5. Resposta
    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    // Error handling específico
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Checklist

- [ ] Autenticação implementada
- [ ] Validação de input com Zod
- [ ] Autorização (role-based) se necessário
- [ ] Error handling robusto
- [ ] Logging de erros
- [ ] Rate limiting (se API pública)
- [ ] Resposta consistente (sempre JSON)
- [ ] Status codes HTTP corretos

---

## 🎨 Checklist: Criar Novo Componente React

### Estrutura

- [ ] Arquivo em `/src/components/[categoria]/[Nome].tsx`
- [ ] Props tipadas com interface
- [ ] Componente exportado como default ou named

### Implementação

```typescript
interface ComponentProps {
  // Props obrigatórias
  userId: string

  // Props opcionais
  onSuccess?: () => void
  onError?: (error: Error) => void
  className?: string
}

export default function Component({
  userId,
  onSuccess,
  onError,
  className
}: ComponentProps) {
  // Hooks
  const [state, setState] = useState()

  // Handlers
  const handleAction = () => { ... }

  // Render
  return (
    <div className={cn("base-classes", className)}>
      {/* JSX */}
    </div>
  )
}
```

### Checklist

- [ ] Props tipadas (sem `any`)
- [ ] Props opcionais marcadas com `?`
- [ ] Hooks no topo do componente
- [ ] Event handlers nomeados como `handleX`
- [ ] Componente responsivo
- [ ] Acessibilidade (aria-labels, etc)
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Dark mode suportado (se aplicável)
- [ ] Usa componentes do shadcn/ui quando possível

---

## 🗄️ Checklist: Modificar Schema do Banco

### Planejamento

- [ ] Mudança está documentada
- [ ] Impacto em dados existentes avaliado
- [ ] Migration strategy definida
- [ ] Backup planejado

### Desenvolvimento

- [ ] Modificar `src/db/schema.ts`
- [ ] Gerar migration: `npm run db:generate`
- [ ] Revisar migration gerada em `/drizzle`
- [ ] Testar migration em dev: `npm run db:migrate`
- [ ] Atualizar tipos TypeScript relacionados

### Validação

- [ ] Migration roda sem erros
- [ ] Dados existentes não corrompidos
- [ ] Queries antigas ainda funcionam
- [ ] Performance não degradada

### Documentação

- [ ] Atualizar `docs/DB_DOCS.md`
- [ ] Adicionar comentários no schema
- [ ] Documentar em migration se mudança complexa

---

## 📤 Checklist: Pull Request

### Antes de Criar PR

- [ ] Código passou em `npm run typecheck`
- [ ] Código passou em `npm run lint`
- [ ] Código formatado com `npm run format`
- [ ] Build passa: `npm run build`
- [ ] Sem `console.log` de debug
- [ ] Sem código comentado desnecessário
- [ ] Todos os TODOs resolvidos ou documentados

### Descrição do PR

- [ ] Título claro e descritivo
- [ ] Descrição explica o que foi feito
- [ ] Screenshots/GIFs se mudança visual
- [ ] Lista de mudanças principais
- [ ] Referencia issues relacionadas (`Closes #X`)
- [ ] Breaking changes documentadas

### Review

- [ ] Self-review feito
- [ ] Reviewers atribuídos
- [ ] CI/CD passou
- [ ] Code review aprovado
- [ ] Conflitos resolvidos

---

## 🚀 Checklist: Deploy para Produção

### Pré-Deploy

- [ ] Todos os testes passaram
- [ ] Code review aprovado
- [ ] Staging testado e validado
- [ ] Breaking changes comunicadas ao time
- [ ] Environment variables configuradas
- [ ] Backup do banco feito

### Configuração

- [ ] `next.config.ts` com `ignoreBuildErrors: false`
- [ ] `next.config.ts` com `ignoreDuringBuilds: false`
- [ ] Environment variables de produção corretas
- [ ] Secrets/keys seguros e rotacionados
- [ ] HTTPS configurado
- [ ] Domain/DNS configurado

### Validação Crítica

- [ ] ⚠️ Sistema de autenticação unificado (Lucia OU JWT)
- [ ] ⚠️ Middleware não usa `AbortSignal.timeout()`
- [ ] ⚠️ API maintenance-check retorna `maintenanceMode`
- [ ] ⚠️ Credenciais S3 e SES separadas
- [ ] ⚠️ `COMPANY_INIT` configurado corretamente

### Pós-Deploy

- [ ] Deploy executado com sucesso
- [ ] Health check passou
- [ ] Funcionalidades críticas testadas:
  - [ ] Login/Logout
  - [ ] Criação de contribuição
  - [ ] Upload de arquivo
  - [ ] Envio de email
  - [ ] Notificações
- [ ] Monitoring ativo
- [ ] Logs sendo coletados
- [ ] Alertas configurados

### Rollback Plan

- [ ] Plano de rollback documentado
- [ ] Backup disponível
- [ ] Comando de rollback testado

---

## 📊 Checklist: Code Review

### Como Reviewer

#### Funcionalidade

- [ ] Código faz o que propõe
- [ ] Lógica está correta
- [ ] Edge cases são tratados
- [ ] Não introduz novos bugs

#### Qualidade

- [ ] Código é legível e limpo
- [ ] Sem duplicação desnecessária
- [ ] Funções têm tamanho razoável
- [ ] Nomenclatura clara e consistente

#### TypeScript

- [ ] Tipos estão corretos
- [ ] Sem uso de `any`
- [ ] Interfaces bem definidas
- [ ] Sem type assertions desnecessários

#### Segurança

- [ ] Input é validado
- [ ] Autenticação/autorização correta
- [ ] Sem dados sensíveis em logs
- [ ] Sem vulnerabilidades óbvias

#### Performance

- [ ] Sem operações desnecessariamente pesadas
- [ ] Queries otimizadas
- [ ] Sem loops ineficientes
- [ ] Memoization onde necessário

#### Testes

- [ ] Casos de teste adequados
- [ ] Coverage aceitável
- [ ] Testes passam

#### Documentação

- [ ] Código complexo comentado
- [ ] JSDoc em APIs públicas
- [ ] README atualizado se necessário

---

## 🔍 Checklist: Debugging

### Investigação Inicial

- [ ] Erro reproduzido consistentemente
- [ ] Stack trace analisado
- [ ] Logs revisados
- [ ] Variáveis de ambiente verificadas
- [ ] Versões de dependências verificadas

### Ferramentas

- [ ] Usar `console.error` (não `console.log`)
- [ ] Usar debugging do VS Code/Cursor
- [ ] Usar DevTools do browser
- [ ] Usar Drizzle Studio para inspecionar DB
- [ ] Usar Redux DevTools se aplicável

### Processo

- [ ] Isolar o problema (dividir e conquistar)
- [ ] Verificar mudanças recentes (git log)
- [ ] Testar em ambiente limpo
- [ ] Consultar `KNOWN_BUGS.md`
- [ ] Buscar em issues fechadas
- [ ] Documentar solução quando resolver

---

## 📝 Checklist: Documentação

### Para Cada Feature Nova

- [ ] Adicionar em README se feature principal
- [ ] Criar doc em `/docs` se complexa
- [ ] Adicionar JSDoc em código
- [ ] Adicionar comentários em lógica complexa
- [ ] Atualizar `.cursorrules` se novo padrão

### Para Cada Bug Corrigido

- [ ] Atualizar `KNOWN_BUGS.md`
- [ ] Adicionar comentário explicando o fix
- [ ] Atualizar `.cursorrules` se aplicável

### Manutenção Regular

- [ ] Revisar docs mensalmente
- [ ] Remover docs obsoletos
- [ ] Atualizar screenshots/exemplos
- [ ] Verificar links quebrados

---

## 🎯 Quick Reference: Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Dev server (turbo, porta 9002)
npm run dev:worker       # Worker de notificações

# Build e Tipos
npm run build            # Build de produção
npm run typecheck        # Verificar tipos
npm run lint             # Lint
npm run format           # Formatar código

# Banco de Dados
npm run db:generate      # Gerar migration
npm run db:push          # Push schema (dev)
npm run db:migrate       # Rodar migrations
npm run db:seed          # Popular banco
npm run db:studio        # Drizzle Studio UI

# Qualidade
npm run quality:check    # Check completo
npm run deps:check       # Verificar dependências

# Git
git checkout -b feature/nome-da-feature
git add .
git commit -m "feat: descrição"
git push origin feature/nome-da-feature
```

---

## 📞 Onde Buscar Ajuda

1. **Bugs Conhecidos:** `docs/KNOWN_BUGS.md`
2. **Regras do Projeto:** `.cursorrules`
3. **Schema do Banco:** `docs/DB_DOCS.md`
4. **Email System:** `docs/EMAIL_SYSTEM.md`
5. **S3 Issues:** `docs/S3_TROUBLESHOOTING.md`
6. **Cielo Gateway:** `docs/CIELO_API_GUIDE.md`
7. **Features Pendentes:** `docs/PENDING_IMPLEMENTATION.md`
8. **Issues GitHub:** [Link para repo]
9. **Team Chat:** [Link para Slack/Discord]

---

**Mantenha este checklist atualizado conforme o projeto evolui!**

**Última atualização:** 2025-11-05
