import { randomUUID } from 'node:crypto';
import { and, desc, eq, like, or, sql } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import * as schema from '@/db/schema';
import type {
  AddHaveCardInput,
  AddWantCardInput,
  Card,
  CardOwner,
  CardOwnerWantCard,
  CardWithCreator,
  CreateCardInput,
} from './types';

/**
 * カードを検索する
 */
export async function searchCards(query?: string, category?: string, limit = 50) {
  const whereConditions = [];

  if (query) {
    whereConditions.push(like(schema.card.name, `%${query}%`));
  }

  if (category) {
    whereConditions.push(eq(schema.card.category, category));
  }

  const cards = await db
    .select()
    .from(schema.card)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(schema.card.name)
    .limit(limit);

  return cards;
}

/**
 * カードを作成する
 */
export async function createCard(input: CreateCardInput, createdByUserId: string): Promise<Card> {
  const newCard = {
    id: randomUUID(),
    name: input.name,
    category: input.category ?? null,
    description: input.description ?? null,
    imageUrl: input.imageUrl ?? null,
    createdByUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(schema.card).values(newCard);

  return newCard;
}

/**
 * カードIDでカードを取得する
 */
export async function getCardById(cardId: string) {
  const cards = await db.select().from(schema.card).where(eq(schema.card.id, cardId)).limit(1);

  return cards[0] ?? null;
}

/**
 * ユーザーの持っているカード一覧を取得
 */
export async function getUserHaveCards(userId: string) {
  const haveCards = await db
    .select({
      id: schema.userHaveCard.id,
      userId: schema.userHaveCard.userId,
      cardId: schema.userHaveCard.cardId,
      quantity: schema.userHaveCard.quantity,
      createdAt: schema.userHaveCard.createdAt,
      updatedAt: schema.userHaveCard.updatedAt,
      card: {
        id: schema.card.id,
        name: schema.card.name,
        category: schema.card.category,
        description: schema.card.description,
        imageUrl: schema.card.imageUrl,
      },
    })
    .from(schema.userHaveCard)
    .innerJoin(schema.card, eq(schema.userHaveCard.cardId, schema.card.id))
    .where(eq(schema.userHaveCard.userId, userId))
    .orderBy(schema.card.name);

  return haveCards;
}

/**
 * ユーザーの欲しいカード一覧を取得
 */
export async function getUserWantCards(userId: string) {
  const wantCards = await db
    .select({
      id: schema.userWantCard.id,
      userId: schema.userWantCard.userId,
      cardId: schema.userWantCard.cardId,
      priority: schema.userWantCard.priority,
      createdAt: schema.userWantCard.createdAt,
      updatedAt: schema.userWantCard.updatedAt,
      card: {
        id: schema.card.id,
        name: schema.card.name,
        category: schema.card.category,
        description: schema.card.description,
        imageUrl: schema.card.imageUrl,
      },
    })
    .from(schema.userWantCard)
    .innerJoin(schema.card, eq(schema.userWantCard.cardId, schema.card.id))
    .where(eq(schema.userWantCard.userId, userId))
    .orderBy(sql`${schema.userWantCard.priority} DESC NULLS LAST`, schema.card.name);

  return wantCards;
}

/**
 * 持っているカードを追加/更新
 * quantity が 0 の場合は削除
 */
export async function upsertHaveCard(userId: string, input: AddHaveCardInput) {
  const { cardId, quantity } = input;

  // カードが存在するか確認
  const card = await getCardById(cardId);
  if (!card) {
    throw new Error('Card not found');
  }

  // quantity が 0 の場合は削除
  if (quantity <= 0) {
    await db
      .delete(schema.userHaveCard)
      .where(and(eq(schema.userHaveCard.userId, userId), eq(schema.userHaveCard.cardId, cardId)));
    return null;
  }

  // 既存のレコードを確認
  const existing = await db
    .select()
    .from(schema.userHaveCard)
    .where(and(eq(schema.userHaveCard.userId, userId), eq(schema.userHaveCard.cardId, cardId)))
    .limit(1);

  if (existing[0]) {
    // 更新
    await db
      .update(schema.userHaveCard)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(schema.userHaveCard.id, existing[0].id));

    return { ...existing[0], quantity };
  } else {
    // 新規作成
    const newRecord = {
      id: randomUUID(),
      userId,
      cardId,
      quantity,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(schema.userHaveCard).values(newRecord);

    return newRecord;
  }
}

/**
 * 欲しいカードを追加/更新
 */
export async function upsertWantCard(userId: string, input: AddWantCardInput) {
  const { cardId, priority = 0 } = input;

  // カードが存在するか確認
  const card = await getCardById(cardId);
  if (!card) {
    throw new Error('Card not found');
  }

  // 既存のレコードを確認
  const existing = await db
    .select()
    .from(schema.userWantCard)
    .where(and(eq(schema.userWantCard.userId, userId), eq(schema.userWantCard.cardId, cardId)))
    .limit(1);

  if (existing[0]) {
    // 更新
    await db
      .update(schema.userWantCard)
      .set({ priority, updatedAt: new Date() })
      .where(eq(schema.userWantCard.id, existing[0].id));

    return { ...existing[0], priority };
  } else {
    // 新規作成
    const newRecord = {
      id: randomUUID(),
      userId,
      cardId,
      priority,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(schema.userWantCard).values(newRecord);

    return newRecord;
  }
}

/**
 * 欲しいカードを削除
 */
export async function removeWantCard(userId: string, cardId: string) {
  await db
    .delete(schema.userWantCard)
    .where(and(eq(schema.userWantCard.userId, userId), eq(schema.userWantCard.cardId, cardId)));
}

/**
 * 最新登録カードを取得する（公開API用）
 */
export async function getLatestCards(limit = 20): Promise<Card[]> {
  const cards = await db
    .select()
    .from(schema.card)
    .orderBy(desc(schema.card.createdAt))
    .limit(Math.min(limit, 100));

  return cards;
}

/**
 * 最新登録カードを作成者情報付きで取得する（公開API用）
 */
export async function getLatestCardsWithCreator(limit = 20): Promise<CardWithCreator[]> {
  const cards = await db
    .select({
      id: schema.card.id,
      name: schema.card.name,
      category: schema.card.category,
      description: schema.card.description,
      imageUrl: schema.card.imageUrl,
      createdByUserId: schema.card.createdByUserId,
      createdAt: schema.card.createdAt,
      updatedAt: schema.card.updatedAt,
      creator: {
        id: schema.user.id,
        name: schema.user.name,
        image: schema.user.image,
        twitterUsername: schema.user.twitterUsername,
        trustScore: schema.user.trustScore,
        trustGrade: schema.user.trustGrade,
      },
    })
    .from(schema.card)
    .leftJoin(schema.user, eq(schema.card.createdByUserId, schema.user.id))
    .orderBy(desc(schema.card.createdAt))
    .limit(Math.min(limit, 100));

  return cards.map((card) => ({
    id: card.id,
    name: card.name,
    category: card.category,
    description: card.description,
    imageUrl: card.imageUrl,
    createdByUserId: card.createdByUserId,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
    creator: card.creator?.id
      ? {
          id: card.creator.id,
          name: card.creator.name,
          image: card.creator.image,
          twitterUsername: card.creator.twitterUsername,
          trustScore: card.creator.trustScore,
          trustGrade: card.creator.trustGrade,
        }
      : null,
  }));
}

interface SearchLatestCardsOptions {
  query?: string;
  page?: number;
  limit?: number;
}

interface SearchLatestCardsResult {
  cards: CardWithCreator[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * 最新登録カードを検索・ページネーション付きで取得する（公開API用）
 */
export async function searchLatestCardsWithCreator(
  options: SearchLatestCardsOptions = {}
): Promise<SearchLatestCardsResult> {
  const { query, page = 1, limit = 12 } = options;
  const offset = (page - 1) * limit;
  const safeLimit = Math.min(limit, 100);

  // 全文検索: カード名、カテゴリ、説明文のいずれかにマッチ
  let whereClause: ReturnType<typeof or> | undefined;
  if (query?.trim()) {
    const searchTerm = `%${query.trim()}%`;
    whereClause = or(
      like(schema.card.name, searchTerm),
      like(schema.card.category, searchTerm),
      like(schema.card.description, searchTerm)
    );
  }

  // 総件数を取得
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.card)
    .where(whereClause);
  const total = Number(countResult[0]?.count ?? 0);

  // カード取得
  const cards = await db
    .select({
      id: schema.card.id,
      name: schema.card.name,
      category: schema.card.category,
      description: schema.card.description,
      imageUrl: schema.card.imageUrl,
      createdByUserId: schema.card.createdByUserId,
      createdAt: schema.card.createdAt,
      updatedAt: schema.card.updatedAt,
      creator: {
        id: schema.user.id,
        name: schema.user.name,
        image: schema.user.image,
        twitterUsername: schema.user.twitterUsername,
        trustScore: schema.user.trustScore,
        trustGrade: schema.user.trustGrade,
        bio: schema.user.bio,
        wantText: schema.user.wantText,
      },
    })
    .from(schema.card)
    .leftJoin(schema.user, eq(schema.card.createdByUserId, schema.user.id))
    .where(whereClause)
    .orderBy(desc(schema.card.createdAt))
    .limit(safeLimit)
    .offset(offset);

  // 作成者のIDを収集
  const creatorIds = cards.map((c) => c.creator?.id).filter((id): id is string => id != null);

  // 作成者の欲しいカードを一括取得（N+1回避）
  const creatorWantCards =
    creatorIds.length > 0
      ? await db
          .select({
            userId: schema.userWantCard.userId,
            cardId: schema.userWantCard.cardId,
            cardName: schema.card.name,
            cardImageUrl: schema.card.imageUrl,
            priority: schema.userWantCard.priority,
          })
          .from(schema.userWantCard)
          .innerJoin(schema.card, eq(schema.userWantCard.cardId, schema.card.id))
          .where(sql`${schema.userWantCard.userId} IN ${creatorIds}`)
          .orderBy(sql`${schema.userWantCard.priority} DESC NULLS LAST`)
      : [];

  // ユーザーIDごとにwantCardsをグループ化（上位3件）
  const wantCardsByUser = new Map<
    string,
    { cardId: string; cardName: string; cardImageUrl: string | null }[]
  >();
  for (const wc of creatorWantCards) {
    const existing = wantCardsByUser.get(wc.userId) ?? [];
    if (existing.length < 3) {
      existing.push({
        cardId: wc.cardId,
        cardName: wc.cardName,
        cardImageUrl: wc.cardImageUrl,
      });
      wantCardsByUser.set(wc.userId, existing);
    }
  }

  return {
    cards: cards.map((card) => ({
      id: card.id,
      name: card.name,
      category: card.category,
      description: card.description,
      imageUrl: card.imageUrl,
      createdByUserId: card.createdByUserId,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
      creator: card.creator?.id
        ? {
            id: card.creator.id,
            name: card.creator.name,
            image: card.creator.image,
            twitterUsername: card.creator.twitterUsername,
            trustScore: card.creator.trustScore,
            trustGrade: card.creator.trustGrade,
            bio: card.creator.bio,
            wantText: card.creator.wantText,
            wantCards: wantCardsByUser.get(card.creator.id) ?? [],
          }
        : null,
    })),
    total,
    page,
    totalPages: Math.ceil(total / safeLimit),
  };
}

/**
 * カードを持っているユーザー一覧を取得する（公開API用）
 */
export async function getCardOwners(cardId: string): Promise<CardOwner[]> {
  const owners = await db
    .select({
      userId: schema.user.id,
      name: schema.user.name,
      image: schema.user.image,
      twitterUsername: schema.user.twitterUsername,
      trustScore: schema.user.trustScore,
      trustGrade: schema.user.trustGrade,
      wantText: schema.user.wantText,
      quantity: schema.userHaveCard.quantity,
    })
    .from(schema.userHaveCard)
    .innerJoin(schema.user, eq(schema.userHaveCard.userId, schema.user.id))
    .where(eq(schema.userHaveCard.cardId, cardId))
    .orderBy(desc(schema.user.trustScore));

  return owners;
}

/**
 * カードを持っているユーザー一覧を取得する（欲しいカード情報付き）
 */
export async function getCardOwnersWithWantCards(
  cardId: string,
  wantCardsLimit = 5
): Promise<CardOwner[]> {
  // 所有者を取得
  const owners = await getCardOwners(cardId);

  // 各所有者の欲しいカードを取得
  const ownersWithWantCards = await Promise.all(
    owners.map(async (owner) => {
      const wantCards = await db
        .select({
          cardId: schema.userWantCard.cardId,
          cardName: schema.card.name,
          cardImageUrl: schema.card.imageUrl,
        })
        .from(schema.userWantCard)
        .innerJoin(schema.card, eq(schema.userWantCard.cardId, schema.card.id))
        .where(eq(schema.userWantCard.userId, owner.userId))
        .orderBy(sql`${schema.userWantCard.priority} DESC NULLS LAST`)
        .limit(wantCardsLimit);

      return {
        ...owner,
        wantCards: wantCards as CardOwnerWantCard[],
      };
    })
  );

  return ownersWithWantCards;
}

/**
 * ユーザーが持っているカードのカテゴリ一覧を取得する
 */
export async function getUserCategories(userId: string): Promise<string[]> {
  // ユーザーの持っているカードと欲しいカードからカテゴリを取得
  const haveCardCategories = await db
    .selectDistinct({ category: schema.card.category })
    .from(schema.userHaveCard)
    .innerJoin(schema.card, eq(schema.userHaveCard.cardId, schema.card.id))
    .where(eq(schema.userHaveCard.userId, userId));

  const wantCardCategories = await db
    .selectDistinct({ category: schema.card.category })
    .from(schema.userWantCard)
    .innerJoin(schema.card, eq(schema.userWantCard.cardId, schema.card.id))
    .where(eq(schema.userWantCard.userId, userId));

  // カテゴリを統合して重複を排除
  const allCategories = new Set<string>();
  for (const row of haveCardCategories) {
    if (row.category) {
      allCategories.add(row.category);
    }
  }
  for (const row of wantCardCategories) {
    if (row.category) {
      allCategories.add(row.category);
    }
  }

  return Array.from(allCategories).sort();
}

/**
 * ユーザーが出品しているカード一覧を取得する（公開API用）
 */
export async function getUserListingCards(userId: string): Promise<Card[]> {
  const cards = await db
    .select({
      id: schema.card.id,
      name: schema.card.name,
      category: schema.card.category,
      description: schema.card.description,
      imageUrl: schema.card.imageUrl,
      createdByUserId: schema.card.createdByUserId,
      createdAt: schema.card.createdAt,
      updatedAt: schema.card.updatedAt,
    })
    .from(schema.userHaveCard)
    .innerJoin(schema.card, eq(schema.userHaveCard.cardId, schema.card.id))
    .where(eq(schema.userHaveCard.userId, userId))
    .orderBy(desc(schema.card.createdAt));

  return cards;
}

/**
 * カード詳細を作成者情報付きで取得する
 */
export async function getCardWithCreator(cardId: string): Promise<CardWithCreator | null> {
  const cards = await db
    .select({
      id: schema.card.id,
      name: schema.card.name,
      category: schema.card.category,
      description: schema.card.description,
      imageUrl: schema.card.imageUrl,
      createdByUserId: schema.card.createdByUserId,
      createdAt: schema.card.createdAt,
      updatedAt: schema.card.updatedAt,
      creator: {
        id: schema.user.id,
        name: schema.user.name,
        image: schema.user.image,
        twitterUsername: schema.user.twitterUsername,
        trustScore: schema.user.trustScore,
        trustGrade: schema.user.trustGrade,
      },
    })
    .from(schema.card)
    .leftJoin(schema.user, eq(schema.card.createdByUserId, schema.user.id))
    .where(eq(schema.card.id, cardId))
    .limit(1);

  const card = cards[0];
  if (!card) {
    return null;
  }

  return {
    id: card.id,
    name: card.name,
    category: card.category,
    description: card.description,
    imageUrl: card.imageUrl,
    createdByUserId: card.createdByUserId,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
    creator: card.creator?.id
      ? {
          id: card.creator.id,
          name: card.creator.name,
          image: card.creator.image,
          twitterUsername: card.creator.twitterUsername,
          trustScore: card.creator.trustScore,
          trustGrade: card.creator.trustGrade,
        }
      : null,
  };
}
