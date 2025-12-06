'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '@/lib/utils';
import type { TrustGrade } from '@/modules/trust';

const trustBadgeVariants = cva(
  'inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold',
  {
    variants: {
      grade: {
        S: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-md',
        A: 'bg-emerald-500 text-white',
        B: 'bg-sky-500 text-white',
        C: 'bg-slate-400 text-white',
        D: 'bg-red-400 text-white',
        U: 'bg-gray-200 text-gray-500',
      },
      size: {
        sm: 'h-5 min-w-5 text-[10px] px-1.5',
        default: 'h-6 min-w-6 text-xs px-2',
        lg: 'h-8 min-w-8 text-sm px-3',
      },
    },
    defaultVariants: {
      grade: 'U',
      size: 'default',
    },
  }
);

export interface TrustBadgeProps
  extends Omit<React.ComponentProps<'span'>, 'children'>,
    VariantProps<typeof trustBadgeVariants> {
  grade: TrustGrade | null | undefined;
  showScore?: boolean;
  score?: number | null;
}

/**
 * 信頼グレードを表示するバッジコンポーネント
 *
 * @example
 * ```tsx
 * <TrustBadge grade="A" />
 * <TrustBadge grade="S" size="lg" showScore score={85} />
 * ```
 */
export function TrustBadge({
  className,
  grade,
  size,
  showScore = false,
  score,
  ...props
}: TrustBadgeProps) {
  const displayGrade = grade ?? 'U';

  return (
    <span
      data-slot="trust-badge"
      className={cn(trustBadgeVariants({ grade: displayGrade, size }), className)}
      title={`信頼グレード: ${displayGrade}${score != null ? ` (${score}点)` : ''}`}
      {...props}
    >
      {displayGrade}
      {showScore && score != null && <span className="ml-1 font-normal opacity-90">{score}</span>}
    </span>
  );
}
