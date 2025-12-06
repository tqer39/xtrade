'use client';

import Image from 'next/image';
import type * as React from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { StarRating } from './star-rating';

/**
 * 相対的な時間表示を生成する
 */
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffYear > 0) return `${diffYear}年前`;
  if (diffMonth > 0) return `${diffMonth}ヶ月前`;
  if (diffDay > 0) return `${diffDay}日前`;
  if (diffHour > 0) return `${diffHour}時間前`;
  if (diffMin > 0) return `${diffMin}分前`;
  return 'たった今';
}

export interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export interface ReviewListProps extends React.ComponentProps<'div'> {
  /** レビュー一覧 */
  reviews: ReviewItem[];
  /** レビューがない場合のメッセージ */
  emptyMessage?: string;
  /** 自分のレビューかどうかを判定するためのユーザーID */
  currentUserId?: string;
  /** コンパクト表示 */
  compact?: boolean;
}

function ReviewCard({
  review,
  isOwn,
  compact,
}: {
  review: ReviewItem;
  isOwn: boolean;
  compact: boolean;
}) {
  const timeAgo = formatTimeAgo(review.createdAt);

  if (compact) {
    return (
      <div className="flex items-start gap-3 py-3">
        {/* アバター */}
        <div className="flex-shrink-0">
          {review.reviewer.image ? (
            <Image
              src={review.reviewer.image}
              alt={review.reviewer.name ?? ''}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
              {(review.reviewer.name ?? '?')[0]}
            </div>
          )}
        </div>

        {/* コンテンツ */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">
              {review.reviewer.name ?? '匿名ユーザー'}
            </span>
            <StarRating value={review.rating} readOnly size="sm" showEmpty={false} />
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          {review.comment && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{review.comment}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={cn(isOwn && 'border-primary/30 bg-primary/5')}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {/* アバター */}
          {review.reviewer.image ? (
            <Image
              src={review.reviewer.image}
              alt={review.reviewer.name ?? ''}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
              {(review.reviewer.name ?? '?')[0]}
            </div>
          )}

          <div className="flex-1">
            <CardTitle className="text-sm font-medium">
              {review.reviewer.name ?? '匿名ユーザー'}
              {isOwn && <span className="ml-2 text-xs text-muted-foreground">(自分)</span>}
            </CardTitle>
            <CardDescription className="text-xs">{timeAgo}</CardDescription>
          </div>

          <StarRating value={review.rating} readOnly size="default" />
        </div>
      </CardHeader>

      {review.comment && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{review.comment}</p>
        </CardContent>
      )}
    </Card>
  );
}

/**
 * レビュー一覧コンポーネント
 *
 * @example
 * ```tsx
 * <ReviewList
 *   reviews={reviews}
 *   currentUserId={session.user.id}
 *   emptyMessage="まだレビューがありません"
 * />
 * ```
 */
export function ReviewList({
  className,
  reviews,
  emptyMessage = 'レビューはありません',
  currentUserId,
  compact = false,
  ...props
}: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div
        className={cn('flex items-center justify-center py-8 text-muted-foreground', className)}
        {...props}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn(compact ? 'divide-y' : 'space-y-4', className)} {...props}>
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          isOwn={currentUserId === review.reviewer.id}
          compact={compact}
        />
      ))}
    </div>
  );
}
