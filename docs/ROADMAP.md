# 🗺️ Roadmap - Vinha Admin Center

## 📊 Sistema de Relatórios

### ✅ Concluído
- [x] Geração de relatórios em tempo real (PDF/Excel)
- [x] 4 tipos de relatórios: Financeiro, Membros, Igrejas, Contribuições
- [x] Filtros por período (data início/fim)
- [x] Download direto de arquivos

### 🔄 Próximas Melhorias
- [ ] **Armazenamento de Relatórios**
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
- [x] Notificações de boas-vindas
- [x] Lembretes de pagamento
- [x] Logs de notificações enviadas

### 🔄 Próximas Melhorias
- [ ] **Notificações em Massa**
  - Enviar para grupos (todos pastores, todas igrejas, etc)
  - Agendamento de envios
  - Fila de processamento para grandes volumes

- [ ] **Templates Avançados**
  - Editor visual de templates
  - Prévia antes de enviar
  - Variáveis dinâmicas adicionais
  - Suporte a anexos

- [ ] **Automações**
  - Notificação automática de aniversário
  - Lembrete de renovação de cadastro
  - Alertas de inadimplência
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
1. Armazenamento de Relatórios
2. Notificações em Massa
3. Permissões Granulares

### Média Prioridade
4. Relatórios Adicionais
5. Gestão de Eventos
6. Two-Factor Authentication

### Baixa Prioridade
7. App Mobile
8. Analytics Avançado
9. Múltiplos Gateways de Pagamento
