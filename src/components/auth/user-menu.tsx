'use client';

import { Settings } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth-client';
import { XIcon } from '../icons/x-icon';
import { LoginButton } from './login-button';

interface UserData {
  role: string;
  twitterUsername?: string;
}

/**
 * ユーザーメニュー
 * ログイン状態に応じてユーザー情報またはログインボタンを表示
 */
export function UserMenu() {
  const { data: session, isPending } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/admin/me')
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setUserData(data.user);
          }
        })
        .catch(console.error);
    }
  }, [session?.user?.id]);

  if (isPending) {
    return <div className="w-30 h-10 bg-muted rounded-lg animate-pulse" />;
  }

  if (!session?.user) {
    return <LoginButton />;
  }

  const isAdmin = userData?.role === 'admin';
  const twitterUsername = userData?.twitterUsername;

  return (
    <div className="flex items-center gap-2">
      <Link href={`/users/${session.user.id}`} className="flex items-center gap-2 hover:opacity-80">
        {session.user.image && (
          <img
            src={session.user.image}
            alt={session.user.name || 'User'}
            className="w-8 h-8 rounded-full"
          />
        )}
        <div className="flex flex-col items-start">
          <span className="text-sm">{session.user.name}</span>
          {twitterUsername && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <XIcon className="h-3 w-3" />@{twitterUsername}
            </span>
          )}
        </div>
      </Link>
      {isAdmin && (
        <Button variant="default" size="sm" asChild className="text-xs">
          <Link href="/admin/users">管理画面</Link>
        </Button>
      )}
      <Link href="/settings" title="設定">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
