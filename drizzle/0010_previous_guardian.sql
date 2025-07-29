ALTER TABLE "other_settings" ADD COLUMN "smtp_from" varchar;--> statement-breakpoint
ALTER TABLE "other_settings" DROP COLUMN IF EXISTS "smtp_secure";