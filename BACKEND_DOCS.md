# 📄 Documentação do Backend - Vinha Admin Center

Este documento detalha a arquitetura, tecnologias e estrutura do backend da aplicação Vinha Admin Center.

## ✨ Tecnologias Principais

*   **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/) - Um sistema de gerenciamento de banco de dados relacional robusto e de código aberto.
*   **ORM:** [Drizzle ORM](https://orm.drizzle.team/) - Um ORM "headless" para TypeScript, que nos permite interagir com o banco de dados de forma segura e com tipagem estática.
*   **Segurança de Senhas:** [Bcrypt](https://www.npmjs.com/package/bcrypt) - Biblioteca para fazer o hash de senhas, garantindo que as credenciais nunca sejam armazenadas em texto plano.
*   **Ambiente de Execução:** [Next.js](https://nextjs.org/) (Server-side) e [Node.js](https://nodejs.org/) para a execução de scripts.
*   **Gerenciamento de Migrações:** [Drizzle Kit](https://orm.drizzle.team/kit/overview) - Ferramenta de linha de comando para gerar e gerenciar as migrações do banco de dados.

---

## 📂 Estrutura do Banco de Dados

A estrutura foi projetada para ser centralizada, segura e escalável.

### Tabela Raiz: `companies`
A tabela `companies` é a "mãe" de toda a estrutura. Ela armazena as configurações globais da aplicação, como o nome do sistema, logo, e-mail de suporte e modo de manutenção. Todos os outros dados (usuários, regiões, etc.) estão vinculados a uma empresa.

### Tabela Central: `users`
A tabela `users` é o pilar da autenticação e identificação. Ela contém as informações essenciais de login (`email`, `password` em hash) e o `role` (perfil) de cada pessoa ou entidade no sistema. Perfis específicos (como administrador, pastor, igreja) são armazenados em tabelas separadas e se relacionam com a tabela `users` através de uma chave estrangeira (`userId`).

### Exclusão Lógica (Soft Delete)
Para garantir a segurança e a capacidade de auditoria, a maioria das tabelas críticas não apaga os registros permanentemente. Em vez disso, utilizamos o método de *soft delete*. As seguintes colunas estão presentes nessas tabelas:
*   `deletedAt`: Armazena a data e hora em que o registro foi "excluído". Se for `null`, o registro está ativo.
*   `deletedBy`: Armazena o `id` do usuário que realizou a exclusão.
*   `deletionReason`: Um campo de texto para registrar o motivo da exclusão.

---

## ⚙️ Gerenciamento do Banco de Dados (Scripts)

Os seguintes comandos `npm` foram configurados no `package.json` para facilitar o gerenciamento do banco de dados durante o desenvolvimento:

*   **`npm run db:generate`**
    *   **O que faz:** Lê o `schema.ts` e gera um novo arquivo de migração SQL na pasta `drizzle/`. Este comando **não aplica** a migração, apenas a cria. É o método preferido para versionar mudanças no banco de dados.

*   **`npm run db:push`**
    *   **O que faz:** Compara o `schema.ts` com o estado atual do banco de dados e aplica as diferenças diretamente, sem criar um arquivo de migração. É útil para prototipagem e desenvolvimento rápido.

*   **`npm run db:seed`**
    *   **O que faz:** Executa o script `src/db/seed.ts` para popular o banco de dados com dados de exemplo (um usuário para cada perfil, regiões, etc.). Garante que o banco tenha um estado inicial consistente para testes.

*   **`npm run db:rollback`**
    *   **O que faz:** **(Comando Destrutivo)** Apaga todas as tabelas do banco de dados e, em seguida, as recria com base no `schema.ts` atual. É um "reset" completo, útil quando há conflitos ou para começar do zero.

---

## 🔑 Variáveis de Ambiente

As credenciais e configurações sensíveis do backend são gerenciadas através de variáveis de ambiente. Os seguintes arquivos são utilizados:

*   **`.env.local`:** Armazena as variáveis para o ambiente de desenvolvimento local. **Este arquivo não deve ser versionado no Git.**
*   **`.env.backup`:** Um backup da estrutura e dos valores do `.env.local`.
*   **`.env.example`:** Um arquivo de exemplo que lista as variáveis necessárias para que outros desenvolvedores possam configurar seus próprios ambientes.

Variáveis essenciais do backend:
*   `DATABASE_URL`: A string de conexão completa para o banco de dados PostgreSQL.
*   `DEFAULT_PASSWORD`: A senha padrão usada pelo script de `seed` para criar os usuários de exemplo.

Esta documentação deve ser mantida atualizada para refletir as mudanças na arquitetura do backend.