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
  /** フィーチャーカードとして大きく表示 */
  featured?: boolean;
}

export function CardGridItem({
  item,
  type,
  onCardClick,
  onFavoriteToggle,
  isFavorite = false,
  featured = false,
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
      className={`group relative w-full overflow-hidden bg-zinc-900 cursor-pointer transition-all duration-300 text-left
        hover:z-10 hover:ring-2 hover:ring-white/30 hover:shadow-2xl
        active:scale-[0.98]
        ${featured ? 'aspect-[4/5] row-span-2' : 'aspect-[3/4]'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* カード画像 */}
      <div className="absolute inset-0">
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt={card.name}
            fill
            className={`object-cover transition-transform duration-500 ${isHovered ? 'scale-105' : 'scale-100'}`}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-800">
            <ImageIcon className="h-16 w-16 text-zinc-600" />
          </div>
        )}
      </div>

      {/* 常時表示のグラデーションオーバーレイ */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      {/* 数量・優先度バッジ（右上） */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        {isHave && haveItem && (
          <Badge className="bg-white/90 text-zinc-900 font-semibold backdrop-blur-sm border-0 shadow-lg">
            ×{haveItem.quantity}
          </Badge>
        )}
        {!isHave && wantItem && wantItem.priority !== null && (
          <Badge className="bg-violet-500/90 text-white font-semibold backdrop-blur-sm border-0 shadow-lg">
            P{wantItem.priority}
          </Badge>
        )}
      </div>

      {/* お気に入りボタン（左上） */}
      {onFavoriteToggle && (
        <Button
          variant="ghost"
          size="icon"
          className={`absolute top-3 left-3 z-10 h-9 w-9 rounded-full backdrop-blur-sm transition-all duration-200
            ${localFavorite ? 'bg-red-500/80 hover:bg-red-500' : 'bg-black/40 hover:bg-black/60'}
          `}
          onClick={handleFavoriteClick}
        >
          <Heart
            className={`h-4 w-4 transition-all ${localFavorite ? 'fill-white text-white scale-110' : 'text-white'}`}
          />
        </Button>
      )}

      {/* 下部の情報エリア（Sora風 - 常時表示） */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="space-y-2">
          {/* カード名 */}
          <h3
            className={`font-semibold text-white leading-tight ${featured ? 'text-lg' : 'text-sm'} line-clamp-2`}
          >
            {card.name}
          </h3>

          {/* カテゴリー・レアリティ */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-zinc-300 bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-sm">
              {card.category}
            </span>
            {card.rarity && (
              <span className="text-xs text-zinc-300 bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-sm">
                {card.rarity}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ホバー時の追加エフェクト */}
      <div
        className={`absolute inset-0 bg-white/5 transition-opacity duration-300 pointer-events-none ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </button>
  );
}
