CREATE TABLE "member_master" (
	"id" text PRIMARY KEY NOT NULL,
	"group_name" text NOT NULL,
	"name" text NOT NULL,
	"name_reading" text,
	"name_romaji" text,
	"debut_rank" integer,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "photocard_master" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text,
	"group_name" text,
	"member_name" text,
	"member_name_reading" text,
	"series" text,
	"release_type" text,
	"release_date" text,
	"rarity" text,
	"image_url" text,
	"source" text DEFAULT 'seed',
	"source_url" text,
	"verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "series_master" (
	"id" text PRIMARY KEY NOT NULL,
	"group_name" text NOT NULL,
	"name" text NOT NULL,
	"release_type" text,
	"release_date" text,
	"card_count" integer,
	"source_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "card" ADD COLUMN "photocard_master_id" text;--> statement-breakpoint
CREATE INDEX "member_master_group_name_idx" ON "member_master" USING btree ("group_name");--> statement-breakpoint
CREATE INDEX "member_master_name_idx" ON "member_master" USING btree ("name");--> statement-breakpoint
CREATE INDEX "photocard_master_name_idx" ON "photocard_master" USING btree ("name");--> statement-breakpoint
CREATE INDEX "photocard_master_group_idx" ON "photocard_master" USING btree ("group_name");--> statement-breakpoint
CREATE INDEX "photocard_master_member_idx" ON "photocard_master" USING btree ("member_name");--> statement-breakpoint
CREATE INDEX "photocard_master_series_idx" ON "photocard_master" USING btree ("series");--> statement-breakpoint
CREATE INDEX "series_master_group_name_idx" ON "series_master" USING btree ("group_name");--> statement-breakpoint
CREATE INDEX "series_master_name_idx" ON "series_master" USING btree ("name");--> statement-breakpoint
ALTER TABLE "card" ADD CONSTRAINT "card_photocard_master_id_photocard_master_id_fk" FOREIGN KEY ("photocard_master_id") REFERENCES "public"."photocard_master"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "card_photocard_master_id_idx" ON "card" USING btree ("photocard_master_id");
