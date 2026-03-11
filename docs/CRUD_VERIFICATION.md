# Verificação CRUD - Frontend e Backend

Relatório de verificação dos CRUDs do Vinha Admin Center. Última atualização: 2025-03.

---

## 1. Mapeamento de Entidades e Rotas

| Entidade        | Admin         | Manager       | Supervisor    | Observação                                                                                                      |
| --------------- | ------------- | ------------- | ------------- | --------------------------------------------------------------------------------------------------------------- |
| Administradores | CRUD completo | -             | -             | `/api/v1/administradores`                                                                                       |
| Gerentes        | CRUD completo | GET lista     | -             | Admin: `/api/v1/admin/gerentes`                                                                                 |
| Supervisores    | CRUD completo | CRUD completo | -             | Admin: `/api/v1/admin/supervisores`, Manager: `/api/v1/manager/supervisores`                                    |
| Pastores        | CRUD completo | CRUD completo | CRUD completo | Admin: `/api/v1/admin/pastores`, Manager: `/api/v1/manager/pastores`, Supervisor: `/api/v1/supervisor/pastores` |
| Igrejas         | CRUD completo | CRUD completo | CRUD completo | Admin: `/api/v1/igrejas`, Manager: `/api/v1/manager/igrejas`, Supervisor: `/api/v1/supervisor/igrejas`          |
| Regiões         | CRUD\*        | -             | -             | `/api/v1/regioes` - sem GET [id], DELETE sem body                                                               |
| Transações      | R + Create    | R             | R             | Sem UPDATE/DELETE (apenas refund, sync, resend em subrotas)                                                     |

---

## 2. Schemas de Exclusão (DELETE)

| Contexto                                                           | Schema                 | Motivo obrigatório?   |
| ------------------------------------------------------------------ | ---------------------- | --------------------- |
| Admin (administradores, gerentes, supervisores, pastores, igrejas) | `deleteSchemaRequired` | Sim                   |
| Supervisor (pastores, igrejas)                                     | `deleteSchemaRequired` | Sim                   |
| Manager (supervisores, pastores, igrejas)                          | `deleteSchemaOptional` | Opcional              |
| Regiões                                                            | N/A                    | Não (DELETE sem body) |

**Fonte dos schemas**: `@/lib/types` - `deleteSchemaRequired` e `deleteSchemaOptional`.

---

## 3. Verificação Frontend x Backend

### 3.1 Chamadas de DELETE

| Página                | Endpoint                                   | Body                 |
| --------------------- | ------------------------------------------ | -------------------- |
| admin/administradores | DELETE `/api/v1/administradores/[id]`      | `{ deletionReason }` |
| admin/gerentes        | DELETE `/api/v1/admin/gerentes/[id]`       | `{ deletionReason }` |
| admin/supervisores    | DELETE `/api/v1/admin/supervisores/[id]`   | `{ deletionReason }` |
| admin/pastores        | DELETE `/api/v1/admin/pastores/[id]`       | `{ deletionReason }` |
| admin/igrejas         | DELETE `/api/v1/igrejas/[id]`              | `{ deletionReason }` |
| manager/supervisores  | DELETE `/api/v1/manager/supervisores/[id]` | `{ deletionReason }` |
| manager/pastores      | DELETE `/api/v1/manager/pastores/[id]`     | `{ deletionReason }` |
| manager/igrejas       | DELETE `/api/v1/manager/igrejas/[id]`      | `{ deletionReason }` |
| supervisor/pastores   | DELETE `/api/v1/supervisor/pastores/[id]`  | `{ deletionReason }` |
| supervisor/igrejas    | DELETE `/api/v1/supervisor/igrejas/[id]`   | `{ deletionReason }` |
| admin/regioes         | DELETE `/api/v1/regioes/[id]`              | Sem body             |

### 3.2 Regiões - Caso especial

- **DELETE** não recebe `deletionReason` (regiões não exigem auditoria de motivo)
- **Edição** usa dados da listagem (GET `/api/v1/regioes`); não há GET `/api/v1/regioes/[id]`
- **Frontend** (`admin/regioes/page.tsx`): usa `regionSchema` local com `name`, `color`

---

## 4. Schemas Zod - Fonte única

| Schema                  | Fonte         | Usado em                      |
| ----------------------- | ------------- | ----------------------------- |
| pastorProfileSchema     | `@/lib/types` | pastores (todas as rotas)     |
| supervisorProfileSchema | `@/lib/types` | supervisores (todas as rotas) |
| managerProfileSchema    | `@/lib/types` | gerentes                      |
| churchProfileSchema     | `@/lib/types` | igrejas                       |
| deleteSchemaRequired    | `@/lib/types` | Admin, Supervisor             |
| deleteSchemaOptional    | `@/lib/types` | Manager                       |

---

## 5. Inconsistências Identificadas (para correção)

1. **Duplicação de deleteSchema**: As rotas admin (gerentes, supervisores, pastores, administradores, igrejas) definem `deleteSchema` localmente idêntico a `deleteSchemaRequired`. **Correção recomendada**: importar `deleteSchemaRequired` de `@/lib/types`.

2. **Rota pastores genérica vs admin**: Existe `/api/v1/pastores` (sem prefixo admin) e `/api/v1/admin/pastores`. O admin usa `/api/v1/admin/pastores`. A rota `/api/v1/pastores` pode ser usada pelo supervisor ou para compatibilidade.

3. **Igrejas - Schemas duplicados**: `churchSchema` está definido em `igrejas/route.ts`, `manager/igrejas/route.ts` e `supervisor/igrejas/route.ts`. Ideal centralizar em `@/lib/types` ou criar `churchCreateSchema` compartilhado.

---

## 6. Checklist de Verificação Periódica

- [ ] Frontend envia `deletionReason` em todos os DELETE que exigem (exceto regiões)
- [ ] Campos do formulário de create/update correspondem ao schema do backend
- [ ] Rotas GET [id] retornam estrutura esperada pelo frontend
- [ ] Validação de hierarquia (manager só acessa seus supervisores, etc.)
- [ ] Cache invalidado após alterações (invalidateCache)

---

## 7. Arquivos Críticos por Entidade

| Entidade        | Backend                                | Frontend Lista        | Frontend Detalhe           |
| --------------- | -------------------------------------- | --------------------- | -------------------------- |
| Administradores | api/v1/administradores                 | admin/administradores | admin/administradores/[id] |
| Gerentes        | api/v1/admin/gerentes                  | admin/gerentes        | admin/gerentes/[id]        |
| Supervisores    | api/v1/admin/supervisores              | admin/supervisores    | admin/supervisores/[id]    |
| Pastores        | api/v1/admin/pastores, api/v1/pastores | admin/pastores        | admin/pastores/[id]        |
| Igrejas         | api/v1/igrejas                         | admin/igrejas         | admin/igrejas/[id]         |
| Regiões         | api/v1/regioes                         | admin/regioes         | (inline na mesma página)   |
