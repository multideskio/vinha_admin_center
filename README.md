# Vinha Admin Center

> Sistema Completo de Gestão para Igrejas e Organizações Religiosas

[![Version](https://img.shields.io/badge/version-0.1.2-blue.svg)](https://github.com/multideskio/vinha_admin_center)
[![Status](https://img.shields.io/badge/status-stable-green.svg)](https://github.com/multideskio/vinha_admin_center)
[![License](https://img.shields.io/badge/license-proprietary-red.svg)](LICENSE)
[![Private](https://img.shields.io/badge/access-private-red.svg)](https://github.com/multideskio/vinha_admin_center)

## 🔒 CONFIDENCIAL - Acesso Restrito

**⚠️ AVISO:** Este é um repositório **PRIVADO** da Multidesk.io. Acesso restrito apenas à equipe autorizada.

## 🎉 Versão 0.1.2 - Deploy Docker

Esta é a **primeira versão estável** do Vinha Admin Center, um sistema completo e profissional para gestão de igrejas, desenvolvido com as mais modernas tecnologias web.

**Versão 0.1.2** inclui deploy completo com Docker, documentação atualizada e otimizações de produção.

## 📋 Sobre o Projeto

O **Vinha Admin Center** é uma plataforma completa que oferece:

- **5 níveis de usuário** com painéis específicos (Admin, Manager, Supervisor, Pastor, Igreja)
- **Sistema de pagamentos** integrado (PIX, Cartão, Boleto)
- **Notificações automáticas** via Email e WhatsApp
- **Gestão completa** de perfis, contribuições e relatórios
- **Interface moderna** e responsiva

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+ 
- PostgreSQL 14+
- npm ou yarn

### Instalação

```bash
# Clonar o repositório
git clone https://github.com/multideskio/vinha_admin_center.git
cd vinha_admin_center

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas configurações

# Configurar banco de dados
npm run db:generate
npm run db:push
npm run db:seed

# Executar em desenvolvimento
npm run dev
```

O sistema estará disponível em `http://localhost:9002`

### Usuários de Teste

Após executar `npm run db:seed`, você terá acesso aos seguintes usuários:

```
Admin:      admin@vinha.com / admin123
Manager:    manager@vinha.com / manager123
Supervisor: supervisor@vinha.com / supervisor123
Pastor:     pastor@vinha.com / pastor123
Igreja:     igreja@vinha.com / igreja123
```

## ✨ Funcionalidades Principais

### 🏛️ **Painéis Administrativos**
- **Admin**: Gestão completa do sistema
- **Manager**: Supervisão de rede
- **Supervisor**: Gestão regional
- **Pastor**: Perfil pessoal e contribuições
- **Igreja**: Gestão da igreja

### 💳 **Sistema de Pagamentos**
- Integração completa com **Cielo API**
- Suporte a **PIX**, **Cartão de Crédito** e **Boleto**
- Confirmação automática via webhook
- Interface moderna e intuitiva

### 📊 **Dashboards e Relatórios**
- KPIs em tempo real
- Gráficos interativos
- Filtros por período
- Exportação PDF/Excel

### 🔔 **Sistema de Notificações**
- Email via **AWS SES**
- WhatsApp via **Evolution API v2**
- Templates personalizáveis
- Logs de auditoria

### 👤 **Gestão de Perfis**
- Upload de avatares (AWS S3)
- Redes sociais integradas
- Configurações personalizáveis
- Validação completa de dados

## 🛠️ Stack Tecnológica

### Frontend
- **Next.js 15.5.3** - Framework React
- **React 18.3.1** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **Radix UI** - Primitivos acessíveis

### Backend
- **Next.js API Routes** - Backend
- **PostgreSQL** - Banco de dados
- **Drizzle ORM** - Query builder
- **JWT** - Autenticação
- **bcrypt** - Hash de senhas

### Integrações
- **AWS S3** - Armazenamento de arquivos
- **AWS SES** - Envio de emails
- **Cielo API** - Gateway de pagamentos
- **Evolution API v2** - WhatsApp
- **ViaCEP** - Consulta de endereços

## 📚 Documentação

> **📖 ÍNDICE COMPLETO:** [docs/README.md](docs/README.md) - Navegação completa da documentação

### 🔴 **Documentos Críticos (Leitura Obrigatória)**
- 🚨 **[CRITICAL_ISSUES.md](CRITICAL_ISSUES.md)** - Issues que bloqueiam produção
- 🐛 **[KNOWN_BUGS.md](docs/KNOWN_BUGS.md)** - Todos os bugs conhecidos
- ✅ **[DEV_CHECKLIST.md](docs/DEV_CHECKLIST.md)** - Checklists de desenvolvimento
- 📝 **[BUG_REPORT_TEMPLATE.md](docs/BUG_REPORT_TEMPLATE.md)** - Template para reportar bugs

### 📘 **Documentação Técnica**
- **[Banco de Dados](docs/DB_DOCS.md)** - Schema e estrutura completa
- **[Sistema de Email](docs/EMAIL_SYSTEM.md)** - Email e notificações
- **[S3 Troubleshooting](docs/S3_TROUBLESHOOTING.md)** - Upload de arquivos
- **[API Cielo](docs/CIELO_API_GUIDE.md)** - Integração de pagamentos
- **[Configuração Cron](docs/CRON_SETUP.md)** - Notificações automáticas

### 🚀 **Deploy e Infraestrutura**
- **[Deploy Docker](docs/DOCKER_DEPLOY.md)** - Deploy com Docker
- **[Checklist de Produção](docs/PRODUCTION_CHECKLIST.md)** - Antes de deploy
- **[GitHub Actions](docs/GITHUB_ACTIONS.md)** - CI/CD

### 📝 **Planejamento**
- **[Changelog](docs/CHANGELOG.md)** - Histórico de versões
- **[Roadmap](docs/ROADMAP.md)** - Próximas funcionalidades
- **[Features Pendentes](docs/PENDING_IMPLEMENTATION.md)** - A implementar

### 🤖 **Para Cursor AI**
- **[.cursorrules](.cursorrules)** - Regras e contexto do projeto para IA

## 🛡️ Segurança e Qualidade

### 🎉 **Status: 100% PRONTO PARA PRODUÇÃO**

**✅ TODAS AS 4 ISSUES CRÍTICAS RESOLVIDAS!** (2025-11-05)

**Documentação:**
- 🚨 **[CRITICAL_ISSUES.md](CRITICAL_ISSUES.md)** - Todas as issues resolvidas
- 📋 **[KNOWN_BUGS.md](docs/KNOWN_BUGS.md)** - Status de bugs (12 total, 4 resolvidos)
- ✅ **[DEV_CHECKLIST.md](docs/DEV_CHECKLIST.md)** - Checklists de desenvolvimento

### ✅ **Issues Críticas Resolvidas**
- ✅ Build ignora erros de TypeScript - **CORRIGIDO**
- ✅ Autenticação duplicada (removido Lucia, mantido JWT) - **CORRIGIDO**
- ✅ Middleware com API incompatível - **CORRIGIDO**
- ✅ Sistema de manutenção não funcional - **CORRIGIDO**

**Sistema pronto para deploy em produção!** 🚀

### ✅ **Pontos Positivos**
- ✅ **Sistema completo** e funcional (em desenvolvimento)
- ✅ **Arquitetura sólida** com TypeScript strict mode
- ✅ **Error handling** implementado
- ✅ **Código bem estruturado** e organizado

### 🔒 **Recursos de Segurança**
- Autenticação JWT segura
- Controle de acesso baseado em roles
- Sanitização de dados
- Proteção contra XSS e CSRF
- Logs de auditoria completos

## 📊 **Estatísticas do Sistema**

- **5 painéis** administrativos completos
- **25+ formulários** estruturados
- **47 componentes UI** padronizados
- **50+ APIs** funcionais
- **3 métodos de pagamento** integrados
- **2 canais de notificação** (Email + WhatsApp)

## 🚀 **Comandos Disponíveis**

```bash
# Desenvolvimento
npm run dev          # Servidor de desenvolvimento (porta 9002)
npm run build        # Build para produção
npm run start        # Servidor de produção

# Qualidade de Código
npm run lint         # ESLint
npm run format       # Prettier
npm run typecheck    # Verificação TypeScript

# Banco de Dados
npm run db:generate  # Gerar migrações
npm run db:push      # Aplicar migrações
npm run db:seed      # Popular com dados de teste
npm run db:studio    # Interface visual do banco

# Utilitários
npm run notifications:test  # Testar notificações
```

## 🎯 **Roadmap**

### v0.2.0 - Melhorias e Otimizações
- [ ] Testes automatizados
- [ ] Monitoramento de performance
- [ ] Melhorias de acessibilidade
- [ ] Cache otimizado

### v0.3.0 - Expansão de Funcionalidades
- [ ] Sistema de eventos
- [ ] Gestão de membros avançada
- [ ] Relatórios financeiros detalhados
- [ ] Mais gateways de pagamento

## 📞 **Suporte**

Para suporte técnico ou dúvidas:
- 📧 Email: suporte@vinha.com
- 📚 Documentação: [docs/](docs/)
- 🐛 Issues: [GitHub Issues](https://github.com/multideskio/vinha_admin_center/issues)

## 📄 **Licença**

Este projeto é **proprietário** e **privado**. Todos os direitos reservados.

---

**Vinha Admin Center v0.1.2** - Sistema completo e profissional para gestão de igrejas! 🎉

Desenvolvido com ❤️ pela equipe MultiDesk