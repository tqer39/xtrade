'use client';

import type { UserHaveCard, UserWantCard } from '@/modules/cards/types';
import { CardGridItem } from './card-grid-item';
import { CardGridSkeleton } from './card-grid-skeleton';

interface CardGridProps {
  items: (UserHaveCard | UserWantCard)[];
  type: 'have' | 'want';
  isLoading?: boolean;
  onCardClick?: (item: UserHaveCard | UserWantCard) => void;
  onFavoriteToggle?: (cardId: string, isFavorite: boolean) => void;
  favoriteCardIds?: Set<string>;
  emptyMessage?: string;
}

export function CardGrid({
  items,
  type,
  isLoading = false,
  onCardClick,
  onFavoriteToggle,
  favoriteCardIds = new Set(),
  emptyMessage = 'カードがありません',
}: CardGridProps) {
  if (isLoading) {
    return <CardGridSkeleton />;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-zinc-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <p className="text-zinc-400 text-center">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-0.5">
      {items.map((item) => (
        <CardGridItem
          key={item.id}
          item={item}
          type={type}
          onCardClick={onCardClick}
          onFavoriteToggle={onFavoriteToggle}
          isFavorite={item.card ? favoriteCardIds.has(item.card.id) : false}
        />
      ))}
    </div>
  );
}
