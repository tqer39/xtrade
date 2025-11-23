import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  // Drizzle スキーマの場所
  schema: './src/db/schema.ts',

  // マイグレーションファイルの出力先
  out: './drizzle',

  // 使用するデータベースドライバ
  dialect: 'postgresql',

  // データベース接続設定
  dbCredentials: {
    // 環境変数 DATABASE_URL を使用
    // Neon の pooling connection を使用
    url: process.env.DATABASE_URL!,
  },

  // マイグレーション設定
  verbose: true, // 詳細なログを出力
  strict: true, // 厳密モード（型安全性を強化）
})
