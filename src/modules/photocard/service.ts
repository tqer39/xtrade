import { and, eq, like, or, sql } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import * as schema from '@/db/schema';
import type { MemberMaster, PhotocardMaster, SeriesMaster } from './types';

/**
 * フォトカードマスターを検索する
 */
export async function searchPhotocardMaster(
  query?: string,
  groupName?: string,
  memberName?: string,
  series?: string,
  limit = 50
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
