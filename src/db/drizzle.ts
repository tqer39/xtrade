import { drizzle } from 'drizzle-orm/neon-serverless'
import { Pool } from '@neondatabase/serverless'
import * as schema from './schema'

// 環境変数チェック
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL 環境変数が設定されていません')
}

// Neon serverless driver の pooling connection を作成
// pooling=true パラメータを使用して効率的なコネクション管理を実現
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// Drizzle ORM クライアントを作成
// schema をインポートすることで、型安全な DB アクセスが可能
export const db = drizzle(pool, { schema })

// 型安全な db クライアントをエクスポート
// 他のモジュールから import { db } from '@/db/drizzle' で使用可能
export type Database = typeof db
