import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// .env.local ファイルから環境変数を読み込む
config({ path: '.env.local' })

const isLocal = process.env.DATABASE_URL?.includes('localhost')

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

  // マイグレーション設定
  verbose: true, // 詳細なログを出力
  strict: true, // 厳密モード（型安全性を強化）
})
