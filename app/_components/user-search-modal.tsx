'use client';

import { Heart, Loader2, Search, User, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { TrustBadge } from '@/components/trust/trust-badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import type { TrustGrade } from '@/modules/trust';

interface SearchUserResult {
  id: string;
  name: string | null;
  twitterUsername: string | null;
  image: string | null;
  trustScore: number | null;
  trustGrade: TrustGrade | null;
}

interface UserSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserSearchModal({ open, onOpenChange }: UserSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [favoriteUsers, setFavoriteUsers] = useState<Record<string, boolean>>({});
  const debouncedQuery = useDebounce(searchQuery, 300);

  // 検索実行
  useEffect(() => {
    if (!open) return;
    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(debouncedQuery)}&limit=20`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users ?? []);

          // お気に入り状態を取得
          const userIds = (data.users ?? []).map((u: SearchUserResult) => u.id);
          if (userIds.length > 0) {
            const favoriteRes = await fetch('/api/me/favorites/check', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cardIds: [], userIds }),
            });
            if (favoriteRes.ok) {
              const favoriteData = await favoriteRes.json();
              setFavoriteUsers(favoriteData.users ?? {});
            }
          }
        }
      } catch (error) {
        console.error('ユーザー検索エラー:', error);
      } finally {
        setIsSearching(false);
      }
    };

    searchUsers();
  }, [debouncedQuery, open]);

  // お気に入りトグル
  const toggleFavorite = useCallback(
    async (userId: string) => {
      const isFavorited = favoriteUsers[userId];
      // 楽観的更新
      setFavoriteUsers((prev) => ({ ...prev, [userId]: !isFavorited }));

      try {
        if (isFavorited) {
          await fetch(`/api/me/favorites/users?userId=${userId}`, { method: 'DELETE' });
        } else {
          await fetch('/api/me/favorites/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          });
        }
      } catch {
        // エラー時は元に戻す
        setFavoriteUsers((prev) => ({ ...prev, [userId]: isFavorited }));
      }
    },
    [favoriteUsers]
  );

  // モーダルを閉じる時にリセット
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSearchQuery('');
      setSearchResults([]);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ユーザー検索</DialogTitle>
          <DialogDescription>名前または X ユーザー名で検索できます</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 検索フォーム */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ユーザー名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* 検索結果 */}
          <div className="max-h-80 overflow-y-auto">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : searchQuery && searchResults.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">
                  「{searchQuery}」に一致するユーザーが見つかりません
                </p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Link
                      href={`/users/${user.id}`}
                      className="flex items-center gap-3 flex-1 min-w-0"
                      onClick={() => handleOpenChange(false)}
                    >
                      {/* アバター */}
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name ?? ''}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      {/* ユーザー情報 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate text-sm">
                            {user.name ?? '名前未設定'}
                          </p>
                          {user.trustGrade && <TrustBadge grade={user.trustGrade} size="sm" />}
                        </div>
                        {user.twitterUsername && (
                          <p className="text-xs text-muted-foreground truncate">
                            @{user.twitterUsername}
                          </p>
                        )}
                      </div>
                    </Link>
                    {/* お気に入りボタン */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavorite(user.id)}
                      className="flex-shrink-0"
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          favoriteUsers[user.id]
                            ? 'fill-red-500 text-red-500'
                            : 'text-muted-foreground'
                        }`}
                      />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">
                  ユーザー名を入力して検索してください
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
