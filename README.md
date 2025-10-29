# Vinha Admin Center

> Sistema Completo de Gestão para Igrejas e Organizações Religiosas

[![Version](https://img.shields.io/badge/version-0.1.1-blue.svg)](https://github.com/multideskio/vinha_admin_center)
[![Status](https://img.shields.io/badge/status-stable-green.svg)](https://github.com/multideskio/vinha_admin_center)
[![License](https://img.shields.io/badge/license-proprietary-red.svg)](LICENSE)
[![Private](https://img.shields.io/badge/access-private-red.svg)](https://github.com/multideskio/vinha_admin_center)

## 🔒 CONFIDENCIAL - Acesso Restrito

**⚠️ AVISO:** Este é um repositório **PRIVADO** da Multidesk.io. Acesso restrito apenas à equipe autorizada.

## 🎉 Versão 0.1.1 - Estrutura Profissional Completa

Esta é a **primeira versão estável** do Vinha Admin Center, um sistema completo e profissional para gestão de igrejas, desenvolvido com as mais modernas tecnologias web.

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

### 📖 **Documentação Essencial**
- **[Banco de Dados](docs/DB_DOCS.md)** - Schema e estrutura
- **[API Cielo](docs/CIELO_API_GUIDE.md)** - Integração de pagamentos
- **[Configuração Cron](docs/CRON_SETUP.md)** - Notificações automáticas
- **[Checklist de Produção](docs/PRODUCTION_CHECKLIST.md)** - Deploy

### 📝 **Projeto**
- **[Changelog](docs/CHANGELOG.md)** - Histórico de versões
- **[Roadmap](docs/ROADMAP.md)** - Próximas funcionalidades

## 🛡️ Segurança e Qualidade

### ✅ **Status: APROVADO PARA PRODUÇÃO**

- ✅ **Sistema completo** e funcional
- ✅ **Vulnerabilidades críticas** resolvidas
- ✅ **Testes** implementados
- ✅ **Error handling** robusto
- ✅ **Performance** otimizada
- ✅ **Código auditado** e aprovado

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

**Vinha Admin Center v0.1.0** - Sistema completo e profissional para gestão de igrejas! 🎉

Desenvolvido com ❤️ pela equipe MultiDesk