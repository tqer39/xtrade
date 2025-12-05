import { and, eq, inArray, ne } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import * as schema from '@/db/schema';
import type { TrustGrade } from '@/modules/trust';
import type { Match, MatchSearchOptions } from './types';

/** グレードを数値に変換（比較用） */
const GRADE_ORDER: Record<TrustGrade, number> = {
  S: 5,
  A: 4,
  B: 3,
  C: 2,
  D: 1,
  U: 0,
};

/**
 * マッチング候補を検索する
 *
 * @param userId - 検索するユーザーのID
 * @param options - 検索オプション
 * @returns マッチング候補のリスト
 */
export async function findMatches(
  userId: string,
  options: MatchSearchOptions = {}
): Promise<{ matches: Match[]; total: number }> {
  const { minTrustGrade, limit = 20, offset = 0 } = options;

  // 自分の持っているカードIDを取得
  const myHaveCards = await db
    .select({ cardId: schema.userHaveCard.cardId })
    .from(schema.userHaveCard)
    .where(eq(schema.userHaveCard.userId, userId));

  // 自分の欲しいカードIDを取得
  const myWantCards = await db
    .select({ cardId: schema.userWantCard.cardId })
    .from(schema.userWantCard)
    .where(eq(schema.userWantCard.userId, userId));

  const myHaveCardIds = myHaveCards.map((c) => c.cardId);
  const myWantCardIds = myWantCards.map((c) => c.cardId);

  // カードを登録していない場合は空を返す
  if (myHaveCardIds.length === 0 && myWantCardIds.length === 0) {
    return { matches: [], total: 0 };
  }

  // 条件を構築
  const conditions = [ne(schema.user.id, userId)];

  // 信頼グレードフィルタ
  if (minTrustGrade) {
    const minGradeValue = GRADE_ORDER[minTrustGrade];
    const validGrades = Object.entries(GRADE_ORDER)
      .filter(([, value]) => value >= minGradeValue)
      .map(([grade]) => grade);
    conditions.push(inArray(schema.user.trustGrade, validGrades));
  }

  // マッチング候補のユーザーを取得
  // 自分の欲しいカードを持っているユーザー、または自分の持っているカードを欲しがっているユーザー
  const candidateUserIds = new Set<string>();

  // 自分の欲しいカードを持っているユーザー
  if (myWantCardIds.length > 0) {
    const usersWithMyWants = await db
      .select({ userId: schema.userHaveCard.userId })
      .from(schema.userHaveCard)
      .where(
        and(
          ne(schema.userHaveCard.userId, userId),
          inArray(schema.userHaveCard.cardId, myWantCardIds)
        )
      );
    for (const u of usersWithMyWants) {
      candidateUserIds.add(u.userId);
    }
  }

  // 自分の持っているカードを欲しがっているユーザー
  if (myHaveCardIds.length > 0) {
    const usersWantMyHaves = await db
      .select({ userId: schema.userWantCard.userId })
      .from(schema.userWantCard)
      .where(
        and(
          ne(schema.userWantCard.userId, userId),
          inArray(schema.userWantCard.cardId, myHaveCardIds)
        )
      );
    for (const u of usersWantMyHaves) {
      candidateUserIds.add(u.userId);
    }
  }

  if (candidateUserIds.size === 0) {
    return { matches: [], total: 0 };
  }

  // 候補ユーザーの詳細を取得
  const candidateUsers = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      twitterUsername: schema.user.twitterUsername,
      image: schema.user.image,
      trustGrade: schema.user.trustGrade,
      trustScore: schema.user.trustScore,
    })
    .from(schema.user)
    .where(
      and(
        inArray(schema.user.id, Array.from(candidateUserIds)),
        ...conditions.slice(1) // userId 条件以外を適用
      )
    );

  // 各候補ユーザーについてマッチング詳細を計算
  const matches: Match[] = [];

  for (const candidateUser of candidateUsers) {
    // 相手が持っていて自分が欲しいカード
    const theyHaveIWant =
      myWantCardIds.length > 0
        ? await db
            .select({
              cardId: schema.userHaveCard.cardId,
              cardName: schema.card.name,
            })
            .from(schema.userHaveCard)
            .innerJoin(schema.card, eq(schema.userHaveCard.cardId, schema.card.id))
            .where(
              and(
                eq(schema.userHaveCard.userId, candidateUser.id),
                inArray(schema.userHaveCard.cardId, myWantCardIds)
              )
            )
        : [];

    // 自分が持っていて相手が欲しいカード
    const iHaveTheyWant =
      myHaveCardIds.length > 0
        ? await db
            .select({
              cardId: schema.userWantCard.cardId,
              cardName: schema.card.name,
            })
            .from(schema.userWantCard)
            .innerJoin(schema.card, eq(schema.userWantCard.cardId, schema.card.id))
            .where(
              and(
                eq(schema.userWantCard.userId, candidateUser.id),
                inArray(schema.userWantCard.cardId, myHaveCardIds)
              )
            )
        : [];

    // どちらも空の場合はスキップ
    if (theyHaveIWant.length === 0 && iHaveTheyWant.length === 0) {
      continue;
    }

    matches.push({
      user: {
        id: candidateUser.id,
        name: candidateUser.name,
        twitterUsername: candidateUser.twitterUsername,
        image: candidateUser.image,
        trustGrade: candidateUser.trustGrade as TrustGrade | null,
        trustScore: candidateUser.trustScore,
      },
      theyHaveIWant,
      iHaveTheyWant,
      matchScore: theyHaveIWant.length + iHaveTheyWant.length,
    });
  }

  // マッチスコアでソート
  matches.sort((a, b) => b.matchScore - a.matchScore);

  const total = matches.length;
  const paginatedMatches = matches.slice(offset, offset + limit);

  return { matches: paginatedMatches, total };
}
