import { beforeEach, describe, expect, it, vi } from 'vitest';

// index.ts を直接インポートしてカバレッジを確保
import * as indexModule from '../index';
import * as schemaModule from '../schema';

describe('Database Index', () => {
  beforeEach(() => {
    vi.stubEnv('DATABASE_URL', 'postgres://localhost:5432/testdb');
  });

  describe('Re-exports', () => {
    it('db を再エクスポートする', () => {
      expect(indexModule.db).toBeDefined();
    });

    it('schema のテーブルを再エクスポートする', () => {
      // schema からエクスポートされている主要なテーブルが含まれていることを確認
      expect(indexModule.user).toBe(schemaModule.user);
      expect(indexModule.account).toBe(schemaModule.account);
      expect(indexModule.session).toBe(schemaModule.session);
    });
  });
});
