'use client';

import { ArrowLeft, ImageIcon, Loader2, Mail, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoginButton } from '@/components/auth';
import { TrustBadge } from '@/components/trust/trust-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCardOwners } from '@/hooks/use-card-owners';
import type { TrustGrade } from '@/modules/trust/types';

interface CardOwnerListProps {
  cardId: string;
  onBack: () => void;
  isLoggedIn: boolean;
  currentUserId?: string;
}

export function CardOwnerList({ cardId, onBack, isLoggedIn, currentUserId }: CardOwnerListProps) {
  const router = useRouter();
  const { card, owners, isLoading, error } = useCardOwners(cardId);
  const [isCreatingTrade, setIsCreatingTrade] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);

  const handleCreateTrade = async () => {
    if (!owners[0]) return;

    setIsCreatingTrade(true);
    setTradeError(null);

    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responderUserId: owners[0].userId,
          initialCardId: cardId, // カード詳細画面から開始時、相手のオファーに追加
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-destructive mb-4">エラーが発生しました: {error.message}</p>
        <Button variant="outline" onClick={onBack}>
          戻る
        </Button>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground mb-4">アイテムが見つかりません</p>
        <Button variant="outline" onClick={onBack}>
          戻る
        </Button>
      </div>
    );
  }

  // 出品者は1人だけ（ユニークアイテムの仕様）
  const owner = owners[0];

  return (
    <div className="space-y-4">
      {/* 戻るボタン */}
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        戻る
      </Button>

      {/* カード詳細 */}
      <Card className="py-0 overflow-hidden">
        <CardContent className="p-0">
          {/* カード画像 */}
          <div className="w-full aspect-[3/4] bg-muted rounded-t-lg overflow-hidden">
            {card.imageUrl ? (
              <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* カード情報 */}
          <div className="p-4 space-y-3">
            <div>
              <h2 className="text-xl font-bold">{card.name}</h2>
              {card.category && (
                <span className="text-sm text-muted-foreground">{card.category}</span>
              )}
            </div>
            {card.description && (
              <p className="text-sm text-muted-foreground">{card.description}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 出品者情報 */}
      {owner ? (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">出品者</h3>
            <Link
              href={`/users/${owner.userId}`}
              className="flex items-center gap-3 p-3 -m-3 rounded-lg hover:bg-accent transition-colors"
            >
              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-muted flex items-center justify-center">
                {owner.image ? (
                  <img src={owner.image} alt={owner.name} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {owner.twitterUsername ? `@${owner.twitterUsername}` : owner.name}
                  </span>
                </div>
                <div className="mt-1">
                  <TrustBadge
                    grade={owner.trustGrade as TrustGrade}
                    size="sm"
                    showScore
                    score={owner.trustScore}
                  />
                </div>
              </div>
              <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180" />
            </Link>

            {/* 出品者が欲しいアイテム */}
            {owner.wantCards && owner.wantCards.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">欲しいアイテム</h4>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {owner.wantCards.map((wantCard) => (
                    <div
                      key={wantCard.cardId}
                      className="flex-shrink-0 w-16 group"
                      title={wantCard.cardName}
                    >
                      <div className="aspect-[3/4] bg-muted rounded overflow-hidden">
                        {wantCard.cardImageUrl ? (
                          <img
                            src={wantCard.cardImageUrl}
                            alt={wantCard.cardName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">
                        {wantCard.cardName}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-center py-4">出品者情報がありません</p>
          </CardContent>
        </Card>
      )}

      {/* 取引申し込みボタン（自分自身のアイテムの場合は非表示） */}
      {owner && owner.userId !== currentUserId && (
        <div className="pt-2">
          {isLoggedIn ? (
            <div className="space-y-2">
              <Button
                className="w-full gap-2"
                onClick={handleCreateTrade}
                disabled={isCreatingTrade}
              >
                {isCreatingTrade ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                {isCreatingTrade ? '作成中...' : 'トレードを申し込む'}
              </Button>
              {tradeError && <p className="text-sm text-destructive text-center">{tradeError}</p>}
            </div>
          ) : (
            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">
                トレードを申し込むにはログインが必要です
              </p>
              <LoginButton />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
