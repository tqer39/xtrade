ALTER TABLE "photocard_master" ADD COLUMN "source_image_url" text;--> statement-breakpoint
ALTER TABLE "photocard_master" ADD COLUMN "r2_image_url" text;--> statement-breakpoint
ALTER TABLE "photocard_master" ADD COLUMN "image_sync_status" text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "photocard_master" ADD COLUMN "image_synced_at" timestamp;--> statement-breakpoint
ALTER TABLE "photocard_master" ADD COLUMN "image_sync_error" text;--> statement-breakpoint
CREATE INDEX "photocard_master_source_image_url_idx" ON "photocard_master" USING btree ("source_image_url");--> statement-breakpoint
CREATE INDEX "photocard_master_image_sync_status_idx" ON "photocard_master" USING btree ("image_sync_status");
