'use client'

import { signOut, useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { LoginButton } from './login-button'

/**
 * ユーザーメニュー
 * ログイン状態に応じてユーザー情報またはログインボタンを表示
 */
export function UserMenu() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <div className="w-30 h-10 bg-muted rounded-lg animate-pulse" />
    )
  }

  if (!session?.user) {
    return <LoginButton />
  }

  return (
    <div className="flex items-center gap-3">
      {session.user.image && (
        <img
          src={session.user.image}
          alt={session.user.name || 'User'}
          className="w-10 h-10 rounded-full"
        />
      )}
      <div>
        <div className="font-semibold">{session.user.name}</div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut()}
          className="text-xs"
        >
          ログアウト
        </Button>
      </div>
    </div>
  )
}
