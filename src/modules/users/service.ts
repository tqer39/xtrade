import { or, sql } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import * as schema from '@/db/schema';
import type { SearchUserResult } from './types';

/**
 * ユーザーを検索する
 * 名前とTwitterユーザー名で部分一致検索
 */
export async function searchUsers(query?: string, limit = 50): Promise<SearchUserResult[]> {
  const conditions = [];

  if (query) {
    // 大文字小文字を区別しない検索のためにlowerを使用
    const lowerQuery = query.toLowerCase();
    conditions.push(
      or(
        sql`LOWER(${schema.user.name}) LIKE ${`%${lowerQuery}%`}`,
        sql`LOWER(${schema.user.twitterUsername}) LIKE ${`%${lowerQuery}%`}`
      )
    );
  }

  const users = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      twitterUsername: schema.user.twitterUsername,
      image: schema.user.image,
      trustScore: schema.user.trustScore,
      trustGrade: schema.user.trustGrade,
      createdAt: schema.user.createdAt,
    })
    .from(schema.user)
    .where(conditions.length > 0 ? conditions[0] : undefined)
    .orderBy(schema.user.name)
    .limit(limit);

  return users as SearchUserResult[];
}

/**
 * ユーザーをIDで取得する
 */
export async function getUserById(id: string): Promise<SearchUserResult | null> {
  const users = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      twitterUsername: schema.user.twitterUsername,
      image: schema.user.image,
      trustScore: schema.user.trustScore,
      trustGrade: schema.user.trustGrade,
      createdAt: schema.user.createdAt,
    })
    .from(schema.user)
    .where(sql`${schema.user.id} = ${id}`)
    .limit(1);

  return (users[0] as SearchUserResult) ?? null;
}
