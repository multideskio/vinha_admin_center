# Documento de Requisitos

## Introdução

Este documento define os requisitos para a implementação do login com Google OAuth 2.0 no Vinha Admin Center. A funcionalidade permite que usuários existentes façam login com sua conta Google, e que novos usuários utilizem o Google para pré-preencher o formulário de cadastro na página `/auth/nova-conta`. A integração mantém o sistema JWT existente como mecanismo de sessão, sem introduzir bibliotecas de autenticação externas (NextAuth, Lucia, etc.).

## Glossário

- **Sistema_OAuth**: O módulo responsável por gerenciar o fluxo de autenticação OAuth 2.0 com o Google, incluindo geração de URLs de autorização, troca de códigos por tokens e obtenção de dados do perfil Google.
- **Tabela_OAuth_Accounts**: Tabela no banco de dados que armazena a vinculação entre contas Google e usuários do sistema.
- **Página_Login**: A página de login existente em `/auth/login` que será estendida com o botão de login Google.
- **Página_Registro**: A página de criação de conta existente em `/auth/nova-conta` que será estendida com o botão Google para pré-preenchimento.
- **API_Callback**: O endpoint que recebe o redirecionamento do Google após autorização e processa a autenticação ou redirecionamento para registro.
- **Parâmetro_State**: Token CSRF gerado aleatoriamente e armazenado em cookie para validação no callback OAuth.
- **JWT_Service**: O serviço existente em `@/lib/jwt` que cria e valida tokens JWT para sessões.
- **Cookie_Google_Profile**: Cookie httpOnly temporário que armazena os dados do perfil Google (nome, sobrenome, email) de forma criptografada para pré-preenchimento do formulário de registro.

## Requisitos

### Requisito 1: Fluxo de Autorização OAuth 2.0

**User Story:** Como usuário, quero clicar em um botão "Entrar com Google" na página de login ou na página de registro, para que eu possa me autenticar ou pré-preencher meus dados usando minha conta Google.

#### Critérios de Aceitação

1. WHEN um usuário clica no botão "Entrar com Google" em qualquer página (login ou registro), THE Sistema_OAuth SHALL gerar um Parâmetro_State criptograficamente seguro, armazená-lo em um cookie httpOnly e redirecionar o usuário para o endpoint de autorização do Google com os escopos `openid`, `email` e `profile`
2. WHEN o Google redireciona o usuário de volta com um código de autorização válido, THE API_Callback SHALL validar o Parâmetro_State contra o cookie armazenado, trocar o código por tokens de acesso e obter o perfil do usuário (email, nome, sobrenome, ID Google)
3. IF o Parâmetro_State recebido no callback não corresponder ao cookie armazenado, THEN THE API_Callback SHALL rejeitar a requisição e redirecionar para a página de login com mensagem de erro
4. IF a troca do código de autorização por tokens falhar, THEN THE API_Callback SHALL registrar o erro no log e redirecionar para a página de login com mensagem de erro genérica

### Requisito 2: Login de Usuário Existente via Google

**User Story:** Como usuário existente, quero fazer login com minha conta Google, para que eu possa acessar o sistema de forma rápida sem digitar senha.

#### Critérios de Aceitação

1. WHEN o email retornado pelo Google corresponde a um usuário existente no banco de dados e esse usuário ainda não possui conta Google vinculada, THE Sistema_OAuth SHALL criar um registro na Tabela_OAuth_Accounts vinculando o ID Google ao usuário existente e emitir um JWT válido
2. WHEN o email retornado pelo Google corresponde a um usuário que já possui conta Google vinculada, THE Sistema_OAuth SHALL verificar se o ID Google corresponde ao registro existente e emitir um JWT válido
3. IF o email retornado pelo Google corresponde a um usuário existente mas o ID Google vinculado é diferente do recebido, THEN THE Sistema_OAuth SHALL rejeitar a autenticação e redirecionar para a página de login com mensagem informando que o email já está vinculado a outra conta Google

### Requisito 3: Redirecionamento de Novo Usuário para Registro

**User Story:** Como novo usuário, quero usar minha conta Google para pré-preencher o formulário de cadastro, para que eu possa completar meu registro mais rapidamente sem precisar digitar meu nome e email manualmente.

#### Critérios de Aceitação

1. WHEN o email retornado pelo Google não corresponde a nenhum usuário existente, THE API_Callback SHALL armazenar os dados do perfil Google (nome, sobrenome, email, ID Google) em um Cookie_Google_Profile criptografado e temporário (max-age 10 minutos) e redirecionar o usuário para `/auth/nova-conta`
2. WHEN a Página_Registro detecta a presença do Cookie_Google_Profile, THE Página_Registro SHALL pré-preencher os campos firstName, lastName e email do formulário de pastor com os dados do perfil Google
3. WHEN o usuário submete o formulário de registro com dados do Google presentes, THE API de registro SHALL criar o usuário normalmente e adicionalmente criar um registro na Tabela_OAuth_Accounts vinculando o ID Google ao novo usuário
4. WHEN o registro com dados Google é concluído com sucesso, THE Sistema_OAuth SHALL limpar o Cookie_Google_Profile
5. IF o Cookie_Google_Profile expirar antes do usuário completar o registro, THEN THE Página_Registro SHALL permitir o preenchimento manual normal sem dados pré-preenchidos

### Requisito 4: Modelo de Dados para Contas OAuth

**User Story:** Como desenvolvedor, quero uma tabela dedicada para armazenar vinculações OAuth, para que o sistema suporte múltiplos provedores no futuro.

#### Critérios de Aceitação

1. THE Tabela_OAuth_Accounts SHALL armazenar os campos: id (UUID), userId (referência à tabela users), provider (string), providerAccountId (string), email do provedor, createdAt e updatedAt
2. THE Tabela_OAuth_Accounts SHALL ter uma constraint unique composta nos campos provider e providerAccountId para evitar duplicatas
3. THE Tabela_OAuth_Accounts SHALL ter uma constraint unique composta nos campos provider e userId para garantir que cada usuário tenha no máximo uma conta por provedor
4. WHEN um usuário é deletado, THE Tabela_OAuth_Accounts SHALL remover automaticamente os registros vinculados via cascade

### Requisito 5: Emissão de Sessão JWT Após Login Google

**User Story:** Como usuário existente autenticado via Google, quero receber uma sessão JWT idêntica à do login tradicional, para que minha experiência no sistema seja consistente.

#### Critérios de Aceitação

1. WHEN a autenticação via Google é bem-sucedida para um usuário existente, THE JWT_Service SHALL criar um token JWT contendo userId, email e role do usuário, idêntico ao gerado pelo login com senha
2. WHEN o JWT é criado após login Google, THE JWT_Service SHALL definir o cookie `auth_token` com as mesmas configurações (httpOnly, secure, sameSite, maxAge) do login tradicional
3. WHEN o JWT é emitido com sucesso, THE API_Callback SHALL redirecionar o usuário para o dashboard correspondente ao seu role (admin → /admin, pastor → /pastor, etc.)

### Requisito 6: Interface do Botão Google nas Páginas de Login e Registro

**User Story:** Como usuário, quero ver um botão "Entrar com Google" tanto na página de login quanto na página de registro, para que eu saiba que essa opção está disponível em ambos os contextos.

#### Critérios de Aceitação

1. THE Página_Login SHALL exibir um botão "Entrar com Google" com o ícone do Google, posicionado abaixo do formulário de login tradicional, separado por um divisor visual com texto "ou"
2. THE Página_Registro SHALL exibir um botão "Entrar com Google" com o ícone do Google, posicionado acima do formulário de registro, com texto explicativo "Preencha seus dados automaticamente com o Google"
3. WHILE o fluxo OAuth está em andamento, THE Página_Login e THE Página_Registro SHALL exibir um estado de carregamento no botão Google para indicar que a autenticação está sendo processada
4. WHEN a página de login recebe um parâmetro de erro na URL (retornado pelo callback), THE Página_Login SHALL exibir a mensagem de erro correspondente ao usuário
5. WHEN a Página_Registro recebe dados do Google via Cookie_Google_Profile, THE Página_Registro SHALL exibir um indicador visual informando que os campos foram pré-preenchidos com dados do Google

### Requisito 7: Segurança do Fluxo OAuth

**User Story:** Como administrador do sistema, quero que o fluxo OAuth seja seguro contra ataques comuns, para que os dados dos usuários estejam protegidos.

#### Critérios de Aceitação

1. THE Sistema_OAuth SHALL validar que o email retornado pelo Google está verificado (campo `email_verified` do perfil) antes de prosseguir com a autenticação ou redirecionamento para registro
2. THE Sistema_OAuth SHALL armazenar as credenciais OAuth (Client ID e Client Secret) exclusivamente em variáveis de ambiente, validadas na inicialização via schema Zod
3. THE API_Callback SHALL aplicar rate limiting para prevenir abuso do endpoint de callback
4. THE Sistema_OAuth SHALL utilizar o parâmetro `prompt=select_account` na URL de autorização para permitir que o usuário escolha qual conta Google usar
5. THE Sistema_OAuth SHALL criptografar os dados do perfil Google armazenados no Cookie_Google_Profile para evitar manipulação por parte do cliente

### Requisito 8: Configuração de Variáveis de Ambiente

**User Story:** Como desenvolvedor, quero que as credenciais do Google OAuth sejam configuráveis via variáveis de ambiente, para que o deploy em diferentes ambientes seja simples.

#### Critérios de Aceitação

1. THE Sistema_OAuth SHALL requerer as variáveis GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET, validadas como strings não-vazias no schema Zod de env.ts
2. THE Sistema_OAuth SHALL construir a URL de redirect callback dinamicamente usando NEXT_PUBLIC_APP_URL para suportar diferentes ambientes (desenvolvimento, produção)
3. IF as variáveis GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET não estiverem definidas, THEN THE Sistema_OAuth SHALL desabilitar o botão de login Google na interface e registrar um aviso no log
