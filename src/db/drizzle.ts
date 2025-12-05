import { Pool as NeonPool } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { Pool as PgPool } from 'pg';
import * as schema from './schema';

// 環境変数チェック
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL 環境変数が設定されていません');
}

const isLocal = process.env.DATABASE_URL.includes('localhost');

// ローカル環境では pg ドライバー、本番環境では Neon serverless ドライバーを使用
const db = isLocal
  ? drizzlePg(new PgPool({ connectionString: process.env.DATABASE_URL }), {
      schema,
    })
  : drizzleNeon(new NeonPool({ connectionString: process.env.DATABASE_URL }), {
      schema,
    });

export { db };

// 型安全な db クライアントをエクスポート
// 他のモジュールから import { db } from '@/db/drizzle' で使用可能
export type Database = typeof db;
