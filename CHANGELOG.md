# Histórico de Versões - Vinha Admin Center

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.0.5] - 2024-08-01

### Adicionado
*   **API REST para Administradores:**
    *   Criação dos endpoints `GET` e `POST` em `/api/v1/administradores` para listar e criar administradores.
    *   Criação dos endpoints dinâmicos `GET`, `PUT` e `DELETE` em `/api/v1/administradores/[id]` para gerenciar administradores específicos.
*   **API REST para Gateways de Pagamento:**
    *   Criação do endpoint `GET /api/v1/gateways` para listar as configurações de todos os gateways.
    *   Criação de rotas dinâmicas como `/api/v1/gateways/cielo` e `/api/v1/gateways/bradesco` para buscar (`GET`) e salvar (`PUT`) configurações específicas.
*   **API para Dashboard do Admin:**
    *   Implementado o endpoint `GET /api/v1/dashboard/admin` para fornecer dados agregados (KPIs, estatísticas) para o painel principal.
*   **Documentação da API da Cielo:**
    *   Adicionado o arquivo `CIELO_API_GUIDE.md` com um guia técnico completo para a integração, incluindo exemplos de cURL para Cartão de Crédito, Boleto, PIX, e instruções para cancelamento e consulta.

### Corrigido
*   **Valores Nulos em Formulários:** Corrigido o erro "Expected string, received null" nos formulários de configuração de gateway, garantindo que valores nulos do banco de dados sejam tratados corretamente.

## [1.0.4] - 2024-07-31

### Adicionado
*   **API REST para Regiões:**
    *   Criação do endpoint `GET /api/v1/regioes` para listar todas as regiões ativas, ordenadas pela data de atualização.
    *   Criação do endpoint `POST /api/v1/regioes` para adicionar novas regiões.
    *   Criação dos endpoints dinâmicos `PUT` e `DELETE` em `/api/v1/regioes/[id]` para atualizar e excluir (soft delete) regiões específicas.
*   **Refatoração do Frontend de Regiões:**
    *   A página `/admin/regioes` foi totalmente refatorada para consumir a nova API REST, utilizando `fetch` no lado do cliente para todas as operações CRUD.
    *   As antigas Server Actions (`getRegions`, `saveRegion`, `deleteRegion`) foram removidas em favor da nova arquitetura de API.

### Corrigido
*   **Falha na Consulta de Regiões:** Resolvido o problema crítico onde a listagem de regiões retornava um array vazio. A causa raiz era uma inconsistência no schema do Drizzle (`church_profiles`) que causava um erro em cascata, impedindo a consulta correta.
*   **Erro de "Não Autorizado":** Corrigido o erro que impedia a manipulação de regiões (criação, exclusão) ao remover a dependência de um usuário autenticado nas rotas da API durante o desenvolvimento.
*   **Atualização de `updatedAt`:** A função de atualização de região agora define corretamente o campo `updatedAt` no banco de dados.

### Melhorias
*   **Ambiente de Desenvolvimento:** Removida temporariamente a validação de sessão (`validateRequest`) de todos os `layout.tsx` dos painéis (`/admin`, `/gerente`, etc.) para agilizar o desenvolvimento e evitar redirecionamentos indesejados. Os dados do usuário agora usam um fallback para evitar quebras na interface.

## [1.0.3] - 2024-07-31

### Adicionado

*   **Sistema de Autenticação Completo:**
    *   Implementação do `lucia-auth` para gerenciamento de sessões seguras baseadas em cookies.
    *   Adição da tabela `sessions` ao esquema do banco de dados para armazenar sessões de usuários.
    *   Criação das Server Actions `loginUser` e `logoutUser` para lidar com o fluxo de autenticação no backend.
*   **Integração do Login:**
    *   A página de login (`/auth/login`) agora se comunica com a ação `loginUser` para autenticar os usuários.
    *   Implementação de um painel de logs na tela de login para exibir o feedback do processo de autenticação, incluindo erros detalhados do backend para facilitar a depuração.
*   **Redirecionamento Pós-Login:**
    *   Após o login bem-sucedido, os usuários são automaticamente redirecionados para o dashboard correspondente ao seu perfil (`/admin`, `/gerente`, etc.).
*   **Exibição de Dados Dinâmicos:**
    *   O cabeçalho de todos os painéis agora busca e exibe dinamicamente o nome e o e-mail do usuário autenticado.
*   **Backend para Regiões:**
    *   Criação das Server Actions (`getRegions`, `saveRegion`, `deleteRegion`) para gerenciar as regiões no banco de dados.
    *   A página `/admin/regioes` foi totalmente conectada ao backend, permitindo a criação, edição e exclusão de regiões em tempo real.

### Corrigido

*   Corrigido um problema crítico no script de `seed` onde a senha padrão não era carregada corretamente, resultando em hashes de senha inválidos.
*   Resolvido o problema de a sessão do usuário não persistir entre as navegações, ajustando a lógica de validação de sessão no `lucia.ts`.


## [1.0.2] - 2024-07-30

### Adicionado

*   **Configuração do Banco de Dados:**
    *   Configuração da conexão com o banco de dados PostgreSQL através de variáveis de ambiente seguras (`.env.local`).
    *   Criação dos arquivos `.env.example` e `.env.backup` para seguir as boas práticas de desenvolvimento.
*   **Estrutura de Dados com Drizzle ORM:**
    *   Definição do esquema completo do banco de dados em `src/db/schema.ts`.
    *   Criação da tabela `companies` para centralizar as configurações do sistema.
    *   Implementação de chaves primárias `UUID` em todas as tabelas para maior segurança.
    *   Adição de funcionalidade de "soft delete" (`deletedAt`, `deletedBy`, `deletionReason`) em tabelas críticas para permitir a recuperação de dados e auditoria.
*   **Scripts de Banco de Dados:**
    *   Adição dos comandos `npm run db:generate` e `npm run db:push` para gerenciamento de migrações.
    *   Criação do comando `npm run db:seed` para popular o banco de dados com dados de exemplo para todos os perfis de usuário.
    *   Adição do comando de conveniência `npm run db:rollback` para resetar o banco de dados durante o desenvolvimento.
*   **Segurança:**
    *   Implementação de hashing de senhas com `bcrypt` no script de seed para garantir o armazenamento seguro das credenciais.

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
