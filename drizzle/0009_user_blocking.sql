-- Adicionar campos de bloqueio na tabela users
ALTER TABLE "users" ADD COLUMN "blocked_at" timestamp;
ALTER TABLE "users" ADD COLUMN "blocked_by" uuid;
ALTER TABLE "users" ADD COLUMN "block_reason" text;
