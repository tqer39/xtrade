import { and, eq, like, or, sql } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import * as schema from '@/db/schema';
import type { MemberMaster, PhotocardMaster, SeriesMaster } from './types';

export type SortBy = 'name' | 'relevance';

/**
 * 和名マッチスコアを計算する
 * - 完全一致: +100
 * - 前方一致: +50
 * - 部分一致: +25
 * - 読み/正規化名マッチ: +10
 */
function calcNameRelevanceScore(photocard: PhotocardMaster, query: string): number {
  if (!query) return 0;

  const normalizedQuery = query.toLowerCase().trim();
  const name = photocard.name?.toLowerCase() ?? '';
  const memberName = photocard.memberName?.toLowerCase() ?? '';
  const normalizedName = photocard.normalizedName?.toLowerCase() ?? '';
  const memberNameReading = photocard.memberNameReading?.toLowerCase() ?? '';

  let score = 0;

  // カード名の完全一致
  if (name === normalizedQuery) {
    score += 100;
  } else if (name.startsWith(normalizedQuery)) {
    // カード名の前方一致
    score += 50;
  } else if (name.includes(normalizedQuery)) {
    // カード名の部分一致
    score += 25;
  }

  // メンバー名の完全一致
  if (memberName === normalizedQuery) {
    score += 80;
  } else if (memberName.startsWith(normalizedQuery)) {
    // メンバー名の前方一致
    score += 40;
  } else if (memberName.includes(normalizedQuery)) {
    // メンバー名の部分一致
    score += 20;
  }

  // 正規化名・読みマッチ
  if (normalizedName.includes(normalizedQuery)) {
    score += 10;
  }
  if (memberNameReading.includes(normalizedQuery)) {
    score += 10;
  }

  return score;
}

/**
 * フォトカードマスターを検索する
 */
export async function searchPhotocardMaster(
  query?: string,
  groupName?: string,
  memberName?: string,
  series?: string,
  limit = 50,
  sortBy: SortBy = 'relevance'
): Promise<PhotocardMaster[]> {
  const conditions = [];

  if (query) {
    conditions.push(
      or(
        like(schema.photocardMaster.name, `%${query}%`),
        like(schema.photocardMaster.memberName, `%${query}%`),
        like(schema.photocardMaster.normalizedName, `%${query}%`),
        like(schema.photocardMaster.memberNameReading, `%${query}%`)
      )
    );
  }

  if (groupName) {
    conditions.push(eq(schema.photocardMaster.groupName, groupName));
  }

  if (memberName) {
    conditions.push(eq(schema.photocardMaster.memberName, memberName));
  }

  if (series) {
    conditions.push(eq(schema.photocardMaster.series, series));
  }

  const photocards = await db
    .select()
    .from(schema.photocardMaster)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(schema.photocardMaster.name)
    .limit(limit);

  // 関連度順ソート
  if (sortBy === 'relevance' && query) {
    return photocards.sort((a, b) => {
      const scoreA = calcNameRelevanceScore(a, query);
      const scoreB = calcNameRelevanceScore(b, query);
      // スコアが同じ場合は名前順
      if (scoreB === scoreA) {
        return (a.name ?? '').localeCompare(b.name ?? '');
      }
      return scoreB - scoreA;
    });
  }

  return photocards;
}

/**
 * フォトカードマスターをIDで取得する
 */
export async function getPhotocardMasterById(id: string): Promise<PhotocardMaster | null> {
  const photocards = await db
    .select()
    .from(schema.photocardMaster)
    .where(eq(schema.photocardMaster.id, id))
    .limit(1);

  return photocards[0] ?? null;
}

/**
 * メンバーマスター一覧を取得する
 */
export async function getMemberMasters(groupName?: string): Promise<MemberMaster[]> {
  const conditions = [];

  if (groupName) {
    conditions.push(eq(schema.memberMaster.groupName, groupName));
  }

  const members = await db
    .select()
    .from(schema.memberMaster)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(schema.memberMaster.debutRank);

  return members;
}

/**
 * シリーズマスター一覧を取得する
 */
export async function getSeriesMasters(groupName?: string): Promise<SeriesMaster[]> {
  const conditions = [];

  if (groupName) {
    conditions.push(eq(schema.seriesMaster.groupName, groupName));
  }

  const seriesList = await db
    .select()
    .from(schema.seriesMaster)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`${schema.seriesMaster.releaseDate} DESC`);

  return seriesList;
}

/**
 * グループ一覧を取得する（ユニークなgroupNameを抽出）
 */
export async function getGroups(): Promise<string[]> {
  const groups = await db
    .selectDistinct({ groupName: schema.memberMaster.groupName })
    .from(schema.memberMaster)
    .orderBy(schema.memberMaster.groupName);

  return groups.map((g) => g.groupName);
}
