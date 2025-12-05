import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/lib/auth';

/**
 * BetterAuth API ルートハンドラー
 *
 * 以下のエンドポイントが自動生成される:
 * - POST /api/auth/signin/twitter - X ログイン開始
 * - GET /api/auth/callback/twitter - OAuth コールバック
 * - POST /api/auth/signout - ログアウト
 * - GET /api/auth/session - セッション取得
 */
export const { GET, POST } = toNextJsHandler(auth);
