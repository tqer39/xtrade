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
