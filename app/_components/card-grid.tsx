'use client';

import { CardGridItem } from './card-grid-item';
import { CardGridSkeleton } from './card-grid-skeleton';
import type { UserHaveCard, UserWantCard } from '@/modules/cards/types';

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
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
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
