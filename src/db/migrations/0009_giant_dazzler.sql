CREATE TABLE "scrape_log" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"status" text NOT NULL,
	"items_found" integer,
	"items_created" integer,
	"items_updated" integer,
	"error_message" text,
	"started_at" timestamp NOT NULL,
	"finished_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "scrape_source" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"base_url" text NOT NULL,
	"category" text,
	"group_name" text,
	"config" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_scraped_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scrape_log" ADD CONSTRAINT "scrape_log_source_id_scrape_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."scrape_source"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scrape_log_source_id_idx" ON "scrape_log" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "scrape_log_status_idx" ON "scrape_log" USING btree ("status");--> statement-breakpoint
CREATE INDEX "scrape_log_started_at_idx" ON "scrape_log" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "scrape_source_type_idx" ON "scrape_source" USING btree ("type");--> statement-breakpoint
CREATE INDEX "scrape_source_category_idx" ON "scrape_source" USING btree ("category");--> statement-breakpoint
CREATE INDEX "scrape_source_is_active_idx" ON "scrape_source" USING btree ("is_active");
