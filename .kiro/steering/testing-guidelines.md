---
inclusion: fileMatch
fileMatchPattern: '**/*.test.{ts,tsx}'
---

# Diretrizes de Testes

## Princípios de Testes

### 1. Estrutura de Testes

```typescript
import { describe, it, expect, beforeEach } from 'vitest'

describe('UserService', () => {
  beforeEach(() => {
    // Setup antes de cada teste
  })

  describe('createUser', () => {
    it('deve criar usuário com dados válidos', async () => {
      // Arrange
      const userData = {
        name: 'João Silva',
        email: 'joao@example.com',
      }

      // Act
      const result = await createUser(userData)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data.email).toBe(userData.email)
    })

    it('deve retornar erro com email inválido', async () => {
      const userData = {
        name: 'João Silva',
        email: 'email-invalido',
      }

      const result = await createUser(userData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Email inválido')
    })
  })
})
```

### 2. Testes de Componentes

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { UserForm } from './user-form';

describe('UserForm', () => {
  it('deve renderizar formulário', () => {
    render(<UserForm />);

    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('deve submeter formulário com dados válidos', async () => {
    const onSubmit = vi.fn();
    render(<UserForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'João Silva' },
    });

    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });
});
```

### 3. Mocks

```typescript
import { vi } from 'vitest'

// Mock de módulo
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      users: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
  },
}))

// Mock de função
const mockFetch = vi.fn()
global.fetch = mockFetch
```

## Checklist de Testes

- [ ] Testes cobrem casos de sucesso
- [ ] Testes cobrem casos de erro
- [ ] Mocks apropriados para dependências externas
- [ ] Testes são independentes entre si
- [ ] Nomes descritivos e em português
- [ ] Arrange-Act-Assert bem definidos
