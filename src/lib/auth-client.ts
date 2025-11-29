import { createAuthClient } from 'better-auth/react'

/**
 * BetterAuth クライアント設定
 * React コンポーネントで使用
 *
 * baseURL を省略すると、現在のオリジンが自動的に使用される
 */
export const authClient = createAuthClient()

// 便利なメソッドをエクスポート
export const { signIn, signOut, useSession } = authClient
