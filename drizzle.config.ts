import * as fs from 'node:fs';
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// .env.local ファイルが存在する場合のみ読み込む（CI環境では存在しない）
if (fs.existsSync('.env.local')) {
  config({ path: '.env.local' });
}

const isLocal = process.env.DATABASE_URL?.includes('localhost');

export default defineConfig({
  // Drizzle スキーマの場所
  schema: './src/db/schema.ts',

  // マイグレーションファイルの出力先
  out: './src/db/migrations',

  // 使用するデータベースドライバ
  dialect: 'postgresql',

  // データベース接続設定
  dbCredentials: {
    // 環境変数 DATABASE_URL を使用
    url: process.env.DATABASE_URL!,
  },

  // ローカルの場合は pg ドライバーを使用
  ...(isLocal && { driver: undefined }),

  // マイグレーション履歴テーブルの設定
  migrations: {
    table: '__drizzle_migrations', // デフォルトのテーブル名
    schema: 'public', // public スキーマを使用（デフォルトは 'drizzle'）
  },

  // マイグレーション設定
  verbose: true, // 詳細なログを出力
  strict: true, // 厳密モード（型安全性を強化）
});
