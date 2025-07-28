# Histórico de Versões - Vinha Admin Center

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.0.1] - 2024-07-30

### Adicionado

*   **Estrutura Inicial do Projeto:**
    *   Configuração do projeto Next.js com TypeScript e Tailwind CSS.
    *   Implementação da biblioteca de componentes ShadCN/UI.
*   **Painel de Administrador (`/admin`):**
    *   Layout principal com sidebar de navegação e cabeçalho.
    *   Páginas CRUD completas para Administradores, Gerentes, Supervisores, Pastores e Igrejas.
    *   Páginas de configuração para Regiões, Gateways de Pagamento (Cielo e Bradesco) e Configurações Gerais.
    *   Dashboard com KPIs e gráficos de exemplo.
    *   Página de Relatórios e Transações.
*   **Painéis por Perfil de Usuário:**
    *   Criação de layouts e páginas dedicadas para os perfis: Gerente (`/gerente`), Supervisor (`/supervisor`), Pastor (`/pastor`) e Igreja (`/igreja`).
    *   Cada painel possui dashboard, páginas de gerenciamento e perfil customizadas.
*   **Fluxo de Autenticação (`/auth`):**
    *   Criação das páginas de Login, Cadastro de Conta (Pastor e Igreja) e Recuperação de Senha.
    *   Implementação de um layout moderno de duas colunas para as telas de autenticação.
*   **Documentação:**
    *   Criação do `README.md` com a visão geral do projeto.
    *   Criação do `CONTRIBUTING.md` com as diretrizes e regras de desenvolvimento.
    *   Criação do `FRONTEND_DOCS.md` com detalhes da arquitetura do frontend.
    *   Início deste `CHANGELOG.md`.

### Corrigido

*   Corrigidos todos os links de navegação que resultavam em erro 404.
*   Ajustes de responsividade em toda a aplicação para garantir uma boa experiência em dispositivos móveis.
*   Refatoração da página de Regiões para usar modais, melhorando a fluidez da interface.
