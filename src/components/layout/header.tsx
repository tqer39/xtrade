'use client';

import { ArrowLeft, LogOut, Shield, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { UserMenu } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { signOut, useSession } from '@/lib/auth-client';

import { UserSearchModal } from '../../../app/_components/user-search-modal';

interface HeaderProps {
  /** 戻るボタンを表示するかどうか */
  showBackButton?: boolean;
}

/**
 * 共通ヘッダーコンポーネント
 * 全ページで統一されたヘッダーを表示
 */
export function Header({ showBackButton = false }: HeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);

  const isLoggedIn = !!session?.user;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        {/* 左側: ロゴ + ログアウト */}
        <div className="flex items-center gap-3">
          <Link href="/" className="text-2xl font-bold hover:opacity-80 transition-opacity">
            xtrade
          </Link>
          {isLoggedIn && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut()}
              className="h-8 w-8"
              title="ログアウト"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* 右側: コントロール */}
        <div className="flex items-center gap-3">
          {/* ログイン済みの場合、ユーザー検索アイコンを表示 */}
          {isLoggedIn && (
            <button
              type="button"
              onClick={() => setIsUserSearchOpen(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors text-sm text-muted-foreground hover:text-foreground"
              title="ユーザー検索"
            >
              <Users className="h-3.5 w-3.5" />
            </button>
          )}

          {/* ログイン済みの場合、信頼性詳細画面へのリンクを表示 */}
          {isLoggedIn && session?.user && (
            <Link
              href={`/users/${session.user.id}/trust`}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors text-sm text-muted-foreground hover:text-foreground"
              title="信頼性スコア"
            >
              <Shield className="h-3.5 w-3.5" />
            </Link>
          )}

          {/* ユーザーメニュー（アバター、設定、ログアウト） */}
          <UserMenu />

          {/* 戻るボタン（オプション） */}
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-1 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              戻る
            </Button>
          )}
        </div>
      </div>

      {/* ユーザー検索モーダル */}
      <UserSearchModal open={isUserSearchOpen} onOpenChange={setIsUserSearchOpen} />
    </>
  );
}
