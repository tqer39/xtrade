-- card テーブルを item テーブルにリネーム
-- rarity カラムを description カラムにリネーム
-- category を任意カラムに変更

-- 1. card テーブルを item テーブルにリネーム
ALTER TABLE "card" RENAME TO "item";

-- 2. rarity カラムを description カラムにリネーム
ALTER TABLE "item" RENAME COLUMN "rarity" TO "description";

-- 3. category を任意カラムに変更（NOT NULL 制約を削除）
ALTER TABLE "item" ALTER COLUMN "category" DROP NOT NULL;

-- 4. インデックスの更新
DROP INDEX IF EXISTS "card_name_idx";
DROP INDEX IF EXISTS "card_category_idx";
DROP INDEX IF EXISTS "card_photocard_master_id_idx";

CREATE INDEX "item_name_idx" ON "item" ("name");
CREATE INDEX "item_category_idx" ON "item" ("category");
CREATE INDEX "item_photocard_master_id_idx" ON "item" ("photocard_master_id");
