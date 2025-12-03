/**
 * 信頼スコア計算の入力パラメータ
 */
export interface TrustScoreInput {
  /** アカウント作成からの日数 */
  accountAgeDays: number
  /** 総ツイート数 */
  tweetCount: number
  /** フォロワー数 */
  followersCount: number
  /** プロフィール画像があるか */
  hasProfileImage: boolean
  /** 自己紹介があるか */
  hasDescription: boolean
  /** 認証済みか（有料 or 旧認証） */
  verified: boolean
  /** 鍵垢か */
  isProtected: boolean
}

/**
 * 信頼スコアのグレード
 * S: 80+, A: 65-79, B: 50-64, C: 35-49, D: 0-34, U: 未評価
 */
export type TrustGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'U'

/**
 * 信頼スコア計算の結果
 */
export interface TrustScoreResult {
  /** スコア（0〜100） */
  score: number
  /** グレード */
  grade: TrustGrade
}

/**
 * X API から取得するユーザープロフィール
 */
export interface XUserProfile {
  id: string
  username: string
  name: string
  created_at: string // ISO 8601
  description: string | null
  profile_image_url: string | null
  protected: boolean
  verified: boolean
  public_metrics: {
    followers_count: number
    following_count: number
    tweet_count: number
    listed_count: number
  }
}

/**
 * 信頼スコアジョブのステータス
 */
export type TrustJobStatus = 'queued' | 'running' | 'succeeded' | 'failed'
