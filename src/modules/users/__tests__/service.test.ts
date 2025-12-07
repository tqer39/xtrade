import { beforeEach, describe, expect, it, vi } from 'vitest';

// DB モジュールをモック
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();

vi.mock('@/db/drizzle', () => ({
  db: {
    select: () => ({
      from: mockFrom,
    }),
  },
}));

vi.mock('@/db/schema', () => ({
  user: {
    id: 'user.id',
    name: 'user.name',
    twitterUsername: 'user.twitterUsername',
    image: 'user.image',
    trustScore: 'user.trustScore',
    trustGrade: 'user.trustGrade',
    createdAt: 'user.createdAt',
  },
}));

// drizzle-orm のモック
vi.mock('drizzle-orm', () => ({
  like: vi.fn((a, b) => ({ type: 'like', a, b })),
  or: vi.fn((...args) => ({ type: 'or', conditions: args })),
  sql: vi.fn((strings, ...values) => ({ type: 'sql', strings, values })),
}));

// モック後にインポート
const { searchUsers, getUserById } = await import('../service');

describe('users/service', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // デフォルトのチェーンモック設定
    mockFrom.mockReturnValue({
      where: mockWhere,
      orderBy: mockOrderBy,
    });
    mockWhere.mockReturnValue({
      orderBy: mockOrderBy,
      limit: mockLimit,
    });
    mockOrderBy.mockReturnValue({
      limit: mockLimit,
    });
    mockLimit.mockResolvedValue([]);
  });

  describe('searchUsers', () => {
    it('クエリなしで全件検索', async () => {
      const mockUsers = [
        { id: '1', name: 'User A', twitterUsername: 'user_a', trustGrade: 'A' },
        { id: '2', name: 'User B', twitterUsername: 'user_b', trustGrade: 'B' },
      ];
      mockLimit.mockResolvedValueOnce(mockUsers);

      const result = await searchUsers();

      expect(result).toEqual(mockUsers);
      expect(mockFrom).toHaveBeenCalled();
    });

    it('クエリありで検索', async () => {
      const mockUsers = [{ id: '1', name: 'Test User', twitterUsername: 'test', trustGrade: 'A' }];
      mockLimit.mockResolvedValueOnce(mockUsers);

      const result = await searchUsers('test');

      expect(result).toEqual(mockUsers);
      expect(mockWhere).toHaveBeenCalled();
    });

    it('件数制限を適用', async () => {
      mockLimit.mockResolvedValueOnce([]);

      await searchUsers(undefined, 10);

      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it('デフォルト件数制限は50', async () => {
      mockLimit.mockResolvedValueOnce([]);

      await searchUsers();

      expect(mockLimit).toHaveBeenCalledWith(50);
    });

    it('大文字小文字を区別しない検索', async () => {
      const mockUsers = [{ id: '1', name: 'TEST User', twitterUsername: 'TEST', trustGrade: 'A' }];
      mockLimit.mockResolvedValueOnce(mockUsers);

      const result = await searchUsers('TEST');

      expect(result).toEqual(mockUsers);
      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('存在するIDで取得', async () => {
      const mockUser = { id: '1', name: 'Test User', twitterUsername: 'test', trustGrade: 'A' };
      mockLimit.mockResolvedValueOnce([mockUser]);

      const result = await getUserById('1');

      expect(result).toEqual(mockUser);
      expect(mockWhere).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('存在しないIDでnullを返す', async () => {
      mockLimit.mockResolvedValueOnce([]);

      const result = await getUserById('nonexistent');

      expect(result).toBeNull();
    });
  });
});
