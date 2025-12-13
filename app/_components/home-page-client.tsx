'use client';

import { ChevronLeft, ChevronRight, ImageIcon, Search, Shield, User, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { UserMenu } from '@/components/auth';
import { Footer } from '@/components/layout';
import { TrustBadge } from '@/components/trust/trust-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ViewToggle } from '@/components/view-toggle';
import { useDebounce } from '@/hooks/use-debounce';
import { useLatestCards } from '@/hooks/use-latest-cards';
import { useViewPreference } from '@/hooks/use-view-preference';
import { useSession } from '@/lib/auth-client';
import type { TrustGrade } from '@/modules/trust/types';
import { CardOwnerList } from './card-owner-list';

export function HomePageClient() {
  const { data: session, isPending: isSessionPending } = useSession();

  // 検索入力値とデバウンス
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);

  const {
    latestCards,
    isLoading: isLatestLoading,
    error,
    page,
    totalPages,
    setPage,
    setQuery,
    refetch,
  } = useLatestCards({ limit: 12 });

  // デバウンスされた検索値を反映
  useEffect(() => {
    setQuery(debouncedSearch);
  }, [debouncedSearch, setQuery]);

  const { viewMode, setViewMode, isHydrated } = useViewPreference();
  const [selectedCardForOwners, setSelectedCardForOwners] = useState<string | null>(null);

  // 広告スロット ID（環境変数から取得）
  const adSlot = process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER;

  if (isSessionPending) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-10 w-full mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  const isLoggedIn = !!session?.user;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-2xl font-bold hover:opacity-80 transition-opacity">
            xtrade
          </Link>
          <UserMenu />
        </div>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">エラーが発生しました: {error.message}</p>
          <Button onClick={() => refetch()}>再読み込み</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-4 flex-1">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-2xl font-bold hover:opacity-80 transition-opacity">
            xtrade
          </Link>
          <div className="flex items-center gap-3">
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
            <UserMenu />
          </div>
        </div>

        {/* 未ログイン時のみログイン促進 */}
        {!isLoggedIn && (
          <div className="mb-6">
            <Button asChild className="gap-2" size="lg">
              <Link href="/cards/search">
                <Search className="h-4 w-4" />
                アイテムを検索
              </Link>
            </Button>
            <p className="mt-2 text-sm text-muted-foreground">
              アイテムを追加・管理するにはログインが必要です
            </p>
          </div>
        )}

        {/* カード所有者一覧表示（選択時） */}
        {selectedCardForOwners ? (
          <CardOwnerList
            cardId={selectedCardForOwners}
            onBack={() => setSelectedCardForOwners(null)}
            isLoggedIn={isLoggedIn}
            currentUserId={session?.user?.id}
          />
        ) : (
          <>
            {/* 最近登録されたカード一覧 */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-medium">最近登録されたアイテム</h2>
                {isHydrated && <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />}
              </div>

              {/* インライン検索フォーム */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="アイテム名で検索..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 pr-9"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {isLatestLoading ? (
                <div
                  className={
                    !isHydrated || viewMode === 'grid'
                      ? 'columns-2 sm:columns-3 md:columns-4 gap-0.5'
                      : 'space-y-2'
                  }
                >
                  {Array.from({ length: 8 }, (_, i) => `skeleton-${i}`).map((key) => (
                    <Skeleton
                      key={key}
                      className={
                        !isHydrated || viewMode === 'grid'
                          ? 'aspect-[3/4] w-full mb-0.5 rounded-sm'
                          : 'h-20 w-full'
                      }
                    />
                  ))}
                </div>
              ) : latestCards.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {searchInput
                    ? `「${searchInput}」に一致するアイテムが見つかりませんでした`
                    : 'まだアイテムが登録されていません'}
                </p>
              ) : !isHydrated || viewMode === 'grid' ? (
                <div className="columns-2 sm:columns-3 md:columns-4 gap-0.5">
                  {latestCards.map((card) => (
                    <button
                      type="button"
                      key={card.id}
                      className="relative w-full mb-0.5 rounded-sm overflow-hidden cursor-pointer transition-all duration-200 hover:brightness-110 text-left"
                      onClick={() => setSelectedCardForOwners(card.id)}
                    >
                      <div className="relative w-full">
                        {card.imageUrl ? (
                          <img
                            src={card.imageUrl}
                            alt={card.name}
                            className="w-full h-auto object-cover"
                          />
                        ) : (
                          <div className="aspect-[3/4] flex items-center justify-center bg-zinc-800">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                      {/* 作成者の信頼性スコア（左上） */}
                      {card.creator && (
                        <div className="absolute top-1 left-1 flex items-center gap-1 bg-black/60 rounded-full pl-0.5 pr-1.5 py-0.5 backdrop-blur-sm">
                          <div className="h-4 w-4 rounded-full overflow-hidden bg-zinc-700 flex items-center justify-center">
                            {card.creator.image ? (
                              <img
                                src={card.creator.image}
                                alt={card.creator.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <User className="h-2.5 w-2.5 text-zinc-400" />
                            )}
                          </div>
                          <TrustBadge grade={card.creator.trustGrade as TrustGrade} size="sm" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="font-medium text-white text-xs truncate drop-shadow-lg">
                          {card.name}
                        </p>
                        {card.category && (
                          <span className="text-[10px] text-zinc-300 bg-black/40 px-1.5 py-0.5 rounded">
                            {card.category}
                          </span>
                        )}
                        {card.description && (
                          <p className="text-[10px] text-zinc-300 mt-1 line-clamp-2">
                            {card.description.length > 80
                              ? `${card.description.slice(0, 80)}...`
                              : card.description}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {latestCards.map((card) => (
                    <Card
                      key={card.id}
                      className="cursor-pointer transition-colors hover:bg-accent"
                      onClick={() => setSelectedCardForOwners(card.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-muted">
                            {card.imageUrl ? (
                              <img
                                src={card.imageUrl}
                                alt={card.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{card.name}</p>
                            {card.category && (
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {card.category}
                                </Badge>
                              </div>
                            )}
                            {card.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {card.description.length > 80
                                  ? `${card.description.slice(0, 80)}...`
                                  : card.description}
                              </p>
                            )}
                          </div>
                          {/* 作成者の信頼性スコア */}
                          {card.creator && (
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                                {card.creator.image ? (
                                  <img
                                    src={card.creator.image}
                                    alt={card.creator.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <User className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <TrustBadge
                                grade={card.creator.trustGrade as TrustGrade}
                                size="sm"
                                showScore
                                score={card.creator.trustScore}
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* ページネーション */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* フッター（ゲストユーザーにのみ広告表示） */}
      <Footer showAd={!isLoggedIn} adSlot={adSlot} />
    </div>
  );
}
