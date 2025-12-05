/**
 * カードの基本情報
 */
export interface Card {
  id: string
  name: string
  category: string
  rarity: string | null
  imageUrl: string | null
  createdByUserId: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * ユーザーが持っているカード
 */
export interface UserHaveCard {
  id: string
  userId: string
  cardId: string
  quantity: number
  createdAt: Date
  updatedAt: Date
  card?: Card
}

/**
 * ユーザーが欲しいカード
 */
export interface UserWantCard {
  id: string
  userId: string
  cardId: string
  priority: number | null
  createdAt: Date
  updatedAt: Date
  card?: Card
}

/**
 * カード作成の入力
 */
export interface CreateCardInput {
  name: string
  category: string
  rarity?: string
  imageUrl?: string
}

/**
 * 持っているカード追加の入力
 */
export interface AddHaveCardInput {
  cardId: string
  quantity: number
}

/**
 * 欲しいカード追加の入力
 */
export interface AddWantCardInput {
  cardId: string
  priority?: number
}

// =====================================
// カードセット関連
// =====================================

/**
 * カードセットの基本情報
 */
export interface CardSet {
  id: string
  userId: string
  name: string
  description: string | null
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * カード情報（簡易版、一覧表示用）
 */
export interface CardSummary {
  id: string
  name: string
  category: string
  rarity: string | null
  imageUrl: string | null
}

/**
 * カードセット内のアイテム
 */
export interface CardSetItem {
  id: string
  setId: string
  cardId: string
  quantity: number
  createdAt: Date
  card?: CardSummary
}

/**
 * カードセット（アイテム含む）
 */
export interface CardSetWithItems extends CardSet {
  items: CardSetItem[]
}

/**
 * カードセット（カード数含む、一覧表示用）
 */
export interface CardSetWithCount extends CardSet {
  itemCount: number
}

/**
 * セット作成の入力
 */
export interface CreateCardSetInput {
  name: string
  description?: string
  isPublic?: boolean
}

/**
 * セット更新の入力
 */
export interface UpdateCardSetInput {
  name?: string
  description?: string
  isPublic?: boolean
}

/**
 * セットにカード追加の入力
 */
export interface AddCardToSetInput {
  cardId: string
  quantity?: number
}
