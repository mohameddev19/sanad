CREATE TYPE "public"."beneficiary_status" AS ENUM('Martyr Family', 'Wounded', 'Prisoner Family', 'Other');--> statement-breakpoint
CREATE TABLE "beneficiaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"kinde_user_id" varchar NOT NULL,
	"first_name" varchar(256) NOT NULL,
	"last_name" varchar(256) NOT NULL,
	"phone_number" varchar(50),
	"address" text,
	"status" "beneficiary_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "beneficiaries_kinde_user_id_unique" UNIQUE("kinde_user_id")
);
--> statement-breakpoint
CREATE INDEX "beneficiary_kinde_user_id_idx" ON "beneficiaries" USING btree ("kinde_user_id");