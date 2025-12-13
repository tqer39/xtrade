-- Add bio column to user table for user profile text
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "bio" text;
