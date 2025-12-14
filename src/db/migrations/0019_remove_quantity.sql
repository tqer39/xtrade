-- Remove quantity columns from tables
-- Since quantity is always 1 and the feature is not needed, we remove these columns

-- user_have_card: quantity column removal
ALTER TABLE "user_have_card" DROP COLUMN IF EXISTS "quantity";

-- card_set_item: quantity column removal
ALTER TABLE "card_set_item" DROP COLUMN IF EXISTS "quantity";

-- trade_item: quantity column removal
ALTER TABLE "trade_item" DROP COLUMN IF EXISTS "quantity";
