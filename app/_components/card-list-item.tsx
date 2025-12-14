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
      <button
        type="button"
        className={`relative w-full mb-0.5 rounded-sm overflow-hidden text-left ${onClick ? 'cursor-pointer transition-all duration-200 hover:brightness-110' : ''}`}
        onClick={onClick}
      >
        <div className="relative w-full">
          {card.imageUrl ? (
            <Image
              src={card.imageUrl}
              alt={card.name}
              width={400}
              height={600}
              className="w-full h-auto object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            />
          ) : (
            <div className="aspect-[3/4] flex items-center justify-center bg-zinc-800">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
        {/* グラデーションオーバーレイ */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
        {/* 優先度バッジ */}
        {!isHave && wantItem && wantItem.priority !== null && (
          <div className="absolute top-2 right-2 bg-violet-500/90 text-white text-xs font-bold px-1.5 py-0.5 rounded">
            P{wantItem.priority}
          </div>
        )}
        {/* 下部の情報エリア */}
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <div className="font-medium text-white text-xs truncate drop-shadow-lg">{card.name}</div>
          <span className="text-[10px] text-zinc-300 bg-black/40 px-1.5 py-0.5 rounded">
            {card.category}
          </span>
        </div>
      </button>
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
            {card.category && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {card.category}
                </Badge>
              </div>
            )}
            {card.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{card.description}</p>
            )}
          </div>
          {!isHave && wantItem && wantItem.priority !== null && (
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                優先度: <span className="font-semibold">{wantItem.priority}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
