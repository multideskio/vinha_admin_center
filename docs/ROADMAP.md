# 🗺️ Roadmap - Vinha Admin Center

> Planejamento de evolução do sistema. Para o histórico de versões lançadas, consulte [RELEASES.md](RELEASES.md).

---

## 🚀 Próxima Versão

### v0.5.0 - Testes, Monitoramento e Autenticação Avançada (Q2 2026)

#### 🔧 Testes e Qualidade

- [ ] Testes Automatizados (Vitest, integração, E2E com Playwright, coverage 80%+)
- [ ] Monitoramento de performance com logs centralizados e alertas

#### 🔒 Autenticação Avançada

- [ ] Login com Google (OAuth 2.0)
- [ ] Two-Factor Authentication (2FA)
- [ ] Auditoria completa de ações
- [ ] Compliance LGPD

#### 🔄 Dependências

- [ ] react-day-picker: 8.x → 9.x
- [ ] lint-staged: 15.x → 16.x
- [ ] zod: 3.x → 4.x

#### 📊 Relatórios Avançados

- [ ] Armazenamento de Relatórios no S3 com metadados
- [ ] Novos Tipos de Relatório (Eventos, Frequência, Aniversariantes)
- [ ] Agendamento automático de relatórios

#### 🔔 Notificações Melhoradas

- [ ] Templates visuais para notificações
- [ ] Notificações em massa com agendamento
- [ ] Métricas de entrega

#### 🔗 Integrações Pendentes

- [ ] Webhooks — envio de eventos do sistema para serviços externos (UI e API prontas, falta ativar)
- [ ] Chaves de API — gestão de acesso programático à API (UI pronta, falta hardening de segurança)
- [ ] Soft Delete completo — UI de restauração de registros deletados

#### 🎯 UX Pendente

- [ ] Command Palette (Ctrl+K) — Busca global + ações rápidas
- [ ] Bulk Actions — Ações em massa nas tabelas
- [ ] Notificações In-App — Bell icon com badge
- [ ] Breadcrumbs — Integração nas páginas
- [ ] Atalhos de Teclado — Navegação rápida

---

## 📌 Status

| Versão  | Status       | Previsão   |
| ------- | ------------ | ---------- |
| v0.12.0 | ✅ Concluída | 11/02/2026 |
| v0.11.0 | ✅ Concluída | 11/02/2026 |
| v0.5.0  | 📋 Planejada | Q2 2026    |

### ✅ Itens Concluídos (v0.12.0)

- ✅ Sistema de impersonation para suporte técnico
- ✅ Banner de modo suporte em todos os layouts
- ✅ Endpoint /api/v1/auth/me

### ✅ Itens Concluídos (v0.11.0)

- ✅ Refatoração de páginas admin concluída
- ✅ Índices de performance implementados (30+ índices)
- ✅ Tradução PT-BR completa (interface 100%)
- ✅ Sistema de autenticação com helpers (requireRole, requireAdmin, etc.)
- ✅ Scripts de gerenciamento de índices
- ✅ Documentação de refatoração admin

_Última atualização: 11 de Fevereiro de 2026_
