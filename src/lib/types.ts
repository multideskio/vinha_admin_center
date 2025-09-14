
import { z } from 'zod';

// =============================================================================
// ENUMS (Fonte única da verdade)
// =============================================================================

export const USER_ROLES = ['admin', 'manager', 'supervisor', 'pastor', 'church_account'] as const;
export const USER_STATUSES = ['active', 'inactive', 'pending_approval'] as const;
export const PERMISSION_LEVELS = ['admin', 'superadmin'] as const;
export const TRANSACTION_STATUSES = ['approved', 'pending', 'refused', 'refunded'] as const;
export const PAYMENT_METHODS = ['pix', 'credit_card', 'boleto'] as const;
export const NOTIFICATION_EVENT_TRIGGERS = ['user_registered', 'payment_received', 'payment_due_reminder', 'payment_overdue'] as const;
export const WEBHOOK_EVENTS = ['transacao_criada', 'transacao_recusada', 'usuario_atualizado', 'transacao_aprovada', 'usuario_criado'] as const;
export const API_KEY_STATUSES = ['active', 'inactive'] as const;
export const NOTIFICATION_TYPES = ['payment_notifications', 'due_date_reminders', 'network_reports'] as const;


// =============================================================================
// TIPOS INFERIDOS DOS SCHEMAS (para uso em todo o app)
// =============================================================================

export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];
export type PermissionLevel = (typeof PERMISSION_LEVELS)[number];
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type NotificationEventTrigger = (typeof NOTIFICATION_EVENT_TRIGGERS)[number];
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];
export type ApiKeyStatus = (typeof API_KEY_STATUSES)[number];
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

// =============================================================================
// SCHEMAS ZOD (para validação de I/O na API e Formulários)
// =============================================================================

const addressSchema = {
    cep: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    neighborhood: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    number: z.string().nullable().optional(),
    complement: z.string().nullable().optional(),
};

const socialLinksSchema = {
    facebook: z.string().url().or(z.literal('')).nullable().optional(),
    instagram: z.string().url().or(z.literal('')).nullable().optional(),
    website: z.string().url().or(z.literal('')).nullable().optional(),
};

export const userSchema = z.object({
    email: z.string().email(),
    phone: z.string().nullable(),
    titheDay: z.coerce.number().min(1).max(31).nullable(),
});

export const adminProfileSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  firstName: z.string().min(1, 'O nome é obrigatório.'),
  lastName: z.string().min(1, 'O sobrenome é obrigatório.'),
  cpf: z.string().min(14, 'CPF inválido.').optional(),
  permission: z.enum(PERMISSION_LEVELS).optional(),
  ...addressSchema,
  ...socialLinksSchema,
});

export const managerProfileSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  firstName: z.string().min(1, 'O nome é obrigatório.'),
  lastName: z.string().min(1, 'O sobrenome é obrigatório.'),
  cpf: z.string().min(14, 'CPF inválido.'),
  landline: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email('E-mail inválido.').optional(),
  titheDay: z.coerce.number().min(1).max(31).nullable().optional(),
  ...addressSchema,
  ...socialLinksSchema,
});

export const supervisorProfileSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  managerId: z.string().uuid({ message: "Selecione um gerente." }).nullable(),
  regionId: z.string().uuid({ message: "Selecione uma região." }).nullable(),
  firstName: z.string().min(1, { message: 'O nome é obrigatório.' }),
  lastName: z.string().min(1, { message: 'O sobrenome é obrigatório.' }),
  cpf: z.string().min(14, { message: 'O CPF deve ter 11 dígitos.' }),
  email: z.string().email({ message: 'E-mail inválido.' }),
  phone: z.string().min(1, { message: 'O celular é obrigatório.' }),
  landline: z.string().nullable().optional(),
  titheDay: z.coerce.number().min(1).max(31).nullable().optional(),
  ...addressSchema,
  ...socialLinksSchema,
});

export const pastorProfileSchema = z.object({
    id: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    supervisorId: z.string().uuid({ message: "Selecione um supervisor." }).nullable().optional(),
    firstName: z.string().min(1, { message: 'O nome é obrigatório.' }),
    lastName: z.string().min(1, { message: 'O sobrenome é obrigatório.' }),
    cpf: z.string().min(14, { message: 'O CPF deve ter 11 dígitos.' }),
    birthDate: z.date().nullable().optional(),
    email: z.string().email({ message: 'E-mail inválido.' }),
    phone: z.string().min(1, { message: 'O celular é obrigatório.' }),
    landline: z.string().nullable().optional(),
    titheDay: z.coerce.number().min(1).max(31).nullable().optional(),
    ...addressSchema,
    ...socialLinksSchema,
});

export const churchProfileSchema = z.object({
    id: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    supervisorId: z.string().uuid({ message: "Selecione um supervisor." }).nullable().optional(),
    cnpj: z.string().min(1, 'O CNPJ/CPF é obrigatório.'),
    razaoSocial: z.string().min(1, { message: 'A razão social é obrigatória.' }),
    nomeFantasia: z.string().min(1, { message: 'O nome fantasia é obrigatório.' }),
    foundationDate: z.date().nullable().optional(),
    email: z.string().email({ message: 'E-mail inválido.' }),
    phone: z.string().min(1, { message: 'O celular é obrigatório.' }),
    titheDay: z.coerce.number().min(1).max(31).nullable().optional(),
    treasurerFirstName: z.string().min(1, 'O nome do tesoureiro é obrigatório.').nullable().optional(),
    treasurerLastName: z.string().min(1, 'O sobrenome do tesoureiro é obrigatório.').nullable().optional(),
    treasurerCpf: z.string().min(14, 'O CPF do tesoureiro deve ter 11 dígitos.').nullable().optional(),
    ...addressSchema,
    ...socialLinksSchema,
});

// Tipos para uso no Frontend
export type AdminProfile = z.infer<typeof adminProfileSchema>;
export type ManagerProfile = z.infer<typeof managerProfileSchema>;
export type SupervisorProfile = z.infer<typeof supervisorProfileSchema>;
export type PastorProfile = z.infer<typeof pastorProfileSchema>;
export type ChurchProfile = z.infer<typeof churchProfileSchema>;
export type User = z.infer<typeof userSchema>;

