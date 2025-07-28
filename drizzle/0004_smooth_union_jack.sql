ALTER TABLE "companies" DROP CONSTRAINT "companies_deleted_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "church_profiles" ADD COLUMN "treasurer_cpf" varchar(14);--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "regions" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "regions" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "church_profiles" DROP COLUMN IF EXISTS "cpf";--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN IF EXISTS "deleted_by";