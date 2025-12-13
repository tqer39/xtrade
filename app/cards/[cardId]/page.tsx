'use client';

import { ArrowLeft, ImageIcon, Loader2, Mail, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

import { LoginButton } from '@/components/auth';
import { TrustBadge } from '@/components/trust';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/lib/auth-client';
import type { CardOwner, CardWithCreator } from '@/modules/cards/types';
import type { TrustGrade } from '@/modules/trust';

interface Props {
  params: Promise<{ cardId: string }>;
}

export default function CardDetailPage({ params }: Props) {
  const { cardId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [card, setCard] = useState<CardWithCreator | null>(null);
  const [owners, setOwners] = useState<CardOwner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingTrade, setIsCreatingTrade] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // カード詳細と所有者一覧を並列取得
        const [cardRes, ownersRes] = await Promise.all([
          fetch(`/api/cards/${cardId}`),
          fetch(`/api/cards/${cardId}/owners`),
        ]);

        if (!cardRes.ok) {
          if (cardRes.status === 404) {
            setError('カードが見つかりません');
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

  const handleCreateTrade = async (ownerUserId: string) => {
    setIsCreatingTrade(true);
    setTradeError(null);

    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responderUserId: ownerUserId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '取引の作成に失敗しました');
      }

      const data = await res.json();
      router.push(`/trades/${data.trade.roomSlug}`);
    } catch (err) {
      setTradeError(err instanceof Error ? err.message : '取引の作成に失敗しました');
      setIsCreatingTrade(false);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={() => router.back()}>
            戻る
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !card) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="aspect-[3/4] w-full max-w-md mx-auto mb-6" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const isLoggedIn = !!session?.user;
  const currentUserId = session?.user?.id;

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      {/* ヘッダー */}
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Button>
        <Link href="/" className="text-xl font-bold hover:opacity-80 transition-opacity">
          xtrade
        </Link>
      </div>

      {/* カード画像 */}
      <div className="mb-6">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className="w-full max-w-md mx-auto rounded-lg object-cover"
          />
        ) : (
          <div className="aspect-[3/4] max-w-md mx-auto bg-muted rounded-lg flex items-center justify-center">
            <ImageIcon className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* カード情報 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">{card.name}</h1>
        {card.category && <p className="text-muted-foreground mb-2">{card.category}</p>}
        {card.description && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{card.description}</p>
        )}
      </div>

      {/* 登録者情報 */}
      {card.creator && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-2">登録者</p>
            <Link
              href={`/users/${card.creator.id}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              {card.creator.image ? (
                <img
                  src={card.creator.image}
                  alt={card.creator.name ?? ''}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{card.creator.name ?? '名前未設定'}</p>
                <TrustBadge grade={card.creator.trustGrade as TrustGrade | null} size="sm" />
              </div>
            </Link>
          </CardContent>
        </Card>
      )}

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
                        取引
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {tradeError && <p className="text-sm text-destructive text-center">{tradeError}</p>}
          </div>
        )}
        {!isLoggedIn && owners.length > 0 && (
          <div className="mt-4 text-center space-y-2">
            <p className="text-sm text-muted-foreground">取引を申し込むにはログインが必要です</p>
            <LoginButton />
          </div>
        )}
      </div>
    </div>
  );
}
