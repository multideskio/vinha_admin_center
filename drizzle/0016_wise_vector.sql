ALTER TABLE "regions" DROP CONSTRAINT "regions_deleted_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_deleted_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_deleted_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "deleted_by" uuid;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "deletion_reason" text;