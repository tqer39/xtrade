'use client'

import { signOut, useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { LoginButton } from './login-button'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface UserData {
  role: string
}

/**
 * ユーザーメニュー
 * ログイン状態に応じてユーザー情報またはログインボタンを表示
 */
export function UserMenu() {
  const { data: session, isPending } = useSession()
  const [userData, setUserData] = useState<UserData | null>(null)

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/admin/me')
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setUserData(data.user)
          }
        })
        .catch(console.error)
    }
  }, [session?.user?.id])

  if (isPending) {
    return (
      <div className="w-30 h-10 bg-muted rounded-lg animate-pulse" />
    )
  }

  if (!session?.user) {
    return <LoginButton />
  }

  const isAdmin = userData?.role === 'admin'

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
        <div className="flex gap-2 mt-1">
          {isAdmin && (
            <Button variant="default" size="sm" asChild className="text-xs">
              <Link href="/admin/users">管理画面</Link>
            </Button>
          )}
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
    </div>
  )
}
