import type { TrustGrade } from '@/modules/trust';

/**
 * トレードのステータス
 */
export type TradeStatus =
  | 'draft'
  | 'proposed'
  | 'agreed'
  | 'completed'
  | 'disputed'
  | 'canceled'
  | 'expired';

/**
 * トレードの基本情報
 */
export interface Trade {
  id: string;
  roomSlug: string;
  initiatorUserId: string;
  responderUserId: string | null;
  status: TradeStatus;
  proposedExpiredAt: Date | null;
  agreedExpiredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * トレード参加者の情報
 */
export interface TradeParticipant {
  id: string;
  name: string;
  twitterUsername: string | null;
  image: string | null;
  trustGrade: TrustGrade | null;
}

/**
 * トレードアイテム
 */
export interface TradeItem {
  cardId: string;
  cardName: string;
  quantity: number;
  offeredByUserId: string;
}

/**
 * トレード詳細
 */
export interface TradeDetail {
  id: string;
  roomSlug: string;
  status: TradeStatus;
  initiator: TradeParticipant;
  responder: TradeParticipant | null;
  initiatorItems: TradeItem[];
  responderItems: TradeItem[];
  proposedExpiredAt: string | null;
  agreedExpiredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * トレード作成の入力
 */
export interface CreateTradeInput {
  responderUserId?: string;
  proposedExpiredAt?: Date;
}

/**
 * オファー更新の入力
 */
export interface UpdateOfferInput {
  items: Array<{
    cardId: string;
    quantity: number;
  }>;
}

/**
 * 状態遷移エラー
 */
export class TradeTransitionError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_TRANSITION' | 'UNAUTHORIZED' | 'EXPIRED'
  ) {
    super(message);
    this.name = 'TradeTransitionError';
  }
}
