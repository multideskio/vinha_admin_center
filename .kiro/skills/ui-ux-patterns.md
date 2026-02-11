---
inclusion: manual
---

# Skill: Padrões de UI/UX

## Objetivo

Implementar interfaces consistentes e acessíveis usando o Design System Videira.

## Padrões de Interface

### 1. Loading States

```typescript
// Skeleton Loading
export function UserCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}

// Suspense Boundary
<Suspense fallback={<UserCardSkeleton />}>
  <UserCard userId={id} />
</Suspense>
```

### 2. Empty States

```typescript
export function EmptyState({
  title,
  description,
  action
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-gray-400 mb-4">
        <Icon size={48} />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

### 3. Feedback Visual

```typescript
import { toast } from 'sonner'

// Sucesso
toast.success('Usuário criado com sucesso!')

// Erro
toast.error('Erro ao criar usuário')

// Loading
const toastId = toast.loading('Processando...')
// Depois
toast.success('Concluído!', { id: toastId })
```

### 4. Formulários

```typescript
export function UserForm() {
  const [errors, setErrors] = useState({});

  return (
    <form className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Nome
        </label>
        <input
          type="text"
          className={cn(
            "w-full px-3 py-2 border rounded-md",
            errors.name && "border-red-500"
          )}
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">
            {errors.name}
          </p>
        )}
      </div>
    </form>
  );
}
```

### 5. Modais e Dialogs

```typescript
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';

export function ConfirmDialog({ open, onClose, onConfirm }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <h2>Confirmar ação</h2>
        </DialogHeader>
        <p>Tem certeza que deseja continuar?</p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onConfirm}>
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 6. Tabelas Responsivas

```typescript
export function DataTable({ data }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Nome
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Email
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item) => (
            <tr key={item.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                {item.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {item.email}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 7. Acessibilidade

```typescript
// Usar labels apropriados
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// ARIA attributes
<button
  aria-label="Fechar modal"
  aria-pressed={isOpen}
>
  <Icon />
</button>

// Navegação por teclado
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
```

## Checklist de UI/UX

- [ ] Loading states implementados
- [ ] Empty states com ações claras
- [ ] Feedback visual para ações
- [ ] Formulários com validação visual
- [ ] Modais com foco apropriado
- [ ] Tabelas responsivas
- [ ] Acessibilidade (ARIA, keyboard)
- [ ] Design consistente com Videira
- [ ] Mobile-first responsive
- [ ] Cores do tema aplicadas
