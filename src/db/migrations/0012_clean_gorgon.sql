ALTER TABLE "scrape_log" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "scrape_source" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "scrape_log" CASCADE;--> statement-breakpoint
DROP TABLE "scrape_source" CASCADE;--> statement-breakpoint
DROP INDEX "photocard_master_source_image_url_idx";--> statement-breakpoint
DROP INDEX "photocard_master_image_sync_status_idx";--> statement-breakpoint
ALTER TABLE "photocard_master" DROP COLUMN "source_image_url";--> statement-breakpoint
ALTER TABLE "photocard_master" DROP COLUMN "r2_image_url";--> statement-breakpoint
ALTER TABLE "photocard_master" DROP COLUMN "image_sync_status";--> statement-breakpoint
ALTER TABLE "photocard_master" DROP COLUMN "image_synced_at";--> statement-breakpoint
ALTER TABLE "photocard_master" DROP COLUMN "image_sync_error";
