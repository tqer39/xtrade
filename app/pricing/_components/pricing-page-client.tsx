'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { redirectToCheckout, useSubscription } from '@/hooks/use-subscription';

import { PlanCard } from './plan-card';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: '基本機能を無料で利用',
    features: [
      'カード登録・管理',
      'マッチング閲覧（1日3件まで）',
      'トレード機能',
      'ベーシックサポート',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 200,
    description: 'マッチング機能を拡張',
    features: [
      'Free の全機能',
      'マッチング閲覧（1日20件まで）',
      '詳細検索フィルター',
      '優先サポート',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 400,
    description: '全機能を解放',
    features: [
      'Basic の全機能',
      'マッチング閲覧（無制限）',
      '優先表示',
      '詳細統計・分析',
      'プレミアムサポート',
    ],
    isPopular: true,
  },
] as const;

export function PricingPageClient() {
  const { subscription, isLoading: isLoadingSubscription } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPlan = async (planId: 'basic' | 'premium') => {
    setError(null);
    setLoadingPlan(planId);

    try {
      await redirectToCheckout(planId);
    } catch (err) {
      setError(err instanceof Error ? err.message : '決済の開始に失敗しました');
      setLoadingPlan(null);
    }
  };

  const currentPlan = subscription?.plan || 'free';

  return (
    <div className="container max-w-5xl py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">料金プラン</h1>
        <p className="text-muted-foreground text-lg">あなたに合ったプランをお選びください</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-8">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            name={plan.name}
            price={plan.price}
            description={plan.description}
            features={plan.features}
            isCurrentPlan={currentPlan === plan.id}
            isPopular={plan.isPopular}
            onSelect={
              plan.id !== 'free'
                ? () => handleSelectPlan(plan.id as 'basic' | 'premium')
                : undefined
            }
            isLoading={loadingPlan === plan.id}
            disabled={isLoadingSubscription || loadingPlan !== null}
          />
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground space-y-2">
        <p>有料プランは月額自動更新です。いつでもキャンセルできます。</p>
        <p>
          ご利用にあたっては
          <Link href="/terms" className="underline hover:text-foreground mx-1">
            利用規約
          </Link>
          および
          <Link href="/privacy" className="underline hover:text-foreground mx-1">
            プライバシーポリシー
          </Link>
          に同意したものとみなされます。
        </p>
        <p>
          <Link href="/legal/scta" className="underline hover:text-foreground">
            特定商取引法に基づく表記
          </Link>
        </p>
      </div>
    </div>
  );
}
