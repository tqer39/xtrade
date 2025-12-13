-- 新3軸信頼性スコアのカラムを追加

-- 1. user テーブルに新3軸スコアカラムを追加
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS twitter_score integer;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS total_trade_score integer;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS recent_trade_score integer;

-- 2. trust_score_history テーブルを作成
CREATE TABLE IF NOT EXISTS trust_score_history (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  trust_score integer NOT NULL,
  twitter_score integer NOT NULL,
  total_trade_score integer NOT NULL,
  recent_trade_score integer NOT NULL,
  reason text,
  created_at timestamp DEFAULT now() NOT NULL
);

-- 3. インデックスを作成
CREATE INDEX IF NOT EXISTS trust_score_history_user_id_idx ON trust_score_history(user_id);
