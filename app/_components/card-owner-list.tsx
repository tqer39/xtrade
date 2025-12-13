'use client';

import { ArrowLeft, ImageIcon, Mail, User } from 'lucide-react';
import Link from 'next/link';
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
}

export function CardOwnerList({ cardId, onBack, isLoggedIn }: CardOwnerListProps) {
  const { card, owners, isLoading, error } = useCardOwners(cardId);

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
        <p className="text-muted-foreground mb-4">カードが見つかりません</p>
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
      <Card>
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
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-center py-4">出品者情報がありません</p>
          </CardContent>
        </Card>
      )}

      {/* 取引申し込みボタン */}
      <div className="pt-2">
        {isLoggedIn ? (
          <Button className="w-full gap-2" disabled>
            <Mail className="h-4 w-4" />
            取引を申し込む（準備中）
          </Button>
        ) : (
          <div className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">取引を申し込むにはログインが必要です</p>
            <LoginButton />
          </div>
        )}
      </div>
    </div>
  );
}
