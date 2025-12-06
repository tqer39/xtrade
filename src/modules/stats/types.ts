/**
 * トレード統計関連の型定義
 */

/**
 * ユーザーのトレード統計
 */
export interface UserTradeStats {
  userId: string;
  completedCount: number;
  canceledCount: number;
  disputedCount: number;
  avgResponseTimeHours: number | null;
  firstTradeAt: string | null;
  lastTradeAt: string | null;
  updatedAt: string;
}

/**
 * ユーザーのレビュー統計
 */
export interface UserReviewStats {
  userId: string;
  reviewCount: number;
  avgRating: number | null; // 実際の評価（1.0-5.0）
  positiveCount: number;
  negativeCount: number;
  updatedAt: string;
}

/**
 * 統合統計情報
 */
export interface UserStats {
  trade: UserTradeStats | null;
  review: UserReviewStats | null;
}
