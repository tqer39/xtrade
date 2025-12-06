'use client';

import type * as React from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { TrustGrade } from '@/modules/trust';

import { TrustBadge } from './trust-badge';

interface ScoreBreakdown {
  xProfile: number;
  behavior: number;
  review: number;
}

interface TradeStats {
  completedTrades: number;
  successRate: number | null;
  avgRating: number | null;
  reviewCount: number;
}

export interface TrustScoreCardProps extends React.ComponentProps<typeof Card> {
  trustScore: number | null;
  trustGrade: TrustGrade | null;
  breakdown?: ScoreBreakdown;
  stats?: TradeStats;
  updatedAt?: string | null;
  compact?: boolean;
}

function ScoreBar({
  label,
  score,
  maxScore,
  color,
}: {
  label: string;
  score: number;
  maxScore: number;
  color: string;
}) {
  const percentage = (score / maxScore) * 100;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {score}/{maxScore}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * 信頼スコアの詳細を表示するカードコンポーネント
 *
 * @example
 * ```tsx
 * <TrustScoreCard
 *   trustScore={75}
 *   trustGrade="A"
 *   breakdown={{ xProfile: 32, behavior: 28, review: 15 }}
 *   stats={{ completedTrades: 12, successRate: 92, avgRating: 4.3, reviewCount: 8 }}
 * />
 * ```
 */
export function TrustScoreCard({
  className,
  trustScore,
  trustGrade,
  breakdown,
  stats,
  updatedAt,
  compact = false,
  ...props
}: TrustScoreCardProps) {
  const formattedDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <TrustBadge grade={trustGrade} size="lg" showScore score={trustScore} />
        {stats && stats.completedTrades > 0 && (
          <span className="text-sm text-muted-foreground">
            {stats.completedTrades}件のトレード完了
          </span>
        )}
      </div>
    );
  }

  return (
    <Card className={cn('w-full max-w-md', className)} {...props}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">信頼スコア</CardTitle>
          <TrustBadge grade={trustGrade} size="lg" showScore score={trustScore} />
        </div>
        {formattedDate && (
          <CardDescription className="text-xs">最終更新: {formattedDate}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {breakdown && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">スコア内訳</h4>
            <ScoreBar
              label="Xプロフィール"
              score={breakdown.xProfile}
              maxScore={40}
              color="bg-sky-500"
            />
            <ScoreBar
              label="取引実績"
              score={breakdown.behavior}
              maxScore={40}
              color="bg-emerald-500"
            />
            <ScoreBar
              label="レビュー"
              score={breakdown.review}
              maxScore={20}
              color="bg-amber-500"
            />
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.completedTrades}</div>
              <div className="text-xs text-muted-foreground">トレード完了</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {stats.successRate != null ? `${stats.successRate}%` : '-'}
              </div>
              <div className="text-xs text-muted-foreground">成功率</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {stats.avgRating != null ? stats.avgRating.toFixed(1) : '-'}
              </div>
              <div className="text-xs text-muted-foreground">平均評価</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.reviewCount}</div>
              <div className="text-xs text-muted-foreground">レビュー数</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
