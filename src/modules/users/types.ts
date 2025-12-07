/**
 * ユーザー検索関連の型定義
 */

import type { TrustGrade } from '@/modules/trust';

export interface SearchUserResult {
  id: string;
  name: string;
  twitterUsername: string | null;
  image: string | null;
  trustScore: number | null;
  trustGrade: TrustGrade | null;
  createdAt: Date;
}

export interface SearchUsersInput {
  query?: string;
  limit?: number;
}
