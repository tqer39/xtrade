import { and, eq } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import * as schema from '@/db/schema';
import type { TrustScoreInput, XUserProfile } from './types';

/**
 * X API レートリミットエラー
 */
export class RateLimitError extends Error {
  constructor(message: string = 'X API rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * X API トークンリフレッシュエラー
 */
export class TokenRefreshError extends Error {
  constructor(message: string = 'Failed to refresh X access token') {
    super(message);
    this.name = 'TokenRefreshError';
  }
}

/**
 * リフレッシュトークンを使用してアクセストークンを更新
 *
 * @param accountId - account テーブルの ID
 * @param refreshToken - リフレッシュトークン
 * @returns 新しいアクセストークン
 */
async function refreshAccessToken(accountId: string, refreshToken: string): Promise<string> {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new TokenRefreshError('Twitter OAuth credentials not configured');
  }

  // X API v2 トークンエンドポイントにリフレッシュリクエスト
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch('https://api.x.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Token refresh failed:', response.status, errorData);
    throw new TokenRefreshError(`Token refresh failed: ${response.status}`);
  }

  const data = await response.json();

  // 新しいトークンをデータベースに保存
  const now = new Date();
  const expiresAt = data.expires_in ? new Date(now.getTime() + data.expires_in * 1000) : null;

  await db
    .update(schema.account)
    .set({
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken, // 新しいリフレッシュトークンがあれば更新
      accessTokenExpiresAt: expiresAt,
    })
    .where(eq(schema.account.id, accountId));

  return data.access_token;
}

/**
 * 有効なアクセストークンを取得（必要に応じてリフレッシュ）
 *
 * @param userId - xtrade のユーザー ID
 * @returns 有効なアクセストークン
 */
async function getValidAccessToken(userId: string): Promise<string> {
  const accounts = await db
    .select()
    .from(schema.account)
    .where(and(eq(schema.account.userId, userId), eq(schema.account.providerId, 'twitter')))
    .limit(1);

  const account = accounts[0];
  if (!account?.accessToken) {
    throw new Error('No X access token found for user');
  }

  // トークンの有効期限をチェック（5分のバッファを持たせる）
  const now = new Date();
  const bufferMs = 5 * 60 * 1000; // 5分
  const isExpired =
    account.accessTokenExpiresAt &&
    account.accessTokenExpiresAt.getTime() - bufferMs < now.getTime();

  if (isExpired && account.refreshToken) {
    console.log(`Access token expired for user ${userId}, attempting refresh...`);
    return refreshAccessToken(account.id, account.refreshToken);
  }

  return account.accessToken;
}

/**
 * X API からユーザープロフィールを取得
 *
 * @param userId - xtrade のユーザー ID
 * @returns X ユーザープロフィール
 * @throws RateLimitError - レートリミットに達した場合
 */
export async function fetchXUserProfile(userId: string): Promise<XUserProfile> {
  // 有効なアクセストークンを取得（期限切れならリフレッシュ）
  let accessToken = await getValidAccessToken(userId);

  // X API v2 を呼び出し
  let response = await fetch(
    'https://api.twitter.com/2/users/me?user.fields=created_at,description,profile_image_url,protected,verified,public_metrics',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  // 401 エラーの場合、トークンリフレッシュを試みる
  if (response.status === 401) {
    const accounts = await db
      .select()
      .from(schema.account)
      .where(and(eq(schema.account.userId, userId), eq(schema.account.providerId, 'twitter')))
      .limit(1);

    const account = accounts[0];
    if (account?.refreshToken) {
      console.log(`401 received, attempting token refresh for user ${userId}...`);
      accessToken = await refreshAccessToken(account.id, account.refreshToken);

      // 新しいトークンで再試行
      response = await fetch(
        'https://api.twitter.com/2/users/me?user.fields=created_at,description,profile_image_url,protected,verified,public_metrics',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    }
  }

  if (response.status === 429) {
    throw new RateLimitError();
  }

  if (response.status === 401) {
    throw new Error('X access token expired or invalid (refresh failed)');
  }

  if (!response.ok) {
    throw new Error(`X API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(`X API returned errors: ${JSON.stringify(data.errors)}`);
  }

  return data.data as XUserProfile;
}

/**
 * X ユーザープロフィールを TrustScoreInput に変換
 *
 * @param profile - X ユーザープロフィール
 * @returns 信頼スコア計算の入力
 */
export function profileToTrustScoreInput(profile: XUserProfile): TrustScoreInput {
  const createdAt = new Date(profile.created_at);
  const now = new Date();
  const accountAgeDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

  return {
    accountAgeDays,
    tweetCount: profile.public_metrics?.tweet_count ?? 0,
    followersCount: profile.public_metrics?.followers_count ?? 0,
    hasProfileImage:
      !!profile.profile_image_url && !profile.profile_image_url.includes('default_profile'),
    hasDescription: !!profile.description && profile.description.length > 0,
    verified: profile.verified ?? false,
    isProtected: profile.protected ?? false,
  };
}

/**
 * レートリミットエラーかどうかをチェック
 */
export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}
