import { config } from 'dotenv';

// .env.local から環境変数を読み込む
config({ path: '.env.local' });

/**
 * ローカル環境かどうかを判定
 * DATABASE_URL に localhost を含む場合のみ true
 */
export function isLocalEnvironment(): boolean {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL 環境変数が設定されていません');
  }
  return databaseUrl.includes('localhost');
}

/**
 * ローカル環境でない場合はエラーをスロー
 * シードスクリプトの冒頭で呼び出す
 */
export function assertLocalEnvironment(): void {
  if (!isLocalEnvironment()) {
    throw new Error(
      'シードは本番環境では実行できません。\n' +
        'DATABASE_URL に localhost を含む環境でのみ実行可能です。'
    );
  }
}

/**
 * UUID生成ヘルパー
 */
export function generateId(): string {
  return crypto.randomUUID();
}
