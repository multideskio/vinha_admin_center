# 📄 Documentação do Backend - Vinha Admin Center

Este documento detalha a arquitetura, tecnologias e estrutura do backend da aplicação Vinha Admin Center.

## ✨ Tecnologias Principais

- **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/) - Um sistema de gerenciamento de banco de dados relacional robusto e de código aberto.
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/) - Um ORM "headless" para TypeScript, que nos permite interagir com o banco de dados de forma segura e com tipagem estática.
- **Autenticação e Sessões:** [Lucia Auth](https://lucia-auth.com/) - Uma biblioteca de autenticação agnóstica de framework, utilizada para o gerenciamento de sessões e proteção de rotas.
- **API:** [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) - Para a criação de endpoints RESTful que servem os dados para o frontend.
- **Segurança de Senhas:** [Bcrypt](https://www.npmjs.com/package/bcrypt) - Biblioteca para fazer o hash de senhas, garantindo que as credenciais nunca sejam armazenadas em texto plano.
- **Ambiente de Execução:** [Next.js](https://nextjs.org/) (Server-side) e [Node.js](https://nodejs.org/) para a execução de scripts.
- **Gerenciamento de Migrações:** [Drizzle Kit](https://orm.drizzle.team/kit/overview) - Ferramenta de linha de comando para gerar e gerenciar as migrações do banco de dados.

---

## 📂 Estrutura do Banco de Dados

A estrutura foi projetada para ser centralizada, segura e escalável.

### Tabela Raiz: `companies`

A tabela `companies` é a "mãe" de toda a estrutura. Ela armazena as configurações globais da aplicação, como o nome do sistema, logo, e-mail de suporte e modo de manutenção. Todos os outros dados (usuários, regiões, etc.) estão vinculados a uma empresa.

### Tabela Central: `users`

A tabela `users` é o pilar da autenticação e identificação. Ela contém as informações essenciais de login (`email`, `password` em hash) e o `role` (perfil) de cada pessoa ou entidade no sistema. Perfis específicos (como administrador, gerente, pastor) são armazenados em tabelas separadas e se relacionam com a tabela `users` através de uma chave estrangeira (`userId`).

### Tabela de Sessões: `sessions`

Para gerenciar o estado de login dos usuários, a tabela `sessions` armazena as sessões ativas. Ela é gerenciada pelo Lucia Auth e contém o ID da sessão, a referência ao `userId` e a data de expiração.

### Exclusão Lógica (Soft Delete)

Para garantir a segurança e a capacidade de auditoria, a maioria das tabelas críticas não apaga os registros permanentemente. Em vez disso, utilizamos o método de _soft delete_. As seguintes colunas estão presentes nessas tabelas:

- `deletedAt`: Armazena a data e hora em que o registro foi "excluído". Se for `null`, o registro está ativo.
- `deletedBy`: Armazena o `id` do usuário que realizou a exclusão.
- `deletionReason`: Um campo de texto para registrar o motivo da exclusão.

---

## 🚀 Arquitetura da API

Para garantir um desacoplamento claro entre o frontend e o backend, a aplicação está adotando uma arquitetura de **API RESTful**.

- **Endpoints:** Os endpoints da API estão localizados no diretório `src/app/api/`. A estrutura de pastas segue o padrão de versionamento, como em `src/app/api/v1/[recurso]`.
- **Manipuladores de Rota (Route Handlers):** Cada endpoint é implementado usando os _Route Handlers_ do Next.js, com arquivos como `route.ts` que exportam funções assíncronas correspondentes aos métodos HTTP (`GET`, `POST`, `PUT`, `DELETE`).
- **Exemplo (Admin e Manager):** As funcionalidades de Regiões, Administradores, Gerentes, Supervisores, Pastores e Igrejas foram migradas para esta arquitetura. Todas as operações CRUD são tratadas por seus respectivos endpoints, como `/api/v1/regioes`, `/api/v1/admin/administradores`, `/api/v1/manager/supervisores`, `/api/v1/manager/pastores`, `/api/v1/manager/igrejas`, etc. Além disso, foram criados endpoints específicos para cada dashboard (ex: `/api/v1/admin/dashboard`, `/api/v1/manager/dashboard`) para agregar dados.

Esta abordagem substitui o uso inicial de Server Actions para a busca e manipulação de dados, proporcionando uma forma mais tradicional e explícita de comunicação de dados.

### Endpoints Principais

#### Admin Endpoints
- `/api/v1/admin/dashboard` - KPIs e estatísticas do admin
- `/api/v1/admin/administradores` - CRUD de administradores
- `/api/v1/admin/gerentes` - CRUD de gerentes
- `/api/v1/admin/supervisores` - CRUD de supervisores
- `/api/v1/admin/pastores` - CRUD de pastores
- `/api/v1/admin/igrejas` - CRUD de igrejas
- `/api/v1/regioes` - Gerenciamento de regiões
- `/api/v1/transacoes` - Listagem e detalhes de transações
- `/api/v1/gateways` - Configuração de gateways de pagamento
- `/api/v1/company` - Configurações da empresa

#### Manager Endpoints
- `/api/v1/manager/dashboard` - KPIs e estatísticas do manager
- `/api/v1/manager/supervisores` - CRUD de supervisores (filtrado por managerId)
- `/api/v1/manager/supervisores/[id]` - Operações em supervisor específico
- `/api/v1/manager/pastores` - CRUD de pastores (filtrado por supervisores do manager)
- `/api/v1/manager/pastores/[id]` - Operações em pastor específico
- `/api/v1/manager/igrejas` - CRUD de igrejas (filtrado por supervisores do manager)
- `/api/v1/manager/igrejas/[id]` - Operações em igreja específica

#### Shared Endpoints
- `/api/v1/cep` - Consulta de CEP via ViaCEP
- `/api/v1/users/[id]/notification-settings` - Configurações de notificações (admin e manager)
- `/api/v1/cron/notifications` - Sistema de notificações automáticas

### Padrões de API

#### Autenticação
- Todos os endpoints protegidos usam `validateRequest()` do Lucia Auth
- Verificação de role (admin, manager, etc.)
- Verificação de ownership (manager só acessa seus próprios recursos)

#### Respostas
- Sucesso: `{ success: true, data: {...} }`
- Erro: `{ success: false, error: "mensagem" }` com status HTTP apropriado
- Listagens incluem `avatarUrl` para exibição de imagens

#### Query Parameters
- `?minimal=true` - Retorna apenas id e name para dropdowns
- `?page=1&limit=10` - Paginação
- `?search=termo` - Busca por nome/email

#### Soft Delete
- DELETE endpoints não removem registros permanentemente
- Definem `deletedAt`, `deletedBy`, `deletionReason`
- `deletionReason` é obrigatório para auditoria

---

## ⚙️ Gerenciamento do Banco de Dados (Scripts)

Os seguintes comandos `npm` foram configurados no `package.json` para facilitar o gerenciamento do banco de dados durante o desenvolvimento:

- **`npm run db:generate`**
  - **O que faz:** Lê o `schema.ts` e gera um novo arquivo de migração SQL na pasta `drizzle/`. Este comando **não aplica** a migração, apenas a cria. É o método preferido para versionar mudanças no banco de dados.

- **`npm run db:migrate`**
  - **O que faz:** Compara o `schema.ts` com o estado atual do banco de dados e aplica as diferenças diretamente, sem criar um arquivo de migração. É útil para prototipagem e desenvolvimento rápido.

- **`npm run db:seed`**
  - **O que faz:** Executa o script `src/db/seed.ts` para popular o banco de dados com dados de exemplo (um usuário para cada perfil, regiões, etc.). Garante que o banco tenha um estado inicial consistente para testes.

- **`npm run db:rollback:generate`**
  - **O que faz:** Gera um arquivo de migração vazio para que você possa escrever o SQL para reverter uma ou mais migrações manualmente.
- **`npm run db:kill`**
  - **O que faz:** **(Comando Destrutivo)** Apaga todas as tabelas do banco de dados. É um "reset" completo, útil quando há conflitos ou para começar do zero.

---

## 🔑 Variáveis de Ambiente

As credenciais e configurações sensíveis do backend são gerenciadas através de variáveis de ambiente. Os seguintes arquivos são utilizados:

- **`.env.local`:** Armazena as variáveis para o ambiente de desenvolvimento local. **Este arquivo não deve ser versionado no Git.**
- **`.env.backup`:** Um backup da estrutura e dos valores do `.env.local`.
- **`.env.example`:** Um arquivo de exemplo que lista as variáveis necessárias para que outros desenvolvedores possam configurar seus próprios ambientes.

Variáveis essenciais do backend:

- `DATABASE_URL`: A string de conexão completa para o banco de dados PostgreSQL.
- `DEFAULT_PASSWORD`: A senha padrão usada pelo script de `seed` para criar os usuários de exemplo.

Esta documentação deve ser mantida atualizada para refletir as mudanças na arquitetura do backend.
