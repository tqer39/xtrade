/**
 * レビュー関連の型定義
 */

/**
 * レビュー作成時の入力
 */
export interface CreateReviewInput {
  /** 評価（1-5） */
  rating: number;
  /** コメント（任意） */
  comment?: string;
  /** 公開フラグ（デフォルト: true） */
  isPublic?: boolean;
}

/**
 * レビュー情報
 */
export interface Review {
  id: string;
  tradeId: string;
  reviewer: {
    id: string;
    name: string;
    twitterUsername: string | null;
    image: string | null;
  };
  reviewee: {
    id: string;
    name: string;
    twitterUsername: string | null;
    image: string | null;
  };
  rating: number;
  comment: string | null;
  isPublic: boolean;
  createdAt: string;
}

/**
 * レビュー待ちトレード情報
 */
export interface PendingReviewTrade {
  tradeId: string;
  roomSlug: string;
  otherUser: {
    id: string;
    name: string;
    twitterUsername: string | null;
    image: string | null;
  };
  completedAt: string;
}

/**
 * レビューサービスのエラー
 */
export class ReviewError extends Error {
  constructor(
    message: string,
    public code:
      | 'TRADE_NOT_FOUND'
      | 'NOT_PARTICIPANT'
      | 'TRADE_NOT_COMPLETED'
      | 'ALREADY_REVIEWED'
      | 'INVALID_RATING'
  ) {
    super(message);
    this.name = 'ReviewError';
  }
}
