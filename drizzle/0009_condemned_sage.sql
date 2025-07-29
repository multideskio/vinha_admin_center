CREATE TABLE IF NOT EXISTS "other_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"smtp_host" varchar,
	"smtp_port" integer,
	"smtp_user" varchar,
	"smtp_pass" text,
	"smtp_secure" boolean DEFAULT false,
	"whatsapp_api_url" text,
	"whatsapp_api_key" text,
	"s3_endpoint" text,
	"s3_bucket" varchar,
	"s3_region" varchar,
	"s3_access_key_id" text,
	"s3_secret_access_key" text,
	"s3_force_path_style" boolean DEFAULT false
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "other_settings" ADD CONSTRAINT "other_settings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
