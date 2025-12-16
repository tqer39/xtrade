'use client';

import { ArrowLeft, Twitter, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

import { LoginButton } from '@/components/auth/login-button';
import { TrustBadge } from '@/components/trust/trust-badge';
import { TrustHistoryChart } from '@/components/trust/trust-history-chart';
import { TrustRadarChart } from '@/components/trust/trust-radar-chart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/lib/auth-client';
import type { TrustGrade } from '@/modules/trust';
import type { TrustScoreBreakdown, TrustScoreHistoryEntry } from '@/modules/trust/types';

interface UserTrustDetailData {
  user: {
    id: string;
    name: string | null;
    twitterUsername: string | null;
    image: string | null;
  };
  trustScore: number | null;
  trustGrade: TrustGrade | null;
  newBreakdown: {
    twitter: { score: number; maxScore: number };
    totalTrade: { score: number; maxScore: number };
    recentTrade: { score: number; maxScore: number };
  };
  stats: {
    completedTrades: number;
    successRate: number | null;
    avgRating: number | null;
    reviewCount: number;
  };
  history: TrustScoreHistoryEntry[];
  updatedAt: string | null;
}

interface Props {
  params: Promise<{ userId: string }>;
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
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {score}/{maxScore} 点
        </span>
      </div>
      <div className="h-3 w-full rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function TrustDetailPage({ params }: Props) {
  const { userId } = use(params);
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();
  const [userData, setUserData] = useState<UserTrustDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!session?.user) return;

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/users/${userId}/trust`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('ユーザーが見つかりません');
          } else {
            throw new Error('データの取得に失敗しました');
          }
          return;
        }
        const data = await res.json();
        setUserData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [userId, session?.user]);

  if (isSessionPending) {
    return (
      <div className="container mx-auto px-4 py-4">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-24 w-full mb-6" />
        <Skeleton className="h-80 w-full mb-6" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            信頼性スコアの詳細を表示するにはログインが必要です
          </p>
          <LoginButton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link href={`/users/${userId}`}>
            <Button variant="outline">プロフィールに戻る</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading || !userData) {
    return (
      <div className="container mx-auto px-4 py-4">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-24 w-full mb-6" />
        <Skeleton className="h-80 w-full mb-6" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  // レーダーチャート用のデータ変換
  const breakdownForChart: TrustScoreBreakdown = {
    total: userData.trustScore ?? 0,
    grade: (userData.trustGrade ?? 'E') as TrustScoreBreakdown['grade'],
    twitter: {
      score: userData.newBreakdown.twitter.score,
      accountAgeDays: 0,
      followerCount: 0,
      postFrequency: 0,
      hasVerifiedBadge: false,
    },
    totalTrade: {
      score: userData.newBreakdown.totalTrade.score,
      completionRate: 0,
      totalCount: userData.stats.completedTrades,
      troubleRate: 0,
      averageRating: userData.stats.avgRating ?? 0,
    },
    recentTrade: {
      score: userData.newBreakdown.recentTrade.score,
      completionRate: 0,
      averageRating: 0,
      troubleRate: 0,
    },
  };

  const formattedDate = userData.updatedAt
    ? new Date(userData.updatedAt).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="container mx-auto px-4 py-4">
      {/* ヘッダー */}
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold hover:opacity-80 transition-opacity">
          xtrade
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Button>
      </div>

      <h1 className="text-2xl font-bold mb-6">信頼性スコア詳細</h1>

      {/* ユーザー情報 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Link href={`/users/${userId}`} className="flex-shrink-0">
              {userData.user.image ? (
                <img
                  src={userData.user.image}
                  alt={userData.user.name ?? ''}
                  className="w-16 h-16 rounded-full object-cover hover:opacity-80 transition-opacity cursor-pointer"
                />
              ) : (
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center hover:bg-muted/80 transition-colors cursor-pointer">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <Link href={`/users/${userId}`} className="hover:underline">
                  <h2 className="text-xl font-bold">{userData.user.name ?? '名前未設定'}</h2>
                </Link>
                <TrustBadge
                  grade={userData.trustGrade}
                  size="lg"
                  showScore
                  score={userData.trustScore}
                />
              </div>
              {userData.user.twitterUsername && (
                <a
                  href={`https://x.com/${userData.user.twitterUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-1"
                >
                  <Twitter className="w-4 h-4" />@{userData.user.twitterUsername}{' '}
                  のプロフィールを見る
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3軸スコア詳細 */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* レーダーチャート */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">スコア分布</CardTitle>
            <CardDescription>3軸評価のバランスを可視化</CardDescription>
          </CardHeader>
          <CardContent>
            <TrustRadarChart breakdown={breakdownForChart} />
          </CardContent>
        </Card>

        {/* スコア内訳 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">スコア内訳</CardTitle>
            <CardDescription>各評価項目の詳細</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScoreBar
              label="Twitter アカウント"
              score={userData.newBreakdown.twitter.score}
              maxScore={40}
              color="bg-sky-500"
            />
            <ScoreBar
              label="トータル取引"
              score={userData.newBreakdown.totalTrade.score}
              maxScore={40}
              color="bg-emerald-500"
            />
            <ScoreBar
              label="直近取引"
              score={userData.newBreakdown.recentTrade.score}
              maxScore={20}
              color="bg-amber-500"
            />
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">総合スコア</span>
                <span className="text-2xl font-bold">{userData.trustScore ?? 0} 点</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 取引統計 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">取引統計</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-3xl font-bold">{userData.stats.completedTrades}</div>
              <div className="text-sm text-muted-foreground">完了取引</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-3xl font-bold">
                {userData.stats.successRate != null ? `${userData.stats.successRate}%` : '-'}
              </div>
              <div className="text-sm text-muted-foreground">成功率</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-3xl font-bold">
                {userData.stats.avgRating != null ? userData.stats.avgRating.toFixed(1) : '-'}
              </div>
              <div className="text-sm text-muted-foreground">平均評価</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-3xl font-bold">{userData.stats.reviewCount}</div>
              <div className="text-sm text-muted-foreground">レビュー数</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* スコア履歴グラフ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">スコア推移</CardTitle>
          <CardDescription>信頼性スコアの変動履歴</CardDescription>
        </CardHeader>
        <CardContent>
          <TrustHistoryChart history={userData.history} />
        </CardContent>
      </Card>

      {/* 最終更新日時 */}
      {formattedDate && (
        <p className="text-sm text-muted-foreground text-center mt-6">最終更新: {formattedDate}</p>
      )}
    </div>
  );
}
