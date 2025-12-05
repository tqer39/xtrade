import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '@/db/drizzle';
import * as schema from '@/db/schema';
import type { TrustGrade } from '@/modules/trust';
import { canParticipate, validateTransition } from './state-machine';
import type { CreateTradeInput, Trade, TradeDetail, TradeStatus, UpdateOfferInput } from './types';
import { TradeTransitionError } from './types';

/**
 * roomSlug を生成（nanoid を使用）
 */
function generateRoomSlug(): string {
  return nanoid(10);
}

/**
 * トレードを作成する
 */
export async function createTrade(
  initiatorUserId: string,
  input: CreateTradeInput = {}
): Promise<Trade> {
  const newTrade = {
    id: randomUUID(),
    roomSlug: generateRoomSlug(),
    initiatorUserId,
    responderUserId: input.responderUserId ?? null,
    status: 'draft' as const,
    proposedExpiredAt: input.proposedExpiredAt ?? null,
    agreedExpiredAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(schema.trade).values(newTrade);

  // 履歴を記録
  await db.insert(schema.tradeHistory).values({
    id: randomUUID(),
    tradeId: newTrade.id,
    fromStatus: null,
    toStatus: 'draft',
    changedByUserId: initiatorUserId,
    createdAt: new Date(),
  });

  return newTrade;
}

/**
 * roomSlug でトレードを取得
 */
export async function getTradeByRoomSlug(roomSlug: string): Promise<Trade | null> {
  const trades = await db
    .select()
    .from(schema.trade)
    .where(eq(schema.trade.roomSlug, roomSlug))
    .limit(1);

  if (!trades[0]) return null;

  return {
    ...trades[0],
    status: trades[0].status as TradeStatus,
  };
}

/**
 * トレードの詳細を取得
 */
export async function getTradeDetail(roomSlug: string): Promise<TradeDetail | null> {
  const trade = await getTradeByRoomSlug(roomSlug);
  if (!trade) return null;

  // 開始者の情報を取得
  const initiators = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      twitterUsername: schema.user.twitterUsername,
      image: schema.user.image,
      trustGrade: schema.user.trustGrade,
    })
    .from(schema.user)
    .where(eq(schema.user.id, trade.initiatorUserId))
    .limit(1);

  const initiator = initiators[0];
  if (!initiator) return null;

  // 応答者の情報を取得（存在する場合）
  let responder = null;
  if (trade.responderUserId) {
    const responders = await db
      .select({
        id: schema.user.id,
        name: schema.user.name,
        twitterUsername: schema.user.twitterUsername,
        image: schema.user.image,
        trustGrade: schema.user.trustGrade,
      })
      .from(schema.user)
      .where(eq(schema.user.id, trade.responderUserId))
      .limit(1);
    responder = responders[0] ?? null;
  }

  // トレードアイテムを取得
  const items = await db
    .select({
      cardId: schema.tradeItem.cardId,
      cardName: schema.card.name,
      quantity: schema.tradeItem.quantity,
      offeredByUserId: schema.tradeItem.offeredByUserId,
    })
    .from(schema.tradeItem)
    .innerJoin(schema.card, eq(schema.tradeItem.cardId, schema.card.id))
    .where(eq(schema.tradeItem.tradeId, trade.id));

  const initiatorItems = items.filter((item) => item.offeredByUserId === trade.initiatorUserId);
  const responderItems = items.filter((item) => item.offeredByUserId === trade.responderUserId);

  return {
    id: trade.id,
    roomSlug: trade.roomSlug,
    status: trade.status as TradeStatus,
    initiator: {
      ...initiator,
      trustGrade: initiator.trustGrade as TrustGrade | null,
    },
    responder: responder
      ? {
          ...responder,
          trustGrade: responder.trustGrade as TrustGrade | null,
        }
      : null,
    initiatorItems,
    responderItems,
    proposedExpiredAt: trade.proposedExpiredAt?.toISOString() ?? null,
    agreedExpiredAt: trade.agreedExpiredAt?.toISOString() ?? null,
    createdAt: trade.createdAt.toISOString(),
    updatedAt: trade.updatedAt.toISOString(),
  };
}

/**
 * オファー内容を更新
 */
export async function updateOffer(
  trade: Trade,
  userId: string,
  input: UpdateOfferInput
): Promise<void> {
  // 参加者チェック
  if (!canParticipate(trade, userId)) {
    throw new TradeTransitionError('You are not a participant in this trade', 'UNAUTHORIZED');
  }

  // draft または proposed 状態でのみオファー更新可能
  if (!['draft', 'proposed'].includes(trade.status)) {
    throw new TradeTransitionError('Cannot update offer in current status', 'INVALID_TRANSITION');
  }

  // 既存のアイテムを削除
  await db
    .delete(schema.tradeItem)
    .where(
      and(eq(schema.tradeItem.tradeId, trade.id), eq(schema.tradeItem.offeredByUserId, userId))
    );

  // 新しいアイテムを追加
  if (input.items.length > 0) {
    const newItems = input.items.map((item) => ({
      id: randomUUID(),
      tradeId: trade.id,
      offeredByUserId: userId,
      cardId: item.cardId,
      quantity: item.quantity,
      createdAt: new Date(),
    }));

    await db.insert(schema.tradeItem).values(newItems);
  }
}

/**
 * 状態を遷移させる
 */
export async function transitionTrade(
  trade: Trade,
  toStatus: TradeStatus,
  userId: string,
  options: { reason?: string; agreedExpiredAt?: Date } = {}
): Promise<void> {
  // バリデーション
  validateTransition(trade, toStatus, userId);

  // 状態を更新
  const updateData: Partial<typeof schema.trade.$inferInsert> = {
    status: toStatus,
    updatedAt: new Date(),
  };

  // agreed に遷移する場合は期限を設定
  if (toStatus === 'agreed' && options.agreedExpiredAt) {
    updateData.agreedExpiredAt = options.agreedExpiredAt;
  }

  await db.update(schema.trade).set(updateData).where(eq(schema.trade.id, trade.id));

  // 履歴を記録
  await db.insert(schema.tradeHistory).values({
    id: randomUUID(),
    tradeId: trade.id,
    fromStatus: trade.status,
    toStatus,
    changedByUserId: userId,
    reason: options.reason ?? null,
    createdAt: new Date(),
  });
}

/**
 * 応答者を設定する
 */
export async function setResponder(trade: Trade, responderUserId: string): Promise<void> {
  if (trade.responderUserId) {
    throw new TradeTransitionError('Trade already has a responder', 'INVALID_TRANSITION');
  }

  if (trade.initiatorUserId === responderUserId) {
    throw new TradeTransitionError('Cannot be both initiator and responder', 'INVALID_TRANSITION');
  }

  await db
    .update(schema.trade)
    .set({
      responderUserId,
      updatedAt: new Date(),
    })
    .where(eq(schema.trade.id, trade.id));
}
