'use client';

import { User } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { LoginButton } from '@/components/auth/login-button';
import { type ReviewItem, ReviewList } from '@/components/reviews';
import { TrustScoreCard } from '@/components/trust';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSession } from '@/lib/auth-client';
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
  breakdown: {
    xProfile: number;
    behavior: number;
    review: number;
  };
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
  const { data: session, isPending: isSessionPending } = useSession();
  const [userData, setUserData] = useState<UserTrustData | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!session?.user) return;

      setIsLoading(true);
      setError(null);

      try {
        // ユーザー信頼スコアを取得
        const trustRes = await fetch(`/api/users/${userId}/trust`);
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

        // レビューを取得
        const reviewsRes = await fetch(`/api/users/${userId}/reviews`);
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviews(reviewsData.reviews ?? []);
        }
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
      {/* ユーザーヘッダー */}
      <div className="flex items-center gap-4 mb-8">
        {userData.user.image ? (
          <Image
            src={userData.user.image}
            alt={userData.user.name ?? ''}
            width={80}
            height={80}
            className="w-20 h-20 rounded-full object-cover"
          />
        ) : (
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-muted-foreground" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">
            {userData.user.name ?? '名前未設定'}
            {isOwnProfile && <span className="ml-2 text-sm text-muted-foreground">(自分)</span>}
          </h1>
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
        </div>
      </div>

      <Tabs defaultValue="trust">
        <TabsList className="mb-6">
          <TabsTrigger value="trust">信頼スコア</TabsTrigger>
          <TabsTrigger value="reviews">レビュー ({userData.stats.reviewCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="trust">
          <TrustScoreCard
            trustScore={userData.trustScore}
            trustGrade={userData.trustGrade}
            breakdown={userData.breakdown}
            stats={userData.stats}
            updatedAt={userData.updatedAt}
          />
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
