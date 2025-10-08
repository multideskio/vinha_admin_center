# Histórico de Versões - Vinha Admin Center

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.6.0] - 2025-01-15

### Adicionado

- **Sistema de Relatórios Completo:**
  - Geração de relatórios em tempo real com exportação para PDF e Excel
  - 4 tipos de relatórios: Financeiro, Membros, Igrejas e Contribuições
  - Filtros por período com seleção de datas (início e fim)
  - Preview do último relatório gerado com resumo de dados
  - Consultas otimizadas ao banco de dados para agregação de dados
  - Bibliotecas integradas: jsPDF, jsPDF-AutoTable e XLSX
  - API endpoint `/api/v1/relatorios` para geração de relatórios
- **Páginas de Documentação Dinâmicas:**
  - Página `/admin/roadmap` renderizando `docs/ROADMAP.md` dinamicamente
  - Página `/admin/changelog` renderizando `docs/CHANGELOG.md` dinamicamente
  - Links adicionados no menu dropdown do perfil do usuário
  - Integração com `react-markdown` e `remark-gfm` para renderização
  - Estilização automática com `@tailwindcss/typography`
- **Avatar do Usuário no Header:**
  - Avatar do usuário logado agora é exibido no header
  - Busca automática da imagem do perfil no banco de dados
  - Exibição do nome completo do usuário ao invés de apenas email
  - Fallback com iniciais quando não há avatar configurado

### Melhorias

- **Organização de Código:**
  - Criado arquivo `src/db/index.ts` para centralizar exports do banco de dados
  - Criado `src/lib/report-generator.ts` para geração de relatórios
  - Melhorias na estrutura de queries do banco de dados
- **Interface do Usuário:**
  - Menu dropdown do perfil reorganizado com novos links
  - Ícones atualizados (MapPin para Roadmap, History para Changelog)
  - Páginas de documentação agora leem diretamente de `docs/` (fonte única de verdade)
  - Suporte a dark mode nas páginas de documentação

### Corrigido

- **Erro de Build:** Resolvido erro "Module not found: Can't resolve '@/db'" criando arquivo de índice na pasta db

## [1.5.0] - 2024-12-20

### Adicionado

- **Paridade Completa de Features:**
  - Todas as páginas de perfil (Admin, Manager, Supervisor, Pastor, Igreja) agora possuem funcionalidades idênticas
  - Sistema de mensagens via WhatsApp e Email em todos os perfis
  - Upload de avatares com integração S3 para todos os usuários
  - Gestão de redes sociais (Facebook, Instagram, Website) com auto-save
  - Configurações de notificações personalizáveis por usuário
  - Histórico de transações em todos os perfis

### Melhorias

- **Componente PhoneInput Padronizado:**
  - Substituição de todas as instâncias diretas de `react-phone-input-2` pelo componente customizado
  - Integração completa com design system
  - Suporte a tipos mobile e landline
  - TypeScript types adequados
- **Auto-save de Redes Sociais:**
  - Links de redes sociais salvam automaticamente ao perder foco (onBlur)
  - Não requer submissão de formulário
  - Feedback visual de salvamento

### Corrigido

- **Bug de Links de Redes Sociais:** Corrigido problema onde links não eram salvos corretamente
- **Erros de TypeScript:** Resolvidos todos os erros de compilação relacionados a tipos
- **Configuração CloudFront:** Corrigida integração entre S3 (upload) e CloudFront (serving)

## [1.4.0] - 2024-11-15

### Adicionado

- **Sistema de Notificações via WhatsApp:**
  - Integração completa com Evolution API v2
  - Headers corretos (apikey ao invés de Bearer)
  - Payload estruturado com delay e linkPreview
  - Tratamento de respostas e erros
- **Sistema de Notificações via Email:**
  - Integração com AWS SES
  - Templates HTML personalizáveis
  - Suporte a variáveis dinâmicas
- **Templates de Mensagens:**
  - Tabela `message_templates` no banco de dados
  - Engine de templates com suporte a variáveis ({{name}}, {{churchName}})
  - Suporte a condicionais ({{#if variable}})
  - Templates para boas-vindas e lembretes de pagamento
- **Logs de Notificações:**
  - Tabela `notification_logs` para auditoria
  - Registro de status (sucesso/falha)
  - Armazenamento de mensagens de erro

### Melhorias

- **Multi-tenant:** Todas as notificações são scoped por companyId
- **Configurações S3:** Sistema de avisos quando credenciais não estão configuradas

## [1.0.8] - 2024-08-08

### Corrigido

- **Erro Crítico de Servidor Interno:** Corrigido um erro que causava falha na renderização de todas as páginas autenticadas. A função `validateRequest` não estava sendo exportada corretamente do `lib/auth.ts`, impedindo que os layouts de perfil verificassem a sessão do usuário.
- **Tipagem de Formulários e Componentes:** Ajustes finos de tipagem foram feitos para garantir que valores `null` de `react-hook-form` sejam corretamente tratados como `undefined` ou strings vazias antes de serem passados para os componentes de UI, resolvendo os últimos erros de compilação.
- **Assinatura de Função de Logout:** A função `logoutUser` foi ajustada para ser compatível com o atributo `action` dos formulários do React.
- **Importações Ausentes:** Adicionadas importações que faltavam em diversos componentes, como `zodResolver` e `CartesianGrid`, que causavam falhas no build.

## [1.0.7] - 2024-08-05

### Adicionado

- **Segurança de API com API Key:**
  - Adicionada a tabela `api_keys` ao banco de dados para armazenar chaves de API seguras.
  - Implementado um middleware de autenticação (`src/lib/api-auth.ts`) para proteger todos os endpoints da API. Requisições sem uma chave válida no cabeçalho `Authorization` são bloqueadas.
  - Criada a página e as rotas da API (`/api/v1/api-keys`) para o gerenciamento completo (CRUD) de chaves de API pelo painel de administrador.
- **Conexão de Dados Reais (Admin):**
  - Os KPIs e gráficos do dashboard do administrador (`/admin/dashboard`) agora consomem dados reais da API, incluindo o cálculo de variação percentual em relação ao mês anterior.
  - A página de transações do administrador (`/admin/transacoes`) foi conectada ao backend, exibindo a lista de todas as transações reais do sistema.
  - A aba "Transações" dentro do perfil de cada usuário (gerente, pastor, etc.) agora exibe o histórico de transações real e específico daquele usuário.
- **Melhorias na Interface (Admin):**
  - Adicionada uma nova aba "Configurações" no perfil de cada tipo de usuário (Gerente, Supervisor, Pastor, Igreja) dentro do painel do admin, preparando o local para o gerenciamento de notificações.

### Corrigido

- **Redirecionamento de Login do Gerente:** Corrigido o mapeamento de rota pós-login para o perfil de `manager`, que agora redireciona corretamente para `/manager` em vez de `/gerente`.

### Melhorias

- **Organização de Rotas da API:** As rotas de API para cada perfil foram organizadas em subdiretórios (`/api/v1/admin`, `/api/v1/manager`), melhorando a estrutura e clareza do backend.

## [1.0.6] - 2024-08-02

### Adicionado

- **API REST para Gerentes:**
  - Criação dos endpoints `GET` e `POST` em `/api/v1/manager/gerentes` para listar e criar gerentes.
  - Criação dos endpoints dinâmicos `GET`, `PUT` e `DELETE` em `/api/v1/manager/gerentes/[id]` para gerenciar gerentes específicos.
  - Criação do endpoint `GET /api/v1/manager/dashboard` para fornecer dados agregados para o painel do gerente.
  - Criação do endpoint `GET /api/v1/manager/perfil` para buscar os dados do perfil do gerente logado.
- **Conexão do Frontend com a API:**
  - A página `/manager/gerentes` agora consome a nova API para listar, criar e excluir gerentes, substituindo os dados estáticos.
  - Implementado feedback de carregamento (skeletons) e tratamento de erros com toasts em todas as páginas do painel de gerente.

### Corrigido

- **Erro Crítico de Metadados:** Resolvido o problema recorrente "You are attempting to export "metadata" from a component marked with "use client"", reestruturando os layouts de todos os perfis (`admin`, `manager`, `supervisor`, `pastor`, `igreja`) para isolar corretamente os Componentes de Cliente dos Componentes de Servidor.
- **Links Quebrados (404):** Corrigidos todos os links de navegação que apontavam para a antiga rota `/gerente`, que foi migrada para `/manager`.
- **Lógica de Perfil Incompleto:** Removida a verificação estrita do campo de endereço no alerta de "perfil incompleto" do gerente para evitar confusão.

### Melhorias

- **Estrutura de Rotas:** A rota do painel de gerente foi padronizada de `/gerente` para `/manager` para consistência.
- **Componentização:** Os componentes de sidebar e header de cada perfil foram movidos para seus respectivos diretórios `_components` para uma melhor organização e escopo.
- **Ambiente de Desenvolvimento:** Removida temporariamente a validação de sessão de todos os painéis para agilizar o desenvolvimento, com a adição de dados de fallback para evitar quebras na interface.

## [1.0.5] - 2024-08-01

### Adicionado

- **API REST para Administradores:**
  - Criação dos endpoints `GET` e `POST` em `/api/v1/administradores` para listar e criar administradores.
  - Criação dos endpoints dinâmicos `GET`, `PUT` e `DELETE` em `/api/v1/administradores/[id]` para gerenciar administradores específicos.
- **API REST para Gateways de Pagamento:**
  - Criação do endpoint `GET /api/v1/gateways` para listar as configurações de todos os gateways.
  - Criação de rotas dinâmicas como `/api/v1/gateways/cielo` e `/api/v1/gateways/bradesco` para buscar (`GET`) e salvar (`PUT`) configurações específicas.
- **API para Dashboard do Admin:**
  - Implementado o endpoint `GET /api/v1/dashboard/admin` para fornecer dados agregados (KPIs, estatísticas) para o painel principal.
- **Documentação da API da Cielo:**
  - Adicionado o arquivo `docs/CIELO_API_GUIDE.md` com um guia técnico completo para a integração, incluindo exemplos de cURL para Cartão de Crédito, Boleto, PIX, e instruções para cancelamento e consulta.

### Corrigido

- **Valores Nulos em Formulários:** Corrigido o erro "Expected string, received null" nos formulários de configuração de gateway, garantindo que valores nulos do banco de dados sejam tratados corretamente.

## [1.0.4] - 2024-07-31

### Adicionado

- **API REST para Regiões:**
  - Criação do endpoint `GET /api/v1/regioes` para listar todas as regiões ativas, ordenadas pela data de atualização.
  - Criação do endpoint `POST /api/v1/regioes` para adicionar novas regiões.
  - Criação dos endpoints dinâmicos `PUT` e `DELETE` em `/api/v1/regioes/[id]` para atualizar e excluir (soft delete) regiões específicas.
- **Refatoração do Frontend de Regiões:**
  - A página `/admin/regioes` foi totalmente refatorada para consumir a nova API REST, utilizando `fetch` no lado do cliente para todas as operações CRUD.
  - As antigas Server Actions (`getRegions`, `saveRegion`, `deleteRegion`) foram removidas em favor da nova arquitetura de API.

### Corrigido

- **Falha na Consulta de Regiões:** Resolvido o problema crítico onde a listagem de regiões retornava um array vazio. A causa raiz era uma inconsistência no schema do Drizzle (`church_profiles`) que causava um erro em cascata, impedindo a consulta correta.
- **Erro de "Não Autorizado":** Corrigido o erro que impedia a manipulação de regiões (criação, exclusão) ao remover a dependência de um usuário autenticado nas rotas da API durante o desenvolvimento.
- **Atualização de `updatedAt`:** A função de atualização de região agora define corretamente o campo `updatedAt` no banco de dados.

## [1.0.3] - 2024-07-31

### Adicionado

- **Sistema de Autenticação Completo:**
  - Implementação do `lucia-auth` para gerenciamento de sessões seguras baseadas em cookies.
  - Adição da tabela `sessions` ao esquema do banco de dados para armazenar sessões de usuários.
  - Criação das Server Actions `loginUser` e `logoutUser` para lidar com o fluxo de autenticação no backend.
- **Integração do Login:**
  - A página de login (`/auth/login`) agora se comunica com a ação `loginUser` para autenticar os usuários.
  - Implementação de um painel de logs na tela de login para exibir o feedback do processo de autenticação, incluindo erros detalhados do backend para facilitar a depuração.
- **Redirecionamento Pós-Login:**
  - Após o login bem-sucedido, os usuários são automaticamente redirecionados para o dashboard correspondente ao seu perfil (`/admin`, `/manager`, etc.).
- **Exibição de Dados Dinâmicos:**
  - O cabeçalho de todos os painéis agora busca e exibe dinamicamente o nome e o e-mail do usuário autenticado.
- **Backend para Regiões:**
  - Criação das Server Actions (`getRegions`, `saveRegion`, `deleteRegion`) para gerenciar as regiões no banco de dados.
  - A página `/admin/regioes` foi totalmente conectada ao backend, permitindo a criação, edição e exclusão de regiões em tempo real.

### Corrigido

- Corrigido um problema crítico no script de `seed` onde a senha padrão não era carregada corretamente, resultando em hashes de senha inválidos.
- Resolvido o problema de a sessão do usuário não persistir entre as navegações, ajustando a lógica de validação de sessão no `lucia.ts`.

## [1.0.2] - 2024-07-30

### Adicionado

- **Configuração do Banco de Dados:**
  - Configuração da conexão com o banco de dados PostgreSQL através de variáveis de ambiente seguras (`.env.local`).
  - Criação dos arquivos `.env.example` e `.env.backup` para seguir as boas práticas de desenvolvimento.
- **Estrutura de Dados com Drizzle ORM:**
  - Definição do esquema completo do banco de dados em `src/db/schema.ts`.
  - Criação da tabela `companies` para centralizar as configurações do sistema.
  - Implementação de chaves primárias `UUID` em todas as tabelas para maior segurança.
  - Adição de funcionalidade de "soft delete" (`deletedAt`, `deletedBy`, `deletionReason`) em tabelas críticas para permitir a recuperação de dados e auditoria.
- **Scripts de Banco de Dados:**
  - Adição dos comandos `npm run db:generate` e `npm run db:push` para gerenciamento de migrações.
  - Criação do comando `npm run db:seed` para popular o banco de dados com dados de exemplo para todos os perfis de usuário.
  - Adição do comando de conveniência `npm run db:rollback` para resetar o banco de dados durante o desenvolvimento.
- **Segurança:**
  - Implementação de hashing de senhas com `bcrypt` no script de seed para garantir o armazenamento seguro das credenciais.

## [1.0.1] - 2024-07-30

### Adicionado

- **Estrutura Inicial do Projeto:**
  - Configuração do projeto Next.js com TypeScript e Tailwind CSS.
  - Implementação da biblioteca de componentes ShadCN/UI.
- **Painel de Administrador (`/admin`):**
  - Layout principal com sidebar de navegação e cabeçalho.
  - Páginas CRUD completas para Administradores, Gerentes, Supervisores, Pastores e Igrejas.
  - Páginas de configuração para Regiões, Gateways de Pagamento (Cielo e Bradesco) e Configurações Gerais.
  - Dashboard com KPIs e gráficos de exemplo.
  - Página de Relatórios e Transações.
- **Painéis por Perfil de Usuário:**
  - Criação de layouts e páginas dedicadas para os perfis: Gerente (`/manager`), Supervisor (`/supervisor`), Pastor (`/pastor`) e Igreja (`/igreja`).
  - Cada painel possui dashboard, páginas de gerenciamento e perfil customizadas.
- **Fluxo de Autenticação (`/auth`):**
  - Criação das páginas de Login, Cadastro de Conta (Pastor e Igreja) e Recuperação de Senha.
  - Implementação de um layout moderno de duas colunas para as telas de autenticação.
- **Documentação:**
  - Criação do `docs/README.md` com a visão geral do projeto.
- Criação do `docs/CONTRIBUTING.md` com as diretrizes e regras de desenvolvimento.
- Criação do `docs/FRONTEND_DOCS.md` com detalhes da arquitetura do frontend.
- Início deste `docs/CHANGELOG.md`.

### Corrigido

- Corrigidos todos os links de navegação que resultavam em erro 404.
- Ajustes de responsividade em toda a aplicação para garantir uma boa experiência em dispositivos móveis.
- Refatoração da página de Regiões para usar modais, melhorando a fluidez da interface.
