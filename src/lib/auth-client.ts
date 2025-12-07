import { adminClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

/**
 * BetterAuth クライアント設定
 * React コンポーネントで使用
 *
 * baseURL を省略すると、現在のオリジンが自動的に使用される
 */
export const authClient = createAuthClient({
  plugins: [adminClient()],
});

// 便利なメソッドをエクスポート
export const { signIn, signOut, useSession } = authClient;

/**
 * メール認証用のメソッド
 * - sendVerificationEmail: 認証メールを送信
 * - verifyEmail: 認証トークンを検証
 */
export const { sendVerificationEmail, verifyEmail } = authClient;
