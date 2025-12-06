'use client';

import { Star } from 'lucide-react';
import type * as React from 'react';
import { useCallback, useState } from 'react';

import { cn } from '@/lib/utils';

export interface StarRatingProps extends Omit<React.ComponentProps<'fieldset'>, 'onChange'> {
  /** 現在の評価値（1-5） */
  value?: number;
  /** 評価変更時のコールバック */
  onChange?: (rating: number) => void;
  /** 読み取り専用モード */
  readOnly?: boolean;
  /** サイズ */
  size?: 'sm' | 'default' | 'lg';
  /** 空の星を表示するか */
  showEmpty?: boolean;
}

const sizeMap = {
  sm: 'h-4 w-4',
  default: 'h-5 w-5',
  lg: 'h-6 w-6',
};

/**
 * 星評価コンポーネント
 *
 * @example
 * ```tsx
 * // 入力モード
 * <StarRating value={rating} onChange={setRating} />
 *
 * // 表示モード
 * <StarRating value={4.5} readOnly />
 * ```
 */
export function StarRating({
  className,
  value = 0,
  onChange,
  readOnly = false,
  size = 'default',
  showEmpty = true,
  ...props
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const handleClick = useCallback(
    (rating: number) => {
      if (!readOnly && onChange) {
        onChange(rating);
      }
    },
    [readOnly, onChange]
  );

  const handleMouseEnter = useCallback(
    (rating: number) => {
      if (!readOnly) {
        setHoverValue(rating);
      }
    },
    [readOnly]
  );

  const handleMouseLeave = useCallback(() => {
    if (!readOnly) {
      setHoverValue(null);
    }
  }, [readOnly]);

  const displayValue = hoverValue ?? value;
  const starSize = sizeMap[size];

  return (
    <fieldset
      data-slot="star-rating"
      className={cn('inline-flex items-center gap-0.5 border-0 p-0 m-0', className)}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <legend className="sr-only">評価</legend>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= displayValue;
        const isHalf = !isFilled && star - 0.5 <= displayValue;

        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            className={cn(
              'relative transition-transform focus:outline-none',
              !readOnly && 'cursor-pointer hover:scale-110 focus-visible:scale-110',
              readOnly && 'cursor-default'
            )}
            aria-label={`${star}つ星`}
          >
            {/* 空の星（背景） */}
            {showEmpty && (
              <Star
                className={cn(starSize, 'text-muted-foreground/30', isFilled && 'opacity-0')}
                fill="none"
              />
            )}

            {/* 塗りつぶされた星（前景） */}
            {(isFilled || isHalf) && (
              <Star
                className={cn(
                  starSize,
                  'absolute inset-0 text-amber-400',
                  isHalf && 'clip-path-half'
                )}
                fill="currentColor"
              />
            )}
          </button>
        );
      })}

      {/* 評価値の表示（読み取り専用時） */}
      {readOnly && value > 0 && (
        <span className="ml-1 text-sm font-medium text-muted-foreground">{value.toFixed(1)}</span>
      )}
    </fieldset>
  );
}
