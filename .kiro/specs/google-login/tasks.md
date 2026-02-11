# Plano de Implementação: Login com Google OAuth 2.0

## Visão Geral

Implementação incremental do login Google OAuth 2.0, integrando ao sistema JWT existente. O fluxo diferencia usuários existentes (login direto) de novos usuários (redirecionamento para registro com pré-preenchimento via cookie criptografado). Cada tarefa constrói sobre a anterior, começando pelo modelo de dados e terminando com a integração na UI.

## Tarefas

- [ ] 1. Modelo de dados e configuração
  - [ ] 1.1 Adicionar tabela `oauth_accounts` ao schema Drizzle (`src/db/schema.ts`)
    - Criar tabela com campos: id, userId, provider, providerAccountId, providerEmail, createdAt, updatedAt
    - Adicionar constraints unique compostas (provider+providerAccountId, provider+userId)
    - Configurar cascade delete via referência ao users.id
    - Adicionar relações (oauthAccountsRelations + atualizar usersRelations)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 1.2 Tornar campo `password` nullable na tabela `users`
    - Alterar schema Drizzle: remover `.notNull()` do campo password
    - Atualizar tipo em locais que assumem password como non-null (login action, API login)
    - Executar `npm run db:push` para aplicar a migration
    - _Requirements: 3.3_

  - [ ] 1.3 Adicionar variáveis de ambiente Google OAuth ao schema Zod (`src/lib/env.ts`)
    - Adicionar GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET como opcionais no envSchema
    - _Requirements: 8.1, 8.2_

- [ ] 2. Módulo utilitário Google OAuth
  - [ ] 2.1 Criar módulo `src/lib/google-oauth.ts`
    - Implementar `getGoogleOAuthConfig()`: retorna clientId, clientSecret, redirectUri (construído via NEXT_PUBLIC_APP_URL)
    - Implementar `isGoogleOAuthEnabled()`: verifica se credenciais estão configuradas
    - Implementar `getGoogleAuthUrl(state)`: constrói URL de autorização com todos os parâmetros (client_id, redirect_uri, response_type=code, scope=openid email profile, state, prompt=select_account)
    - Implementar `exchangeCodeForTokens(code)`: POST para https://oauth2.googleapis.com/token
    - Implementar `getGoogleUserInfo(accessToken)`: GET para https://www.googleapis.com/oauth2/v2/userinfo
    - Implementar `encryptGoogleProfile(data)` e `decryptGoogleProfile(encrypted)`: criptografia AES-256-GCM para dados do perfil Google no cookie
    - Definir interfaces GoogleTokenResponse, GoogleUserInfo e GoogleProfileCookieData
    - _Requirements: 1.1, 3.2, 7.4, 7.5, 8.2_

  - [ ]\* 2.2 Escrever teste de propriedade para URL de autorização
    - **Property 1: URL de autorização contém todos os parâmetros obrigatórios**
    - **Validates: Requirements 1.1, 7.4, 8.2**

  - [ ]\* 2.3 Escrever teste de propriedade para criptografia do perfil Google
    - **Property 5: Criptografia do perfil Google é round-trip**
    - **Validates: Requirements 3.2, 7.5**

- [ ] 3. Serviço de vinculação de contas OAuth
  - [ ] 3.1 Criar módulo `src/lib/oauth-account-service.ts`
    - Implementar `handleGoogleCallback(googleUser)` com lógica:
      1. Buscar oauth_account por provider='google' + providerAccountId
      2. Se encontrou → buscar user → retornar { type: 'login', user }
      3. Se não encontrou → buscar user por email
         a. User existe sem oauth → criar oauth_account → retornar { type: 'login', user }
         b. User existe com oauth diferente → erro account_conflict
         c. User NÃO existe → retornar { type: 'register', googleProfile }
    - Implementar `linkGoogleAccountToUser(userId, googleData)`: cria registro na oauth_accounts vinculando Google ID ao usuário
    - Validar email_verified === true antes de prosseguir
    - Usar transação atômica para criação de oauth_account quando user existe
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 7.1_

  - [ ]\* 3.2 Escrever teste de propriedade para login de usuário existente
    - **Property 3: Login Google para usuário existente preserva vinculação**
    - **Validates: Requirements 2.1, 2.2**

  - [ ]\* 3.3 Escrever teste de propriedade para novo usuário retorna registro
    - **Property 4: Novo usuário retorna redirecionamento para registro**
    - **Validates: Requirements 3.1**

- [ ] 4. Rotas API do fluxo OAuth
  - [ ] 4.1 Criar rota de início `src/app/api/v1/auth/google/route.ts`
    - Endpoint GET que gera state CSRF (crypto.randomBytes 32 bytes, hex)
    - Armazenar state em cookie httpOnly (max-age: 600s / 10 min)
    - Redirecionar para URL de autorização Google
    - Retornar erro se Google OAuth não estiver habilitado
    - _Requirements: 1.1_

  - [ ] 4.2 Criar rota de callback `src/app/api/v1/auth/google/callback/route.ts`
    - Endpoint GET que recebe code e state do Google
    - Validar state contra cookie (rejeitar se diferente)
    - Aplicar rate limiting no endpoint
    - Chamar exchangeCodeForTokens e getGoogleUserInfo
    - Chamar handleGoogleCallback com perfil do Google
    - Se result.type === 'login': criar JWT, definir cookie, redirect para dashboard do role
    - Se result.type === 'register': criptografar perfil em cookie (max-age: 600s), redirect para /auth/nova-conta
    - Tratar todos os erros com redirecionamento para /auth/login?error=<código>
    - Limpar cookie de state após uso
    - _Requirements: 1.2, 1.3, 1.4, 3.1, 5.1, 5.2, 5.3, 7.3_

  - [ ] 4.3 Criar rota de leitura do perfil Google `src/app/api/v1/auth/google/profile/route.ts`
    - Endpoint GET que lê o Cookie_Google_Profile, descriptografa e retorna os dados
    - Se cookie ausente ou inválido, retorna { data: null }
    - _Requirements: 3.2_

  - [ ]\* 4.4 Escrever testes de propriedade para validação de state e mapeamento de role
    - **Property 2: Validação de state CSRF é estrita**
    - **Property 8: Mapeamento role para path de redirecionamento é completo**
    - **Validates: Requirements 1.2, 1.3, 5.3**

- [ ] 5. Checkpoint - Verificar backend
  - Garantir que todas as rotas API funcionam corretamente
  - Executar todos os testes e verificar que passam
  - Perguntar ao usuário se há dúvidas

- [ ] 6. Interface do botão Google e integração nas páginas
  - [ ] 6.1 Criar componente `src/components/ui/GoogleLoginButton.tsx`
    - Botão com ícone SVG do Google
    - Prop `variant`: 'login' → texto "Entrar com Google", 'register' → texto "Preencher com Google"
    - Estado de loading (spinner) ao clicar
    - Prop disabled para quando OAuth não está configurado
    - Ao clicar, redirecionar para /api/v1/auth/google
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 6.2 Integrar botão Google na página de login (`src/app/auth/login/page.tsx`)
    - Adicionar divisor visual "ou" entre formulário e botão Google
    - Adicionar GoogleLoginButton com variant='login' abaixo do divisor
    - Ler parâmetro `error` da URL e exibir mensagem correspondente usando mapeamento de erros
    - Criar endpoint ou server action para verificar se Google OAuth está habilitado
    - _Requirements: 6.1, 6.4, 8.3_

  - [ ] 6.3 Integrar botão Google e pré-preenchimento na página de registro (`src/app/auth/nova-conta/page.tsx`)
    - Adicionar GoogleLoginButton com variant='register' acima do formulário
    - No carregamento, chamar GET /api/v1/auth/google/profile para obter dados do cookie
    - Se dados presentes: pré-preencher firstName, lastName, email no PastorForm via defaultValues
    - Exibir badge visual "Dados do Google" nos campos pré-preenchidos
    - Armazenar googleId em state para enviar junto com o submit do formulário
    - Campos pré-preenchidos permanecem editáveis pelo usuário
    - _Requirements: 3.2, 6.2, 6.5_

  - [ ]\* 6.4 Escrever teste de propriedade para mapeamento de erros
    - **Property 9: Mapeamento de código de erro para mensagem é completo**
    - **Validates: Requirements 6.4**

- [ ] 7. Atualização das APIs de registro para suportar vinculação Google
  - [ ] 7.1 Atualizar API `src/app/api/v1/auth/register/pastor/route.ts`
    - Adicionar campo opcional `googleId` ao schema Zod do body
    - Se googleId presente: após criar user + pastor_profile, chamar `linkGoogleAccountToUser`
    - Limpar Cookie_Google_Profile no header Set-Cookie da resposta de sucesso
    - _Requirements: 3.3, 3.4_

  - [ ] 7.2 Atualizar API `src/app/api/v1/auth/register/church/route.ts`
    - Adicionar campo opcional `googleId` ao schema Zod do body
    - Se googleId presente: após criar user, chamar `linkGoogleAccountToUser`
    - Limpar Cookie_Google_Profile no header Set-Cookie da resposta de sucesso
    - _Requirements: 3.3, 3.4_

  - [ ]\* 7.3 Escrever teste de propriedade para registro com vinculação Google
    - **Property 6: Registro com Google cria vinculação oauth_account**
    - **Validates: Requirements 3.3**

- [ ] 8. Teste de propriedade JWT round-trip
  - [ ]\* 8.1 Escrever teste de propriedade para JWT após login Google
    - **Property 7: JWT emitido após login Google contém dados corretos (round-trip)**
    - **Validates: Requirements 5.1**

- [ ] 9. Checkpoint final
  - Garantir que todos os testes passam
  - Verificar fluxo completo: login existente (botão → Google → callback → JWT → dashboard)
  - Verificar fluxo novo usuário (botão → Google → callback → cookie → nova-conta → pré-preenchimento → registro → oauth_account)
  - Perguntar ao usuário se há dúvidas

## Notas

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada tarefa referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Testes de propriedade validam propriedades universais de corretude
- Testes unitários validam exemplos específicos e edge cases
