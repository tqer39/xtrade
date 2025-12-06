-- マイグレーション履歴を同期するSQL
-- __drizzle_migrations テーブルが存在しない場合は作成し、
-- 既存のマイグレーション履歴をすべて登録して不整合を解消する

-- drizzle-kit が使用するマイグレーション履歴テーブルを作成
CREATE TABLE IF NOT EXISTS __drizzle_migrations (
  id SERIAL PRIMARY KEY,
  hash TEXT NOT NULL UNIQUE,
  created_at BIGINT NOT NULL
);

-- マイグレーション履歴を挿入（ON CONFLICT DO NOTHING で重複はスキップ）
INSERT INTO __drizzle_migrations (hash, created_at) VALUES
  ('0000_smiling_jackpot', 1764379344483),
  ('0001_chubby_warbird', 1764493524387),
  ('0002_spotty_shiver_man', 1764536962952),
  ('0003_cold_zzzax', 1764537180582),
  ('0004_heavy_rhodey', 1764800389902),
  ('0005_wooden_black_widow', 1764897098937),
  ('0006_rapid_butterfly', 1764899986917)
ON CONFLICT (hash) DO NOTHING;
