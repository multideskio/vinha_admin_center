DO $$ BEGIN
 CREATE TYPE "public"."webhook_event" AS ENUM('transacao_criada', 'transacao_recusada', 'usuario_atualizado', 'transacao_aprovada', 'usuario_criado');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "webhooks" ALTER COLUMN "events" SET DATA TYPE webhook_event[];