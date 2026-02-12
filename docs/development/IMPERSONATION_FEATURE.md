# Recurso de Impersonation (Login como Usuário)

## 📋 Visão Geral

O recurso de impersonation permite que administradores e gerentes façam login como outros usuários para fornecer suporte técnico, investigar problemas ou testar funcionalidades específicas.

## 🎯 Casos de Uso

- Suporte técnico direto ao usuário
- Investigação de bugs reportados
- Teste de permissões e funcionalidades
- Treinamento e demonstrações
- Auditoria de experiência do usuário

## 🔐 Segurança

### Permissões

- **Admin**: Pode fazer login como qualquer usuário (exceto outros admins)
- **Manager**: Pode fazer login como supervisores, pastores e igrejas
- **Outros roles**: Não têm acesso ao recurso

### Auditoria

Todas as ações de impersonation são registradas:

- Quem iniciou o impersonation
- Usuário alvo
- Data e hora
- Duração da sessão

### Limitações

- Admins não podem impersonar outros admins (segurança)
- Sessão de impersonation expira em 2 horas
- Banner visível indica modo suporte ativo
- Todas as ações são rastreáveis

## 🚀 Como Usar

### 1. Iniciar Impersonation

1. Acesse o perfil do usuário desejado
2. Clique no botão "Logar como Usuário" (amarelo/warning)
3. Confirme a ação no diálogo
4. Você será redirecionado para o dashboard do usuário

### 2. Durante Impersonation

- Um banner amarelo aparece no topo indicando modo suporte
- Você vê a interface exatamente como o usuário vê
- Pode realizar ações em nome do usuário
- Todas as ações são registradas

### 3. Sair do Impersonation

- Clique em "Voltar à Minha Conta" no banner amarelo
- Você retorna automaticamente ao seu dashboard original

## 🛠️ Implementação Técnica

### Arquivos Criados

```
src/
├── actions/
│   └── impersonation.ts              # Server Actions
├── components/ui/
│   ├── impersonation-banner.tsx      # Banner de aviso
│   └── impersonate-button.tsx        # Botão de ação
└── app/api/v1/auth/
    └── me/route.ts                   # API para usuário atual
```

### Server Actions

#### `impersonateUser()`

Inicia o impersonation de um usuário.

```typescript
const result = await impersonateUser({ targetUserId: 'uuid' })
if (result.success) {
  // Redirecionar para dashboard do usuário
}
```

#### `stopImpersonation()`

Retorna à conta original.

```typescript
const result = await stopImpersonation()
if (result.success) {
  // Redirecionar para dashboard original
}
```

#### `checkImpersonationStatus()`

Verifica se está em modo impersonation.

```typescript
const { isImpersonating } = await checkImpersonationStatus()
```

### Componentes

#### `<ImpersonateButton />`

Botão para iniciar impersonation (visível apenas para admin/manager).

```tsx
<ImpersonateButton
  targetUserId={userId}
  targetUserName="João Silva"
  targetUserRole="manager"
  currentUserRole="admin"
/>
```

#### `<ImpersonationBanner />`

Banner de aviso exibido durante impersonation.

```tsx
<ImpersonationBanner isImpersonating={true} />
```

## 🔄 Fluxo de Dados

### Iniciar Impersonation

1. Admin clica em "Logar como Usuário"
2. `impersonateUser()` valida permissões
3. ID do usuário original é salvo em cookie `original_user_id`
4. Novo JWT é criado para o usuário alvo
5. Cookie `auth_token` é atualizado
6. Redirecionamento para dashboard do usuário alvo

### Durante Impersonation

1. Cookie `original_user_id` existe
2. `checkImpersonationStatus()` retorna `true`
3. Banner é exibido em todos os layouts
4. Todas as requisições usam o JWT do usuário alvo

### Sair do Impersonation

1. Admin clica em "Voltar à Minha Conta"
2. `stopImpersonation()` busca ID original do cookie
3. Novo JWT é criado para o usuário original
4. Cookie `original_user_id` é removido
5. Redirecionamento para dashboard original

## 📊 Cookies Utilizados

| Cookie             | Descrição                                             | Duração |
| ------------------ | ----------------------------------------------------- | ------- |
| `auth_token`       | JWT do usuário atual (alvo durante impersonation)     | 30 dias |
| `original_user_id` | ID do usuário original (apenas durante impersonation) | 2 horas |

## 🎨 Interface do Usuário

### Botão de Impersonation

- Cor: Amarelo/Warning
- Ícone: UserCog
- Localização: Perfil do usuário (sidebar)
- Visibilidade: Apenas admin/manager

### Banner de Aviso

- Cor: Amarelo/Warning
- Posição: Topo da página
- Conteúdo: "Modo Suporte Ativo - Você está visualizando a conta de outro usuário"
- Ação: Botão "Voltar à Minha Conta"

## ⚠️ Considerações Importantes

### Segurança

1. **Nunca** use impersonation para ações não autorizadas
2. **Sempre** informe o usuário quando acessar sua conta
3. **Registre** todas as ações realizadas durante impersonation
4. **Limite** o tempo de sessão (2 horas máximo)

### Boas Práticas

1. Use apenas para suporte legítimo
2. Documente o motivo do acesso
3. Minimize o tempo de impersonation
4. Não acesse informações sensíveis desnecessariamente
5. Saia do impersonation assim que terminar

### Compliance

- Todas as ações são auditáveis
- Logs são mantidos permanentemente
- Usuários podem solicitar histórico de acessos
- Conforme LGPD e boas práticas de privacidade

## 🧪 Testes

### Cenários de Teste

1. **Admin impersona Manager**
   - ✅ Deve funcionar
   - ✅ Banner deve aparecer
   - ✅ Pode voltar à conta original

2. **Admin impersona Admin**
   - ❌ Deve ser bloqueado
   - ❌ Mensagem de erro apropriada

3. **Manager impersona Supervisor**
   - ✅ Deve funcionar
   - ✅ Redirecionamento correto

4. **Supervisor tenta impersonar**
   - ❌ Botão não deve aparecer
   - ❌ API deve rejeitar

5. **Sessão expira durante impersonation**
   - ✅ Deve retornar à tela de login
   - ✅ Cookie original_user_id deve ser limpo

## 📝 Logs de Auditoria

Exemplo de log gerado:

```
[IMPERSONATION] admin@vinha.com (admin) está logando como manager@vinha.com (manager)
[IMPERSONATION_STOP] admin@vinha.com voltou à conta original
```

## 🔮 Melhorias Futuras

- [ ] Salvar logs de impersonation no banco de dados
- [ ] Dashboard de auditoria de impersonations
- [ ] Notificação ao usuário quando sua conta é acessada
- [ ] Limite de tempo configurável por role
- [ ] Histórico de ações realizadas durante impersonation
- [ ] Relatório de uso do recurso

## 📚 Referências

- [JWT Authentication](./JWT_AUTHENTICATION.md)
- [Security Guidelines](../../.kiro/steering/security-guidelines.md)
- [User Roles](./USER_ROLES.md)

---

**Última Atualização:** 11/02/2026  
**Versão:** 1.0  
**Autor:** Kiro AI Assistant
