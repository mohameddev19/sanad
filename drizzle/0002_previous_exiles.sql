CREATE TYPE "public"."forum_post_status" AS ENUM('Visible', 'HiddenByAdmin');--> statement-breakpoint
CREATE TYPE "public"."forum_topic_status" AS ENUM('Open', 'ClosedByAdmin', 'HiddenByAdmin');--> statement-breakpoint
CREATE TABLE "forum_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"topic_id" integer NOT NULL,
	"creator_beneficiary_id" integer NOT NULL,
	"content" text NOT NULL,
	"status" "forum_post_status" DEFAULT 'Visible' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_topics" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"creator_beneficiary_id" integer NOT NULL,
	"status" "forum_topic_status" DEFAULT 'Open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_topic_id_forum_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."forum_topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_creator_beneficiary_id_beneficiaries_id_fk" FOREIGN KEY ("creator_beneficiary_id") REFERENCES "public"."beneficiaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_topics" ADD CONSTRAINT "forum_topics_creator_beneficiary_id_beneficiaries_id_fk" FOREIGN KEY ("creator_beneficiary_id") REFERENCES "public"."beneficiaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "forum_post_topic_idx" ON "forum_posts" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "forum_post_creator_idx" ON "forum_posts" USING btree ("creator_beneficiary_id");--> statement-breakpoint
CREATE INDEX "forum_post_status_idx" ON "forum_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "forum_topic_creator_idx" ON "forum_topics" USING btree ("creator_beneficiary_id");--> statement-breakpoint
CREATE INDEX "forum_topic_status_idx" ON "forum_topics" USING btree ("status");--> statement-breakpoint
CREATE INDEX "forum_topic_last_activity_idx" ON "forum_topics" USING btree ("last_activity_at");