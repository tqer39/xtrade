-- Add want_text column to user table for free-text want description
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "want_text" text;
