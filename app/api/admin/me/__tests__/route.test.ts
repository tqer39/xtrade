import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック設定
const mockGetSession = vi.fn();
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn(),
};

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: () => mockGetSession(),
    },
  },
}));

vi.mock('@/db/drizzle', () => ({
  db: mockDb,
}));

vi.mock('@/db/schema', () => ({
  user: {
    id: 'id',
    name: 'name',
    email: 'email',
    image: 'image',
    twitterUsername: 'twitter_username',
    role: 'role',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ column: a, value: b })),
}));

describe('GET /api/admin/me', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('未認証の場合は 401 を返す', async () => {
    mockGetSession.mockResolvedValue(null);

    const { GET } = await import('../route');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('セッションはあるがユーザーが見つからない場合は 404 を返す', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
    });
    mockDb.limit.mockResolvedValue([]);

    const { GET } = await import('../route');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe('User not found');
  });

  it('認証済みユーザーの情報を返す', async () => {
    const mockUser = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      image: 'https://example.com/avatar.jpg',
      twitterUsername: 'testuser',
      role: 'user',
    };

    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
    });
    mockDb.limit.mockResolvedValue([mockUser]);

    const { GET } = await import('../route');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.user).toEqual(mockUser);
  });

  it('管理者ユーザーの情報を正しく返す', async () => {
    const mockAdmin = {
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@example.com',
      image: null,
      twitterUsername: 'adminuser',
      role: 'admin',
    };

    mockGetSession.mockResolvedValue({
      user: { id: 'admin-1' },
    });
    mockDb.limit.mockResolvedValue([mockAdmin]);

    const { GET } = await import('../route');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.user.role).toBe('admin');
  });
});
