ALTER TABLE "users" ADD COLUMN "blocked_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "blocked_by" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "block_reason" text;