import {
  pgTable,
  text,
  varchar,
  timestamp,
  serial,
  integer,
  boolean,
  date,
  decimal,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums

export const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'supervisor', 'pastor', 'church_account']);
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'pending_approval']);
export const permissionLevelEnum = pgEnum('permission_level', ['admin', 'superadmin']);
export const transactionStatusEnum = pgEnum('transaction_status', ['approved', 'pending', 'refused', 'refunded']);
export const paymentMethodEnum = pgEnum('payment_method', ['pix', 'credit_card', 'boleto']);

// Tabelas Principais

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: text('password').notNull(),
  role: userRoleEnum('role').notNull(),
  status: userStatusEnum('status').default('active').notNull(),
  phone: varchar('phone', { length: 20 }),
  titheDay: integer('tithe_day'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const regions = pgTable('regions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 7 }).notNull(), // Hex color
});

// Tabelas de Perfis

export const adminProfiles = pgTable('admin_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  cpf: varchar('cpf', { length: 14 }).unique().notNull(),
  permission: permissionLevelEnum('permission').default('admin').notNull(),
  cep: varchar('cep', { length: 9 }),
  state: varchar('state', { length: 2 }),
  city: varchar('city', { length: 100 }),
  neighborhood: varchar('neighborhood', { length: 100 }),
  address: varchar('address', { length: 255 }),
  facebook: varchar('facebook', { length: 255 }),
  instagram: varchar('instagram', { length: 255 }),
  website: varchar('website', { length: 255 }),
});

export const managerProfiles = pgTable('manager_profiles', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    cpf: varchar('cpf', { length: 14 }).unique().notNull(),
    landline: varchar('landline', { length: 20 }),
    cep: varchar('cep', { length: 9 }),
    state: varchar('state', { length: 2 }),
    city: varchar('city', { length: 100 }),
    neighborhood: varchar('neighborhood', { length: 100 }),
    address: varchar('address', { length: 255 }),
    facebook: varchar('facebook', { length: 255 }),
    instagram: varchar('instagram', { length: 255 }),
    website: varchar('website', { length: 255 }),
});

export const supervisorProfiles = pgTable('supervisor_profiles', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    managerId: integer('manager_id').references(() => users.id), // References a user with 'manager' role
    regionId: integer('region_id').references(() => regions.id),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    cpf: varchar('cpf', { length: 14 }).unique().notNull(),
    landline: varchar('landline', { length: 20 }),
    cep: varchar('cep', { length: 9 }),
    state: varchar('state', { length: 2 }),
    city: varchar('city', { length: 100 }),
    neighborhood: varchar('neighborhood', { length: 100 }),
    street: varchar('street', { length: 255 }),
    number: varchar('number', { length: 20 }),
    complement: varchar('complement', { length: 100 }),
    facebook: varchar('facebook', { length: 255 }),
    instagram: varchar('instagram', { length: 255 }),
    website: varchar('website', { length: 255 }),
});

export const pastorProfiles = pgTable('pastor_profiles', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    supervisorId: integer('supervisor_id').references(() => users.id), // References a user with 'supervisor' role
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    cpf: varchar('cpf', { length: 14 }).unique().notNull(),
    birthDate: date('birth_date'),
    landline: varchar('landline', { length: 20 }),
    cep: varchar('cep', { length: 9 }),
    state: varchar('state', { length: 2 }),
    city: varchar('city', { length: 100 }),
    neighborhood: varchar('neighborhood', { length: 100 }),
    street: varchar('street', { length: 255 }),
    number: varchar('number', { length: 20 }),
    complement: varchar('complement', { length: 100 }),
    facebook: varchar('facebook', { length: 255 }),
    instagram: varchar('instagram', { length: 255 }),
    website: varchar('website', { length: 255 }),
});

export const churchProfiles = pgTable('church_profiles', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    supervisorId: integer('supervisor_id').references(() => users.id), // References a user with 'supervisor' role
    cnpj: varchar('cnpj', { length: 18 }).unique().notNull(),
    razaoSocial: varchar('razao_social', { length: 255 }).notNull(),
    nomeFantasia: varchar('nome_fantasia', { length: 255 }).notNull(),
    foundationDate: date('foundation_date'),
    cep: varchar('cep', { length: 9 }),
    state: varchar('state', { length: 2 }),
    city: varchar('city', { length: 100 }),
    neighborhood: varchar('neighborhood', { length: 100 }),
    address: varchar('address', { length: 255 }),
    treasurerFirstName: varchar('treasurer_first_name', { length: 100 }),
    treasurerLastName: varchar('treasurer_last_name', { length: 100 }),
    treasurerCpf: varchar('treasurer_cpf', { length: 14 }),
    facebook: varchar('facebook', { length: 255 }),
    instagram: varchar('instagram', { length: 255 }),
    website: varchar('website', { length: 255 }),
});

// Tabela de Transações
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  contributorId: integer('contributor_id').references(() => users.id).notNull(), // User who made the contribution
  churchId: integer('church_id').references(() => users.id).notNull(), // Church that received the contribution
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  status: transactionStatusEnum('status').notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  gatewayTransactionId: varchar('gateway_transaction_id', { length: 255 }),
  refundRequestReason: text('refund_request_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabela de Configurações dos Gateways
export const gatewayConfigurations = pgTable('gateway_configurations', {
    id: serial('id').primaryKey(),
    gatewayName: varchar('gateway_name', { length: 50 }).unique().notNull(), // 'cielo' or 'bradesco'
    isActive: boolean('is_active').default(false).notNull(),
    environment: varchar('environment', { length: 20 }).default('development').notNull(), // 'production' or 'development'
    prodClientId: text('prod_client_id'),
    prodClientSecret: text('prod_client_secret'),
    devClientId: text('dev_client_id'),
    devClientSecret: text('dev_client_secret'),
    certificate: text('certificate'), // Store file path or content
    certificatePassword: text('certificate_password'),
    acceptedPaymentMethods: text('accepted_payment_methods'), // Store as JSON string or comma-separated
});


// Relações

export const usersRelations = relations(users, ({ one }) => ({
    adminProfile: one(adminProfiles, { fields: [users.id], references: [adminProfiles.userId] }),
    managerProfile: one(managerProfiles, { fields: [users.id], references: [managerProfiles.userId] }),
    supervisorProfile: one(supervisorProfiles, { fields: [users.id], references: [supervisorProfiles.userId] }),
    pastorProfile: one(pastorProfiles, { fields: [users.id], references: [pastorProfiles.userId] }),
    churchProfile: one(churchProfiles, { fields: [users.id], references: [churchProfiles.userId] }),
}));

export const supervisorProfilesRelations = relations(supervisorProfiles, ({ one }) => ({
    manager: one(users, { fields: [supervisorProfiles.managerId], references: [users.id], relationName: 'manager' }),
    region: one(regions, { fields: [supervisorProfiles.regionId], references: [regions.id] }),
}));

export const pastorProfilesRelations = relations(pastorProfiles, ({ one }) => ({
    supervisor: one(users, { fields: [pastorProfiles.supervisorId], references: [users.id], relationName: 'supervisor' }),
}));

export const churchProfilesRelations = relations(churchProfiles, ({ one }) => ({
    supervisor: one(users, { fields: [churchProfiles.supervisorId], references: [users.id], relationName: 'church_supervisor' }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
    contributor: one(users, { fields: [transactions.contributorId], references: [users.id], relationName: 'contributor' }),
    church: one(users, { fields: [transactions.churchId], references: [users.id], relationName: 'church' }),
}));
