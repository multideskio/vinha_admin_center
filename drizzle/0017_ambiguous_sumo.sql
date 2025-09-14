DO $$ BEGIN
 CREATE TYPE "public"."notification_type" AS ENUM('payment_notifications', 'due_date_reminders', 'network_reports');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_notification_settings" (
	"user_id" uuid NOT NULL,
	"notification_type" "notification_type" NOT NULL,
	"email" boolean DEFAULT true NOT NULL,
	"whatsapp" boolean DEFAULT false NOT NULL,
	CONSTRAINT "user_notification_settings_user_id_notification_type_pk" PRIMARY KEY("user_id","notification_type")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_notification_settings" ADD CONSTRAINT "user_notification_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
