'use client';

import { Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface PricingNoticeProps {
  tradeCount?: number;
}

/**
 * 課金プランの案内 UI（スタブ）
 * 月1回まで無料で取引可能、2回目以降は有料プラン案内
 */
export function PricingNotice({ tradeCount = 0 }: PricingNoticeProps) {
  const freeTradesRemaining = Math.max(0, 1 - tradeCount);
  const needsPaidPlan = tradeCount >= 1;

  if (!needsPaidPlan) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">今月あと {freeTradesRemaining} 回無料で取引できます</p>
              <p className="text-sm text-muted-foreground">毎月1回まで無料でトレードが可能です</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-500/20 bg-amber-500/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
            <Crown className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="font-medium">有料プランへのアップグレード</p>
            <p className="text-sm text-muted-foreground">
              今月の無料枠を使い切りました。有料プランで無制限に取引できます。
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-1" disabled>
            <Crown className="h-4 w-4" />
            準備中
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
