'use client';

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit2,
  Gift,
  Heart,
  ImageIcon,
  Loader2,
  Plus,
  Search,
  Star,
  Twitter,
  User,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { LoginButton } from '@/components/auth/login-button';
import { Footer, Header } from '@/components/layout';
import { type ReviewItem, ReviewList } from '@/components/reviews';
import { TrustBadge } from '@/components/trust';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CategoryAutocomplete } from '@/components/ui/category-autocomplete';
import { ImageUpload } from '@/components/ui/image-upload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ViewToggle } from '@/components/view-toggle';
import { useItemSearch } from '@/hooks/use-item-search';
import { useMyCategories } from '@/hooks/use-my-categories';
import { useMyItems } from '@/hooks/use-my-items';
import { useViewPreference } from '@/hooks/use-view-preference';
import { useSession } from '@/lib/auth-client';
import type { Card as CardType } from '@/modules/cards/types';
import type { UserTradeListItem } from '@/modules/trades';
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

interface WantCard {
  id: string;
  card: {
    id: string;
    name: string;
    category: string | null;
    description: string | null;
    imageUrl: string | null;
  };
}

interface FavoriteUser {
  id: string;
  favoriteUser: {
    id: string;
    name: string | null;
    twitterUsername: string | null;
    image: string | null;
    trustScore: number | null;
    trustGrade: TrustGrade | null;
  };
}

export function UserProfileClient({ userId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending: isSessionPending } = useSession();
  const [userData, setUserData] = useState<UserTrustData | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [listings, setListings] = useState<CardType[]>([]);
  const [filteredListings, setFilteredListings] = useState<CardType[]>([]);
  const [wantCards, setWantCards] = useState<WantCard[]>([]);
  const [favoriteUsers, setFavoriteUsers] = useState<FavoriteUser[]>([]);
  const [activeTrades, setActiveTrades] = useState<UserTradeListItem[]>([]);
  const [completedTrades, setCompletedTrades] = useState<UserTradeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [wantSearchQuery, setWantSearchQuery] = useState('');
  const [filteredWantCards, setFilteredWantCards] = useState<WantCard[]>([]);

  // ページネーション
  const ITEMS_PER_PAGE = 12;
  const initialListingsPage = parseInt(searchParams.get('lp') ?? '1', 10);
  const initialWantPage = parseInt(searchParams.get('wp') ?? '1', 10);
  const [listingsPage, setListingsPage] = useState(initialListingsPage);
  const [wantCardsPage, setWantCardsPage] = useState(initialWantPage);
  const [wantText, setWantText] = useState<string>('');
  const [isEditingWantText, setIsEditingWantText] = useState(false);
  const [isSavingWantText, setIsSavingWantText] = useState(false);
  const { viewMode, setViewMode, isHydrated } = useViewPreference();
  const wantTextRef = useRef<HTMLTextAreaElement>(null);

  // 出品登録用
  const { createCard } = useItemSearch();

  // インライン出品登録フォーム
  const [showListingForm, setShowListingForm] = useState(false);
  const [newListingName, setNewListingName] = useState('');
  const [newListingCategory, setNewListingCategory] = useState('');
  const [newListingDescription, setNewListingDescription] = useState('');
  const [newListingImageUrl, setNewListingImageUrl] = useState<string | undefined>();
  const [isAddingListing, setIsAddingListing] = useState(false);
  const [addListingError, setAddListingError] = useState<string | null>(null);
  const { categories: myCategories } = useMyCategories();
  const { wantCards: myWantCards, addWantCard, removeWantCard } = useMyItems();

  // カードが自分の欲しいものリストにあるか確認
  const isInMyWantList = useCallback(
    (cardId: string) => myWantCards.some((w) => w.card?.id === cardId || w.cardId === cardId),
    [myWantCards]
  );

  // 欲しいものリストへの追加/削除をトグル
  const handleToggleWant = async (cardId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (isInMyWantList(cardId)) {
        await removeWantCard(cardId);
      } else {
        await addWantCard(cardId);
      }
    } catch (err) {
      console.error('Failed to toggle want card:', err);
    }
  };

  // URLクエリパラメータからタブを取得（デフォルトは'listings'）
  const activeTab = searchParams.get('tab') || 'listings';

  // タブ変更時にURLを更新
  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', value);
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // ページネーション計算
  const listingsTotalPages = Math.ceil(filteredListings.length / ITEMS_PER_PAGE);
  const wantCardsTotalPages = Math.ceil(filteredWantCards.length / ITEMS_PER_PAGE);

  const paginatedListings = filteredListings.slice(
    (listingsPage - 1) * ITEMS_PER_PAGE,
    listingsPage * ITEMS_PER_PAGE
  );
  const paginatedWantCards = filteredWantCards.slice(
    (wantCardsPage - 1) * ITEMS_PER_PAGE,
    wantCardsPage * ITEMS_PER_PAGE
  );

  // 出品中ページ変更
  const handleListingsPageChange = useCallback(
    (newPage: number) => {
      setListingsPage(newPage);
      const params = new URLSearchParams(searchParams.toString());
      if (newPage === 1) {
        params.delete('lp');
      } else {
        params.set('lp', newPage.toString());
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // 欲しいものページ変更
  const handleWantCardsPageChange = useCallback(
    (newPage: number) => {
      setWantCardsPage(newPage);
      const params = new URLSearchParams(searchParams.toString());
      if (newPage === 1) {
        params.delete('wp');
      } else {
        params.set('wp', newPage.toString());
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // テキストエリアの高さを内容に応じて自動調整（最大50行分 = 約750px）
  const adjustTextareaHeight = useCallback(() => {
    const textarea = wantTextRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = 750; // 約50行分
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  // 編集モードに入った時に高さを調整
  useEffect(() => {
    if (isEditingWantText) {
      // 次のフレームで高さを調整（DOMの更新後）
      requestAnimationFrame(adjustTextareaHeight);
    }
  }, [isEditingWantText, adjustTextareaHeight]);

  useEffect(() => {
    async function fetchData() {
      if (!session?.user) return;

      setIsLoading(true);
      setError(null);

      try {
        // 並列でデータを取得
        const [
          trustRes,
          reviewsRes,
          cardsRes,
          wantCardsRes,
          activeTradesRes,
          completedTradesRes,
          userRes,
        ] = await Promise.all([
          fetch(`/api/users/${userId}/trust`),
          fetch(`/api/users/${userId}/reviews`),
          fetch(`/api/users/${userId}/cards`),
          fetch(`/api/users/${userId}/want-cards`),
          fetch(`/api/users/${userId}/trades?status=active`),
          fetch(`/api/users/${userId}/trades?status=completed`),
          fetch(`/api/users/${userId}`),
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

        if (wantCardsRes.ok) {
          const wantCardsData = await wantCardsRes.json();
          setWantCards(wantCardsData.wantCards ?? []);
        }

        if (activeTradesRes.ok) {
          const activeTradesData = await activeTradesRes.json();
          setActiveTrades(activeTradesData.trades ?? []);
        }

        if (completedTradesRes.ok) {
          const completedTradesData = await completedTradesRes.json();
          setCompletedTrades(completedTradesData.trades ?? []);
        }

        if (userRes.ok) {
          const userData = await userRes.json();
          setWantText(userData.user?.wantText ?? '');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [userId, session?.user]);

  // お気に入りユーザーの取得（自分のプロフィールのみ）
  useEffect(() => {
    async function fetchFavoriteUsers() {
      if (!session?.user || session.user.id !== userId) return;

      try {
        const res = await fetch('/api/me/favorites/users');
        if (res.ok) {
          const data = await res.json();
          setFavoriteUsers(data.favoriteUsers ?? []);
        }
      } catch (err) {
        console.error('お気に入りユーザーの取得に失敗:', err);
      }
    }

    fetchFavoriteUsers();
  }, [userId, session?.user]);

  // お気に入りユーザーの削除
  const handleRemoveFavoriteUser = async (favoriteUserId: string) => {
    try {
      const res = await fetch(`/api/me/favorites/users?userId=${favoriteUserId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setFavoriteUsers((prev) => prev.filter((f) => f.favoriteUser.id !== favoriteUserId));
      }
    } catch (err) {
      console.error('お気に入りユーザーの削除に失敗:', err);
    }
  };

  // 検索フィルター（出品中）
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
    setListingsPage(1); // 検索時はページをリセット
  }, [searchQuery, listings]);

  // 検索フィルター（欲しいもの）
  useEffect(() => {
    if (!wantSearchQuery.trim()) {
      setFilteredWantCards(wantCards);
    } else {
      const query = wantSearchQuery.toLowerCase();
      setFilteredWantCards(
        wantCards.filter(
          (wc) =>
            wc.card.name.toLowerCase().includes(query) ||
            wc.card.category?.toLowerCase().includes(query)
        )
      );
    }
    setWantCardsPage(1); // 検索時はページをリセット
  }, [wantSearchQuery, wantCards]);

  // wantText保存
  const handleSaveWantText = async () => {
    setIsSavingWantText(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wantText }),
      });
      if (!res.ok) {
        throw new Error('保存に失敗しました');
      }
      setIsEditingWantText(false);
    } catch {
      // エラー時は何もしない（UIにはエラーを表示しない）
    } finally {
      setIsSavingWantText(false);
    }
  };

  // 出品登録ハンドラー
  const handleCreateAndAddListing = async () => {
    if (!newListingName.trim()) {
      setAddListingError('名前は必須です');
      return;
    }

    setIsAddingListing(true);
    setAddListingError(null);
    try {
      const card = await createCard({
        name: newListingName.trim(),
        category: newListingCategory.trim() || undefined,
        description: newListingDescription.trim() || undefined,
        imageUrl: newListingImageUrl,
      });

      // カードを出品リストに追加
      const res = await fetch('/api/me/cards/have', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '出品の追加に失敗しました');
      }

      // 成功したら listings を更新
      const cardsRes = await fetch(`/api/users/${userId}/cards`);
      if (cardsRes.ok) {
        const cardsData = await cardsRes.json();
        setListings(cardsData.cards ?? []);
        setFilteredListings(cardsData.cards ?? []);
      }

      // フォームをリセット
      setShowListingForm(false);
      setNewListingName('');
      setNewListingCategory('');
      setNewListingDescription('');
      setNewListingImageUrl(undefined);
    } catch (err) {
      setAddListingError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsAddingListing(false);
    }
  };

  // 出品フォームをキャンセル
  const handleCancelListingForm = () => {
    setShowListingForm(false);
    setNewListingName('');
    setNewListingCategory('');
    setNewListingDescription('');
    setNewListingImageUrl(undefined);
    setAddListingError(null);
  };

  if (isSessionPending) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-32 w-full mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="container mx-auto px-4 py-4 flex-1">
          {/* ヘッダー */}
          <Header showBackButton />
          {/* コンテンツ */}
          <div className="text-center py-12">
            <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              ユーザープロフィールを表示するにはログインが必要です
            </p>
            <LoginButton />
            <div className="mt-4">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                トップページへ戻る
              </Link>
            </div>
          </div>
        </div>
        <Footer showAd={false} />
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
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-32 w-full mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const isOwnProfile = session.user.id === userId;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* ヘッダー */}
      <Header showBackButton />

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
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Twitter className="w-4 h-4" />@{userData.user.twitterUsername} のプロフィールを見る
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

      {/* 欲しいもの（wantText）- 編集可能 */}
      <div className="mb-6 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-1">
          <Gift className="h-4 w-4" />
          <span className="font-medium">欲しいもの</span>
        </div>
        {isEditingWantText ? (
          <div className="space-y-2">
            <Textarea
              ref={wantTextRef}
              value={wantText}
              onChange={(e) => {
                setWantText(e.target.value);
                adjustTextareaHeight();
              }}
              onFocus={adjustTextareaHeight}
              placeholder="欲しいものを記入..."
              className="min-h-[60px] max-h-[750px] overflow-y-auto resize-none"
              maxLength={300}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{wantText.length}/300</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditingWantText(false)}>
                  キャンセル
                </Button>
                <Button size="sm" onClick={handleSaveWantText} disabled={isSavingWantText}>
                  {isSavingWantText ? '保存中...' : '保存'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="group relative">
            {wantText ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{wantText}</p>
            ) : isOwnProfile ? (
              <p className="text-sm text-muted-foreground italic">欲しいものを追加...</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">登録なし</p>
            )}
            {isOwnProfile && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setIsEditingWantText(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="listings">出品中 ({listings.length})</TabsTrigger>
          <TabsTrigger value="wantCards">欲しいもの ({wantCards.length})</TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger value="draftTrades">
              下書き ({activeTrades.filter((t) => t.status === 'draft').length})
            </TabsTrigger>
          )}
          {isOwnProfile && (
            <TabsTrigger value="activeTrades">
              トレード中 ({activeTrades.filter((t) => t.status !== 'draft').length})
            </TabsTrigger>
          )}
          {isOwnProfile && (
            <TabsTrigger value="completedTrades">成約済 ({completedTrades.length})</TabsTrigger>
          )}
          {isOwnProfile && (
            <TabsTrigger value="reviews">レビュー ({userData.stats.reviewCount})</TabsTrigger>
          )}
          {isOwnProfile && (
            <TabsTrigger value="favoriteUsers">お気に入り ({favoriteUsers.length})</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="listings">
          {/* 出品するボタン（自分のプロフィールのみ） */}
          {isOwnProfile && (
            <div className="mb-4">
              {!showListingForm ? (
                <Button className="w-full sm:w-auto" onClick={() => setShowListingForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  出品する
                </Button>
              ) : (
                <div className="space-y-3 rounded-lg border p-4">
                  <h4 className="font-medium">新しいアイテムを登録</h4>
                  {addListingError && <p className="text-sm text-destructive">{addListingError}</p>}
                  <div className="space-y-2">
                    <Label htmlFor="new-listing-name">アイテム名 *</Label>
                    <Input
                      id="new-listing-name"
                      value={newListingName}
                      onChange={(e) => setNewListingName(e.target.value)}
                      placeholder="アイテム名を入力"
                      disabled={isAddingListing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-listing-category">カテゴリ (任意)</Label>
                    <CategoryAutocomplete
                      value={newListingCategory}
                      onChange={setNewListingCategory}
                      suggestions={myCategories}
                      placeholder="例: ポケカ、遊戯王、アイドルグッズ"
                      disabled={isAddingListing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-listing-description">説明 (任意)</Label>
                    <Input
                      id="new-listing-description"
                      value={newListingDescription}
                      onChange={(e) => setNewListingDescription(e.target.value)}
                      placeholder="アイテムの説明を入力"
                      disabled={isAddingListing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>画像 (任意)</Label>
                    <ImageUpload
                      value={newListingImageUrl}
                      onChange={setNewListingImageUrl}
                      disabled={isAddingListing}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleCancelListingForm}
                      disabled={isAddingListing}
                    >
                      キャンセル
                    </Button>
                    <Button onClick={handleCreateAndAddListing} disabled={isAddingListing}>
                      {isAddingListing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      登録して追加
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
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
                <div className="columns-1 sm:columns-2 md:columns-3 gap-0.5">
                  {paginatedListings.map((card) => {
                    // 説明文を80文字に制限
                    const description = card.description
                      ? card.description.length > 80
                        ? `${card.description.slice(0, 80)}...`
                        : card.description
                      : null;
                    return (
                      <Link
                        key={card.id}
                        href={`/items/${card.id}`}
                        className="mb-0.5 break-inside-avoid block"
                      >
                        <div className="relative overflow-hidden rounded-lg bg-muted cursor-pointer hover:opacity-90 transition-opacity">
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
                          {/* 他ユーザーの出品に欲しいものボタンを表示 */}
                          {!isOwnProfile && (
                            <button
                              type="button"
                              onClick={(e) => handleToggleWant(card.id, e)}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
                              aria-label={
                                isInMyWantList(card.id) ? '欲しいものから削除' : '欲しいものに追加'
                              }
                            >
                              <Heart
                                className={`h-4 w-4 ${
                                  isInMyWantList(card.id)
                                    ? 'text-red-500 fill-red-500'
                                    : 'text-white'
                                }`}
                              />
                            </button>
                          )}
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
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-1">
                  {paginatedListings.map((card) => (
                    <Link key={card.id} href={`/items/${card.id}`} className="block">
                      <Card className="cursor-pointer transition-colors hover:bg-accent rounded-none border-x-0 first:border-t-0">
                        <CardContent className="p-2">
                          <div className="flex items-start gap-2">
                            <div className="h-12 w-12 flex-shrink-0 overflow-hidden bg-muted">
                              {card.imageUrl ? (
                                <img
                                  src={card.imageUrl}
                                  alt={card.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{card.name}</p>
                              {card.category && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {card.category}
                                </p>
                              )}
                              {card.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {card.description}
                                </p>
                              )}
                            </div>
                            {/* 他ユーザーの出品に欲しいものボタンを表示 */}
                            {!isOwnProfile && (
                              <button
                                type="button"
                                onClick={(e) => handleToggleWant(card.id, e)}
                                className="flex-shrink-0 p-1.5 rounded-full hover:bg-muted transition-colors"
                                aria-label={
                                  isInMyWantList(card.id)
                                    ? '欲しいものから削除'
                                    : '欲しいものに追加'
                                }
                              >
                                <Heart
                                  className={`h-4 w-4 ${
                                    isInMyWantList(card.id)
                                      ? 'text-red-500 fill-red-500'
                                      : 'text-muted-foreground'
                                  }`}
                                />
                              </button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}

              {/* ページネーション */}
              {listingsTotalPages > 1 && (
                <div className="flex items-center justify-center gap-1 mt-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleListingsPageChange(1)}
                    disabled={listingsPage <= 1}
                    className="h-8 w-8"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleListingsPageChange(listingsPage - 1)}
                    disabled={listingsPage <= 1}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: listingsTotalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p >= Math.max(1, listingsPage - 2) &&
                        p <= Math.min(listingsTotalPages, listingsPage + 2)
                    )
                    .map((p) => (
                      <Button
                        key={p}
                        variant={p === listingsPage ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => handleListingsPageChange(p)}
                        className="h-8 w-8"
                      >
                        {p}
                      </Button>
                    ))}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleListingsPageChange(listingsPage + 1)}
                    disabled={listingsPage >= listingsTotalPages}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleListingsPageChange(listingsTotalPages)}
                    disabled={listingsPage >= listingsTotalPages}
                    className="h-8 w-8"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="wantCards">
          {/* 欲しいもの追加（自分のプロフィールのみ） */}
          {isOwnProfile && (
            <div className="mb-4">
              <Link href="/">
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  トップページで検索して追加
                </Button>
              </Link>
            </div>
          )}
          {wantCards.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-muted-foreground text-center">欲しいアイテムはありません</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* 検索・ビュー切替 */}
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="アイテムを検索..."
                    value={wantSearchQuery}
                    onChange={(e) => setWantSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {isHydrated && <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />}
              </div>

              {filteredWantCards.length === 0 ? (
                <Card>
                  <CardContent className="py-8">
                    <p className="text-muted-foreground text-center">
                      「{wantSearchQuery}」に一致するアイテムがありません
                    </p>
                  </CardContent>
                </Card>
              ) : !isHydrated || viewMode === 'grid' ? (
                <div className="columns-1 sm:columns-2 md:columns-3 gap-0.5">
                  {paginatedWantCards.map((wantCard) => (
                    <Link
                      key={wantCard.id}
                      href={`/items/${wantCard.card.id}`}
                      className="mb-0.5 break-inside-avoid block"
                    >
                      <div className="relative overflow-hidden rounded-lg bg-muted cursor-pointer hover:opacity-90 transition-opacity">
                        {wantCard.card.imageUrl ? (
                          <img
                            src={wantCard.card.imageUrl}
                            alt={wantCard.card.name}
                            className="w-full object-cover"
                          />
                        ) : (
                          <div className="aspect-[3/4] flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                          <p className="text-sm font-medium truncate">{wantCard.card.name}</p>
                          {wantCard.card.category && (
                            <p className="text-xs opacity-80 truncate">{wantCard.card.category}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {paginatedWantCards.map((wantCard) => (
                    <Link key={wantCard.id} href={`/items/${wantCard.card.id}`} className="block">
                      <Card className="cursor-pointer transition-colors hover:bg-accent rounded-none border-x-0 first:border-t-0">
                        <CardContent className="p-2">
                          <div className="flex items-start gap-2">
                            <div className="h-12 w-12 shrink-0 overflow-hidden bg-muted">
                              {wantCard.card.imageUrl ? (
                                <img
                                  src={wantCard.card.imageUrl}
                                  alt={wantCard.card.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{wantCard.card.name}</p>
                              {wantCard.card.category && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {wantCard.card.category}
                                </p>
                              )}
                              {wantCard.card.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {wantCard.card.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}

              {/* ページネーション */}
              {wantCardsTotalPages > 1 && (
                <div className="flex items-center justify-center gap-1 mt-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleWantCardsPageChange(1)}
                    disabled={wantCardsPage <= 1}
                    className="h-8 w-8"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleWantCardsPageChange(wantCardsPage - 1)}
                    disabled={wantCardsPage <= 1}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: wantCardsTotalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p >= Math.max(1, wantCardsPage - 2) &&
                        p <= Math.min(wantCardsTotalPages, wantCardsPage + 2)
                    )
                    .map((p) => (
                      <Button
                        key={p}
                        variant={p === wantCardsPage ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => handleWantCardsPageChange(p)}
                        className="h-8 w-8"
                      >
                        {p}
                      </Button>
                    ))}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleWantCardsPageChange(wantCardsPage + 1)}
                    disabled={wantCardsPage >= wantCardsTotalPages}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleWantCardsPageChange(wantCardsTotalPages)}
                    disabled={wantCardsPage >= wantCardsTotalPages}
                    className="h-8 w-8"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* 下書きタブ（自分のプロフィールのみ） */}
        {isOwnProfile && (
          <TabsContent value="draftTrades">
            {activeTrades.filter((t) => t.status === 'draft').length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-muted-foreground text-center">下書きのトレードはありません</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {activeTrades
                  .filter((t) => t.status === 'draft')
                  .map((trade) => {
                    const myItems = trade.items?.filter((i) => i.offeredByUserId === userId) ?? [];
                    const partnerItems =
                      trade.items?.filter((i) => i.offeredByUserId !== userId) ?? [];
                    return (
                      <Link key={trade.id} href={`/trades/${trade.roomSlug}`} className="block">
                        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-muted flex items-center justify-center">
                                {trade.partner?.image ? (
                                  <img
                                    src={trade.partner.image}
                                    alt={trade.partner.name ?? ''}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <User className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">
                                  {trade.partner?.twitterUsername
                                    ? `@${trade.partner.twitterUsername}`
                                    : (trade.partner?.name ?? '相手未確定')}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(trade.updatedAt).toLocaleDateString('ja-JP')}
                                </p>
                              </div>
                              <Badge variant="outline" className="shrink-0">
                                下書き
                              </Badge>
                            </div>
                            {/* アイテム情報 */}
                            {(myItems.length > 0 || partnerItems.length > 0) && (
                              <div className="mt-3 pt-3 border-t">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {/* 相手のアイテム */}
                                  <div>
                                    <p className="text-muted-foreground mb-1">相手のアイテム</p>
                                    {partnerItems.length > 0 ? (
                                      <div className="flex gap-1">
                                        {partnerItems.slice(0, 3).map((item) => (
                                          <div
                                            key={item.cardId}
                                            className="h-10 w-10 overflow-hidden rounded bg-muted"
                                          >
                                            {item.cardImageUrl ? (
                                              <img
                                                src={item.cardImageUrl}
                                                alt={item.cardName}
                                                className="h-full w-full object-cover"
                                              />
                                            ) : (
                                              <div className="flex h-full w-full items-center justify-center">
                                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                        {partnerItems.length > 3 && (
                                          <div className="h-10 w-10 flex items-center justify-center text-muted-foreground">
                                            +{partnerItems.length - 3}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-muted-foreground">なし</p>
                                    )}
                                  </div>
                                  {/* 自分のアイテム */}
                                  <div>
                                    <p className="text-muted-foreground mb-1">自分のアイテム</p>
                                    {myItems.length > 0 ? (
                                      <div className="flex gap-1">
                                        {myItems.slice(0, 3).map((item) => (
                                          <div
                                            key={item.cardId}
                                            className="h-10 w-10 overflow-hidden rounded bg-muted"
                                          >
                                            {item.cardImageUrl ? (
                                              <img
                                                src={item.cardImageUrl}
                                                alt={item.cardName}
                                                className="h-full w-full object-cover"
                                              />
                                            ) : (
                                              <div className="flex h-full w-full items-center justify-center">
                                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                        {myItems.length > 3 && (
                                          <div className="h-10 w-10 flex items-center justify-center text-muted-foreground">
                                            +{myItems.length - 3}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-muted-foreground">なし</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="activeTrades">
          {activeTrades.filter((t) => t.status !== 'draft').length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-muted-foreground text-center">
                  トレード中のアイテムはありません
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {activeTrades
                .filter((t) => t.status !== 'draft')
                .map((trade) => {
                  const myItems = trade.items?.filter((i) => i.offeredByUserId === userId) ?? [];
                  const partnerItems =
                    trade.items?.filter((i) => i.offeredByUserId !== userId) ?? [];
                  return (
                    <Link key={trade.id} href={`/trades/${trade.roomSlug}`} className="block">
                      <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-muted flex items-center justify-center">
                              {trade.partner?.image ? (
                                <img
                                  src={trade.partner.image}
                                  alt={trade.partner.name ?? ''}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <User className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">
                                {trade.partner?.twitterUsername
                                  ? `@${trade.partner.twitterUsername}`
                                  : (trade.partner?.name ?? '相手未確定')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(trade.updatedAt).toLocaleDateString('ja-JP')}
                              </p>
                            </div>
                            <Badge variant="outline" className="shrink-0">
                              {trade.status === 'proposed' ? '提案中' : '合意済'}
                            </Badge>
                          </div>
                          {/* アイテム情報 */}
                          {(myItems.length > 0 || partnerItems.length > 0) && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {/* 相手のアイテム */}
                                <div>
                                  <p className="text-muted-foreground mb-1">相手のアイテム</p>
                                  {partnerItems.length > 0 ? (
                                    <div className="flex gap-1">
                                      {partnerItems.slice(0, 3).map((item) => (
                                        <div
                                          key={item.cardId}
                                          className="h-10 w-10 overflow-hidden rounded bg-muted"
                                        >
                                          {item.cardImageUrl ? (
                                            <img
                                              src={item.cardImageUrl}
                                              alt={item.cardName}
                                              className="h-full w-full object-cover"
                                            />
                                          ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                      {partnerItems.length > 3 && (
                                        <div className="h-10 w-10 flex items-center justify-center text-muted-foreground">
                                          +{partnerItems.length - 3}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-muted-foreground">なし</p>
                                  )}
                                </div>
                                {/* 自分のアイテム */}
                                <div>
                                  <p className="text-muted-foreground mb-1">自分のアイテム</p>
                                  {myItems.length > 0 ? (
                                    <div className="flex gap-1">
                                      {myItems.slice(0, 3).map((item) => (
                                        <div
                                          key={item.cardId}
                                          className="h-10 w-10 overflow-hidden rounded bg-muted"
                                        >
                                          {item.cardImageUrl ? (
                                            <img
                                              src={item.cardImageUrl}
                                              alt={item.cardName}
                                              className="h-full w-full object-cover"
                                            />
                                          ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                      {myItems.length > 3 && (
                                        <div className="h-10 w-10 flex items-center justify-center text-muted-foreground">
                                          +{myItems.length - 3}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-muted-foreground">なし</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completedTrades">
          {completedTrades.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-muted-foreground text-center">成約済のトレードはありません</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {completedTrades.map((trade) => {
                const myItems = trade.items?.filter((i) => i.offeredByUserId === userId) ?? [];
                const partnerItems = trade.items?.filter((i) => i.offeredByUserId !== userId) ?? [];
                return (
                  <Link key={trade.id} href={`/trades/${trade.roomSlug}`} className="block">
                    <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-muted flex items-center justify-center">
                            {trade.partner?.image ? (
                              <img
                                src={trade.partner.image}
                                alt={trade.partner.name ?? ''}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">
                              {trade.partner?.twitterUsername
                                ? `@${trade.partner.twitterUsername}`
                                : (trade.partner?.name ?? '相手未確定')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(trade.updatedAt).toLocaleDateString('ja-JP')}
                            </p>
                          </div>
                          <Badge variant="secondary" className="shrink-0">
                            成約済
                          </Badge>
                        </div>
                        {/* アイテム情報 */}
                        {(myItems.length > 0 || partnerItems.length > 0) && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {/* 相手のアイテム */}
                              <div>
                                <p className="text-muted-foreground mb-1">相手のアイテム</p>
                                {partnerItems.length > 0 ? (
                                  <div className="flex gap-1">
                                    {partnerItems.slice(0, 3).map((item) => (
                                      <div
                                        key={item.cardId}
                                        className="h-10 w-10 overflow-hidden rounded bg-muted"
                                      >
                                        {item.cardImageUrl ? (
                                          <img
                                            src={item.cardImageUrl}
                                            alt={item.cardName}
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          <div className="flex h-full w-full items-center justify-center">
                                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                    {partnerItems.length > 3 && (
                                      <div className="h-10 w-10 flex items-center justify-center text-muted-foreground">
                                        +{partnerItems.length - 3}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-muted-foreground">なし</p>
                                )}
                              </div>
                              {/* 自分のアイテム */}
                              <div>
                                <p className="text-muted-foreground mb-1">自分のアイテム</p>
                                {myItems.length > 0 ? (
                                  <div className="flex gap-1">
                                    {myItems.slice(0, 3).map((item) => (
                                      <div
                                        key={item.cardId}
                                        className="h-10 w-10 overflow-hidden rounded bg-muted"
                                      >
                                        {item.cardImageUrl ? (
                                          <img
                                            src={item.cardImageUrl}
                                            alt={item.cardName}
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          <div className="flex h-full w-full items-center justify-center">
                                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                    {myItems.length > 3 && (
                                      <div className="h-10 w-10 flex items-center justify-center text-muted-foreground">
                                        +{myItems.length - 3}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-muted-foreground">なし</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="reviews">
            <ReviewList
              reviews={reviews}
              currentUserId={session.user.id}
              emptyMessage="まだレビューがありません"
            />
          </TabsContent>
        )}

        {isOwnProfile && (
          <TabsContent value="favoriteUsers">
            {favoriteUsers.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-muted-foreground text-center">お気に入りユーザーはいません</p>
                  <p className="text-muted-foreground text-center text-sm mt-2">
                    トップページのユーザー検索からお気に入りを追加できます
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-1">
                {favoriteUsers.map((favorite) => (
                  <div
                    key={favorite.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Link
                      href={`/users/${favorite.favoriteUser.id}`}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      {/* アバター */}
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                        {favorite.favoriteUser.image ? (
                          <img
                            src={favorite.favoriteUser.image}
                            alt={favorite.favoriteUser.name ?? ''}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      {/* ユーザー情報 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate text-sm">
                            {favorite.favoriteUser.name ?? '名前未設定'}
                          </p>
                          {favorite.favoriteUser.trustGrade && (
                            <TrustBadge grade={favorite.favoriteUser.trustGrade} size="sm" />
                          )}
                        </div>
                        {favorite.favoriteUser.twitterUsername && (
                          <p className="text-xs text-muted-foreground truncate">
                            @{favorite.favoriteUser.twitterUsername}
                          </p>
                        )}
                      </div>
                    </Link>
                    {/* 削除ボタン */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFavoriteUser(favorite.favoriteUser.id)}
                      className="flex-shrink-0"
                      title="お気に入りから削除"
                    >
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
