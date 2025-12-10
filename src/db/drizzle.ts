import { Pool as NeonPool } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { Pool as PgPool } from 'pg';
import * as schema from './schema';

type DrizzleClient = ReturnType<typeof drizzleNeon<typeof schema>>;

let _db: DrizzleClient | null = null;

function createDb(): DrizzleClient {
  // 環境変数チェック
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL 環境変数が設定されていません');
  }

  const isLocal = process.env.DATABASE_URL.includes('localhost');

  // ローカル環境では pg ドライバー、本番環境では Neon serverless ドライバーを使用
  if (isLocal) {
    return drizzlePg(new PgPool({ connectionString: process.env.DATABASE_URL }), {
      schema,
    }) as unknown as DrizzleClient;
  }
  return drizzleNeon(new NeonPool({ connectionString: process.env.DATABASE_URL }), {
    schema,
  });
}

// 遅延初期化 (ビルド時にはDBに接続しない)
export const db: DrizzleClient = new Proxy({} as DrizzleClient, {
  get(_target, prop) {
    if (!_db) {
      _db = createDb();
    }
    return Reflect.get(_db, prop);
  },
});

// 型安全な db クライアントをエクスポート
// 他のモジュールから import { db } from '@/db/drizzle' で使用可能
export type Database = DrizzleClient;
