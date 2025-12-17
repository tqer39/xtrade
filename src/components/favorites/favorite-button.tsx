'use client';

import { Heart, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  isFavorited: boolean;
  onToggle: () => Promise<void>;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  /** アイコンの種類: heart=アイテム用(赤), star=ユーザー用(黄) */
  iconType?: 'heart' | 'star';
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function FavoriteButton({
  isFavorited,
  onToggle,
  size = 'md',
  disabled = false,
  className,
  iconType = 'heart',
}: FavoriteButtonProps) {
  const Icon = iconType === 'star' ? Star : Heart;
  const activeColor = iconType === 'star' ? 'text-yellow-500' : 'text-red-500';
  const hoverColor = iconType === 'star' ? 'hover:text-yellow-500' : 'hover:text-red-500';
  const activeHoverColor = iconType === 'star' ? 'hover:text-yellow-600' : 'hover:text-red-600';
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevFavorited, setPrevFavorited] = useState(isFavorited);

  // お気に入りに追加された時にアニメーション発火
  useEffect(() => {
    if (isFavorited && !prevFavorited) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
    setPrevFavorited(isFavorited);
  }, [isFavorited, prevFavorited]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading || disabled) return;

    setIsLoading(true);
    try {
      await onToggle();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        sizeClasses[size],
        'transition-colors',
        isFavorited ? `${activeColor} ${activeHoverColor}` : `text-muted-foreground ${hoverColor}`,
        className
      )}
      onClick={handleClick}
      disabled={isLoading || disabled}
      aria-label={isFavorited ? 'お気に入りから削除' : 'お気に入りに追加'}
    >
      <Icon
        className={cn(
          iconSizes[size],
          isFavorited && 'fill-current',
          isAnimating && 'animate-heart-pop'
        )}
      />
    </Button>
  );
}
