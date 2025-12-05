'use client';

import { Heart } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  isFavorited: boolean;
  onToggle: () => Promise<void>;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
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
}: FavoriteButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

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
        isFavorited
          ? 'text-red-500 hover:text-red-600'
          : 'text-muted-foreground hover:text-red-500',
        className
      )}
      onClick={handleClick}
      disabled={isLoading || disabled}
      aria-label={isFavorited ? 'お気に入りから削除' : 'お気に入りに追加'}
    >
      <Heart className={cn(iconSizes[size], isFavorited && 'fill-current')} />
    </Button>
  );
}
