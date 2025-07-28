ALTER TABLE "church_profiles" ADD COLUMN "cpf" varchar(14);--> statement-breakpoint
ALTER TABLE "church_profiles" DROP COLUMN IF EXISTS "treasurer_cpf";