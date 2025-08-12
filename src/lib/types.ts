

import { z } from 'zod';

// =============================================================================
// ENUMS (usados tanto no DB quanto no Zod)
// =============================================================================

export const USER_ROLES = ['admin', 'manager', 'supervisor', 'pastor', 'church_account'] as const;
export const USER_STATUSES = ['active', 'inactive', 'pending_approval'] as const;
export const PERMISSION_LEVELS = ['admin', 'superadmin'] as const;
export const TRANSACTION_STATUSES = ['approved', 'pending', 'refused', 'refunded'] as const;
export const PAYMENT_METHODS = ['pix', 'credit_card', 'boleto'] as const;
export const NOTIFICATION_EVENT_TRIGGERS = ['user_registered', 'payment_received', 'payment_due_reminder', 'payment_overdue'] as const;
export const WEBHOOK_EVENTS = ['transacao_criada', 'transacao_recusada', 'usuario_atualizado', 'transacao_aprovada', 'usuario_criado'] as const;
export const API_KEY_STATUSES = ['active', 'inactive'] as const;

// =============================================================================
// SCHEMAS ZOD (para validação de I/O)
// =============================================================================

// Base Schemas
export const companySchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    logoUrl: z.string().url().nullable(),
    supportEmail: z.string().email().nullable(),
    maintenanceMode: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
});

export const userSchema = z.object({
    id: z.string().uuid(),
    companyId: z.string().uuid(),
    email: z.string().email(),
    password: z.string(),
    role: z.enum(USER_ROLES),
    status: z.enum(USER_STATUSES),
    phone: z.string().nullable(),
    titheDay: z.number().int().nullable(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
    deletedAt: z.date().nullable(),
    deletedBy: z.string().uuid().nullable(),
    deletionReason: z.string().nullable(),
});

export const regionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'O nome da região é obrigatório.'),
  color: z
    .string()
    .min(7, { message: 'A cor deve estar no formato hexadecimal.' })
    .regex(/^#[0-9a-fA-F]{6}$/, {
      message: 'Cor inválida. Use o formato #RRGGBB.',
    }),
});

// Profile Schemas
export const adminProfileSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    cpf: z.string(),
    permission: z.enum(PERMISSION_LEVELS),
    cep: z.string().nullable(),
    state: z.string().nullable(),
    city: z.string().nullable(),
    neighborhood: z.string().nullable(),
    address: z.string().nullable(),
});

export const managerProfileSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    cpf: z.string(),
    landline: z.string().nullable(),
    cep: z.string().nullable(),
    state: z.string().nullable(),
    city: z.string().nullable(),
    neighborhood: z.string().nullable(),
    address: z.string().nullable(),
});

export const supervisorProfileSchema = z.object({
    id: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    managerId: z.string().uuid({ message: "Selecione um gerente." }).nullable(),
    regionId: z.string().uuid({ message: "Selecione uma região." }).nullable(),
    firstName: z.string().min(1, { message: 'O nome é obrigatório.' }),
    lastName: z.string().min(1, { message: 'O sobrenome é obrigatório.' }),
    cpf: z.string().min(14, { message: 'O CPF deve ter 11 dígitos.' }),
    landline: z.string().nullable(),
    cep: z.string().nullable(),
    state: z.string().nullable(),
    city: z.string().nullable(),
    neighborhood: z.string().nullable(),
    address: z.string().nullable(),
    number: z.string().nullable(),
    complement: z.string().nullable(),
    email: z.string().email(),
    phone: z.string().nullable(),
    titheDay: z.number().nullable(),
  });

export const pastorProfileSchema = z.object({
    id: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    supervisorId: z.string().uuid({ message: "Selecione um supervisor." }).nullable(),
    firstName: z.string().min(1, { message: 'O nome é obrigatório.' }),
    lastName: z.string().min(1, { message: 'O sobrenome é obrigatório.' }),
    cpf: z.string().min(14, { message: 'O CPF deve ter 11 dígitos.' }),
    birthDate: z.date().nullable(),
    landline: z.string().nullable(),
    cep: z.string().nullable(),
    state: z.string().nullable(),
    city: z.string().nullable(),
    neighborhood: z.string().nullable(),
    address: z.string().nullable(),
    number: z.string().nullable(),
    complement: z.string().nullable(),
    email: z.string().email(),
    phone: z.string().nullable(),
    titheDay: z.number().nullable(),
});

export const churchProfileSchema = z.object({
    id: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    supervisorId: z.string().uuid({ message: "Selecione um supervisor." }).nullable(),
    cnpj: z.string().min(18, 'O CNPJ é obrigatório.'),
    razaoSocial: z.string().min(1, { message: 'A razão social é obrigatória.' }),
    nomeFantasia: z.string().min(1, { message: 'O nome fantasia é obrigatório.' }),
    foundationDate: z.date().nullable(),
    cep: z.string().nullable(),
    state: z.string().nullable(),
    city: z.string().nullable(),
    neighborhood: z.string().nullable(),
    address: z.string().nullable(),
    treasurerFirstName: z.string().nullable(),
    treasurerLastName: z.string().nullable(),
    treasurerCpf: z.string().nullable(),
    email: z.string().email(),
    phone: z.string().nullable(),
    titheDay: z.number().nullable(),
});

// =============================================================================
// INFERRED TYPES (exportados para uso no código)
// =============================================================================

export type Company = z.infer<typeof companySchema>;
export type User = z.infer<typeof userSchema>;
export type Region = z.infer<typeof regionSchema>;
export type AdminProfile = z.infer<typeof adminProfileSchema>;
export type ManagerProfile = z.infer<typeof managerProfileSchema>;
export type SupervisorProfile = z.infer<typeof supervisorProfileSchema>;
export type PastorProfile = z.infer<typeof pastorProfileSchema>;
export type ChurchProfile = z.infer<typeof churchProfileSchema>;
