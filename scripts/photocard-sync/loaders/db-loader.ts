import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import * as schema from '@/db/schema';
import type {
  MemberMasterInput,
  PhotocardMasterInput,
  SeriesMasterInput,
  UpsertResult,
} from '../types';

const GROUP_NAME = 'INI';

/**
 * メンバーマスターをupsert
 */
export async function upsertMemberMaster(
  data: MemberMasterInput,
  dryRun = false
): Promise<UpsertResult> {
  // 既存チェック
  const existing = await db
    .select()
    .from(schema.memberMaster)
    .where(
      and(
        eq(schema.memberMaster.groupName, data.groupName),
        eq(schema.memberMaster.name, data.name)
      )
    )
    .limit(1);

  if (existing[0]) {
    return { action: 'skipped', id: existing[0].id };
  }

  if (dryRun) {
    return { action: 'created', id: `dry-run-${randomUUID()}` };
  }

  const id = randomUUID();
  await db.insert(schema.memberMaster).values({
    id,
    ...data,
  });

  return { action: 'created', id };
}

/**
 * シリーズマスターをupsert
 */
export async function upsertSeriesMaster(
  data: SeriesMasterInput,
  dryRun = false
): Promise<UpsertResult> {
  // 既存チェック
  const existing = await db
    .select()
    .from(schema.seriesMaster)
    .where(
      and(
        eq(schema.seriesMaster.groupName, data.groupName),
        eq(schema.seriesMaster.name, data.name)
      )
    )
    .limit(1);

  if (existing[0]) {
    return { action: 'skipped', id: existing[0].id };
  }

  if (dryRun) {
    return { action: 'created', id: `dry-run-${randomUUID()}` };
  }

  const id = randomUUID();
  await db.insert(schema.seriesMaster).values({
    id,
    ...data,
  });

  return { action: 'created', id };
}

/**
 * フォトカードマスターをupsert
 */
export async function upsertPhotocardMaster(
  data: PhotocardMasterInput,
  dryRun = false
): Promise<UpsertResult> {
  // 既存チェック（名前 + シリーズ + メンバー名で一意）
  const existing = await db
    .select()
    .from(schema.photocardMaster)
    .where(
      and(
        eq(schema.photocardMaster.name, data.name),
        eq(schema.photocardMaster.series, data.series ?? ''),
        eq(schema.photocardMaster.memberName, data.memberName ?? '')
      )
    )
    .limit(1);

  if (existing[0]) {
    return { action: 'skipped', id: existing[0].id };
  }

  if (dryRun) {
    return { action: 'created', id: `dry-run-${randomUUID()}` };
  }

  const id = randomUUID();
  await db.insert(schema.photocardMaster).values({
    id,
    ...data,
  });

  return { action: 'created', id };
}

/**
 * 全メンバーの読みマップを取得
 */
export async function getMemberReadingMap(): Promise<Map<string, string>> {
  const members = await db
    .select({
      name: schema.memberMaster.name,
      nameReading: schema.memberMaster.nameReading,
    })
    .from(schema.memberMaster)
    .where(eq(schema.memberMaster.groupName, GROUP_NAME));

  const map = new Map<string, string>();
  for (const member of members) {
    if (member.nameReading) {
      map.set(member.name, member.nameReading);
    }
  }
  return map;
}
