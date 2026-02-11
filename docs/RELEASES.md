# 📦 Releases - Vinha Admin Center

Histórico de todas as versões lançadas do sistema.

---

## v0.6.0 - SEO com Open Graph e Twitter Card (Fevereiro 2026)

### 🔍 SEO e Metadata

- Open Graph metadata com título, descrição, imagem 1200x630 e locale pt_BR
- Twitter Card (summary_large_image) com imagem de preview
- metadataBase configurada via `NEXT_PUBLIC_APP_URL`
- Nova imagem de background para compartilhamento social

---

## v0.5.0 - Suporte Neon/Vercel & Migration Bradesco (Fevereiro 2026)

### 🔧 Banco de Dados e Ambiente

- Suporte a `POSTGRES_URL` e `POSTGRES_URL_NON_POOLING` injetadas pela integração Neon/Vercel
- Validação Zod com `.refine()` garantindo pelo menos uma URL de banco configurada
- Pool de conexão usa `POSTGRES_URL` (pooled) com fallback para `DATABASE_URL`
- Migrations usam `POSTGRES_URL_NON_POOLING` (conexão direta) com fallback para `DATABASE_URL`
- Compatibilidade total mantida com setup local via `DATABASE_URL`

### 💾 Migration

- Nova tabela `bradesco_logs` para logs de operações do gateway
- Campo `pix_key` em `gateway_configurations`
- Campo `gateway` em `transactions`

---

## v0.4.1 - Versionamento Dinâmico, UX Avançada & Documentação Estruturada (Fevereiro 2026)

### 📋 Documentação e Versionamento

- Badge de versão dinâmico na sidebar do admin (lê do package.json)
- Páginas `/admin/changelog` e `/admin/roadmap` com versão dinâmica
- Nova página `/admin/releases` com histórico completo de versões
- Separação clara: ROADMAP (futuro) vs RELEASES (passado) vs CHANGELOG (detalhado)
- ROADMAP limpo focando apenas na próxima versão (v0.5.0)

### 🤖 Automação

- Hook de commit atualizado para v3 com suporte a RELEASES.md
- Hook agora atualiza automaticamente CHANGELOG, RELEASES, ROADMAP e versão do package.json

### 🔗 Navegação

- Link "Releases" adicionado ao dropdown do header admin
- Ícone Package do Lucide para identificação visual

### 🔍 Funcionalidades Existentes Documentadas

Funcionalidades que já existiam no código mas não estavam registradas:

- Busca Global com debounce, agrupamento por tipo e badges de status
- Quick Profile Modal com hierarquia, resumo financeiro e últimas transações
- Send Message Dialog para envio de Email e WhatsApp direto do perfil
- Fraud Alert com níveis de risco, estatísticas e transações fraudulentas
- Avatar Upload com verificação S3, preview e loading state
- Date Range Picker com calendário duplo e locale pt-BR
- Configuração OpenAI para agentes/IA
- Payment Guard — proteção contra duplicação de pagamentos
- Notification Dedup — deduplicação inteligente por tipo de notificação
- Webhook Reconciliation — reconciliação com retry e backoff exponencial
- Action Logger — auditoria de ações com validação UUID
- Template Engine — templates com variáveis dinâmicas e condicionais
- Log Sanitizer — sanitização automática de dados sensíveis em logs
- Rate Limiter — rate limiting com presets por endpoint
- Env Validator — validação centralizada de variáveis de ambiente com Zod

---

## v0.4.0 - Gateway Bradesco, Performance & Segurança Enterprise (Fevereiro 2026)

### 💳 Novo Gateway Bradesco

- Integração completa com OAuth 2.0, PIX e Boleto
- Schema de banco (bradesco_logs, campo gateway, pixKey)
- Endpoints de configuração e upload de certificado digital
- Webhook e cron sync para sincronização automática
- Roteamento multi-gateway (Cielo + Bradesco)
- UI admin com componentes de pagamento

### ⚡ Performance e Cache Redis

- Cache Redis nas rotas de listagem admin
- Invalidação de cache nas rotas de mutação
- Cache em relatórios, insights e transações
- Centralização Redis em singleton
- Paralelização de queries no dashboard
- `.limit()` em todas as queries e otimização N+1

### 🔒 Segurança Enterprise

- CSP, HSTS e Permissions-Policy no middleware
- Rate limiting e validação Zod em endpoints públicos
- Timeout com AbortController (Edge Runtime compatible)
- Sanitização de logs e remoção de catch vazios
- Validação de env com Zod centralizado em 40+ arquivos
- Resiliência Redis com dedup e lock distribuído

### ♻️ Refatorações e Qualidade

- Componentes PageHeader e PaginationControls reutilizáveis
- Phone-input migrado para componente interno
- Transações atômicas em seed, bootstrap, auth e notificações
- Relatórios com camada de serviço separada
- Logging estruturado em todo o sistema
- Tipos SessionUser e SmtpTransporter

### ✨ Funcionalidades

- Persistência de tema dark/light no localStorage
- Relatórios com paginação server-side
- Schemas Zod para relatórios com tipos e testes
- Typecheck no pre-commit hook (Husky)

### 📊 Estatísticas

| Métrica               | Valor                |
| --------------------- | -------------------- |
| Commits desde v0.3.0  | 95                   |
| Novas funcionalidades | 61                   |
| Correções             | 14                   |
| Gateways de pagamento | 2 (Cielo + Bradesco) |

---

## v0.3.0 - Estabilidade Total & Correção de Bugs Críticos (Novembro 2025)

### 🐛 Correções Críticas

- 7 bugs corrigidos (2 críticos, 3 médios, 2 baixos)
- 4 vulnerabilidades de segurança eliminadas
- Correção crítica — APIs de gerentes protegidas (Janeiro 2026)
- Performance otimizada — Dashboard 98% mais rápido
- Webhook Cielo confiável com retry automático
- Upload seguro com validações completas
- Autenticação robusta contra timing attacks

### 🔧 Correções de API Routes

- Hardcoded User ID em notificações corrigido
- Webhook Cielo retorna erro correto (500)
- Cron auth com timingSafeEqual
- Dashboard N+1 otimizado (200+ → 3 queries)
- Upload validation completa (tipo, tamanho, pasta)
- Host header sanitizado em reset password

### 🎨 Melhorias de UX

- 4 layouts corrigidos (Manager, Supervisor, Pastor, Igreja)
- Logout silencioso em todos os perfis
- Sistema de Regiões com validação de unicidade e cores pré-definidas
- Interface moderna com grid de cores sugeridas

### 📊 Estatísticas

| Métrica                     | Valor         |
| --------------------------- | ------------- |
| Bugs corrigidos             | 7/8 (87.5%)   |
| Vulnerabilidades eliminadas | 4             |
| Melhoria de performance     | 98% (queries) |

---

## v0.2.0 - Design System Videira & Auditoria Completa (Novembro 2025)

### 🎨 Design System Videira

- Paleta de cores Videira extraída do logo
- Gradientes dinâmicos em todos os headers
- 100% das páginas /admin redesenhadas
- Sidebar moderna com menu maior e hover effects
- Cards premium com bordas coloridas
- Skeleton loaders detalhados
- KPIs redesenhados com visual moderno

### 🔍 Auditoria Completa

- 35 arquivos auditados (libs, actions, workers, hooks)
- 5 documentos de auditoria criados
- 10 bugs corrigidos
- Sistema SES — 27 correções aplicadas
- Sistemas WhatsApp, S3 e OpenAI validados

### ✨ Funcionalidades

- Página de perfil do admin logado (`/admin/perfil`)
- Relatórios paginados (4 páginas completas)
- Exportação CSV com filtros
- Greeting personalizado no dashboard
- Notificações customizadas via templates

### 📊 Estatísticas

| Métrica              | Valor |
| -------------------- | ----- |
| Arquivos modificados | 80+   |
| Páginas redesenhadas | 30+   |
| APIs validadas       | 35+   |

---

## v0.1.2 - Melhorias e Análise Completa (Janeiro 2025)

### ✨ Melhorias

- Deploy com Docker completo e documentado
- S3 Troubleshooting — Correção de URLs e ACL
- Análise completa de funcionalidades pendentes
- Cielo parcelamento implementado
- Relatórios com preview antes de exportar
- Type safety melhorado em todo o sistema

---

## v0.1.1 - Infraestrutura Profissional (Janeiro 2025)

### 🔧 Infraestrutura

- GitHub Templates completos (Issues, PRs, Security)
- CI/CD Pipeline configurado (GitHub Actions)
- Dependabot ativo para atualizações automáticas
- Scripts locais de qualidade e verificação
- Licença proprietária e documentação interna
- 8 dependências atualizadas com segurança

---

## v0.1.0 - Lançamento Inicial (Janeiro 2025)

### 🎉 Sistema Completo

- 5 painéis administrativos completos e funcionais
- Sistema de pagamentos integrado (PIX, Cartão, Boleto)
- Notificações automáticas via Email e WhatsApp
- Gestão completa de perfis com upload de avatares
- Dashboards e relatórios em tempo real
- Interface moderna e responsiva
- Arquitetura robusta e escalável

### 📊 Estatísticas

| Métrica                 | Valor |
| ----------------------- | ----- |
| Painéis administrativos | 5     |
| Componentes UI          | 47    |
| APIs funcionais         | 50+   |
| Métodos de pagamento    | 3     |
