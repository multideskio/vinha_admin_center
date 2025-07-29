ALTER TABLE "church_profiles" DROP CONSTRAINT "church_profiles_supervisor_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "pastor_profiles" DROP CONSTRAINT "pastor_profiles_supervisor_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "supervisor_profiles" DROP CONSTRAINT "supervisor_profiles_manager_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "supervisor_profiles" DROP CONSTRAINT "supervisor_profiles_region_id_regions_id_fk";
--> statement-breakpoint
ALTER TABLE "pastor_profiles" ADD COLUMN "address" varchar(255);--> statement-breakpoint
ALTER TABLE "supervisor_profiles" ADD COLUMN "address" varchar(255);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "church_profiles" ADD CONSTRAINT "church_profiles_supervisor_id_users_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pastor_profiles" ADD CONSTRAINT "pastor_profiles_supervisor_id_users_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "supervisor_profiles" ADD CONSTRAINT "supervisor_profiles_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "supervisor_profiles" ADD CONSTRAINT "supervisor_profiles_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "pastor_profiles" DROP COLUMN IF EXISTS "street";--> statement-breakpoint
ALTER TABLE "supervisor_profiles" DROP COLUMN IF EXISTS "street";