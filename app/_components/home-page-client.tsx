'use client';

import {
  ChevronLeft,
  ChevronRight,
  Gift,
  ImageIcon,
  Search,
  Shield,
  User,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { UserMenu } from '@/components/auth';
import { FavoriteButton } from '@/components/favorites/favorite-button';
import { Footer } from '@/components/layout';
import { TrustBadge } from '@/components/trust/trust-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ViewToggle } from '@/components/view-toggle';
import { useDebounce } from '@/hooks/use-debounce';
import { useLatestItems } from '@/hooks/use-latest-items';
import { useViewPreference } from '@/hooks/use-view-preference';
import { useSession } from '@/lib/auth-client';
import type { TrustGrade } from '@/modules/trust/types';
import { UserSearchModal } from './user-search-modal';

export function HomePageClient() {
  const { data: session, isPending: isSessionPending } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URLからページ番号を取得
  const initialPage = parseInt(searchParams.get('p') ?? '1', 10);

  // 検索入力値とデバウンス
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);

  const {
    latestItems,
    isLoading: isLatestLoading,
    error,
    page,
    totalPages,
    setPage,
    setQuery,
    refetch,
  } = useLatestItems({ limit: 12, initialPage });

  // デバウンスされた検索値を反映
  useEffect(() => {
    setQuery(debouncedSearch);
  }, [debouncedSearch, setQuery]);

  // ページ変更時にURLを更新
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const params = new URLSearchParams(searchParams.toString());
    if (newPage === 1) {
      params.delete('p');
    } else {
      params.set('p', newPage.toString());
    }
    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : '/', { scroll: false });
  };

  const { viewMode, setViewMode, isHydrated } = useViewPreference();
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [favoriteStates, setFavoriteStates] = useState<Record<string, boolean>>({});
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);

  // お気に入り状態を一括取得
  useEffect(() => {
    if (!session?.user || latestItems.length === 0) return;

    const cardIds = latestItems.map((card) => card.id);
    fetch('/api/me/favorites/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardIds, userIds: [] }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.cards) {
          setFavoriteStates(data.cards);
        }
      })
      .catch(console.error);
  }, [session?.user, latestItems]);

  // お気に入りトグル
  const toggleFavorite = useCallback(
    async (cardId: string) => {
      if (!session?.user) return;

      const isFavorited = favoriteStates[cardId];
      // 楽観的更新
      setFavoriteStates((prev) => ({ ...prev, [cardId]: !isFavorited }));

      try {
        if (isFavorited) {
          await fetch(`/api/me/favorites/cards?cardId=${cardId}`, { method: 'DELETE' });
        } else {
          await fetch('/api/me/favorites/cards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cardId }),
          });
        }
      } catch {
        // エラー時は元に戻す
        setFavoriteStates((prev) => ({ ...prev, [cardId]: isFavorited }));
      }
    },
    [session?.user, favoriteStates]
  );

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
            {/* ログイン済みの場合、ユーザー検索アイコンを表示 */}
            {isLoggedIn && session?.user && (
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
            <UserMenu />
          </div>
        </div>

        {/* 最近登録されたアイテム一覧 */}
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
          ) : latestItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {searchInput
                ? `「${searchInput}」に一致するアイテムが見つかりませんでした`
                : 'まだアイテムが登録されていません'}
            </p>
          ) : !isHydrated || viewMode === 'grid' ? (
            <div className="columns-2 sm:columns-3 md:columns-4 gap-0.5">
              {latestItems.map((card) => (
                <Link
                  key={card.id}
                  href={`/items/${card.id}`}
                  className="relative w-full mb-0.5 rounded-sm overflow-hidden cursor-pointer transition-all duration-200 hover:brightness-110 block"
                  onMouseEnter={() => setHoveredCardId(card.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
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

                  {/* ホバー時の欲しいものオーバーレイ */}
                  {hoveredCardId === card.id &&
                    card.creator?.wantCards &&
                    card.creator.wantCards.length > 0 && (
                      <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-2 pointer-events-none">
                        <div className="flex items-center gap-1 text-white text-xs mb-2">
                          <Gift className="h-3.5 w-3.5 text-pink-400" />
                          <span>欲しいもの</span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-1">
                          {card.creator.wantCards.slice(0, 3).map((wantCard) => (
                            <div
                              key={wantCard.cardId}
                              className="w-10 h-10 rounded overflow-hidden bg-zinc-700"
                            >
                              {wantCard.cardImageUrl ? (
                                <img
                                  src={wantCard.cardImageUrl}
                                  alt={wantCard.cardName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="h-4 w-4 text-zinc-500" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {card.creator.wantCards.length > 0 && (
                          <p className="text-white text-[10px] mt-1.5 text-center truncate max-w-full px-1">
                            {card.creator.wantCards[0].cardName}
                            {card.creator.wantCards.length > 1 &&
                              ` 他${card.creator.wantCards.length - 1}件`}
                          </p>
                        )}
                      </div>
                    )}

                  {/* 作成者の信頼性スコア（左上） */}
                  {card.creator && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
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
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[200px]">
                          <p className="font-medium">
                            {card.creator.twitterUsername
                              ? `@${card.creator.twitterUsername}`
                              : card.creator.name}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {/* お気に入りボタン（右上） */}
                  {session?.user && (
                    <div className="absolute top-1 right-1">
                      <FavoriteButton
                        isFavorited={favoriteStates[card.id] ?? false}
                        onToggle={() => toggleFavorite(card.id)}
                        size="sm"
                      />
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
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {latestItems.map((card) => (
                <Link key={card.id} href={`/items/${card.id}`}>
                  <Card className="cursor-pointer transition-colors hover:bg-accent rounded-none border-x-0 first:border-t-0">
                    <CardContent className="p-2">
                      <div className="flex items-start gap-2">
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden bg-muted">
                          {card.imageUrl ? (
                            <img
                              src={card.imageUrl}
                              alt={card.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate text-sm">{card.name}</p>
                            {card.category && (
                              <Badge variant="secondary" className="text-xs shrink-0">
                                {card.category}
                              </Badge>
                            )}
                          </div>
                          {/* 出品者の欲しいもの */}
                          {card.creator &&
                            (card.creator.wantText ||
                              (card.creator.wantCards && card.creator.wantCards.length > 0)) && (
                              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                <Gift className="h-3 w-3 shrink-0 text-pink-500" />
                                <span className="truncate">
                                  {card.creator.wantText ||
                                    card.creator.wantCards
                                      ?.slice(0, 2)
                                      .map((wc) => wc.cardName)
                                      .join('、')}
                                </span>
                              </div>
                            )}
                        </div>
                        {/* 作成者の信頼性スコア */}
                        {card.creator && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="h-6 w-6 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                              {card.creator.image ? (
                                <img
                                  src={card.creator.image}
                                  alt={card.creator.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <User className="h-3 w-3 text-muted-foreground" />
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
                        {/* お気に入りボタン */}
                        {session?.user && (
                          <FavoriteButton
                            isFavorited={favoriteStates[card.id] ?? false}
                            onToggle={() => toggleFavorite(card.id)}
                            size="sm"
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {/* ページ番号ボタン（現在ページ ±2） */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p >= Math.max(1, page - 2) && p <= Math.min(totalPages, page + 2))
                .map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => handlePageChange(p)}
                    className="h-8 w-8"
                  >
                    {p}
                  </Button>
                ))}
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* フッター（ゲストユーザーにのみ広告表示） */}
      <Footer showAd={!isLoggedIn} adSlot={adSlot} />

      {/* ユーザー検索モーダル */}
      <UserSearchModal open={isUserSearchOpen} onOpenChange={setIsUserSearchOpen} />
    </div>
  );
}
