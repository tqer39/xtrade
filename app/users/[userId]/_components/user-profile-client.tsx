'use client';

import { ChevronRight, Clock, ImageIcon, RefreshCw, Search, Twitter, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { LoginButton } from '@/components/auth/login-button';
import { type ReviewItem, ReviewList } from '@/components/reviews';
import { TrustBadge } from '@/components/trust';
import { TrustRadarChart } from '@/components/trust/trust-radar-chart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ViewToggle } from '@/components/view-toggle';
import { useViewPreference } from '@/hooks/use-view-preference';
import { useSession } from '@/lib/auth-client';
import type { Card as CardType } from '@/modules/cards/types';
import type { TrustGrade } from '@/modules/trust';
import type { TrustScoreBreakdown } from '@/modules/trust/types';

interface UserTrustData {
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
  updatedAt: string | null;
  scoreHistory?: Array<{
    date: string;
    score: number;
  }>;
}

interface Props {
  userId: string;
}

function ScoreBar({
  label,
  icon,
  score,
  maxScore,
  color,
}: {
  label: string;
  icon: React.ReactNode;
  score: number;
  maxScore: number;
  color: string;
}) {
  const percentage = (score / maxScore) * 100;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        <span className="font-medium">
          {score}/{maxScore}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// スコア履歴グラフコンポーネント
function ScoreHistoryChart({ history }: { history: Array<{ date: string; score: number }> }) {
  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        履歴データがありません
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={history} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          tickCount={3}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value: number) => [`${value}点`, 'スコア']}
          labelFormatter={(label) => {
            const date = new Date(label);
            return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
          }}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function UserProfileClient({ userId }: Props) {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();
  const [userData, setUserData] = useState<UserTrustData | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [listings, setListings] = useState<CardType[]>([]);
  const [filteredListings, setFilteredListings] = useState<CardType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { viewMode, setViewMode, isHydrated } = useViewPreference();

  useEffect(() => {
    async function fetchData() {
      if (!session?.user) return;

      setIsLoading(true);
      setError(null);

      try {
        // 並列でデータを取得
        const [trustRes, reviewsRes, cardsRes] = await Promise.all([
          fetch(`/api/users/${userId}/trust`),
          fetch(`/api/users/${userId}/reviews`),
          fetch(`/api/users/${userId}/cards`),
        ]);

        if (!trustRes.ok) {
          if (trustRes.status === 404) {
            setError('ユーザーが見つかりません');
          } else {
            throw new Error('データの取得に失敗しました');
          }
          return;
        }
        const trustData = await trustRes.json();

        // モックの履歴データを追加（本番では API から取得）
        const mockHistory = generateMockHistory(trustData.trustScore ?? 50);
        setUserData({ ...trustData, scoreHistory: mockHistory });

        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviews(reviewsData.reviews ?? []);
        }

        if (cardsRes.ok) {
          const cardsData = await cardsRes.json();
          setListings(cardsData.cards ?? []);
          setFilteredListings(cardsData.cards ?? []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [userId, session?.user]);

  // 検索フィルター
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredListings(listings);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredListings(
        listings.filter(
          (card) =>
            card.name.toLowerCase().includes(query) || card.category?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, listings]);

  if (isSessionPending) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Skeleton className="h-32 w-full mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            ユーザープロフィールを表示するにはログインが必要です
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
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading || !userData) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Skeleton className="h-32 w-full mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const isOwnProfile = session.user.id === userId;

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

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      {/* ヘッダー */}
      <div className="mb-6">
        <Link href="/" className="text-xl font-bold hover:opacity-80 transition-opacity">
          xtrade
        </Link>
      </div>

      {/* ユーザーヘッダー */}
      <div className="flex items-center gap-4 mb-8">
        {userData.user.image ? (
          // DiceBear などの SVG URL は unoptimized で表示
          <img
            src={userData.user.image}
            alt={userData.user.name ?? ''}
            className="w-20 h-20 rounded-full object-cover"
          />
        ) : (
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">
              {userData.user.name ?? '名前未設定'}
              {isOwnProfile && <span className="ml-2 text-sm text-muted-foreground">(自分)</span>}
            </h1>
            <TrustBadge
              grade={userData.trustGrade}
              size="default"
              showScore
              score={userData.trustScore}
            />
          </div>
          {userData.user.twitterUsername && (
            <a
              href={`https://x.com/${userData.user.twitterUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              @{userData.user.twitterUsername}
            </a>
          )}
          {/* 信頼性詳細ページへのリンク */}
          <Link
            href={`/users/${userId}/trust`}
            className="flex items-center gap-1 text-sm text-primary hover:underline mt-1"
          >
            スコア詳細を見る
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 信頼性スコア詳細（レーダーチャート + スコアバー） */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">スコア分布</CardTitle>
          </CardHeader>
          <CardContent>
            <TrustRadarChart breakdown={breakdownForChart} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">スコア内訳</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ScoreBar
              label="Twitter"
              icon={<Twitter className="h-3.5 w-3.5 text-sky-500" />}
              score={userData.newBreakdown.twitter.score}
              maxScore={40}
              color="bg-sky-500"
            />
            <ScoreBar
              label="取引実績"
              icon={<RefreshCw className="h-3.5 w-3.5 text-emerald-500" />}
              score={userData.newBreakdown.totalTrade.score}
              maxScore={40}
              color="bg-emerald-500"
            />
            <ScoreBar
              label="直近取引"
              icon={<Clock className="h-3.5 w-3.5 text-amber-500" />}
              score={userData.newBreakdown.recentTrade.score}
              maxScore={20}
              color="bg-amber-500"
            />
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">総合</span>
                <span className="text-xl font-bold">{userData.trustScore ?? 0} 点</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* スコア履歴グラフ */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">スコア推移</CardTitle>
        </CardHeader>
        <CardContent>
          <ScoreHistoryChart history={userData.scoreHistory ?? []} />
        </CardContent>
      </Card>

      <Tabs defaultValue="listings">
        <TabsList className="mb-4">
          <TabsTrigger value="listings">出品中 ({listings.length})</TabsTrigger>
          <TabsTrigger value="reviews">レビュー ({userData.stats.reviewCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="listings">
          {listings.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-muted-foreground text-center">出品中のアイテムはありません</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* 検索・フィルター・ビュー切替 */}
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="アイテムを検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {isHydrated && <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />}
              </div>

              {filteredListings.length === 0 ? (
                <Card>
                  <CardContent className="py-8">
                    <p className="text-muted-foreground text-center">
                      「{searchQuery}」に一致するアイテムがありません
                    </p>
                  </CardContent>
                </Card>
              ) : !isHydrated || viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filteredListings.map((card) => (
                    <Card key={card.id} className="overflow-hidden">
                      <div className="aspect-[3/4] bg-muted">
                        {card.imageUrl ? (
                          <img
                            src={card.imageUrl}
                            alt={card.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-2">
                        <p className="text-sm font-medium truncate">{card.name}</p>
                        {card.category && (
                          <p className="text-xs text-muted-foreground truncate">{card.category}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredListings.map((card) => (
                    <Card key={card.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-muted">
                            {card.imageUrl ? (
                              <img
                                src={card.imageUrl}
                                alt={card.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{card.name}</p>
                            {card.category && (
                              <p className="text-sm text-muted-foreground truncate">
                                {card.category}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* 全体検索への誘導 */}
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(
                      `/cards/search?creator=${userId}&creatorName=${encodeURIComponent(userData.user.name ?? '')}`
                    )
                  }
                >
                  <Search className="h-4 w-4 mr-2" />
                  このユーザーのアイテムを検索
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="reviews">
          <ReviewList
            reviews={reviews}
            currentUserId={session.user.id}
            emptyMessage="まだレビューがありません"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// モックの履歴データを生成（本番では API から取得）
function generateMockHistory(currentScore: number): Array<{ date: string; score: number }> {
  const history: Array<{ date: string; score: number }> = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i * 7);

    // スコアに若干の変動を加える
    const variation = Math.floor(Math.random() * 10) - 5;
    const score = Math.max(0, Math.min(100, currentScore + variation - (6 - i) * 2));

    history.push({
      date: date.toISOString().split('T')[0],
      score,
    });
  }

  // 最新のスコアは現在のスコアに合わせる
  if (history.length > 0) {
    history[history.length - 1].score = currentScore;
  }

  return history;
}
