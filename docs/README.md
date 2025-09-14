# Vinha Admin Center

Este é o painel de administração para o sistema Vinha Ministérios.

## Visão Geral do Projeto

O Vinha Admin Center é uma aplicação completa construída com Next.js e TypeScript, projetada para gerenciar todos os aspectos do sistema de ministérios, incluindo usuários, igrejas, transações e configurações. A interface é construída com **ShadCN/UI** para componentes modernos e responsivos e **Tailwind CSS** para estilização. O backend utiliza **PostgreSQL** com **Drizzle ORM**, e a autenticação é gerenciada de forma segura com **Lucia Auth**.

## Estrutura de Perfis de Usuário

O sistema suporta múltiplos níveis de acesso, cada um com seu próprio painel e permissões, garantindo que cada usuário tenha acesso apenas às ferramentas e dados relevantes para sua função:

- **Administrador (`/admin`):** Acesso total a todas as funcionalidades do sistema, incluindo gerenciamento de todos os outros usuários, configurações globais e relatórios.
- **Gerente (`/manager`):** Visualiza e gerencia uma rede específica de supervisores, pastores e igrejas.
- **Supervisor (`/supervisor`):** Supervisiona um grupo de pastores e igrejas dentro de uma região.
- **Pastor (`/pastor`):** Gerencia seu próprio perfil, contribuições e pode estar associado a uma ou mais igrejas.
- **Igreja (`/igreja`):** Gerencia suas próprias informações, finanças e membros.

## Funcionalidades Principais

- **Autenticação Segura:** Sistema de login robusto com gerenciamento de sessões e hashing de senhas.
- **Dashboards Interativos:** Cada nível de usuário possui um dashboard customizado com KPIs, gráficos e dados relevantes para suas responsabilidades.
- **Gerenciamento de Usuários:** CRUD completo para todos os níveis de usuários (Gerentes, Supervisores, Pastores, etc.).
- **Gestão Financeira:** Acompanhamento de transações, contribuições (dízimos e ofertas) e relatórios financeiros.
- **Configurações de Gateway:** Integração com gateways de pagamento como Cielo e Bradesco.
- **Layout Responsivo:** A aplicação é totalmente otimizada para uso em dispositivos móveis e desktops.

## Primeiros Passos

Para iniciar o projeto em ambiente de desenvolvimento, execute o seguinte comando:

```bash
npm run dev
```

Isso iniciará o servidor de desenvolvimento do Next.js, geralmente na porta `http://localhost:3002`.
