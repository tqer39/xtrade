import { db } from '@/db/drizzle'
import * as schema from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import type {
  CardSet,
  CardSetItem,
  CardSetWithItems,
  CreateCardSetInput,
  UpdateCardSetInput,
  AddCardToSetInput,
} from './types'
import { getCardById } from './service'

/**
 * ユーザーのセット一覧を取得
 */
export async function getUserSets(userId: string): Promise<CardSet[]> {
  const sets = await db
    .select()
    .from(schema.cardSet)
    .where(eq(schema.cardSet.userId, userId))
    .orderBy(schema.cardSet.createdAt)

  return sets
}

/**
 * セットIDでセットを取得（アイテム含む）
 */
export async function getSetById(setId: string): Promise<CardSetWithItems | null> {
  const sets = await db
    .select()
    .from(schema.cardSet)
    .where(eq(schema.cardSet.id, setId))
    .limit(1)

  const set = sets[0]
  if (!set) return null

  const items: CardSetItem[] = await db
    .select({
      id: schema.cardSetItem.id,
      setId: schema.cardSetItem.setId,
      cardId: schema.cardSetItem.cardId,
      quantity: schema.cardSetItem.quantity,
      createdAt: schema.cardSetItem.createdAt,
      card: {
        id: schema.card.id,
        name: schema.card.name,
        category: schema.card.category,
        rarity: schema.card.rarity,
        imageUrl: schema.card.imageUrl,
      },
    })
    .from(schema.cardSetItem)
    .innerJoin(schema.card, eq(schema.cardSetItem.cardId, schema.card.id))
    .where(eq(schema.cardSetItem.setId, setId))
    .orderBy(schema.card.name)

  return { ...set, items }
}

/**
 * セットを作成
 */
export async function createSet(
  userId: string,
  input: CreateCardSetInput
): Promise<CardSet> {
  const newSet: CardSet = {
    id: randomUUID(),
    userId,
    name: input.name,
    description: input.description ?? null,
    isPublic: input.isPublic ?? false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  await db.insert(schema.cardSet).values(newSet)

  return newSet
}

/**
 * セットを更新
 */
export async function updateSet(
  setId: string,
  input: UpdateCardSetInput
): Promise<CardSet | null> {
  const existing = await db
    .select()
    .from(schema.cardSet)
    .where(eq(schema.cardSet.id, setId))
    .limit(1)

  if (!existing[0]) return null

  const updateData: Partial<CardSet> = {
    updatedAt: new Date(),
  }

  if (input.name !== undefined) updateData.name = input.name
  if (input.description !== undefined) updateData.description = input.description
  if (input.isPublic !== undefined) updateData.isPublic = input.isPublic

  await db
    .update(schema.cardSet)
    .set(updateData)
    .where(eq(schema.cardSet.id, setId))

  return { ...existing[0], ...updateData }
}

/**
 * セットを削除
 */
export async function deleteSet(setId: string): Promise<void> {
  await db.delete(schema.cardSet).where(eq(schema.cardSet.id, setId))
}

/**
 * セットにカードを追加
 */
export async function addItemToSet(
  setId: string,
  input: AddCardToSetInput
): Promise<void> {
  const { cardId, quantity = 1 } = input

  // カードが存在するか確認
  const card = await getCardById(cardId)
  if (!card) {
    throw new Error('Card not found')
  }

  // セットが存在するか確認
  const set = await db
    .select()
    .from(schema.cardSet)
    .where(eq(schema.cardSet.id, setId))
    .limit(1)

  if (!set[0]) {
    throw new Error('Set not found')
  }

  // 既存のアイテムを確認
  const existing = await db
    .select()
    .from(schema.cardSetItem)
    .where(
      and(
        eq(schema.cardSetItem.setId, setId),
        eq(schema.cardSetItem.cardId, cardId)
      )
    )
    .limit(1)

  if (existing[0]) {
    // 更新
    await db
      .update(schema.cardSetItem)
      .set({ quantity })
      .where(eq(schema.cardSetItem.id, existing[0].id))
  } else {
    // 新規作成
    await db.insert(schema.cardSetItem).values({
      id: randomUUID(),
      setId,
      cardId,
      quantity,
      createdAt: new Date(),
    })
  }

  // セットの更新日時を更新
  await db
    .update(schema.cardSet)
    .set({ updatedAt: new Date() })
    .where(eq(schema.cardSet.id, setId))
}

/**
 * セットからカードを削除
 */
export async function removeItemFromSet(setId: string, cardId: string): Promise<void> {
  await db
    .delete(schema.cardSetItem)
    .where(
      and(
        eq(schema.cardSetItem.setId, setId),
        eq(schema.cardSetItem.cardId, cardId)
      )
    )

  // セットの更新日時を更新
  await db
    .update(schema.cardSet)
    .set({ updatedAt: new Date() })
    .where(eq(schema.cardSet.id, setId))
}

/**
 * セットの所有者を確認
 */
export async function isSetOwner(setId: string, userId: string): Promise<boolean> {
  const set = await db
    .select({ userId: schema.cardSet.userId })
    .from(schema.cardSet)
    .where(eq(schema.cardSet.id, setId))
    .limit(1)

  return set[0]?.userId === userId
}
