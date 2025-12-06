'use client';

import type * as React from 'react';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import { StarRating } from './star-rating';

export interface ReviewFormData {
  rating: number;
  comment: string;
  isPublic: boolean;
}

export interface ReviewFormProps extends Omit<React.ComponentProps<typeof Card>, 'onSubmit'> {
  /** 取引相手の名前 */
  partnerName: string;
  /** 送信時のコールバック */
  onSubmit: (data: ReviewFormData) => Promise<void>;
  /** キャンセル時のコールバック */
  onCancel?: () => void;
  /** 送信中かどうか */
  isSubmitting?: boolean;
}

/**
 * レビュー投稿フォームコンポーネント
 *
 * @example
 * ```tsx
 * <ReviewForm
 *   partnerName="田中太郎"
 *   onSubmit={async (data) => { await submitReview(data); }}
 *   onCancel={() => router.back()}
 * />
 * ```
 */
export function ReviewForm({
  className,
  partnerName,
  onSubmit,
  onCancel,
  isSubmitting = false,
  ...props
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (rating === 0) {
        setError('評価を選択してください');
        return;
      }

      try {
        await onSubmit({ rating, comment, isPublic });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      }
    },
    [rating, comment, isPublic, onSubmit]
  );

  return (
    <Card className={cn('w-full max-w-md', className)} {...props}>
      <CardHeader>
        <CardTitle>レビューを投稿</CardTitle>
        <CardDescription>{partnerName}さんとの取引を評価してください</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 評価（星） */}
          <div className="space-y-2">
            <Label htmlFor="rating">評価</Label>
            <div className="flex items-center gap-2">
              <StarRating value={rating} onChange={setRating} size="lg" />
              {rating > 0 && <span className="text-sm text-muted-foreground">{rating}つ星</span>}
            </div>
          </div>

          {/* コメント */}
          <div className="space-y-2">
            <Label htmlFor="comment">コメント（任意）</Label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="取引の感想を書いてください..."
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{comment.length}/500</p>
          </div>

          {/* 公開設定 */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="public">レビューを公開する</Label>
              <p className="text-xs text-muted-foreground">
                他のユーザーがこのレビューを閲覧できます
              </p>
            </div>
            <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          {/* エラーメッセージ */}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          {/* ボタン */}
          <div className="flex gap-3 pt-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                キャンセル
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting || rating === 0} className="flex-1">
              {isSubmitting ? '送信中...' : 'レビューを投稿'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
