'use client';

import { Gift, ImageIcon, Loader2, Mail, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useMemo, useState } from 'react';

import { LoginButton } from '@/components/auth';
import { FavoriteButton } from '@/components/favorites/favorite-button';
import { Header } from '@/components/layout';
import { TrustBadge } from '@/components/trust';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/lib/auth-client';
import type { CardOwner, CardWithCreator } from '@/modules/cards/types';
import type { TrustGrade } from '@/modules/trust';

interface Props {
  params: Promise<{ itemId: string }>;
}

export default function ItemDetailPage({ params }: Props) {
  const { itemId } = use(params);
  const cardId = itemId; // 内部的にはcardIdとして扱う
  const router = useRouter();
  const { data: session } = useSession();
  const [card, setCard] = useState<CardWithCreator | null>(null);
  const [owners, setOwners] = useState<CardOwner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingTrade, setIsCreatingTrade] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);

  const isLoggedIn = !!session?.user;

  // ブラウザバックで前のページに戻る
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  useEffect(() => {
    async function fetchData() {
      try {
        // アイテム詳細と所有者一覧を並列取得
        const [cardRes, ownersRes] = await Promise.all([
          fetch(`/api/items/${cardId}`),
          fetch(`/api/items/${cardId}/owners`),
        ]);

        if (!cardRes.ok) {
          if (cardRes.status === 404) {
            setError('アイテムが見つかりません');
          } else {
            throw new Error('データの取得に失敗しました');
          }
          return;
        }

        const cardData = await cardRes.json();
        setCard(cardData.card);

        if (ownersRes.ok) {
          const ownersData = await ownersRes.json();
          setOwners(ownersData.owners ?? []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [cardId]);

  // お気に入り状態をチェック
  useEffect(() => {
    if (!isLoggedIn || !cardId) return;

    async function checkFavorite() {
      try {
        const res = await fetch('/api/me/favorites/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardIds: [cardId] }),
        });
        if (res.ok) {
          const data = await res.json();
          setIsFavorited(data.cards?.[cardId] ?? false);
        }
      } catch {
        // エラー時は何もしない
      }
    }

    checkFavorite();
  }, [isLoggedIn, cardId]);

  const toggleFavorite = useCallback(async () => {
    if (!isLoggedIn) return;

    const newState = !isFavorited;
    setIsFavorited(newState); // Optimistic update

    try {
      const url = newState
        ? '/api/me/favorites/cards'
        : `/api/me/favorites/cards?cardId=${encodeURIComponent(cardId)}`;
      const res = await fetch(url, {
        method: newState ? 'POST' : 'DELETE',
        ...(newState && {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardId }),
        }),
      });

      if (!res.ok) {
        setIsFavorited(!newState); // Revert on error
      }
    } catch {
      setIsFavorited(!newState); // Revert on error
    }
  }, [isLoggedIn, isFavorited, cardId]);

  const handleCreateTrade = async (ownerUserId: string) => {
    setIsCreatingTrade(true);
    setTradeError(null);

    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responderUserId: ownerUserId,
          initialCardId: cardId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'トレードの作成に失敗しました');
      }

      const data = await res.json();
      router.push(`/trades/${data.trade.roomSlug}`);
    } catch (err) {
      setTradeError(err instanceof Error ? err.message : 'トレードの作成に失敗しました');
      setIsCreatingTrade(false);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={handleBack}>
            戻る
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !card) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="aspect-[3/4] w-full max-w-md mx-auto mb-6" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const currentUserId = session?.user?.id;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* ヘッダー */}
      <Header showBackButton />

      {/* アイテム画像 */}
      <div className="mb-6">
        <div className="relative max-w-md mx-auto">
          {card.imageUrl ? (
            <img src={card.imageUrl} alt={card.name} className="w-full rounded-lg object-cover" />
          ) : (
            <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center">
              <ImageIcon className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          {/* お気に入りボタン - 自分が所有者でない場合のみ表示 */}
          {isLoggedIn && !owners.some((owner) => owner.userId === currentUserId) && (
            <div className="absolute top-2 right-2">
              <FavoriteButton isFavorited={isFavorited} onToggle={toggleFavorite} size="lg" />
            </div>
          )}
        </div>
      </div>

      {/* アイテム情報 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">{card.name}</h1>
        {card.category && <p className="text-muted-foreground mb-2">{card.category}</p>}
        {card.description && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{card.description}</p>
        )}
      </div>

      {/* 所有者一覧 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">このアイテムを持っているユーザー</h2>
        {owners.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-muted-foreground text-center">
                このアイテムを持っているユーザーはいません
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {owners.map((owner) => (
              <Card key={owner.userId}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/users/${owner.userId}`}
                      className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                    >
                      {owner.image ? (
                        <img
                          src={owner.image}
                          alt={owner.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {owner.twitterUsername ? `@${owner.twitterUsername}` : owner.name}
                        </p>
                        <TrustBadge
                          grade={owner.trustGrade as TrustGrade | null}
                          size="sm"
                          showScore
                          score={owner.trustScore}
                        />
                      </div>
                    </Link>
                    {isLoggedIn && owner.userId !== currentUserId && (
                      <Button
                        size="sm"
                        onClick={() => handleCreateTrade(owner.userId)}
                        disabled={isCreatingTrade}
                        className="gap-1"
                      >
                        {isCreatingTrade ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Mail className="h-4 w-4" />
                        )}
                        トレードを申し込む
                      </Button>
                    )}
                  </div>
                  {/* 所有者の欲しいもの */}
                  {(owner.wantText || (owner.wantCards && owner.wantCards.length > 0)) && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-2">
                        <Gift className="h-3.5 w-3.5" />
                        <span>欲しいもの</span>
                      </div>
                      {/* テキスト説明 */}
                      {owner.wantText && (
                        <p className="text-sm text-muted-foreground mb-2">{owner.wantText}</p>
                      )}
                      {/* アイテム一覧 */}
                      {owner.wantCards && owner.wantCards.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {owner.wantCards.slice(0, 5).map((wantCard) => (
                            <Link
                              key={wantCard.cardId}
                              href={`/items/${wantCard.cardId}`}
                              className="flex items-center gap-1.5 bg-muted rounded-full px-2 py-1 hover:bg-muted/80 transition-colors"
                            >
                              {wantCard.cardImageUrl ? (
                                <img
                                  src={wantCard.cardImageUrl}
                                  alt={wantCard.cardName}
                                  className="w-5 h-5 rounded object-cover"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded bg-zinc-700 flex items-center justify-center">
                                  <ImageIcon className="h-3 w-3 text-zinc-500" />
                                </div>
                              )}
                              <span className="text-xs truncate max-w-[100px]">
                                {wantCard.cardName}
                              </span>
                            </Link>
                          ))}
                          {owner.wantCards.length > 5 && (
                            <Link
                              href={`/users/${owner.userId}?tab=wants`}
                              className="text-xs text-primary hover:underline self-center"
                            >
                              他{owner.wantCards.length - 5}件を見る
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {tradeError && <p className="text-sm text-destructive text-center">{tradeError}</p>}
          </div>
        )}
        {!isLoggedIn && owners.length > 0 && (
          <div className="mt-4 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              トレードを申し込むにはログインが必要です
            </p>
            <LoginButton />
          </div>
        )}
      </div>
    </div>
  );
}
