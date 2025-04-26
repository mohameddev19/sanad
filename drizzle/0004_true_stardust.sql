CREATE TABLE "case_workers" (
	"id" serial PRIMARY KEY NOT NULL,
	"kinde_user_id" varchar NOT NULL,
	"first_name" varchar(256) NOT NULL,
	"last_name" varchar(256) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "case_workers_kinde_user_id_unique" UNIQUE("kinde_user_id")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"beneficiary_id" integer NOT NULL,
	"case_worker_id" integer NOT NULL,
	"subject" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"sender_kinde_user_id" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_beneficiary_id_beneficiaries_id_fk" FOREIGN KEY ("beneficiary_id") REFERENCES "public"."beneficiaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_case_worker_id_case_workers_id_fk" FOREIGN KEY ("case_worker_id") REFERENCES "public"."case_workers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "caseworker_kinde_user_id_idx" ON "case_workers" USING btree ("kinde_user_id");--> statement-breakpoint
CREATE INDEX "convo_beneficiary_idx" ON "conversations" USING btree ("beneficiary_id");--> statement-breakpoint
CREATE INDEX "convo_caseworker_idx" ON "conversations" USING btree ("case_worker_id");--> statement-breakpoint
CREATE INDEX "convo_last_message_idx" ON "conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "message_conversation_idx" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "message_sender_idx" ON "messages" USING btree ("sender_kinde_user_id");--> statement-breakpoint
CREATE INDEX "message_sent_at_idx" ON "messages" USING btree ("sent_at");