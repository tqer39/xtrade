import type { Trade, TradeStatus } from './types'
import { TradeTransitionError } from './types'

/**
 * 有効な状態遷移の定義
 *
 * draft → proposed → agreed → completed/disputed/canceled
 *                  → canceled/expired
 */
const VALID_TRANSITIONS: Record<TradeStatus, TradeStatus[]> = {
  draft: ['proposed', 'canceled'],
  proposed: ['agreed', 'canceled', 'expired'],
  agreed: ['completed', 'disputed', 'canceled'],
  completed: [],
  disputed: [],
  canceled: [],
  expired: [],
}

/**
 * 各遷移に必要な権限
 * - 'initiator': 開始者のみ
 * - 'responder': 応答者のみ
 * - 'both': どちらでも可
 */
const TRANSITION_PERMISSIONS: Record<
  string,
  'initiator' | 'responder' | 'both'
> = {
  'draft->proposed': 'initiator',
  'proposed->agreed': 'responder',
  'proposed->canceled': 'both',
  'agreed->completed': 'both',
  'agreed->disputed': 'both',
  'agreed->canceled': 'both',
}

/**
 * 状態遷移が可能かどうかをチェック
 */
export function canTransition(
  from: TradeStatus,
  to: TradeStatus
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * 状態遷移の妥当性を検証
 *
 * @param trade - トレード情報
 * @param toStatus - 遷移先のステータス
 * @param userId - 操作を行うユーザーID
 * @returns エラーがあれば TradeTransitionError をスロー
 */
export function validateTransition(
  trade: Trade,
  toStatus: TradeStatus,
  userId: string
): void {
  // 1. 遷移の妥当性チェック
  if (!canTransition(trade.status, toStatus)) {
    throw new TradeTransitionError(
      `Cannot transition from '${trade.status}' to '${toStatus}'`,
      'INVALID_TRANSITION'
    )
  }

  // 2. 権限チェック
  const permissionKey = `${trade.status}->${toStatus}`
  const requiredPermission = TRANSITION_PERMISSIONS[permissionKey]

  if (requiredPermission) {
    const isInitiator = userId === trade.initiatorUserId
    const isResponder = userId === trade.responderUserId

    if (!isInitiator && !isResponder) {
      throw new TradeTransitionError(
        'You are not a participant in this trade',
        'UNAUTHORIZED'
      )
    }

    if (requiredPermission === 'initiator' && !isInitiator) {
      throw new TradeTransitionError(
        'Only the initiator can perform this action',
        'UNAUTHORIZED'
      )
    }

    if (requiredPermission === 'responder' && !isResponder) {
      throw new TradeTransitionError(
        'Only the responder can perform this action',
        'UNAUTHORIZED'
      )
    }
  }

  // 3. 期限チェック（proposed 状態の場合）
  if (trade.status === 'proposed' && trade.proposedExpiredAt) {
    if (new Date() > trade.proposedExpiredAt) {
      throw new TradeTransitionError(
        'This trade has expired',
        'EXPIRED'
      )
    }
  }

  // 4. 期限チェック（agreed 状態の場合）
  if (trade.status === 'agreed' && trade.agreedExpiredAt) {
    if (new Date() > trade.agreedExpiredAt) {
      throw new TradeTransitionError(
        'This trade has expired',
        'EXPIRED'
      )
    }
  }
}

/**
 * トレードが終了状態かどうかをチェック
 */
export function isFinalStatus(status: TradeStatus): boolean {
  return ['completed', 'disputed', 'canceled', 'expired'].includes(status)
}

/**
 * トレードに参加可能かどうかをチェック
 */
export function canParticipate(trade: Trade, userId: string): boolean {
  return trade.initiatorUserId === userId || trade.responderUserId === userId
}
