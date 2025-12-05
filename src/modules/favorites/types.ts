import type { Card } from '../cards/types';

/**
 * ユーザーがお気に入りにしたカード
 */
export interface UserFavoriteCard {
  id: string;
  userId: string;
  cardId: string;
  createdAt: Date;
  card?: Card;
}

/**
 * お気に入りユーザーの基本情報
 */
export interface FavoriteUserInfo {
  id: string;
  name: string;
  twitterUsername: string | null;
  image: string | null;
  trustGrade: string | null;
  trustScore: number | null;
}

/**
 * ユーザーがお気に入りにしたユーザー
 */
export interface UserFavoriteUser {
  id: string;
  userId: string;
  favoriteUserId: string;
  createdAt: Date;
  favoriteUser?: FavoriteUserInfo;
}

/**
 * お気に入り状態チェックの結果
 */
export interface FavoriteCheckResult {
  cards: Record<string, boolean>;
  users: Record<string, boolean>;
}
