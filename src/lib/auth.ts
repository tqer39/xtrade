import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/db/drizzle'
import * as schema from '@/db/schema'

/**
 * 許可された X アカウント ID のホワイトリスト
 * dev 環境ではこのリストに含まれるユーザーのみ登録可能
 * 環境変数 ALLOWED_TWITTER_IDS でカンマ区切りで指定可能
 */
const getAllowedTwitterIds = (): string[] => {
  const envIds = process.env.ALLOWED_TWITTER_IDS
  if (envIds) {
    return envIds.split(',').map((id) => id.trim())
  }
  return []
}

/**
 * ホワイトリストが有効かどうか
 * ALLOWED_TWITTER_IDS が設定されている場合のみ有効
 */
const isWhitelistEnabled = (): boolean => {
  return !!process.env.ALLOWED_TWITTER_IDS
}

/**
 * BetterAuth サーバー設定
 * X (Twitter) OAuth 認証を使用
 */
export const auth = betterAuth({
  // Drizzle ORM アダプター
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),

  // X (Twitter) OAuth プロバイダー
  socialProviders: {
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    },
  },

  // データベースフック（ユーザー登録時のホワイトリストチェック）
  databaseHooks: {
    account: {
      create: {
        before: async (account) => {
          // ホワイトリストが無効の場合はスキップ
          if (!isWhitelistEnabled()) {
            return
          }

          // X (Twitter) アカウントのみチェック
          if (account.providerId === 'twitter') {
            const allowedIds = getAllowedTwitterIds()
            if (!allowedIds.includes(account.accountId)) {
              throw new APIError('FORBIDDEN', {
                message: 'このアカウントは登録が許可されていません',
              })
            }
          }
        },
      },
    },
  },

  // セッション設定
  session: {
    // セッションの有効期限（7日）
    expiresIn: 60 * 60 * 24 * 7,
    // セッション更新の閾値（1日）
    updateAge: 60 * 60 * 24,
    // Cookie 設定
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5分間キャッシュ
    },
  },

  // 信頼する Origin（CSRF 対策）
  trustedOrigins: (request) => {
    const origin = request.headers.get('origin') || ''
    const baseOrigins = [
      process.env.BETTER_AUTH_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      'https://xtrade-dev.tqer39.dev',
      'https://xtrade.tqer39.dev',
      'http://localhost:3000',
    ].filter(Boolean) as string[]

    // Vercel プレビュー URL を動的に追加
    if (origin.endsWith('.vercel.app')) {
      return [...baseOrigins, origin]
    }

    return baseOrigins
  },
})

// 型エクスポート
export type Auth = typeof auth
