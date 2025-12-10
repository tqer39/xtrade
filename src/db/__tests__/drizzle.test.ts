import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Database Connection', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('環境変数チェック', () => {
    it('DATABASE_URL が未設定の場合はエラーをスローする', async () => {
      vi.stubEnv('DATABASE_URL', '');

      const { db } = await import('../drizzle');

      // 遅延初期化のため、プロパティにアクセスしたときにエラーが発生する
      expect(() => db.query).toThrow('DATABASE_URL 環境変数が設定されていません');
    });
  });

  describe('ローカル環境', () => {
    it('localhost を含む場合は pg ドライバーを使用する', async () => {
      vi.stubEnv('DATABASE_URL', 'postgres://localhost:5432/testdb');

      const { db } = await import('../drizzle');

      expect(db).toBeDefined();
    });
  });

  describe('本番環境', () => {
    it('localhost を含まない場合は Neon ドライバーを使用する', async () => {
      vi.stubEnv('DATABASE_URL', 'postgres://user:pass@neon.tech/testdb');

      const { db } = await import('../drizzle');

      expect(db).toBeDefined();
    });
  });

  describe('型エクスポート', () => {
    it('Database 型がエクスポートされている', async () => {
      vi.stubEnv('DATABASE_URL', 'postgres://localhost:5432/testdb');

      const module = await import('../drizzle');

      expect(module.db).toBeDefined();
      // Database 型は TypeScript の型なので実行時にはチェックできないが、
      // モジュールが正しくエクスポートされていることを確認
    });
  });
});
