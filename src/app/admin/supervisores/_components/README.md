# Componentes de Supervisores

Componentes modulares para a página de gerenciamento de supervisores no painel administrativo.

## 📁 Estrutura

```
_components/
├── supervisores-client.tsx          # Componente principal (Client)
├── supervisor-form-modal.tsx        # Modal de cadastro
├── supervisor-table-view.tsx        # Visualização em tabela
├── supervisor-card-view.tsx         # Visualização em cards
├── delete-supervisor-dialog.tsx     # Dialog de exclusão
├── index.ts                         # Exportações centralizadas
└── README.md                        # Documentação
```

## 🎯 Componentes

### 1. SupervisoresClient

**Tipo:** Client Component  
**Arquivo:** `supervisores-client.tsx`

Componente principal que gerencia o estado e a lógica da página de supervisores.

**Props:**

```typescript
interface SupervisoresClientProps {
  initialSupervisors: Supervisor[] // Lista inicial de supervisores
  managers: Manager[] // Lista de gerentes disponíveis
  regions: Region[] // Lista de regiões disponíveis
}
```

**Funcionalidades:**

- Gerenciamento de estado (search, pagination, viewMode)
- Busca e filtragem de supervisores
- Alternância entre visualização tabela/cards
- Refresh de dados
- Integração com API de supervisores

**Uso:**

```typescript
import { SupervisoresClient } from './_components'

export default async function SupervisoresPage() {
  const supervisors = await getSupervisors()
  const managers = await getManagers()
  const regions = await getRegions()

  return (
    <SupervisoresClient
      initialSupervisors={supervisors}
      managers={managers}
      regions={regions}
    />
  )
}
```

---

### 2. SupervisorFormModal

**Tipo:** Client Component  
**Arquivo:** `supervisor-form-modal.tsx`

Modal de cadastro de novos supervisores com validação completa.

**Props:**

```typescript
interface SupervisorFormModalProps {
  onSave: () => void // Callback após salvar
  managers: Manager[] // Lista de gerentes
  regions: Region[] // Lista de regiões
  children: React.ReactNode // Trigger do modal
}
```

**Funcionalidades:**

- Formulário com validação Zod (supervisorProfileSchema)
- Integração ViaCEP para busca automática de endereço
- Formatação automática de CPF e CEP
- Campos: firstName, lastName, cpf, email, phone, managerId, regionId, endereço completo
- Senha padrão: 123456 (com alerta visual)
- Estados de loading durante busca de CEP

**Validação:**

- Nome e sobrenome obrigatórios
- CPF válido e único
- Email válido e único
- CEP válido (8 dígitos)
- Celular obrigatório
- Gerente e região opcionais

**Endpoint:** `POST /api/v1/admin/supervisores`

---

### 3. SupervisorTableView

**Tipo:** Client Component  
**Arquivo:** `supervisor-table-view.tsx`

Visualização em tabela responsiva de supervisores.

**Props:**

```typescript
interface SupervisorTableViewProps {
  supervisors: Supervisor[] // Lista de supervisores
  isLoading: boolean // Estado de carregamento
  onDelete: (supervisorId: string, reason: string) => void // Handler de exclusão
}
```

**Colunas:**

- Avatar + Nome (sempre visível)
- Email (oculto em mobile)
- Celular (oculto em tablet)
- Gerente (oculto em desktop pequeno)
- Região (oculto em desktop pequeno)
- Status (oculto em mobile)
- Ações (sempre visível)

**Funcionalidades:**

- Skeleton loading (5 linhas)
- Estado vazio com mensagem
- Link para edição: `/admin/supervisores/[id]`
- Menu dropdown com opção de exclusão
- Responsivo com breakpoints: sm, md, lg, xl

---

### 4. SupervisorCardView

**Tipo:** Client Component  
**Arquivo:** `supervisor-card-view.tsx`

Visualização em cards com grid responsivo (3 colunas).

**Props:**

```typescript
interface SupervisorCardViewProps {
  supervisors: Supervisor[] // Lista de supervisores
  isLoading: boolean // Estado de carregamento
  onDelete: (supervisorId: string, reason: string) => void // Handler de exclusão
}
```

**Layout do Card:**

- Avatar (80x80px) com ring
- Nome e status badge
- Gerente e região
- CPF formatado
- Email e celular
- Localização (cidade/estado)
- Bairro
- Botões de editar e excluir

**Funcionalidades:**

- Skeleton loading (6 cards)
- Estado vazio com mensagem
- Bordas coloridas alternadas (videira-cyan, videira-blue, videira-purple)
- Hover effects (scale + shadow)
- Grid responsivo: 1 coluna (mobile), 2 colunas (tablet), 3 colunas (desktop)

---

### 5. DeleteSupervisorDialog

**Tipo:** Client Component  
**Arquivo:** `delete-supervisor-dialog.tsx`

Dialog de confirmação de exclusão com auditoria obrigatória.

**Props:**

```typescript
interface DeleteSupervisorDialogProps {
  supervisorId: string // ID do supervisor
  onConfirm: (id: string, reason: string) => void // Callback de confirmação
  children?: React.ReactNode // Trigger customizado (opcional)
}
```

**Funcionalidades:**

- Campo obrigatório: motivo da exclusão (Textarea)
- Validação: motivo não pode estar vazio
- Botão de confirmação desabilitado sem motivo
- Visual de alerta (borda vermelha, ícone de warning)
- Mensagem de auditoria permanente
- Reset do formulário ao fechar

**Endpoint:** `DELETE /api/v1/admin/supervisores/[id]`

**Body:**

```json
{
  "deletionReason": "Motivo detalhado da exclusão"
}
```

---

## 🎨 Design System Videira

### Cores Utilizadas

```css
/* Primária */
bg-videira-blue
hover:bg-videira-blue/90
border-videira-blue
text-videira-blue

/* Gradientes */
from-videira-cyan/5 via-videira-blue/5 to-videira-purple/5

/* Bordas de Destaque */
border-l-4 border-l-videira-blue      /* Cards principais */
border-t-videira-cyan                 /* Card 1 */
border-t-videira-blue                 /* Card 2 */
border-t-videira-purple               /* Card 3 */
```

### Componentes UI

- Button (shadcn/ui)
- Card (shadcn/ui)
- Table (shadcn/ui)
- Dialog (shadcn/ui)
- AlertDialog (shadcn/ui)
- Form (react-hook-form + shadcn/ui)
- Input (shadcn/ui)
- Select (shadcn/ui)
- Badge (shadcn/ui)
- Skeleton (shadcn/ui)
- PhoneInput (custom)

---

## 📊 Tipos

```typescript
export type Supervisor = {
  id: string
  email: string
  status: 'active' | 'inactive'
  phone: string | null
  avatarUrl: string | null
  firstName: string
  lastName: string
  cpf: string
  cep: string
  state: string
  city: string
  neighborhood: string
  address: string
  managerId: string | null
  managerName?: string
  regionId: string | null
  regionName?: string
}

export type Manager = {
  id: string
  firstName: string
  lastName: string
}

export type Region = {
  id: string
  name: string
}
```

---

## 🔌 API Endpoints

### Listar Supervisores

```
GET /api/v1/admin/supervisores
Response: { supervisors: Supervisor[] }
```

### Criar Supervisor

```
POST /api/v1/admin/supervisores
Body: SupervisorFormData
Response: { success: boolean, supervisor?: Supervisor, error?: string }
```

### Excluir Supervisor

```
DELETE /api/v1/admin/supervisores/[id]
Body: { deletionReason: string }
Response: { success: boolean, error?: string }
```

---

## ✅ Checklist de Implementação

- [x] SupervisoresClient com gerenciamento de estado
- [x] SupervisorFormModal com validação Zod
- [x] Integração ViaCEP para busca de endereço
- [x] SupervisorTableView responsiva
- [x] SupervisorCardView com grid 3 colunas
- [x] DeleteSupervisorDialog com auditoria
- [x] Skeleton loading states
- [x] Empty states com mensagens
- [x] Formatação de CPF, CEP e telefone
- [x] Design System Videira aplicado
- [x] Acessibilidade (aria-labels)
- [x] Responsividade mobile-first
- [x] Exportações centralizadas (index.ts)

---

## 🚀 Próximos Passos

1. Converter `src/app/admin/supervisores/page.tsx` para Server Component
2. Integrar SupervisoresClient na página principal
3. Testar fluxo completo de CRUD
4. Validar responsividade em diferentes dispositivos
5. Testar acessibilidade com leitores de tela

---

## 📝 Notas

- Todos os componentes seguem o padrão das páginas de igrejas e pastores
- Validação usa `supervisorProfileSchema` de `@/lib/types`
- Senha padrão é sempre **123456** até o usuário alterar
- Motivo de exclusão é obrigatório para auditoria
- Formatação automática de CPF: 000.000.000-00
- Formatação automática de CEP: 00000-000
- Formatação automática de telefone: (00) 00000-0000

---

**Versão:** 1.0  
**Data:** 2024-08-07  
**Autor:** Kiro AI Assistant
