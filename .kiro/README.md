# Kiro Configuration - Vinha Admin Center

Este diretório contém as configurações do Kiro para o projeto Vinha Admin Center, incluindo Steering Rules, Skills, Hooks e Specs.

## 📁 Estrutura

```
.kiro/
├── steering/          # Regras de direcionamento (sempre ou condicionalmente incluídas)
├── skills/           # Habilidades específicas (ativadas manualmente)
├── hooks/            # Automações baseadas em eventos
├── specs/            # Especificações de features
└── README.md         # Este arquivo
```

## 📋 Steering Rules (Regras de Direcionamento)

Steering rules são automaticamente incluídas no contexto do Kiro durante as interações.

### Sempre Incluídas (`inclusion: always`)

1. **pt-br-language.md** - Comunicação em Português Brasileiro
   - Garante que todas as respostas sejam em PT-BR
   - Define exceções para termos técnicos
   - Prioridade máxima

2. **security-guidelines.md** - Diretrizes de Segurança
   - Autenticação e autorização (JWT, cookies seguros)
   - Validação de entrada e sanitização
   - Proteção contra XSS, CSRF, SQL Injection
   - Upload de arquivos seguro
   - Rate limiting e webhooks

3. **project-context.md** - Contexto do Projeto
   - Informações sobre o Vinha Admin Center
   - Stack tecnológica
   - Estrutura de diretórios
   - Níveis de acesso (roles)
   - Comandos importantes

4. **code-standards.md** - Padrões de Código
   - TypeScript estrito
   - Estrutura de componentes React
   - Nomenclatura de arquivos e variáveis
   - Banco de dados (Drizzle ORM)
   - Validação com Zod
   - Estilização com Tailwind CSS

5. **performance-optimization.md** - Otimização de Performance
   - Next.js optimizations
   - Database performance
   - Bundle size
   - Rendering performance
   - Metas de performance (Core Web Vitals)

### Condicionalmente Incluídas

6. **testing-guidelines.md** (`inclusion: fileMatch`, pattern: `**/*.test.{ts,tsx}`)
   - Estrutura de testes
   - Testes de componentes
   - Mocks e fixtures
   - Checklist de testes

### Inclusão Manual

7. **git-commit-standards.md** (`inclusion: manual`)
   - Formato de commit (Conventional Commits)
   - Tipos de commit
   - Exemplos práticos

8. **documentation-standards.md** (`inclusion: manual`)
   - Estrutura de documentação
   - Comentários em código
   - Changelog
   - API documentation

## 🎯 Skills (Habilidades)

Skills são ativadas manualmente quando necessário usando o comando `#` no chat.

1. **comunicacao-ptbr.md** - Comunicação em Português Brasileiro
   - Linguagem natural brasileira
   - Terminologia técnica
   - Formatação e estrutura
   - Adaptação cultural

2. **nextjs-best-practices.md** - Next.js 15 Best Practices
   - Server Components vs Client Components
   - Data fetching
   - Layouts e templates
   - Metadata e SEO
   - Caching e revalidação
   - Route handlers
   - Streaming e Suspense

3. **database-optimization.md** - Otimização de Banco de Dados
   - Evitar N+1 queries
   - Usar relações do Drizzle
   - Paginação eficiente
   - Agregações otimizadas
   - Índices apropriados
   - Transações
   - Cache de queries

4. **api-integration.md** - Integração com APIs Externas
   - Cliente HTTP reutilizável
   - Cliente Cielo
   - Cliente Bradesco
   - Retry e timeout
   - Validação de webhook
   - Rate limiting
   - Cache de respostas
   - Logging de requisições

5. **error-handling.md** - Tratamento de Erros
   - Server Actions
   - API Routes
   - Componentes Client
   - Erros customizados
   - Error boundaries
   - Logging estruturado
   - Retry logic

6. **ui-ux-patterns.md** - Padrões de UI/UX
   - Loading states
   - Empty states
   - Feedback visual
   - Formulários
   - Modais e dialogs
   - Tabelas responsivas
   - Acessibilidade

7. **form-validation.md** - Validação de Formulários
   - Schema Zod
   - Validações customizadas
   - Validação assíncrona
   - React Hook Form
   - Validação em Server Actions
   - Máscaras de input
   - Validação de arquivos

## 🔧 Como Usar

### Ativar uma Skill

No chat do Kiro, use `#` seguido do nome da skill:

```
#nextjs-best-practices
Como devo implementar data fetching nesta página?
```

### Referenciar Steering Rules

As steering rules com `inclusion: always` são automaticamente incluídas. Para referenciar manualmente:

```
#git-commit-standards
Me ajude a criar uma mensagem de commit para esta alteração
```

### Criar Nova Steering Rule

```markdown
---
inclusion: always # ou fileMatch, ou manual
fileMatchPattern: '**/*.tsx' # apenas para fileMatch
---

# Título da Regra

Conteúdo da regra...
```

### Criar Nova Skill

```markdown
# Skill: Nome da Skill

## Objetivo

Descrição do objetivo da skill

## Conteúdo

Exemplos e diretrizes...
```

## 📊 Resumo das Configurações

| Tipo           | Quantidade | Descrição                            |
| -------------- | ---------- | ------------------------------------ |
| Steering Rules | 8          | Regras de direcionamento automáticas |
| Skills         | 7          | Habilidades ativáveis manualmente    |
| Hooks          | 0          | Automações baseadas em eventos       |
| Specs          | 0          | Especificações de features           |

## 🎨 Design System Videira

O projeto usa o Design System Videira com paleta de cores personalizada. Consulte as steering rules e skills para padrões de UI/UX.

## 🔒 Segurança

Todas as diretrizes de segurança estão documentadas em `steering/security-guidelines.md`. Sempre consulte antes de implementar funcionalidades que envolvam:

- Autenticação e autorização
- Manipulação de dados sensíveis
- Upload de arquivos
- Integrações com APIs externas
- Webhooks

## 📚 Documentação Adicional

Para mais informações sobre o projeto, consulte:

- `/docs` - Documentação completa do projeto
- `README.md` - Visão geral do Vinha Admin Center
- `CHANGELOG.md` - Histórico de alterações

## 🤝 Contribuindo

Ao adicionar novas steering rules ou skills:

1. Siga o formato estabelecido
2. Use português brasileiro
3. Inclua exemplos práticos
4. Atualize este README
5. Teste a configuração com o Kiro

---

**Última atualização:** 11/02/2026
**Versão do projeto:** v0.3.0
