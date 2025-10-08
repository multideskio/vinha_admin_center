# 🗺️ Roadmap - Vinha Admin Center

## 📊 Sistema de Relatórios

### ✅ Concluído
- [x] Geração de relatórios em tempo real (PDF/Excel)
- [x] 4 tipos de relatórios: Financeiro, Membros, Igrejas, Contribuições
- [x] Filtros por período (data início/fim)
- [x] Download direto de arquivos
- [x] Preview do último relatório gerado
- [x] API endpoint `/api/v1/relatorios`

### 🔄 Próximas Melhorias
- [ ] **Armazenamento de Relatórios** (Alta Prioridade)
  - Criar tabela `reports` no banco de dados
  - Salvar arquivos PDF/Excel no S3
  - Metadados: tipo, período, usuário, data de geração, parâmetros
  - Histórico de relatórios gerados com links para download
  - Auditoria completa (quem gerou, quando, quais filtros)
  - Reutilização de relatórios já gerados (cache inteligente)
  
- [ ] **Relatórios Adicionais**
  - Relatório de Eventos
  - Relatório de Frequência (check-ins)
  - Relatório de Aniversariantes
  - Relatório de Dízimos por Igreja
  - Relatório Consolidado (dashboard executivo)

- [ ] **Agendamento de Relatórios**
  - Gerar relatórios automaticamente (diário, semanal, mensal)
  - Enviar por email para administradores
  - Notificações quando relatório estiver pronto

- [ ] **Filtros Avançados**
  - Filtrar por igreja específica
  - Filtrar por status de pagamento
  - Filtrar por método de pagamento
  - Comparação entre períodos

- [ ] **Visualizações**
  - Gráficos interativos (Chart.js ou Recharts)
  - Dashboard de métricas em tempo real
  - Exportar gráficos como imagem

## 🔔 Sistema de Notificações

### ✅ Concluído
- [x] Integração com Evolution API v2 (WhatsApp)
- [x] Integração com AWS SES (Email)
- [x] Templates personalizáveis no banco de dados
- [x] Interface de gerenciamento (`/admin/configuracoes/mensagens`)
- [x] 4 tipos de eventos: boas-vindas, pagamento recebido, lembretes, atrasos
- [x] Logs de notificações enviadas
- [x] **Sistema de Processamento Automático**
  - Endpoint cron `/api/v1/cron/notifications`
  - Controle de duplicação (não envia 2x)
  - Proteção com `CRON_SECRET`
  - Suporte a cron externo (cron-job.org, EasyCron, Vercel)
  - Documentação completa em `docs/CRON_SETUP.md`

### 🔄 Próximas Melhorias
- [ ] **Monitoramento e Alertas** (Alta Prioridade)
  - Dashboard de métricas de envio
  - Alertas se cron falhar
  - Taxa de entrega/abertura
  - Relatório de efetividade

- [ ] **Escalabilidade** (Alta Prioridade)
  - Migrar para fila (BullMQ + Redis)
  - Otimizar queries (evitar N+1)
  - Processamento em lote
  - Rate limiting

- [ ] **Notificações em Massa**
  - Enviar para grupos (todos pastores, todas igrejas, etc)
  - Agendamento de envios
  - Fila de processamento para grandes volumes

- [ ] **Templates Avançados**
  - Editor visual de templates
  - Prévia antes de enviar
  - Variáveis dinâmicas adicionais
  - Suporte a anexos

- [ ] **Automações Adicionais**
  - Notificação automática de aniversário
  - Lembrete de renovação de cadastro
  - Confirmação de eventos

## 📁 Sistema de Arquivos

### ✅ Concluído
- [x] Upload de avatares para S3
- [x] Integração com CloudFront para CDN
- [x] Configuração por empresa (multi-tenant)
- [x] Avisos quando S3 não configurado

### 🔄 Próximas Melhorias
- [ ] **Gestão de Documentos**
  - Upload de documentos (PDFs, DOCs)
  - Biblioteca de arquivos por igreja
  - Controle de versões
  - Permissões de acesso

- [ ] **Otimização de Imagens**
  - Redimensionamento automático
  - Compressão de imagens
  - Múltiplos tamanhos (thumbnail, medium, large)
  - Conversão para WebP

## 👥 Gestão de Usuários

### ✅ Concluído
- [x] CRUD completo para todos os níveis (Admin, Pastor, Supervisor, Manager)
- [x] Paridade de features entre todos os perfis
- [x] Mensagens via WhatsApp e Email
- [x] Gestão de redes sociais
- [x] Histórico de transações
- [x] Configurações de notificações

### 🔄 Próximas Melhorias
- [ ] **Permissões Granulares**
  - Sistema de roles e permissions customizável
  - Permissões por módulo
  - Grupos de permissões

- [ ] **Auditoria Avançada**
  - Log de todas as ações
  - Histórico de alterações (audit trail)
  - Relatório de atividades por usuário

- [ ] **Importação em Massa**
  - Importar usuários via CSV/Excel
  - Validação de dados
  - Preview antes de importar

## 💳 Sistema de Pagamentos

### ✅ Concluído
- [x] Integração com Cielo API
- [x] Registro de transações
- [x] Histórico de pagamentos

### 🔄 Próximas Melhorias
- [ ] **Múltiplos Gateways**
  - Suporte a PagSeguro
  - Suporte a Mercado Pago
  - Suporte a PIX

- [ ] **Assinaturas Recorrentes**
  - Dízimos mensais automáticos
  - Gestão de planos
  - Cancelamento e reativação

- [ ] **Conciliação Bancária**
  - Importar extratos bancários
  - Reconciliação automática
  - Relatório de divergências

## 🏛️ Gestão de Igrejas

### ✅ Concluído
- [x] CRUD de igrejas
- [x] Perfil completo com avatar e redes sociais
- [x] Mensagens e notificações

### 🔄 Próximas Melhorias
- [ ] **Eventos**
  - Calendário de eventos por igreja
  - Inscrições online
  - Check-in de presença
  - Certificados de participação

- [ ] **Células/Grupos**
  - Gestão de células
  - Líderes de célula
  - Relatórios de frequência

- [ ] **Patrimônio**
  - Inventário de bens
  - Manutenções programadas
  - Controle de chaves

## ⚙️ Configurações da Empresa

### ✅ Concluído
- [x] Upload de logo da empresa (S3)
- [x] Nome da aplicação customizável
- [x] Email de suporte configurável
- [x] Modo de manutenção
- [x] Logo exibido em header e sidebar
- [x] Página de manutenção customizada
- [x] Metadata dinâmica (SEO)

### 🔄 Próximas Melhorias
- [ ] **Temas Customizáveis**
  - Cores primárias/secundárias
  - Fontes personalizadas
  - Modo claro/escuro forçado

## 📱 Mobile & PWA

### 🔄 Futuro
- [ ] **Progressive Web App**
  - Instalável em dispositivos móveis
  - Funciona offline
  - Notificações push

- [ ] **App Nativo**
  - React Native
  - iOS e Android
  - Sincronização offline

## 🔒 Segurança

### 🔄 Próximas Melhorias
- [ ] **Autenticação Avançada**
  - Two-Factor Authentication (2FA)
  - Login com Google/Facebook
  - Biometria (mobile)

- [ ] **Compliance**
  - LGPD - Termos de uso e privacidade
  - Exportação de dados pessoais
  - Direito ao esquecimento

## 📈 Analytics & BI

### 🔄 Futuro
- [ ] **Dashboard Executivo**
  - KPIs principais
  - Gráficos de tendências
  - Comparações período a período

- [ ] **Inteligência de Dados**
  - Previsão de receitas
  - Análise de churn
  - Segmentação de membros

## 🛠️ Infraestrutura

### 🔄 Próximas Melhorias
- [ ] **Performance**
  - Cache com Redis
  - Otimização de queries
  - Lazy loading de componentes

- [ ] **Monitoramento**
  - Logs centralizados
  - Alertas de erro
  - Métricas de performance

- [ ] **Testes**
  - Testes unitários (Jest)
  - Testes de integração
  - Testes E2E (Playwright)

---

## 📝 Legenda

- ✅ **Concluído**: Feature implementada e em produção
- 🔄 **Próximas Melhorias**: Planejado para implementação
- 🔮 **Futuro**: Ideias para longo prazo

## 🎯 Prioridades

### Alta Prioridade
1. **Monitoramento de Notificações** - Dashboard e alertas
2. **Escalabilidade de Notificações** - Fila com Redis
3. **Armazenamento de Relatórios** - Histórico no S3
4. **Permissões Granulares** - Sistema de roles customizável

### Média Prioridade
5. Relatórios Adicionais (Eventos, Frequência)
6. Gestão de Eventos (Calendário, Inscrições)
7. Two-Factor Authentication (2FA)
8. Notificações em Massa

### Baixa Prioridade
9. App Mobile (PWA/React Native)
10. Analytics Avançado (BI)
11. Múltiplos Gateways de Pagamento
