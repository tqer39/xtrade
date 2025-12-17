-- Reset all users' emailVerified to false
-- X OAuth automatically sets emailVerified based on confirmed_email from Twitter API
-- This migration ensures all users must verify their email through our own verification flow
UPDATE "user" SET email_verified = false;
