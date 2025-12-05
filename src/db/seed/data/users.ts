/**
 * テスト用ユーザーのフィクスチャデータ
 * 固定IDを使用してべき等性を確保
 */
export const seedUsers = [
  {
    id: 'test-user-1',
    name: 'テストユーザー1',
    email: 'test1@example.com',
    emailVerified: true,
    twitterUsername: 'testuser1',
    role: 'user',
    trustScore: 80,
    trustGrade: 'A',
  },
  {
    id: 'test-user-2',
    name: 'テストユーザー2',
    email: 'test2@example.com',
    emailVerified: true,
    twitterUsername: 'testuser2',
    role: 'user',
    trustScore: 60,
    trustGrade: 'B',
  },
  {
    id: 'test-admin',
    name: '管理者',
    email: 'admin@example.com',
    emailVerified: true,
    twitterUsername: 'testadmin',
    role: 'admin',
    trustScore: 100,
    trustGrade: 'S',
  },
] as const
