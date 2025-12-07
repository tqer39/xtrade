'use client';

import { ArrowLeft, ImageIcon, Mail, User } from 'lucide-react';
import { LoginButton } from '@/components/auth';
import { TrustBadge } from '@/components/trust/trust-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCardOwners } from '@/hooks/use-card-owners';
import type { TrustGrade } from '@/modules/trust';

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
        <Skeleton className="h-24 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
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

  return (
    <div className="space-y-4">
      {/* カード情報ヘッダー */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
            {card.imageUrl ? (
              <img src={card.imageUrl} alt={card.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-medium truncate">{card.name}</h3>
            <p className="text-sm text-muted-foreground">{card.category}</p>
          </div>
        </div>
      </div>

      {/* 所有者一覧 */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          このカードを持っているユーザー ({owners.length}人)
        </h4>

        {owners.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            このカードを持っているユーザーがいません
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {owners.map((owner) => (
              <Card key={owner.userId} className="transition-colors hover:bg-accent/50">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-muted flex items-center justify-center">
                      {owner.image ? (
                        <img
                          src={owner.image}
                          alt={owner.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{owner.name}</span>
                        <TrustBadge
                          grade={owner.trustGrade as TrustGrade}
                          size="sm"
                          showScore
                          score={owner.trustScore}
                        />
                      </div>
                      {owner.twitterUsername && (
                        <p className="text-xs text-muted-foreground">@{owner.twitterUsername}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-muted-foreground">{owner.quantity}枚</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 取引申し込みボタン */}
      <div className="pt-4 border-t">
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
