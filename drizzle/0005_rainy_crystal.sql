CREATE TYPE "public"."benefit_category" AS ENUM('Financial', 'Medical', 'Educational', 'Psychological', 'Vocational', 'Other');--> statement-breakpoint
CREATE TABLE "information_benefits" (
	"id" serial PRIMARY KEY NOT NULL,
	"language" varchar(10) DEFAULT 'en' NOT NULL,
	"category" "benefit_category" NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"eligibility" text NOT NULL,
	"application_process" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "information_benefits_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "information_faqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"language" varchar(10) DEFAULT 'en' NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"category" varchar(100) DEFAULT 'General',
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "benefit_slug_lang_idx" ON "information_benefits" USING btree ("slug","language");--> statement-breakpoint
CREATE INDEX "benefit_category_lang_idx" ON "information_benefits" USING btree ("category","language");--> statement-breakpoint
CREATE INDEX "faq_lang_category_idx" ON "information_faqs" USING btree ("language","category");