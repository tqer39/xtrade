import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError } from 'better-auth/api';
import { admin } from 'better-auth/plugins';
import { eq } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import * as schema from '@/db/schema';
import { sendVerificationEmail } from '@/modules/email';

/**
 * 管理者の X ユーザー名（環境変数から取得）
 * このユーザーは常にログイン可能で、初回ログイン時に admin ロールが付与される
 */
const ADMIN_TWITTER_USERNAME = process.env.ADMIN_TWITTER_USERNAME || '';

/**
 * ホワイトリストが有効かどうか
 * ADMIN_TWITTER_USERNAME が設定されている場合のみ有効
 */
const isWhitelistEnabled = (): boolean => {
  return !!ADMIN_TWITTER_USERNAME;
};

/**
 * X ユーザー名がホワイトリストに含まれているかチェック
 * @param twitterUsername - X のユーザー名（@ なし）
 * @returns 許可されている場合は true
 */
const isAllowedUser = async (twitterUsername: string): Promise<boolean> => {
  // 管理者は常に許可
  if (twitterUsername.toLowerCase() === ADMIN_TWITTER_USERNAME.toLowerCase()) {
    return true;
  }

  // DB のホワイトリストをチェック
  const allowed = await db
    .select()
    .from(schema.allowedUser)
    .where(eq(schema.allowedUser.twitterUsername, twitterUsername.toLowerCase()))
    .limit(1);

  return allowed.length > 0;
};

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
      clientId: process.env.TWITTER_CLIENT_ID ?? '',
      clientSecret: process.env.TWITTER_CLIENT_SECRET ?? '',
      // Twitter プロフィールからユーザー情報をマッピング
      mapProfileToUser: async (profile) => {
        // Twitter API v2 のプロフィールには username フィールドがある
        const twitterProfile = profile as { username?: string };
        const username = twitterProfile.username?.toLowerCase() || '';

        // ホワイトリストが有効な場合、許可されていないユーザーはブロック
        if (isWhitelistEnabled() && username) {
          const allowed = await isAllowedUser(username);
          if (!allowed) {
            throw new APIError('FORBIDDEN', {
              message:
                'このアカウントはホワイトリストに登録されていません。管理者にお問い合わせください。',
            });
          }
        }

        // 管理者の場合は admin ロールを設定
        const isAdmin = username === ADMIN_TWITTER_USERNAME.toLowerCase();

        return {
          twitterUsername: username,
          role: isAdmin ? 'admin' : 'user',
        };
      },
    },
  },

  // プラグイン
  plugins: [
    admin({
      defaultRole: 'user',
      adminRoles: ['admin'],
    }),
  ],

  // セッション設定
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7日
    updateAge: 60 * 60 * 24, // 1日
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5分間キャッシュ
    },
  },

  // 信頼する Origin（CSRF 対策）
  trustedOrigins: (request) => {
    const origin = request.headers.get('origin') || '';
    const baseOrigins = [
      process.env.BETTER_AUTH_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      'https://xtrade-dev.tqer39.dev',
      'https://xtrade.tqer39.dev',
      'http://localhost:3000',
    ].filter(Boolean) as string[];

    // Vercel プレビュー URL を動的に追加
    if (origin.endsWith('.vercel.app')) {
      return [...baseOrigins, origin];
    }

    return baseOrigins;
  },

  // ユーザー情報のカスタマイズ
  user: {
    additionalFields: {
      twitterUsername: {
        type: 'string',
        required: false,
      },
      role: {
        type: 'string',
        defaultValue: 'user',
        required: false,
      },
    },
  },

  // データベースフック
  // X OAuth ログイン時に emailVerified が自動で true になるのを防ぐ
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // X OAuth からの emailVerified を無視し、本サービスでの認証を必須にする
          return {
            data: {
              ...user,
              emailVerified: false,
            },
          };
        },
      },
    },
  },

  // メール認証設定
  emailVerification: {
    // X Auth 必須なので初回サインアップ時には送信しない
    sendOnSignUp: false,
    // 認証メール送信ハンドラー
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({
        to: user.email,
        verificationUrl: url,
        userName: user.name,
      });
    },
    // トークン有効期限: 1時間
    expiresIn: 60 * 60,
    // 認証完了後のリダイレクト先
    callbackURL: '/settings?email_verified=true',
  },
});

// 型エクスポート
export type Auth = typeof auth;

// ホワイトリスト関連のユーティリティ関数をエクスポート
export { isAllowedUser, isWhitelistEnabled, ADMIN_TWITTER_USERNAME };
