import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック設定
vi.mock('@/db/drizzle', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/db/schema', () => ({
  allowedUser: {
    twitterUsername: 'twitter_username',
  },
}));

describe('auth utilities', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('isWhitelistEnabled', () => {
    it('ADMIN_TWITTER_USERNAME が設定されている場合は true を返す', async () => {
      vi.stubEnv('ADMIN_TWITTER_USERNAME', 'testadmin');
      vi.stubEnv('DATABASE_URL', 'postgres://localhost/test');
      vi.stubEnv('TWITTER_CLIENT_ID', 'test-id');
      vi.stubEnv('TWITTER_CLIENT_SECRET', 'test-secret');

      const { isWhitelistEnabled } = await import('../auth');
      expect(isWhitelistEnabled()).toBe(true);
    });

    it('ADMIN_TWITTER_USERNAME が空の場合は false を返す', async () => {
      vi.stubEnv('ADMIN_TWITTER_USERNAME', '');
      vi.stubEnv('DATABASE_URL', 'postgres://localhost/test');
      vi.stubEnv('TWITTER_CLIENT_ID', 'test-id');
      vi.stubEnv('TWITTER_CLIENT_SECRET', 'test-secret');

      const { isWhitelistEnabled } = await import('../auth');
      expect(isWhitelistEnabled()).toBe(false);
    });
  });

  describe('ADMIN_TWITTER_USERNAME', () => {
    it('環境変数から正しく取得される', async () => {
      vi.stubEnv('ADMIN_TWITTER_USERNAME', 'myadmin');
      vi.stubEnv('DATABASE_URL', 'postgres://localhost/test');
      vi.stubEnv('TWITTER_CLIENT_ID', 'test-id');
      vi.stubEnv('TWITTER_CLIENT_SECRET', 'test-secret');

      const { ADMIN_TWITTER_USERNAME } = await import('../auth');
      expect(ADMIN_TWITTER_USERNAME).toBe('myadmin');
    });

    it('環境変数が未設定の場合は空文字を返す', async () => {
      vi.stubEnv('ADMIN_TWITTER_USERNAME', '');
      vi.stubEnv('DATABASE_URL', 'postgres://localhost/test');
      vi.stubEnv('TWITTER_CLIENT_ID', 'test-id');
      vi.stubEnv('TWITTER_CLIENT_SECRET', 'test-secret');

      const { ADMIN_TWITTER_USERNAME } = await import('../auth');
      expect(ADMIN_TWITTER_USERNAME).toBe('');
    });
  });

  describe('isAllowedUser', () => {
    it('管理者ユーザーは常に許可される', async () => {
      vi.stubEnv('ADMIN_TWITTER_USERNAME', 'adminuser');
      vi.stubEnv('DATABASE_URL', 'postgres://localhost/test');
      vi.stubEnv('TWITTER_CLIENT_ID', 'test-id');
      vi.stubEnv('TWITTER_CLIENT_SECRET', 'test-secret');

      const { isAllowedUser } = await import('../auth');
      const result = await isAllowedUser('adminuser');
      expect(result).toBe(true);
    });

    it('管理者ユーザーは大文字小文字を区別しない', async () => {
      vi.stubEnv('ADMIN_TWITTER_USERNAME', 'AdminUser');
      vi.stubEnv('DATABASE_URL', 'postgres://localhost/test');
      vi.stubEnv('TWITTER_CLIENT_ID', 'test-id');
      vi.stubEnv('TWITTER_CLIENT_SECRET', 'test-secret');

      const { isAllowedUser } = await import('../auth');
      const result = await isAllowedUser('adminuser');
      expect(result).toBe(true);
    });

    it('DBに登録されていないユーザーは許可されない', async () => {
      vi.stubEnv('ADMIN_TWITTER_USERNAME', 'testadmin');
      vi.stubEnv('DATABASE_URL', 'postgres://localhost/test');
      vi.stubEnv('TWITTER_CLIENT_ID', 'test-id');
      vi.stubEnv('TWITTER_CLIENT_SECRET', 'test-secret');

      // DBモックは空配列を返すので許可されない
      const { isAllowedUser } = await import('../auth');
      const result = await isAllowedUser('testuser');
      expect(result).toBe(false);
    });
  });
});
