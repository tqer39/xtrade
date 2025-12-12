import { randomUUID } from 'node:crypto';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import * as schema from '@/db/schema';
import type { FavoriteCheckResult, UserFavoriteCard, UserFavoriteUser } from './types';

// =====================================
// お気に入りカード関連
// =====================================

/**
 * ユーザーのお気に入りカード一覧を取得
 */
export async function getUserFavoriteCards(userId: string): Promise<UserFavoriteCard[]> {
  const favoriteCards = await db
    .select({
      id: schema.userFavoriteCard.id,
      userId: schema.userFavoriteCard.userId,
      cardId: schema.userFavoriteCard.cardId,
      createdAt: schema.userFavoriteCard.createdAt,
      card: {
        id: schema.card.id,
        name: schema.card.name,
        category: schema.card.category,
        description: schema.card.description,
        imageUrl: schema.card.imageUrl,
        createdByUserId: schema.card.createdByUserId,
        createdAt: schema.card.createdAt,
        updatedAt: schema.card.updatedAt,
      },
    })
    .from(schema.userFavoriteCard)
    .innerJoin(schema.card, eq(schema.userFavoriteCard.cardId, schema.card.id))
    .where(eq(schema.userFavoriteCard.userId, userId))
    .orderBy(schema.card.name);

  return favoriteCards;
}

/**
 * カードをお気に入りに追加
 */
export async function addFavoriteCard(userId: string, cardId: string): Promise<UserFavoriteCard> {
  // カードが存在するか確認
  const card = await db.select().from(schema.card).where(eq(schema.card.id, cardId)).limit(1);

  if (!card[0]) {
    throw new Error('Card not found');
  }

  // 既にお気に入りに追加済みか確認
  const existing = await db
    .select()
    .from(schema.userFavoriteCard)
    .where(
      and(eq(schema.userFavoriteCard.userId, userId), eq(schema.userFavoriteCard.cardId, cardId))
    )
    .limit(1);

  if (existing[0]) {
    // 既に存在する場合はそのまま返す
    return {
      ...existing[0],
      card: card[0],
    };
  }

  // 新規作成
  const newRecord = {
    id: randomUUID(),
    userId,
    cardId,
    createdAt: new Date(),
  };

  await db.insert(schema.userFavoriteCard).values(newRecord);

  return {
    ...newRecord,
    card: card[0],
  };
}

/**
 * カードをお気に入りから削除
 */
export async function removeFavoriteCard(userId: string, cardId: string): Promise<void> {
  await db
    .delete(schema.userFavoriteCard)
    .where(
      and(eq(schema.userFavoriteCard.userId, userId), eq(schema.userFavoriteCard.cardId, cardId))
    );
}

/**
 * カードがお気に入りに追加されているか確認
 */
export async function isCardFavorited(userId: string, cardId: string): Promise<boolean> {
  const existing = await db
    .select({ id: schema.userFavoriteCard.id })
    .from(schema.userFavoriteCard)
    .where(
      and(eq(schema.userFavoriteCard.userId, userId), eq(schema.userFavoriteCard.cardId, cardId))
    )
    .limit(1);

  return existing.length > 0;
}

// =====================================
// お気に入りユーザー関連
// =====================================

/**
 * ユーザーのお気に入りユーザー一覧を取得
 */
export async function getUserFavoriteUsers(userId: string): Promise<UserFavoriteUser[]> {
  const favoriteUsers = await db
    .select({
      id: schema.userFavoriteUser.id,
      userId: schema.userFavoriteUser.userId,
      favoriteUserId: schema.userFavoriteUser.favoriteUserId,
      createdAt: schema.userFavoriteUser.createdAt,
      favoriteUser: {
        id: schema.user.id,
        name: schema.user.name,
        twitterUsername: schema.user.twitterUsername,
        image: schema.user.image,
        trustGrade: schema.user.trustGrade,
        trustScore: schema.user.trustScore,
      },
    })
    .from(schema.userFavoriteUser)
    .innerJoin(schema.user, eq(schema.userFavoriteUser.favoriteUserId, schema.user.id))
    .where(eq(schema.userFavoriteUser.userId, userId))
    .orderBy(schema.user.name);

  return favoriteUsers;
}

/**
 * ユーザーをお気に入りに追加
 */
export async function addFavoriteUser(
  userId: string,
  favoriteUserId: string
): Promise<UserFavoriteUser> {
  // 自分自身をお気に入りにすることはできない
  if (userId === favoriteUserId) {
    throw new Error('Cannot favorite yourself');
  }

  // ユーザーが存在するか確認
  const targetUser = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      twitterUsername: schema.user.twitterUsername,
      image: schema.user.image,
      trustGrade: schema.user.trustGrade,
      trustScore: schema.user.trustScore,
    })
    .from(schema.user)
    .where(eq(schema.user.id, favoriteUserId))
    .limit(1);

  if (!targetUser[0]) {
    throw new Error('User not found');
  }

  // 既にお気に入りに追加済みか確認
  const existing = await db
    .select()
    .from(schema.userFavoriteUser)
    .where(
      and(
        eq(schema.userFavoriteUser.userId, userId),
        eq(schema.userFavoriteUser.favoriteUserId, favoriteUserId)
      )
    )
    .limit(1);

  if (existing[0]) {
    // 既に存在する場合はそのまま返す
    return {
      ...existing[0],
      favoriteUser: targetUser[0],
    };
  }

  // 新規作成
  const newRecord = {
    id: randomUUID(),
    userId,
    favoriteUserId,
    createdAt: new Date(),
  };

  await db.insert(schema.userFavoriteUser).values(newRecord);

  return {
    ...newRecord,
    favoriteUser: targetUser[0],
  };
}

/**
 * ユーザーをお気に入りから削除
 */
export async function removeFavoriteUser(userId: string, favoriteUserId: string): Promise<void> {
  await db
    .delete(schema.userFavoriteUser)
    .where(
      and(
        eq(schema.userFavoriteUser.userId, userId),
        eq(schema.userFavoriteUser.favoriteUserId, favoriteUserId)
      )
    );
}

/**
 * ユーザーがお気に入りに追加されているか確認
 */
export async function isUserFavorited(userId: string, favoriteUserId: string): Promise<boolean> {
  const existing = await db
    .select({ id: schema.userFavoriteUser.id })
    .from(schema.userFavoriteUser)
    .where(
      and(
        eq(schema.userFavoriteUser.userId, userId),
        eq(schema.userFavoriteUser.favoriteUserId, favoriteUserId)
      )
    )
    .limit(1);

  return existing.length > 0;
}

// =====================================
// バッチチェック
// =====================================

/**
 * 複数のカード/ユーザーのお気に入り状態を一括確認
 */
export async function checkFavorites(
  userId: string,
  cardIds: string[],
  userIds: string[]
): Promise<FavoriteCheckResult> {
  const result: FavoriteCheckResult = {
    cards: {},
    users: {},
  };

  // カードのお気に入り状態を取得
  if (cardIds.length > 0) {
    const favoriteCards = await db
      .select({ cardId: schema.userFavoriteCard.cardId })
      .from(schema.userFavoriteCard)
      .where(
        and(
          eq(schema.userFavoriteCard.userId, userId),
          inArray(schema.userFavoriteCard.cardId, cardIds)
        )
      );

    const favoriteCardIds = new Set(favoriteCards.map((fc) => fc.cardId));
    for (const cardId of cardIds) {
      result.cards[cardId] = favoriteCardIds.has(cardId);
    }
  }

  // ユーザーのお気に入り状態を取得
  if (userIds.length > 0) {
    const favoriteUsers = await db
      .select({ favoriteUserId: schema.userFavoriteUser.favoriteUserId })
      .from(schema.userFavoriteUser)
      .where(
        and(
          eq(schema.userFavoriteUser.userId, userId),
          inArray(schema.userFavoriteUser.favoriteUserId, userIds)
        )
      );

    const favoriteUserIds = new Set(favoriteUsers.map((fu) => fu.favoriteUserId));
    for (const uid of userIds) {
      result.users[uid] = favoriteUserIds.has(uid);
    }
  }

  return result;
}
