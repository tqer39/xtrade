'use client';

import { CreditCard, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { redirectToPortal, useSubscription } from '@/hooks/use-subscription';

const PLAN_NAMES: Record<string, string> = {
  free: 'Free',
  basic: 'Basic',
  premium: 'Premium',
};

export default function SubscriptionPage() {
  const { subscription, isLoading, isError } = useSubscription();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleManageSubscription = async () => {
    setError(null);
    setIsRedirecting(true);

    try {
      await redirectToPortal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ポータルの表示に失敗しました');
      setIsRedirecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-lg py-12">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            読み込み中...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container max-w-lg py-12">
        <Alert variant="destructive">
          <AlertDescription>サブスクリプション情報の取得に失敗しました。</AlertDescription>
        </Alert>
      </div>
    );
  }

  const plan = subscription?.plan || 'free';
  const status = subscription?.status || 'free';
  const currentPeriodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd)
    : null;
  const cancelAtPeriodEnd = subscription?.cancelAtPeriodEnd;

  return (
    <div className="container max-w-lg py-12">
      <h1 className="text-3xl font-bold mb-8">サブスクリプション</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            現在のプラン
          </CardTitle>
          <CardDescription>{PLAN_NAMES[plan]} プラン</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'active' && currentPeriodEnd && (
            <div className="text-sm">
              <p className="text-muted-foreground">
                {cancelAtPeriodEnd ? (
                  <>キャンセル予定: {currentPeriodEnd.toLocaleDateString('ja-JP')} に終了</>
                ) : (
                  <>次回更新日: {currentPeriodEnd.toLocaleDateString('ja-JP')}</>
                )}
              </p>
            </div>
          )}

          {status === 'past_due' && (
            <Alert variant="destructive">
              <AlertDescription>
                お支払いに問題があります。決済情報をご確認ください。
              </AlertDescription>
            </Alert>
          )}

          {plan !== 'free' && (
            <Button onClick={handleManageSubscription} disabled={isRedirecting} className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              {isRedirecting ? '読み込み中...' : '支払い情報を管理'}
            </Button>
          )}

          {plan === 'free' && (
            <Button asChild className="w-full">
              <Link href="/pricing">プランをアップグレード</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          <Link href="/pricing" className="underline hover:text-foreground">
            料金プランを見る
          </Link>
        </p>
      </div>
    </div>
  );
}
