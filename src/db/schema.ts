/**
 * @fileoverview Schema do banco de dados Drizzle para a aplicação.
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 */
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  date,
  decimal,
  pgEnum,
  uuid,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import {
  USER_ROLES,
  USER_STATUSES,
  PERMISSION_LEVELS,
  TRANSACTION_STATUSES,
  PAYMENT_METHODS,
  NOTIFICATION_EVENT_TRIGGERS,
  WEBHOOK_EVENTS,
  API_KEY_STATUSES,
  NOTIFICATION_TYPES,
} from '@/lib/types'

// Enums
export const userRoleEnum = pgEnum('user_role', USER_ROLES)
export const userStatusEnum = pgEnum('user_status', USER_STATUSES)
export const permissionLevelEnum = pgEnum('permission_level', PERMISSION_LEVELS)
export const transactionStatusEnum = pgEnum('transaction_status', TRANSACTION_STATUSES)
export const paymentMethodEnum = pgEnum('payment_method', PAYMENT_METHODS)
export const notificationEventTriggerEnum = pgEnum(
  'notification_event_trigger',
  NOTIFICATION_EVENT_TRIGGERS,
)
export const webhookEventEnum = pgEnum('webhook_event', WEBHOOK_EVENTS)
export const apiKeyStatusEnum = pgEnum('api_key_status', API_KEY_STATUSES)
export const notificationTypeEnum = pgEnum('notification_type', NOTIFICATION_TYPES)

// Tabelas Principais
export const companies = pgTable('companies', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 255 }).notNull(),
  logoUrl: text('logo_url'),
  supportEmail: varchar('support_email', { length: 255 }),
  maintenanceMode: boolean('maintenance_mode').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
  deletedBy: uuid('deleted_by'),
  deletionReason: text('deletion_reason'),
})

export const users = pgTable('users', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  companyId: uuid('company_id')
    .references(() => companies.id, { onDelete: 'cascade' })
    .notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: text('password').notNull(),
  role: userRoleEnum('role').notNull(),
  status: userStatusEnum('status').default('active').notNull(),
  phone: varchar('phone', { length: 20 }),
  titheDay: integer('tithe_day'),
  avatarUrl: text('avatar_url'),
  welcomeSent: boolean('welcome_sent').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
  deletedBy: uuid('deleted_by'),
  deletionReason: text('deletion_reason'),
})

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', {
    withTimezone: true,
    mode: 'date',
  }).notNull(),
})

export const regions = pgTable('regions', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  companyId: uuid('company_id')
    .references(() => companies.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 7 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
  deletedBy: uuid('deleted_by'),
  deletionReason: text('deletion_reason'),
})

// Tabelas de Perfis
export const adminProfiles = pgTable('admin_profiles', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
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
})

export const managerProfiles = pgTable('manager_profiles', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
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
})

export const supervisorProfiles = pgTable('supervisor_profiles', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  managerId: uuid('manager_id').references(() => users.id, { onDelete: 'set null' }),
  regionId: uuid('region_id').references(() => regions.id, { onDelete: 'set null' }),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  cpf: varchar('cpf', { length: 14 }).unique().notNull(),
  landline: varchar('landline', { length: 20 }),
  cep: varchar('cep', { length: 9 }),
  state: varchar('state', { length: 2 }),
  city: varchar('city', { length: 100 }),
  neighborhood: varchar('neighborhood', { length: 100 }),
  address: varchar('address', { length: 255 }),
  number: varchar('number', { length: 20 }),
  complement: varchar('complement', { length: 100 }),
  facebook: varchar('facebook', { length: 255 }),
  instagram: varchar('instagram', { length: 255 }),
  website: varchar('website', { length: 255 }),
})

export const pastorProfiles = pgTable('pastor_profiles', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  supervisorId: uuid('supervisor_id').references(() => users.id, { onDelete: 'set null' }),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  cpf: varchar('cpf', { length: 14 }).unique().notNull(),
  birthDate: date('birth_date'),
  landline: varchar('landline', { length: 20 }),
  cep: varchar('cep', { length: 9 }),
  state: varchar('state', { length: 2 }),
  city: varchar('city', { length: 100 }),
  neighborhood: varchar('neighborhood', { length: 100 }),
  address: varchar('address', { length: 255 }),
  number: varchar('number', { length: 20 }),
  complement: varchar('complement', { length: 100 }),
  facebook: varchar('facebook', { length: 255 }),
  instagram: varchar('instagram', { length: 255 }),
  website: varchar('website', { length: 255 }),
})

export const churchProfiles = pgTable('church_profiles', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  supervisorId: uuid('supervisor_id').references(() => users.id, { onDelete: 'set null' }),
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
})

// Tabela de Transações
export const transactions = pgTable('transactions', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  contributorId: uuid('contributor_id')
    .references(() => users.id)
    .notNull(),
  originChurchId: uuid('origin_church_id').references(() => users.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  status: transactionStatusEnum('status').notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  description: text('description'),
  gatewayTransactionId: varchar('gateway_transaction_id', { length: 255 }),
  refundRequestReason: text('refund_request_reason'),
  installments: integer('installments').default(1).notNull(),
  // Campos de controle de fraude
  isFraud: boolean('is_fraud').default(false).notNull(),
  fraudMarkedAt: timestamp('fraud_marked_at'),
  fraudMarkedBy: uuid('fraud_marked_by').references(() => users.id),
  fraudReason: text('fraud_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  deletedBy: uuid('deleted_by'),
  deletionReason: text('deletion_reason'),
})

// Tabela de Configurações e Automações
export const gatewayConfigurations = pgTable('gateway_configurations', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  gatewayName: varchar('gateway_name', { length: 50 }).notNull(),
  isActive: boolean('is_active').default(false).notNull(),
  environment: varchar('environment', { length: 20 }).default('development').notNull(),
  prodClientId: text('prod_client_id'),
  prodClientSecret: text('prod_client_secret'),
  devClientId: text('dev_client_id'),
  devClientSecret: text('dev_client_secret'),
  certificate: text('certificate'),
  certificatePassword: text('certificate_password'),
  acceptedPaymentMethods: text('accepted_payment_methods'),
})

export const otherSettings = pgTable('other_settings', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  companyId: uuid('company_id')
    .references(() => companies.id, { onDelete: 'no action' })
    .notNull(),
  smtpHost: varchar('smtp_host'),
  smtpPort: integer('smtp_port'),
  smtpUser: varchar('smtp_user'),
  smtpPass: text('smtp_pass'),
  smtpFrom: varchar('smtp_from'),
  whatsappApiUrl: text('whatsapp_api_url'),
  whatsappApiKey: text('whatsapp_api_key'),
  whatsappApiInstance: varchar('whatsapp_api_instance'),
  s3Endpoint: text('s3_endpoint'),
  s3Bucket: varchar('s3_bucket'),
  s3Region: varchar('s3_region'),
  s3AccessKeyId: text('s3_access_key_id'),
  s3SecretAccessKey: text('s3_secret_access_key'),
  s3ForcePathStyle: boolean('s3_force_path_style').default(false),
  s3CloudfrontUrl: text('s3_cloudfront_url'),
  openaiApiKey: text('openai_api_key'),
})

export const notificationRules = pgTable('notification_rules', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  eventTrigger: notificationEventTriggerEnum('event_trigger').notNull(),
  daysOffset: integer('days_offset').default(0).notNull(),
  messageTemplate: text('message_template').notNull(),
  sendViaEmail: boolean('send_via_email').default(true).notNull(),
  sendViaWhatsapp: boolean('send_via_whatsapp').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const webhooks = pgTable('webhooks', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  url: text('url').notNull(),
  secret: text('secret').notNull(),
  events: webhookEventEnum('events').array().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const apiKeys = pgTable('api_keys', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  key: varchar('key', { length: 255 }).unique().notNull(),
  status: apiKeyStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at'),
})

export const userNotificationSettings = pgTable(
  'user_notification_settings',
  {
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    notificationType: notificationTypeEnum('notification_type').notNull(),
    email: boolean('email').default(true).notNull(),
    whatsapp: boolean('whatsapp').default(false).notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.userId, table.notificationType] }),
    }
  },
)

export const messageTemplates = pgTable('message_templates', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  companyId: uuid('company_id')
    .references(() => companies.id, { onDelete: 'cascade' })
    .notNull(),
  templateType: varchar('template_type', { length: 50 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  whatsappTemplate: text('whatsapp_template'),
  emailSubjectTemplate: varchar('email_subject_template', { length: 255 }),
  emailHtmlTemplate: text('email_html_template'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const notificationLogs = pgTable('notification_logs', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  companyId: uuid('company_id')
    .references(() => companies.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  notificationType: varchar('notification_type', { length: 50 }).notNull(),
  channel: varchar('channel', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  recipient: varchar('recipient', { length: 255 }),
  subject: varchar('subject', { length: 500 }),
  messageContent: text('message_content'),
  errorMessage: text('error_message'),
  errorCode: varchar('error_code', { length: 50 }),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
})

export const emailBlacklist = pgTable('email_blacklist', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  companyId: uuid('company_id')
    .references(() => companies.id, { onDelete: 'cascade' })
    .notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  reason: varchar('reason', { length: 50 }).notNull(),
  errorCode: varchar('error_code', { length: 50 }),
  errorMessage: text('error_message'),
  firstFailedAt: timestamp('first_failed_at').defaultNow().notNull(),
  lastAttemptAt: timestamp('last_attempt_at').defaultNow().notNull(),
  attemptCount: integer('attempt_count').default(1).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
})

export const userActionLogs = pgTable('user_action_logs', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const cieloLogs = pgTable('cielo_logs', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  operationType: varchar('operation_type', { length: 50 }).notNull(), // 'pix' | 'cartao' | 'boleto' | 'webhook' | 'consulta'
  type: varchar('type', { length: 50 }).notNull(), // 'request' | 'response'
  method: varchar('method', { length: 10 }).notNull(), // 'POST' | 'GET'
  endpoint: varchar('endpoint', { length: 255 }).notNull(),
  paymentId: varchar('payment_id', { length: 255 }),
  requestBody: text('request_body'),
  responseBody: text('response_body'),
  statusCode: integer('status_code'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Tabela de Tokens para Recuperação de Senha
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  token: varchar('token', { length: 255 }).unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Relações

export const companiesRelations = relations(companies, ({ many, one }) => ({
  users: many(users),
  regions: many(regions),
  gatewayConfigurations: many(gatewayConfigurations),
  transactions: many(transactions),
  notificationRules: many(notificationRules),
  webhooks: many(webhooks),
  otherSettings: one(otherSettings, {
    fields: [companies.id],
    references: [otherSettings.companyId],
  }),
  apiKeys: many(apiKeys),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, { fields: [users.companyId], references: [companies.id] }),
  adminProfile: one(adminProfiles, { fields: [users.id], references: [adminProfiles.userId] }),
  managerProfile: one(managerProfiles, {
    fields: [users.id],
    references: [managerProfiles.userId],
  }),
  supervisorProfile: one(supervisorProfiles, {
    fields: [users.id],
    references: [supervisorProfiles.userId],
  }),
  pastorProfile: one(pastorProfiles, { fields: [users.id], references: [pastorProfiles.userId] }),
  churchProfile: one(churchProfiles, { fields: [users.id], references: [churchProfiles.userId] }),
  sessions: many(sessions),
  transactions: many(transactions, { relationName: 'contributor' }),
  notificationSettings: many(userNotificationSettings),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

export const regionsRelations = relations(regions, ({ one, many }) => ({
  company: one(companies, { fields: [regions.companyId], references: [companies.id] }),
  supervisors: many(supervisorProfiles),
}))

export const adminProfilesRelations = relations(adminProfiles, ({ one }) => ({
  user: one(users, { fields: [adminProfiles.userId], references: [users.id] }),
}))

export const managerProfilesRelations = relations(managerProfiles, ({ one, many }) => ({
  user: one(users, { fields: [managerProfiles.userId], references: [users.id] }),
  supervisors: many(supervisorProfiles),
}))

export const supervisorProfilesRelations = relations(supervisorProfiles, ({ one, many }) => ({
  user: one(users, { fields: [supervisorProfiles.userId], references: [users.id] }),
  manager: one(users, { fields: [supervisorProfiles.managerId], references: [users.id] }),
  region: one(regions, { fields: [supervisorProfiles.regionId], references: [regions.id] }),
  pastors: many(pastorProfiles),
  churches: many(churchProfiles),
}))

export const pastorProfilesRelations = relations(pastorProfiles, ({ one }) => ({
  user: one(users, { fields: [pastorProfiles.userId], references: [users.id] }),
  supervisor: one(users, {
    fields: [pastorProfiles.supervisorId],
    references: [users.id],
    relationName: 'pastor_supervisor',
  }),
}))

export const churchProfilesRelations = relations(churchProfiles, ({ one }) => ({
  user: one(users, { fields: [churchProfiles.userId], references: [users.id] }),
  supervisor: one(users, {
    fields: [churchProfiles.supervisorId],
    references: [users.id],
    relationName: 'church_supervisor',
  }),
}))

export const transactionsRelations = relations(transactions, ({ one }) => ({
  company: one(companies, { fields: [transactions.companyId], references: [companies.id] }),
  contributor: one(users, { fields: [transactions.contributorId], references: [users.id] }),
  originChurch: one(users, { fields: [transactions.originChurchId], references: [users.id] }),
  fraudMarkedByUser: one(users, { fields: [transactions.fraudMarkedBy], references: [users.id] }),
}))

export const gatewayConfigurationsRelations = relations(gatewayConfigurations, ({ one }) => ({
  company: one(companies, {
    fields: [gatewayConfigurations.companyId],
    references: [companies.id],
  }),
}))

export const notificationRulesRelations = relations(notificationRules, ({ one }) => ({
  company: one(companies, { fields: [notificationRules.companyId], references: [companies.id] }),
}))

export const webhooksRelations = relations(webhooks, ({ one }) => ({
  company: one(companies, { fields: [webhooks.companyId], references: [companies.id] }),
}))

export const otherSettingsRelations = relations(otherSettings, ({ one }) => ({
  company: one(companies, { fields: [otherSettings.companyId], references: [companies.id] }),
}))

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  company: one(companies, { fields: [apiKeys.companyId], references: [companies.id] }),
}))

export const userNotificationSettingsRelations = relations(userNotificationSettings, ({ one }) => ({
  user: one(users, {
    fields: [userNotificationSettings.userId],
    references: [users.id],
  }),
}))

export const messageTemplatesRelations = relations(messageTemplates, ({ one }) => ({
  company: one(companies, { fields: [messageTemplates.companyId], references: [companies.id] }),
}))

export const notificationLogsRelations = relations(notificationLogs, ({ one }) => ({
  company: one(companies, { fields: [notificationLogs.companyId], references: [companies.id] }),
  user: one(users, { fields: [notificationLogs.userId], references: [users.id] }),
}))

export const emailBlacklistRelations = relations(emailBlacklist, ({ one }) => ({
  company: one(companies, { fields: [emailBlacklist.companyId], references: [companies.id] }),
}))

export const userActionLogsRelations = relations(userActionLogs, ({ one }) => ({
  user: one(users, { fields: [userActionLogs.userId], references: [users.id] }),
}))
