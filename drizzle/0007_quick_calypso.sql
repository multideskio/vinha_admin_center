CREATE TABLE "bradesco_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operation_type" varchar(20) NOT NULL,
	"type" varchar(10) NOT NULL,
	"method" varchar(10) NOT NULL,
	"endpoint" text NOT NULL,
	"payment_id" text,
	"request_body" text,
	"response_body" text,
	"status_code" integer,
	"error_message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "gateway_configurations" ADD COLUMN "pix_key" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "gateway" varchar(20);