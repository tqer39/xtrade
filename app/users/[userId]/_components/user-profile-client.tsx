'use client';

import { ArrowLeft, ChevronRight, ImageIcon, Search, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { LoginButton } from '@/components/auth/login-button';
import { type ReviewItem, ReviewList } from '@/components/reviews';
import { TrustBadge } from '@/components/trust';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ViewToggle } from '@/components/view-toggle';
import { useViewPreference } from '@/hooks/use-view-preference';
import { useSession } from '@/lib/auth-client';
import type { Card as CardType } from '@/modules/cards/types';
import type { TrustGrade } from '@/modules/trust';

interface UserTrustData {
  user: {
    id: string;
    name: string | null;
    twitterUsername: string | null;
    image: string | null;
  };
  trustScore: number | null;
  trustGrade: TrustGrade | null;
  stats: {
    completedTrades: number;
    successRate: number | null;
    avgRating: number | null;
    reviewCount: number;
  };
  updatedAt: string | null;
}

interface Props {
  userId: string;
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
        setUserData(trustData);

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

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      {/* ヘッダー */}
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Button>
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
                <div className="columns-2 sm:columns-3 gap-1">
                  {filteredListings.map((card) => {
                    // 説明文を80文字に制限
                    const description = card.description
                      ? card.description.length > 80
                        ? `${card.description.slice(0, 80)}...`
                        : card.description
                      : null;
                    return (
                      <div key={card.id} className="mb-1 break-inside-avoid">
                        <div className="relative overflow-hidden rounded-lg bg-muted">
                          {card.imageUrl ? (
                            <img
                              src={card.imageUrl}
                              alt={card.name}
                              className="w-full object-cover"
                            />
                          ) : (
                            <div className="aspect-[3/4] flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          {/* 画像上のオーバーレイ */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                          <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                            <p className="text-sm font-medium truncate">{card.name}</p>
                            {card.category && (
                              <p className="text-xs opacity-80 truncate">{card.category}</p>
                            )}
                            {description && (
                              <p className="text-xs opacity-70 mt-0.5 line-clamp-2">
                                {description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
