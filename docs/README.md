# 📚 Documentação - Vinha Admin Center

Bem-vindo à documentação do projeto Vinha Admin Center. Esta pasta contém toda a documentação técnica, guias e referências do sistema.

---

## 📑 Índice de Documentos

### 🔴 Documentos Críticos (Leitura Obrigatória)

| Documento                                       | Descrição                                          | Quando Consultar                 |
| ----------------------------------------------- | -------------------------------------------------- | -------------------------------- |
| **[CRITICAL_ISSUES.md](../CRITICAL_ISSUES.md)** | Lista de problemas críticos que bloqueiam produção | Antes de QUALQUER deploy         |
| **[KNOWN_BUGS.md](./KNOWN_BUGS.md)**            | Registro completo de todos os bugs conhecidos      | Antes de iniciar qualquer tarefa |
| **[DEV_CHECKLIST.md](./DEV_CHECKLIST.md)**      | Checklists para diferentes tipos de tarefas        | Antes de criar feature/fix/PR    |

### 📘 Documentação Técnica

| Documento                                            | Descrição                        | Quando Consultar                       |
| ---------------------------------------------------- | -------------------------------- | -------------------------------------- |
| **[DB_DOCS.md](./DB_DOCS.md)**                       | Schema do banco de dados         | Ao trabalhar com queries/migrations    |
| **[EMAIL_SYSTEM.md](./EMAIL_SYSTEM.md)**             | Sistema de emails e notificações | Ao trabalhar com envio de emails       |
| **[S3_TROUBLESHOOTING.md](./S3_TROUBLESHOOTING.md)** | Troubleshooting de S3            | Ao trabalhar com uploads               |
| **[CIELO_API_GUIDE.md](./CIELO_API_GUIDE.md)**       | Integração com gateway Cielo     | Ao trabalhar com pagamentos            |
| **[CRON_SETUP.md](./CRON_SETUP.md)**                 | Configuração de cron jobs        | Ao configurar notificações automáticas |

### 🚀 Guias de Deploy e Infraestrutura

| Documento                                                | Descrição                        | Quando Consultar              |
| -------------------------------------------------------- | -------------------------------- | ----------------------------- |
| **[DOCKER_DEPLOY.md](./DOCKER_DEPLOY.md)**               | Deploy com Docker                | Ao fazer deploy via Docker    |
| **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** | Checklist completo para produção | Antes de deploy para produção |
| **[GITHUB_ACTIONS.md](./GITHUB_ACTIONS.md)**             | Configuração de CI/CD            | Ao configurar GitHub Actions  |

### 📋 Planejamento e Roadmap

| Documento                                                    | Descrição             | Quando Consultar            |
| ------------------------------------------------------------ | --------------------- | --------------------------- |
| **[ROADMAP.md](./ROADMAP.md)**                               | Roadmap do projeto    | Ao planejar novas features  |
| **[PENDING_IMPLEMENTATION.md](./PENDING_IMPLEMENTATION.md)** | Features pendentes    | Antes de criar nova feature |
| **[CHANGELOG.md](./CHANGELOG.md)**                           | Histórico de mudanças | Ao fazer release            |

### 🛠️ Templates e Padrões

| Documento                                              | Descrição                           | Quando Consultar             |
| ------------------------------------------------------ | ----------------------------------- | ---------------------------- |
| **[BUG_REPORT_TEMPLATE.md](./BUG_REPORT_TEMPLATE.md)** | Template para reportar bugs         | Ao encontrar/documentar bug  |
| **[.cursorrules](../.cursorrules)**                    | Regras e padrões do projeto para IA | Sempre (contexto do projeto) |

---

## 🚀 Quick Start - Por Onde Começar?

### Se você é novo no projeto:

1. ✅ Ler [.cursorrules](../.cursorrules) - Entender contexto geral
2. ✅ Ler [CRITICAL_ISSUES.md](../CRITICAL_ISSUES.md) - Saber o que está quebrado
3. ✅ Ler [KNOWN_BUGS.md](./KNOWN_BUGS.md) - Ver todos os bugs conhecidos
4. ✅ Ler [DEV_CHECKLIST.md](./DEV_CHECKLIST.md) - Aprender workflow
5. ✅ Ler [DB_DOCS.md](./DB_DOCS.md) - Entender estrutura de dados

### Antes de criar uma feature:

1. ✅ Consultar [PENDING_IMPLEMENTATION.md](./PENDING_IMPLEMENTATION.md)
2. ✅ Consultar [ROADMAP.md](./ROADMAP.md)
3. ✅ Usar checklist em [DEV_CHECKLIST.md](./DEV_CHECKLIST.md)

### Antes de corrigir um bug:

1. ✅ Verificar se está em [KNOWN_BUGS.md](./KNOWN_BUGS.md)
2. ✅ Usar [BUG_REPORT_TEMPLATE.md](./BUG_REPORT_TEMPLATE.md)
3. ✅ Seguir workflow em [DEV_CHECKLIST.md](./DEV_CHECKLIST.md)

### Antes de fazer deploy:

1. 🔴 **OBRIGATÓRIO:** Ler [CRITICAL_ISSUES.md](../CRITICAL_ISSUES.md)
2. ✅ Seguir [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
3. ✅ Verificar [KNOWN_BUGS.md](./KNOWN_BUGS.md)

---

## 📊 Status da Documentação

| Categoria           | Cobertura            | Status      |
| ------------------- | -------------------- | ----------- |
| 🐛 Bugs Conhecidos  | 12 bugs documentados | ✅ Completo |
| 🗄️ Banco de Dados   | Schema completo      | ✅ Completo |
| 📧 Sistema de Email | Guia completo        | ✅ Completo |
| 💳 Pagamentos       | Cielo documentado    | ✅ Completo |
| ☁️ Infraestrutura   | Docker + Deploy      | ✅ Completo |
| 🧪 Testes           | A implementar        | ❌ Pendente |
| 🔐 Segurança        | A documentar         | ⚠️ Parcial  |

---

## 🔄 Como Manter Esta Documentação Atualizada

### Quando Resolver um Bug

1. Atualizar [KNOWN_BUGS.md](./KNOWN_BUGS.md) - marcar como ✅ RESOLVIDO
2. Atualizar [.cursorrules](../.cursorrules) - remover da lista de bugs
3. Atualizar [CRITICAL_ISSUES.md](../CRITICAL_ISSUES.md) se for crítico
4. Adicionar em [CHANGELOG.md](./CHANGELOG.md)

### Quando Adicionar Feature

1. Remover de [PENDING_IMPLEMENTATION.md](./PENDING_IMPLEMENTATION.md)
2. Adicionar em [CHANGELOG.md](./CHANGELOG.md)
3. Atualizar [ROADMAP.md](./ROADMAP.md)
4. Documentar em arquivo específico se complexo

### Quando Encontrar Bug

1. Usar [BUG_REPORT_TEMPLATE.md](./BUG_REPORT_TEMPLATE.md)
2. Adicionar em [KNOWN_BUGS.md](./KNOWN_BUGS.md)
3. Adicionar em [.cursorrules](../.cursorrules)
4. Se crítico, adicionar em [CRITICAL_ISSUES.md](../CRITICAL_ISSUES.md)

### Mensalmente

- [ ] Revisar todos os documentos
- [ ] Atualizar status de bugs
- [ ] Remover informações obsoletas
- [ ] Atualizar datas e versões

---

## 📝 Convenções de Documentação

### Formatação

- Usar Markdown
- Headers: `# H1`, `## H2`, `### H3`
- Listas: `-` para bullets, `1.` para numeradas
- Checkboxes: `- [ ]` ou `- [x]`
- Código: usar triple backticks com linguagem

### Emojis Padronizados

- 🔴 Crítico/Urgente
- 🟡 Importante/Médio
- 🟢 Baixa prioridade
- ✅ Completo/Resolvido
- ❌ Pendente/Não resolvido
- ⚠️ Atenção/Cuidado
- 🐛 Bug
- 🚀 Feature/Deploy
- 📝 Documentação
- 🔒 Segurança
- 💡 Dica/Sugestão

### Prioridades

- **🔴 CRÍTICA** - Bloqueia produção
- **🟡 MÉDIA** - Afeta funcionalidade
- **🟢 BAIXA** - Melhoria/Nice to have

### Status

- ✅ RESOLVIDO
- ❌ NÃO RESOLVIDO
- ⚠️ EM PROGRESSO
- 🔄 EM REVISÃO

---

## 🎯 Estrutura de Arquivos

```
docs/
├── README.md                      # Este arquivo (índice)
├── KNOWN_BUGS.md                  # Todos os bugs conhecidos
├── BUG_REPORT_TEMPLATE.md         # Template para reportar bugs
├── DEV_CHECKLIST.md               # Checklists de desenvolvimento
├── DB_DOCS.md                     # Documentação do banco
├── EMAIL_SYSTEM.md                # Sistema de emails
├── S3_TROUBLESHOOTING.md          # Troubleshooting S3
├── CIELO_API_GUIDE.md            # Integração Cielo
├── CRON_SETUP.md                 # Setup de cron jobs
├── DOCKER_DEPLOY.md              # Deploy com Docker
├── PRODUCTION_CHECKLIST.md        # Checklist de produção
├── GITHUB_ACTIONS.md             # CI/CD
├── ROADMAP.md                    # Roadmap do projeto
├── PENDING_IMPLEMENTATION.md      # Features pendentes
└── CHANGELOG.md                   # Histórico de mudanças

../
├── .cursorrules                   # Regras para Cursor AI (IMPORTANTE!)
└── CRITICAL_ISSUES.md            # Issues críticas (OBRIGATÓRIO!)
```

---

## 🔍 Como Encontrar Informação Específica

### "Como faço para..."

- **...criar uma API route?** → [DEV_CHECKLIST.md](./DEV_CHECKLIST.md#checklist-criar-nova-api-route)
- **...criar um componente?** → [DEV_CHECKLIST.md](./DEV_CHECKLIST.md#checklist-criar-novo-componente-react)
- **...modificar o banco?** → [DEV_CHECKLIST.md](./DEV_CHECKLIST.md#checklist-modificar-schema-do-banco) + [DB_DOCS.md](./DB_DOCS.md)
- **...enviar email?** → [EMAIL_SYSTEM.md](./EMAIL_SYSTEM.md)
- **...fazer upload para S3?** → [S3_TROUBLESHOOTING.md](./S3_TROUBLESHOOTING.md)
- **...integrar pagamento?** → [CIELO_API_GUIDE.md](./CIELO_API_GUIDE.md)
- **...fazer deploy?** → [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)

### "Qual é o status de..."

- **...bugs conhecidos?** → [KNOWN_BUGS.md](./KNOWN_BUGS.md)
- **...issues críticas?** → [CRITICAL_ISSUES.md](../CRITICAL_ISSUES.md)
- **...features pendentes?** → [PENDING_IMPLEMENTATION.md](./PENDING_IMPLEMENTATION.md)
- **...roadmap?** → [ROADMAP.md](./ROADMAP.md)

### "Estou com problema em..."

- **...autenticação** → [.cursorrules](../.cursorrules) - Bug #2
- **...middleware** → [.cursorrules](../.cursorrules) - Bug #3
- **...S3/Upload** → [S3_TROUBLESHOOTING.md](./S3_TROUBLESHOOTING.md)
- **...Email** → [EMAIL_SYSTEM.md](./EMAIL_SYSTEM.md)
- **...Pagamento** → [CIELO_API_GUIDE.md](./CIELO_API_GUIDE.md)

---

## 💡 Dicas de Uso

### Para Desenvolvedores

1. **Sempre** ler [CRITICAL_ISSUES.md](../CRITICAL_ISSUES.md) antes de deploy
2. **Sempre** consultar [.cursorrules](../.cursorrules) ao trabalhar em código
3. **Sempre** usar checklists de [DEV_CHECKLIST.md](./DEV_CHECKLIST.md)
4. **Sempre** atualizar documentação ao resolver bugs/features

### Para Tech Leads

1. Revisar [KNOWN_BUGS.md](./KNOWN_BUGS.md) semanalmente
2. Atualizar [ROADMAP.md](./ROADMAP.md) mensalmente
3. Garantir que [CRITICAL_ISSUES.md](../CRITICAL_ISSUES.md) está atual
4. Fazer code review usando [DEV_CHECKLIST.md](./DEV_CHECKLIST.md)

### Para QA

1. Usar [KNOWN_BUGS.md](./KNOWN_BUGS.md) para testes de regressão
2. Reportar novos bugs usando [BUG_REPORT_TEMPLATE.md](./BUG_REPORT_TEMPLATE.md)
3. Validar [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) antes de release

---

## 🤖 Para Cursor AI e Assistentes

Quando trabalhar neste projeto:

1. **SEMPRE** ler [.cursorrules](../.cursorrules) primeiro
2. **SEMPRE** verificar [CRITICAL_ISSUES.md](../CRITICAL_ISSUES.md)
3. **SEMPRE** consultar [KNOWN_BUGS.md](./KNOWN_BUGS.md) antes de modificar código
4. **SEMPRE** seguir padrões em [DEV_CHECKLIST.md](./DEV_CHECKLIST.md)
5. **SEMPRE** atualizar documentação ao fazer mudanças

Ordem de prioridade da documentação:

1. `.cursorrules` - Contexto geral e regras
2. `CRITICAL_ISSUES.md` - Problemas bloqueadores
3. `KNOWN_BUGS.md` - Bugs específicos
4. `DEV_CHECKLIST.md` - Workflow e padrões
5. Docs específicos (DB, Email, etc)

---

## 📞 Precisa de Ajuda?

**Dúvidas sobre documentação:**

- Abrir issue no GitHub
- Contatar Tech Lead
- Consultar time em [Canal do projeto]

**Encontrou erro na documentação:**

- Criar PR com correção
- Seguir guia "Como Manter Esta Documentação Atualizada"

**Sugestão de melhoria:**

- Abrir issue com label `documentation`
- Descrever melhoria proposta
- Aguardar feedback do time

---

## 📚 Recursos Externos

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [Lucia Auth](https://lucia-auth.com/)
- [shadcn/ui](https://ui.shadcn.com/)

---

**Mantenha a documentação sempre atualizada!**

**Última atualização:** 2025-11-05  
**Versão do Projeto:** 0.1.2  
**Responsável:** Time de Desenvolvimento Vinha Admin
