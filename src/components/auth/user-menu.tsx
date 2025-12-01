'use client'

import { signOut, useSession } from '@/lib/auth-client'
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
      <div
        style={{
          width: '120px',
          height: '40px',
          backgroundColor: '#e5e5e5',
          borderRadius: '8px',
          animation: 'pulse 2s infinite',
        }}
      />
    )
  }

  if (!session?.user) {
    return <LoginButton />
  }

  const isAdmin = userData?.role === 'admin'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      {session.user.image && (
        <img
          src={session.user.image}
          alt={session.user.name || 'User'}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
          }}
        />
      )}
      <div>
        <div style={{ fontWeight: '600' }}>{session.user.name}</div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          {isAdmin && (
            <Link
              href="/admin/users"
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                color: '#fff',
                backgroundColor: '#000',
                borderRadius: '4px',
                textDecoration: 'none',
              }}
            >
              管理画面
            </Link>
          )}
          <button
            onClick={() => signOut()}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              color: '#666',
              backgroundColor: 'transparent',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  )
}
