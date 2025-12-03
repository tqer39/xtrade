import type { TrustGrade } from '@/modules/trust'

/**
 * マッチング候補のユーザー情報
 */
export interface MatchUser {
  id: string
  name: string
  twitterUsername: string | null
  image: string | null
  trustGrade: TrustGrade | null
  trustScore: number | null
}

/**
 * マッチングしたカード情報
 */
export interface MatchCard {
  cardId: string
  cardName: string
}

/**
 * マッチング結果
 */
export interface Match {
  user: MatchUser
  /** 相手が持っていて自分が欲しいカード */
  theyHaveIWant: MatchCard[]
  /** 自分が持っていて相手が欲しいカード */
  iHaveTheyWant: MatchCard[]
  /** マッチスコア（マッチしたカード数の合計） */
  matchScore: number
}

/**
 * マッチング検索のオプション
 */
export interface MatchSearchOptions {
  /** 最低信頼グレード */
  minTrustGrade?: TrustGrade
  /** 取得件数 */
  limit?: number
  /** オフセット */
  offset?: number
}
