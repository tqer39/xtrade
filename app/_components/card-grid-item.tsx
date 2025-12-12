'use client';

import { Heart, ImageIcon } from 'lucide-react';
import Image from 'next/image';
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
    <button
      type="button"
      className="group relative w-full overflow-hidden bg-zinc-900 cursor-pointer transition-all duration-200 text-left mb-0.5 rounded-sm
        hover:z-10 hover:brightness-110
        active:scale-[0.99]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* カード画像 */}
      <div className="relative w-full">
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt={card.name}
            width={400}
            height={600}
            className={`w-full h-auto object-cover transition-transform duration-300 ${isHovered ? 'scale-[1.02]' : 'scale-100'}`}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="aspect-[3/4] flex items-center justify-center bg-zinc-800">
            <ImageIcon className="h-12 w-12 text-zinc-600" />
          </div>
        )}
      </div>

      {/* グラデーションオーバーレイ */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

      {/* 数量・優先度バッジ（右上） */}
      {((isHave && haveItem && haveItem.quantity > 1) ||
        (!isHave && wantItem && wantItem.priority !== null)) && (
        <div className="absolute top-2 right-2 z-10">
          {isHave && haveItem && haveItem.quantity > 1 && (
            <Badge className="bg-white/90 text-zinc-900 text-xs font-semibold backdrop-blur-sm border-0">
              ×{haveItem.quantity}
            </Badge>
          )}
          {!isHave && wantItem && wantItem.priority !== null && (
            <Badge className="bg-violet-500/90 text-white text-xs font-semibold backdrop-blur-sm border-0">
              P{wantItem.priority}
            </Badge>
          )}
        </div>
      )}

      {/* お気に入りボタン（左上） */}
      {onFavoriteToggle && (
        <Button
          variant="ghost"
          size="icon"
          className={`absolute top-2 left-2 z-10 h-7 w-7 rounded-full backdrop-blur-sm transition-all duration-200
            ${localFavorite ? 'bg-red-500/80 hover:bg-red-500' : 'bg-black/40 hover:bg-black/60'}
          `}
          onClick={handleFavoriteClick}
        >
          <Heart
            className={`h-3.5 w-3.5 transition-all ${localFavorite ? 'fill-white text-white' : 'text-white'}`}
          />
        </Button>
      )}

      {/* 下部の情報エリア */}
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <h3 className="font-medium text-white text-xs leading-tight line-clamp-2 drop-shadow-lg">
          {card.name}
        </h3>
        {card.category && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[10px] text-zinc-300 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm">
              {card.category}
            </span>
          </div>
        )}
        {card.description && (
          <p className="text-[10px] text-zinc-300 mt-1 line-clamp-2 drop-shadow-lg">
            {card.description}
          </p>
        )}
      </div>
    </button>
  );
}
