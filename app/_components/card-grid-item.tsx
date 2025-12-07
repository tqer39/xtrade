'use client';

import { Heart, ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { UserHaveCard, UserWantCard } from '@/modules/cards/types';

interface CardGridItemProps {
  item: UserHaveCard | UserWantCard;
  type: 'have' | 'want';
  onCardClick?: (item: UserHaveCard | UserWantCard) => void;
  onFavoriteToggle?: (cardId: string, isFavorite: boolean) => void;
  isFavorite?: boolean;
}

export function CardGridItem({
  item,
  type,
  onCardClick,
  onFavoriteToggle,
  isFavorite = false,
}: CardGridItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [localFavorite, setLocalFavorite] = useState(isFavorite);
  const card = item.card;

  if (!card) {
    return null;
  }

  const isHave = type === 'have';
  const haveItem = isHave ? (item as UserHaveCard) : null;
  const wantItem = !isHave ? (item as UserWantCard) : null;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavoriteState = !localFavorite;
    setLocalFavorite(newFavoriteState);
    onFavoriteToggle?.(card.id, newFavoriteState);
  };

  const handleCardClick = () => {
    onCardClick?.(item);
  };

  return (
    <div
      className="group relative aspect-square overflow-hidden rounded-lg bg-muted cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* カード画像 */}
      <div className="absolute inset-0">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* 数量・優先度バッジ（右上） */}
      <div className="absolute top-2 right-2 z-10">
        {isHave && haveItem && (
          <Badge variant="secondary" className="bg-black/70 text-white backdrop-blur-sm">
            ×{haveItem.quantity}
          </Badge>
        )}
        {!isHave && wantItem && wantItem.priority !== null && (
          <Badge variant="secondary" className="bg-black/70 text-white backdrop-blur-sm">
            P{wantItem.priority}
          </Badge>
        )}
      </div>

      {/* お気に入りボタン（右上、数量バッジの下） */}
      {onFavoriteToggle && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-12 right-2 z-10 h-8 w-8 bg-black/50 hover:bg-black/70 backdrop-blur-sm"
          onClick={handleFavoriteClick}
        >
          <Heart
            className={`h-4 w-4 ${localFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`}
          />
        </Button>
      )}

      {/* ホバー時のオーバーレイ情報 */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-0 md:opacity-0'
        } flex flex-col justify-end p-3`}
      >
        <div className="space-y-2">
          <h3 className="font-semibold text-white text-sm line-clamp-2">{card.name}</h3>
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs bg-white/90 text-black">
              {card.category}
            </Badge>
            {card.rarity && (
              <Badge variant="outline" className="text-xs bg-white/90 text-black border-white/50">
                {card.rarity}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* モバイル用: 常に表示される下部情報バー */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <p className="font-semibold text-white text-xs truncate">{card.name}</p>
      </div>
    </div>
  );
}
