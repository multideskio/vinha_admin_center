---
inclusion: manual
---

# Skill: Validação de Formulários

## Objetivo

Implementar validação robusta e user-friendly em formulários usando Zod e React Hook Form.

## Padrões de Validação

### 1. Schema Zod

```typescript
import { z } from 'zod'

// Schema básico
export const userSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100, 'Nome muito longo'),

  email: z.string().email('Email inválido').toLowerCase(),

  phone: z
    .string()
    .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Telefone inválido')
    .optional(),

  role: z.enum(['admin', 'manager', 'supervisor', 'pastor', 'igreja']),

  birthDate: z.coerce.date().max(new Date(), 'Data não pode ser futura'),
})

// Inferir tipo do schema
export type UserFormData = z.infer<typeof userSchema>
```

### 2. Validações Customizadas

```typescript
export const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Senha deve ter no mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Deve conter letra maiúscula')
      .regex(/[a-z]/, 'Deve conter letra minúscula')
      .regex(/[0-9]/, 'Deve conter número'),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmPassword'],
  })
```

### 3. Validação Assíncrona

```typescript
export const emailSchema = z
  .object({
    email: z.string().email(),
  })
  .refine(
    async (data) => {
      // Verificar se email já existe
      const exists = await checkEmailExists(data.email)
      return !exists
    },
    {
      message: 'Email já cadastrado',
      path: ['email'],
    },
  )
```

### 4. Formulário com React Hook Form

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function UserForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  async function onSubmit(data: UserFormData) {
    const result = await createUser(data);

    if (result.success) {
      toast.success('Usuário criado!');
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="name">Nome</label>
        <input
          id="name"
          {...register('name')}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className="text-red-500 text-sm">{errors.name.message}</p>
        )}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  );
}
```

### 5. Validação em Server Actions

```typescript
'use server'

export async function createUser(data: unknown) {
  try {
    // Validar no servidor
    const validated = userSchema.parse(data)

    // Processar
    const user = await db.insert(users).values(validated).returning()

    return { success: true, data: user[0] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Dados inválidos',
        details: error.errors,
      }
    }

    return {
      success: false,
      error: 'Erro ao criar usuário',
    }
  }
}
```

### 6. Máscaras de Input

```typescript
import { IMaskInput } from 'react-imask';

export function PhoneInput({ value, onChange }) {
  return (
    <IMaskInput
      mask="(00) 00000-0000"
      value={value}
      onAccept={onChange}
      placeholder="(11) 98765-4321"
    />
  );
}
```

### 7. Validação de CPF/CNPJ

```typescript
export const cpfSchema = z
  .string()
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido')
  .refine((cpf) => {
    // Lógica de validação de CPF
    const numbers = cpf.replace(/\D/g, '')
    // Validar dígitos verificadores
    return validateCPF(numbers)
  }, 'CPF inválido')

export const cnpjSchema = z
  .string()
  .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido')
  .refine((cnpj) => {
    const numbers = cnpj.replace(/\D/g, '')
    return validateCNPJ(numbers)
  }, 'CNPJ inválido')
```

### 8. Validação de Arquivos

```typescript
export const fileSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: 'Arquivo deve ter no máximo 5MB',
    })
    .refine(
      (file) => {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp']
        return validTypes.includes(file.type)
      },
      {
        message: 'Apenas imagens JPEG, PNG ou WebP',
      },
    ),
})
```

## Checklist de Validação

- [ ] Schema Zod definido
- [ ] Validação no cliente (React Hook Form)
- [ ] Validação no servidor (Server Actions)
- [ ] Mensagens de erro em português
- [ ] Feedback visual de erros
- [ ] Máscaras para inputs formatados
- [ ] Validação de arquivos (tipo e tamanho)
- [ ] Validações customizadas quando necessário
- [ ] Desabilitar submit durante processamento
- [ ] Toast de sucesso/erro
