'use client';

import { ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { UserHaveCard, UserWantCard } from '@/modules/cards/types';

interface CardListItemProps {
  item: UserHaveCard | UserWantCard;
  type: 'have' | 'want';
  viewMode?: 'list' | 'grid';
  onClick?: () => void;
}

export function CardListItem({ item, type, viewMode = 'list', onClick }: CardListItemProps) {
  const card = item.card;

  if (!card) {
    return null;
  }

  const isHave = type === 'have';
  const haveItem = isHave ? (item as UserHaveCard) : null;
  const wantItem = !isHave ? (item as UserWantCard) : null;

  if (viewMode === 'grid') {
    return (
      <Card
        className={`overflow-hidden rounded-none ${onClick ? 'cursor-pointer transition-colors hover:bg-accent/50' : ''}`}
        onClick={onClick}
      >
        <CardContent className="p-0">
          <div className="aspect-square relative overflow-hidden bg-muted">
            {card.imageUrl ? (
              <Image
                src={card.imageUrl}
                alt={card.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            {/* 数量/優先度バッジ */}
            {isHave && haveItem && haveItem.quantity > 1 && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                x{haveItem.quantity}
              </div>
            )}
            {!isHave && wantItem && wantItem.priority !== null && (
              <div className="absolute top-2 right-2 bg-secondary text-secondary-foreground text-xs font-bold px-2 py-1 rounded-full">
                優先{wantItem.priority}
              </div>
            )}
          </div>
          <div className="p-3">
            <div className="font-medium text-sm truncate">{card.name}</div>
            <Badge variant="secondary" className="text-xs mt-1">
              {card.category}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={onClick ? 'cursor-pointer transition-colors hover:bg-accent/50' : ''}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* サムネイル画像 */}
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-muted">
            {card.imageUrl ? (
              <Image
                src={card.imageUrl}
                alt={card.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{card.name}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {card.category}
              </Badge>
              {card.rarity && (
                <Badge variant="outline" className="text-xs">
                  {card.rarity}
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            {isHave && haveItem && (
              <div className="text-sm text-muted-foreground">
                数量: <span className="font-semibold">{haveItem.quantity}</span>
              </div>
            )}
            {!isHave && wantItem && wantItem.priority !== null && (
              <div className="text-sm text-muted-foreground">
                優先度: <span className="font-semibold">{wantItem.priority}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
