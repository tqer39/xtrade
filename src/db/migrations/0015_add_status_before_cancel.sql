-- Add status_before_cancel column for trade uncancel feature
ALTER TABLE "trade" ADD COLUMN "status_before_cancel" text;
