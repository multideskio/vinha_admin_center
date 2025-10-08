-- Adicionar tabela para templates de mensagens personalizáveis
CREATE TABLE IF NOT EXISTS "message_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"template_type" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"whatsapp_template" text,
	"email_subject_template" varchar(255),
	"email_html_template" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);

-- Adicionar tabela para controle de notificações enviadas
CREATE TABLE IF NOT EXISTS "notification_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"notification_type" varchar(50) NOT NULL,
	"channel" varchar(20) NOT NULL,
	"status" varchar(20) NOT NULL,
	"message_content" text,
	"error_message" text,
	"sent_at" timestamp DEFAULT now() NOT NULL
);

-- Adicionar campo para controlar se boas-vindas foram enviadas
ALTER TABLE "users" ADD COLUMN "welcome_sent" boolean DEFAULT false NOT NULL;

-- Adicionar referências
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;

-- Inserir templates padrão para cada empresa existente
INSERT INTO "message_templates" ("company_id", "template_type", "name", "whatsapp_template", "email_subject_template", "email_html_template")
SELECT 
    id as company_id,
    'welcome' as template_type,
    'Mensagem de Boas-vindas' as name,
    '🙏 Olá {{name}}!

Seja bem-vindo(a) à {{churchName}}!

Estamos felizes em tê-lo(a) conosco. Em breve você receberá mais informações sobre como contribuir e participar de nossas atividades.

Que Deus abençoe! 🙌' as whatsapp_template,
    'Bem-vindo(a) à {{churchName}}!' as email_subject_template,
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #4a5568;">🙏 Bem-vindo(a), {{name}}!</h2>
  <p>Estamos muito felizes em recebê-lo(a) na <strong>{{churchName}}</strong>!</p>
  <p>Em breve você receberá informações sobre:</p>
  <ul>
    <li>Como fazer suas contribuições</li>
    <li>Atividades e eventos</li>
    <li>Formas de participação</li>
  </ul>
  <p>Que Deus abençoe sua jornada conosco! 🙌</p>
  <hr style="margin: 20px 0;">
  <small style="color: #718096;">Esta é uma mensagem automática do sistema {{churchName}}</small>
</div>' as email_html_template
FROM "companies"
WHERE NOT EXISTS (
    SELECT 1 FROM "message_templates" 
    WHERE "company_id" = "companies"."id" 
    AND "template_type" = 'welcome'
);

INSERT INTO "message_templates" ("company_id", "template_type", "name", "whatsapp_template", "email_subject_template", "email_html_template")
SELECT 
    id as company_id,
    'payment_reminder' as template_type,
    'Lembrete de Pagamento' as name,
    '💰 Olá {{name}}!

Lembramos que seu dízimo de R$ {{amount}} vence em {{dueDate}}.

Você pode realizar o pagamento através do nosso sistema online.

Obrigado pela sua fidelidade! 🙏' as whatsapp_template,
    'Lembrete de Dízimo' as email_subject_template,
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #4a5568;">💰 Lembrete de Dízimo</h2>
  <p>Olá {{name}},</p>
  <p>Lembramos que seu dízimo de <strong>R$ {{amount}}</strong> vence em <strong>{{dueDate}}</strong>.</p>
  {{#if paymentLink}}
  <div style="text-align: center; margin: 20px 0;">
    <a href="{{paymentLink}}" style="background: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
      Pagar Agora
    </a>
  </div>
  {{/if}}
  <p>Obrigado pela sua fidelidade e contribuição! 🙏</p>
  <hr style="margin: 20px 0;">
  <small style="color: #718096;">Esta é uma mensagem automática do sistema</small>
</div>' as email_html_template
FROM "companies"
WHERE NOT EXISTS (
    SELECT 1 FROM "message_templates" 
    WHERE "company_id" = "companies"."id" 
    AND "template_type" = 'payment_reminder'
);