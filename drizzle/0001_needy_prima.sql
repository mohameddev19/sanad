CREATE TYPE "public"."application_status" AS ENUM('Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected');--> statement-breakpoint
CREATE TYPE "public"."application_type" AS ENUM('Financial', 'Medical', 'Educational', 'Other');--> statement-breakpoint
CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"beneficiary_id" integer NOT NULL,
	"application_type" "application_type" NOT NULL,
	"status" "application_status" DEFAULT 'Draft' NOT NULL,
	"form_data" jsonb DEFAULT '{}' NOT NULL,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_beneficiary_id_beneficiaries_id_fk" FOREIGN KEY ("beneficiary_id") REFERENCES "public"."beneficiaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "application_beneficiary_id_idx" ON "applications" USING btree ("beneficiary_id");--> statement-breakpoint
CREATE INDEX "application_status_idx" ON "applications" USING btree ("status");