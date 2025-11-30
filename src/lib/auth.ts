import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/db/drizzle'
import * as schema from '@/db/schema'

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
