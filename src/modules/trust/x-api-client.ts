import { db } from '@/db/drizzle'
import * as schema from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import type { XUserProfile, TrustScoreInput } from './types'

/**
 * X API レートリミットエラー
 */
export class RateLimitError extends Error {
  constructor(message: string = 'X API rate limit exceeded') {
    super(message)
    this.name = 'RateLimitError'
  }
}

/**
 * X API からユーザープロフィールを取得
 *
 * @param userId - xtrade のユーザー ID
 * @returns X ユーザープロフィール
 * @throws RateLimitError - レートリミットに達した場合
 */
export async function fetchXUserProfile(userId: string): Promise<XUserProfile> {
  // account テーブルから accessToken を取得
  const accounts = await db
    .select()
    .from(schema.account)
    .where(
      and(
        eq(schema.account.userId, userId),
        eq(schema.account.providerId, 'twitter')
      )
    )
    .limit(1)

  if (!accounts[0]?.accessToken) {
    throw new Error('No X access token found for user')
  }

  const accessToken = accounts[0].accessToken

  // X API v2 を呼び出し
  const response = await fetch(
    'https://api.twitter.com/2/users/me?user.fields=created_at,description,profile_image_url,protected,verified,public_metrics',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (response.status === 429) {
    throw new RateLimitError()
  }

  if (response.status === 401) {
    throw new Error('X access token expired or invalid')
  }

  if (!response.ok) {
    throw new Error(`X API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  if (data.errors) {
    throw new Error(`X API returned errors: ${JSON.stringify(data.errors)}`)
  }

  return data.data as XUserProfile
}

/**
 * X ユーザープロフィールを TrustScoreInput に変換
 *
 * @param profile - X ユーザープロフィール
 * @returns 信頼スコア計算の入力
 */
export function profileToTrustScoreInput(profile: XUserProfile): TrustScoreInput {
  const createdAt = new Date(profile.created_at)
  const now = new Date()
  const accountAgeDays = Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  )

  return {
    accountAgeDays,
    tweetCount: profile.public_metrics?.tweet_count ?? 0,
    followersCount: profile.public_metrics?.followers_count ?? 0,
    hasProfileImage: !!profile.profile_image_url && !profile.profile_image_url.includes('default_profile'),
    hasDescription: !!profile.description && profile.description.length > 0,
    verified: profile.verified ?? false,
    isProtected: profile.protected ?? false,
  }
}

/**
 * レートリミットエラーかどうかをチェック
 */
export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError
}
