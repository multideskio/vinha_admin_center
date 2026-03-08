---
inclusion: always
---

# Guia de Sub-Agentes e Skills - Vinha Admin Center

## Propósito

Este documento orienta o Kiro sobre QUANDO e COMO utilizar os sub-agentes especializados e skills disponíveis no workspace. Consulte este guia para delegar tarefas ao recurso mais adequado.

---

## 🤖 Sub-Agentes Especializados

Sub-agentes são invocados via `invokeSubAgent` para tarefas que se beneficiam de contexto especializado.

### 1. security-reviewer

- **Quando usar:** Revisão de segurança, análise de vulnerabilidades, verificação de autenticação/autorização, auditoria de código sensível (pagamentos, uploads, webhooks)
- **Gatilhos:** Código que lida com JWT, cookies, validação de entrada, dados de cartão, webhooks, uploads, endpoints públicos
- **Exemplo:** Ao criar ou modificar API Routes, Server Actions com dados sensíveis, integrações de pagamento

### 2. drizzle-migration

- **Quando usar:** Criar/modificar schemas do banco, gerar migrations, otimizar queries, adicionar índices, revisar relações
- **Gatilhos:** Alterações em `src/lib/db/schema/`, arquivos em `drizzle/`, queries lentas, modelagem de dados
- **Exemplo:** Ao adicionar nova tabela, modificar colunas, criar índices, resolver N+1 queries

### 3. payment-gateway

- **Quando usar:** Integrações Cielo (cartão/PIX) e Bradesco (boleto), webhooks de pagamento, estornos, reconciliação
- **Gatilhos:** Código em serviços de pagamento, webhooks financeiros, transações, QR Code PIX, boletos
- **Exemplo:** Ao implementar novo método de pagamento, corrigir webhook, adicionar estorno

### 4. code-quality

- **Quando usar:** Análise de qualidade, refatoração, detecção de anti-patterns, verificação de TypeScript, performance de componentes
- **Gatilhos:** Revisão de PR, refatoração de código, componentes grandes (>300 linhas), uso excessivo de `any`, useEffect desnecessários
- **Exemplo:** Ao revisar código existente, antes de merge, otimização de componentes

### 5. component-builder

- **Quando usar:** Criar componentes React seguindo o Design System Videira, formulários com Zod + React Hook Form, componentes UI reutilizáveis
- **Gatilhos:** Criação de novos componentes, formulários, páginas com UI complexa, componentes compartilhados
- **Exemplo:** Ao criar nova página com formulário, componente de tabela, card de dashboard

### 6. senior-reviewer

- **Quando usar:** Auditoria técnica completa do projeto, revisão pré-deploy, análise de prontidão para produção
- **Gatilhos:** Pedido de revisão geral, auditoria de banco + segurança + frontend + design system, checklist de go-live
- **Exemplo:** Antes de deploy para produção, revisão completa do sistema, análise de qualidade global
- **IMPORTANTE:** Este agente NUNCA modifica arquivos — apenas lê, analisa (incluindo browser) e gera relatório

### 7. context-gatherer (built-in)

- **Quando usar:** Explorar codebase desconhecido, investigar bugs cross-file, entender fluxos antes de modificar
- **Gatilhos:** Início de tarefa complexa, bug em área desconhecida, necessidade de mapear dependências
- **Regra:** Usar UMA VEZ por query, no início da investigação

---

## 🎯 Skills Disponíveis (`.agents/skills/`)

Skills fornecem conhecimento especializado e padrões de referência. São ativadas automaticamente quando o contexto é relevante.

### 1. postgres-drizzle

- **Domínio:** PostgreSQL + Drizzle ORM, schemas, queries, relações, performance, migrations
- **Referências:** CHEATSHEET, MIGRATIONS, PERFORMANCE, POSTGRES, QUERIES, RELATIONS, SCHEMA
- **Usar quando:** Trabalhar com banco de dados, modelagem, otimização de queries

### 2. drizzle-migrations

- **Domínio:** Workflow migration-first, versionamento de schema, CI/CD de banco
- **Usar quando:** Criar ou revisar migrations, garantir consistência entre ambientes

### 3. typescript-react-reviewer

- **Domínio:** Code review React 19, anti-patterns, state management, hooks, TypeScript
- **Referências:** antipatterns, checklist, react19-patterns
- **Usar quando:** Revisar código React, detectar useEffect abuse, avaliar arquitetura de componentes

### 4. nextjs-app-router-patterns

- **Domínio:** Next.js 14+ App Router, Server Components, streaming, parallel routes, data fetching
- **Usar quando:** Criar páginas, implementar layouts, configurar rotas, otimizar rendering

### 5. tailwind-design-system

- **Domínio:** Tailwind CSS v4, design tokens, componentes CVA, dark mode, animações
- **Usar quando:** Estilizar componentes, criar variantes, implementar temas, design responsivo

---

## 🗺️ Matriz de Decisão Rápida

| Tarefa                         | Recurso Recomendado                                           |
| ------------------------------ | ------------------------------------------------------------- |
| Criar nova tabela no banco     | sub-agente `drizzle-migration`                                |
| Otimizar query lenta           | sub-agente `drizzle-migration` + skill `postgres-drizzle`     |
| Criar componente de formulário | sub-agente `component-builder`                                |
| Revisar segurança de endpoint  | sub-agente `security-reviewer`                                |
| Implementar pagamento PIX      | sub-agente `payment-gateway`                                  |
| Refatorar componente grande    | sub-agente `code-quality` + skill `typescript-react-reviewer` |
| Criar nova página Next.js      | skill `nextjs-app-router-patterns`                            |
| Estilizar componente           | skill `tailwind-design-system`                                |
| Investigar bug desconhecido    | sub-agente `context-gatherer` primeiro                        |
| Auditoria completa pré-deploy  | sub-agente `senior-reviewer`                                  |
| Revisar PR / código existente  | sub-agente `code-quality`                                     |
| Webhook de pagamento           | sub-agente `payment-gateway` + `security-reviewer`            |
| Migration com dados sensíveis  | sub-agente `drizzle-migration` + `security-reviewer`          |

---

## ⚡ Regras de Uso

1. **Delegar quando especializado:** Se a tarefa se encaixa claramente em um sub-agente, delegue ao invés de fazer manualmente
2. **Combinar recursos:** Tarefas complexas podem usar múltiplos sub-agentes em sequência (ex: criar migration + revisar segurança)
3. **context-gatherer primeiro:** Para tarefas em áreas desconhecidas, sempre usar context-gatherer antes de outros agentes
4. **Não duplicar trabalho:** Confiar no output dos sub-agentes, não re-ler arquivos que eles já analisaram
5. **Skills como referência:** Skills complementam sub-agentes com padrões e exemplos de código
6. **Tarefas simples direto:** Para edições pequenas e pontuais, não é necessário invocar sub-agente

---

## 📋 Skills do Kiro (`.kiro/skills/`)

Além das skills de `.agents/`, existem skills ativáveis manualmente via `#` no chat:

| Skill                      | Uso                                                 |
| -------------------------- | --------------------------------------------------- |
| `#nextjs-best-practices`   | Padrões Next.js 15, Server/Client Components        |
| `#database-optimization`   | Otimização de queries e performance DB              |
| `#api-integration`         | Integração com APIs externas (Cielo, Bradesco, AWS) |
| `#error-handling`          | Tratamento robusto de erros                         |
| `#form-validation`         | Validação com Zod + React Hook Form                 |
| `#ui-ux-patterns`          | Padrões de interface e UX                           |
| `#comunicacao-ptbr`        | Comunicação natural em PT-BR                        |
| `#git-commit-standards`    | Padrões de commit (manual)                          |
| `#documentation-standards` | Padrões de documentação (manual)                    |
