/**
 * アイテムの基本情報
 * フリーフォーマットでカードに限らず何でも交換可能
 */
export interface Card {
  id: string;
  name: string;
  category: string | null; // カテゴリは任意
  description: string | null; // アイテムの説明
  imageUrl: string | null;
  createdByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// エイリアス
export type Item = Card;

/**
 * ユーザーが持っているカード
 */
export interface UserHaveCard {
  id: string;
  userId: string;
  cardId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  card?: Card;
}

/**
 * ユーザーが欲しいカード
 */
export interface UserWantCard {
  id: string;
  userId: string;
  cardId: string;
  priority: number | null;
  createdAt: Date;
  updatedAt: Date;
  card?: Card;
}

/**
 * アイテム作成の入力
 */
export interface CreateCardInput {
  name: string;
  category?: string; // カテゴリは任意
  description?: string; // アイテムの説明
  imageUrl?: string;
}

// エイリアス
export type CreateItemInput = CreateCardInput;

/**
 * 持っているカード追加の入力
 */
export interface AddHaveCardInput {
  cardId: string;
  quantity: number;
}

/**
 * 欲しいカード追加の入力
 */
export interface AddWantCardInput {
  cardId: string;
  priority?: number;
}

// =====================================
// カードセット関連
// =====================================

/**
 * カードセットの基本情報
 */
export interface CardSet {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * アイテム情報（簡易版、一覧表示用）
 */
export interface CardSummary {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  imageUrl: string | null;
}

// エイリアス
export type ItemSummary = CardSummary;

/**
 * カードセット内のアイテム
 */
export interface CardSetItem {
  id: string;
  setId: string;
  cardId: string;
  quantity: number;
  createdAt: Date;
  card?: CardSummary;
}

/**
 * カードセット（アイテム含む）
 */
export interface CardSetWithItems extends CardSet {
  items: CardSetItem[];
}

/**
 * カードセット（カード数・サムネイル含む、一覧表示用）
 */
export interface CardSetWithCount extends CardSet {
  itemCount: number;
  thumbnails: string[]; // 最初の数枚のカード画像URL
}

/**
 * セット作成の入力
 */
export interface CreateCardSetInput {
  name: string;
  description?: string;
  isPublic?: boolean;
}

/**
 * セット更新の入力
 */
export interface UpdateCardSetInput {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

/**
 * セットにカード追加の入力
 */
export interface AddCardToSetInput {
  cardId: string;
  quantity?: number;
}

// =====================================
// カード所有者関連
// =====================================

/**
 * カード所有者が欲しいカードの簡易情報
 */
export interface CardOwnerWantCard {
  cardId: string;
  cardName: string;
  cardImageUrl: string | null;
}

/**
 * カード所有者の情報
 */
export interface CardOwner {
  userId: string;
  name: string;
  image: string | null;
  twitterUsername: string | null;
  trustScore: number | null;
  trustGrade: string | null;
  quantity: number;
  wantCards?: CardOwnerWantCard[];
}

/**
 * カード作成者の簡易情報
 */
export interface CardCreator {
  id: string;
  name: string;
  image: string | null;
  twitterUsername: string | null;
  trustScore: number | null;
  trustGrade: string | null;
  bio?: string | null;
  wantCards?: CardOwnerWantCard[];
}

/**
 * 作成者情報付きのカード
 */
export interface CardWithCreator extends Card {
  creator: CardCreator | null;
}
