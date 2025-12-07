'use client';

import { ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { UserHaveCard, UserWantCard } from '@/modules/cards/types';

interface CardGridItemProps {
  item: UserHaveCard | UserWantCard;
  type: 'have' | 'want';
  onClick?: () => void;
  className?: string;
}

export function CardGridItem({ item, type, onClick, className }: CardGridItemProps) {
  const card = item.card;

  if (!card) {
    return null;
  }

  const isHave = type === 'have';
  const haveItem = isHave ? (item as UserHaveCard) : null;
  const wantItem = !isHave ? (item as UserWantCard) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative aspect-square w-full overflow-hidden rounded-lg bg-muted',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'transition-transform hover:scale-[1.02]',
        className
      )}
    >
      {/* カード画像 */}
      {card.imageUrl ? (
        <img
          src={card.imageUrl}
          alt={card.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground" />
        </div>
      )}

      {/* ホバー時オーバーレイ */}
      <div
        className={cn(
          'absolute inset-0 flex flex-col justify-end p-2',
          'bg-gradient-to-t from-black/70 via-black/30 to-transparent',
          'opacity-0 group-hover:opacity-100 transition-opacity'
        )}
      >
        <div className="text-white">
          <div className="text-sm font-semibold truncate">{card.name}</div>
          <div className="flex items-center gap-1 mt-1">
            <Badge variant="secondary" className="text-xs h-5">
              {card.category}
            </Badge>
            {card.rarity && (
              <Badge variant="outline" className="text-xs h-5 border-white/50 text-white">
                {card.rarity}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* 数量・優先度バッジ（常時表示） */}
      {isHave && haveItem && haveItem.quantity > 1 && (
        <div className="absolute top-2 right-2">
          <Badge className="text-xs h-5 bg-primary/90">×{haveItem.quantity}</Badge>
        </div>
      )}
      {!isHave && wantItem && wantItem.priority !== null && (
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="text-xs h-5">
            優先度 {wantItem.priority}
          </Badge>
        </div>
      )}
    </button>
  );
}
