'use client';

import { ArrowLeft, ImageIcon, Loader2, Plus, Search, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { LoginButton } from '@/components/auth';
import { FavoriteButton } from '@/components/favorites';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CategoryAutocomplete } from '@/components/ui/category-autocomplete';
import { ImageUpload } from '@/components/ui/image-upload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ViewToggle } from '@/components/view-toggle';
import { useCardSearch } from '@/hooks/use-card-search';
import { useFavorites } from '@/hooks/use-favorites';
import { useMyCategories } from '@/hooks/use-my-categories';
import { usePhotocardSearch } from '@/hooks/use-photocard-search';
import { useViewPreference } from '@/hooks/use-view-preference';
import { useSession } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

function CardSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = (searchParams.get('mode') as 'have' | 'want' | 'set') || 'have';
  const setId = searchParams.get('setId');
  const returnTo = searchParams.get('returnTo') || '/';

  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  const { viewMode, setViewMode, isHydrated } = useViewPreference();
  const { searchResults, isSearching, searchError, search, createCard } = useCardSearch();
  const {
    searchResults: photocardResults,
    isSearching: isPhotocardSearching,
    search: searchPhotocard,
  } = usePhotocardSearch();
  const { isCardFavorited, toggleFavoriteCard } = useFavorites();
  const { categories: myCategories } = useMyCategories();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [newCardName, setNewCardName] = useState('');
  const [newCardCategory, setNewCardCategory] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');
  const [newCardImageUrl, setNewCardImageUrl] = useState<string | undefined>();
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    search(value);
    searchPhotocard(value);
    setShowNewCardForm(false);
  };

  const handleSelectPhotocard = async (photocard: (typeof photocardResults)[0]) => {
    if (!isLoggedIn) return;
    setIsAdding(true);
    setAddError(null);
    try {
      const card = await createCard({
        name: photocard.name,
        category: photocard.groupName || undefined,
        description: photocard.rarity || undefined,
        imageUrl: photocard.imageUrl || undefined,
      });
      await addCardToUser(card.id);
      router.push(returnTo);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsAdding(false);
    }
  };

  const handleSelectCard = async (cardId: string) => {
    if (!isLoggedIn) return;
    setIsAdding(true);
    setAddError(null);
    try {
      await addCardToUser(cardId);
      router.push(returnTo);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsAdding(false);
    }
  };

  const addCardToUser = async (cardId: string) => {
    if (mode === 'set' && setId) {
      // セットへのカード追加
      const res = await fetch(`/api/me/sets/${setId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'セットへのカード追加に失敗しました');
      }
    } else {
      // 持っている/欲しいカードへの追加
      const endpoint = mode === 'have' ? '/api/me/cards/have' : '/api/me/cards/want';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, quantity: 1 }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'カードの追加に失敗しました');
      }
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newCardName.trim()) {
      setAddError('名前は必須です');
      return;
    }

    setIsAdding(true);
    setAddError(null);
    try {
      const card = await createCard({
        name: newCardName.trim(),
        category: newCardCategory.trim() || undefined,
        description: newCardDescription.trim() || undefined,
        imageUrl: newCardImageUrl,
      });
      await addCardToUser(card.id);
      router.push(returnTo);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsAdding(false);
    }
  };

  const modeLabel =
    mode === 'have'
      ? '持っているアイテム'
      : mode === 'want'
        ? '欲しいアイテム'
        : 'セットにアイテム';

  const isLoading = isSearching || isPhotocardSearching;
  const hasResults = photocardResults.length > 0 || searchResults.length > 0;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      {/* ヘッダー */}
      <div className="mb-6">
        <Link
          href={returnTo}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {isLoggedIn ? `${modeLabel}を追加` : 'アイテム検索'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isLoggedIn
                ? 'アイテムを検索するか、新しいアイテムを登録してください'
                : 'アイテムを検索できます。追加するにはログインが必要です'}
            </p>
          </div>
          {isHydrated && <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />}
        </div>
      </div>

      {/* 検索入力 */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="アイテム名で検索..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 h-12 text-lg"
          autoFocus
        />
      </div>

      {/* エラー表示 */}
      {addError && <div className="mb-4 text-sm text-destructive">{addError}</div>}
      {searchError && (
        <div className="mb-4 text-sm text-destructive">検索エラー: {searchError.message}</div>
      )}

      {/* ローディング */}
      {isLoading && (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3'
              : 'space-y-2'
          )}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className={viewMode === 'grid' ? 'aspect-square' : 'h-20'} />
          ))}
        </div>
      )}

      {/* 検索結果 */}
      {!isLoading && searchQuery && (
        <div className="space-y-6">
          {/* フォトカードマスターの候補 */}
          {photocardResults.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                <Star className="h-4 w-4" />
                <span>おすすめ候補</span>
              </div>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {photocardResults.map((photocard) => (
                    <PhotocardGridItem
                      key={`master-${photocard.id}`}
                      photocard={photocard}
                      isLoggedIn={isLoggedIn}
                      isAdding={isAdding}
                      onSelect={() => handleSelectPhotocard(photocard)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {photocardResults.map((photocard) => (
                    <PhotocardListItem
                      key={`master-${photocard.id}`}
                      photocard={photocard}
                      isLoggedIn={isLoggedIn}
                      isAdding={isAdding}
                      onSelect={() => handleSelectPhotocard(photocard)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* 既存のカード */}
          {searchResults.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                <span>登録済みカード</span>
              </div>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {searchResults.map((card) => (
                    <CardGridItem
                      key={card.id}
                      card={card}
                      isLoggedIn={isLoggedIn}
                      isAdding={isAdding}
                      isFavorited={isCardFavorited(card.id)}
                      onSelect={() => handleSelectCard(card.id)}
                      onToggleFavorite={() => toggleFavoriteCard(card.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((card) => (
                    <CardListItem
                      key={card.id}
                      card={card}
                      isLoggedIn={isLoggedIn}
                      isAdding={isAdding}
                      isFavorited={isCardFavorited(card.id)}
                      onSelect={() => handleSelectCard(card.id)}
                      onToggleFavorite={() => toggleFavoriteCard(card.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* 結果なし */}
          {!hasResults && (
            <div className="py-12 text-center text-muted-foreground">
              「{searchQuery}」に一致するアイテムが見つかりません
            </div>
          )}
        </div>
      )}

      {/* 初期状態 */}
      {!isLoading && !searchQuery && (
        <div className="py-12 text-center text-muted-foreground">
          アイテム名を入力して検索してください
        </div>
      )}

      {/* 新規登録ボタン / ログインボタン */}
      <div className="mt-8">
        {!showNewCardForm &&
          (isLoggedIn ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setShowNewCardForm(true);
                setNewCardName(searchQuery);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              新しいアイテムを登録
            </Button>
          ) : (
            <div className="space-y-2 rounded-lg border p-4 text-center">
              <p className="text-sm text-muted-foreground">
                アイテムを追加するにはログインが必要です
              </p>
              <LoginButton />
            </div>
          ))}

        {/* 新規登録フォーム */}
        {showNewCardForm && (
          <div className="space-y-3 rounded-lg border p-4">
            <h4 className="font-medium">新しいアイテムを登録</h4>
            <div className="space-y-2">
              <Label htmlFor="new-card-name">アイテム名 *</Label>
              <Input
                id="new-card-name"
                value={newCardName}
                onChange={(e) => setNewCardName(e.target.value)}
                placeholder="アイテム名を入力"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-card-category">カテゴリ (任意)</Label>
              <CategoryAutocomplete
                value={newCardCategory}
                onChange={setNewCardCategory}
                suggestions={myCategories}
                placeholder="例: ポケモンカード、遊戯王、アイドルグッズ"
                disabled={isAdding}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-card-description">説明 (任意)</Label>
              <Input
                id="new-card-description"
                value={newCardDescription}
                onChange={(e) => setNewCardDescription(e.target.value)}
                placeholder="アイテムの説明を入力"
              />
            </div>
            <div className="space-y-2">
              <Label>画像 (任意)</Label>
              <ImageUpload
                value={newCardImageUrl}
                onChange={setNewCardImageUrl}
                disabled={isAdding}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowNewCardForm(false)}>
                キャンセル
              </Button>
              <Button onClick={handleCreateAndAdd} disabled={isAdding}>
                {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                登録して追加
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// フォトカードグリッドアイテム
function PhotocardGridItem({
  photocard,
  isLoggedIn,
  isAdding,
  onSelect,
}: {
  photocard: {
    id: string;
    name: string;
    imageUrl?: string | null;
    groupName?: string | null;
    memberName?: string | null;
  };
  isLoggedIn: boolean;
  isAdding: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => isLoggedIn && !isAdding && onSelect()}
      disabled={!isLoggedIn || isAdding}
      className={cn(
        'group relative aspect-square w-full overflow-hidden rounded-lg bg-muted border-2 border-primary/20',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        isLoggedIn && !isAdding && 'cursor-pointer hover:scale-[1.02] transition-transform'
      )}
    >
      {photocard.imageUrl ? (
        <img
          src={photocard.imageUrl}
          alt={photocard.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      <div className="absolute inset-0 flex flex-col justify-end p-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="text-white">
          <div className="text-sm font-semibold truncate">{photocard.name}</div>
          {photocard.memberName && (
            <div className="text-xs text-white/80 truncate">{photocard.memberName}</div>
          )}
        </div>
      </div>
      <div className="absolute top-2 left-2">
        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
      </div>
    </button>
  );
}

// フォトカードリストアイテム
function PhotocardListItem({
  photocard,
  isLoggedIn,
  isAdding,
  onSelect,
}: {
  photocard: {
    id: string;
    name: string;
    imageUrl?: string | null;
    groupName?: string | null;
    memberName?: string | null;
    series?: string | null;
  };
  isLoggedIn: boolean;
  isAdding: boolean;
  onSelect: () => void;
}) {
  return (
    <Card
      className={cn(
        'border-primary/20 transition-colors',
        isLoggedIn && !isAdding && 'cursor-pointer hover:bg-accent'
      )}
      onClick={() => isLoggedIn && !isAdding && onSelect()}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-muted">
            {photocard.imageUrl ? (
              <img
                src={photocard.imageUrl}
                alt={photocard.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{photocard.name}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {photocard.groupName && (
                <Badge variant="default" className="text-xs">
                  {photocard.groupName}
                </Badge>
              )}
              {photocard.memberName && (
                <Badge variant="secondary" className="text-xs">
                  {photocard.memberName}
                </Badge>
              )}
              {photocard.series && (
                <Badge variant="outline" className="text-xs">
                  {photocard.series}
                </Badge>
              )}
            </div>
          </div>
          {isLoggedIn && <Plus className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardContent>
    </Card>
  );
}

// カードグリッドアイテム
function CardGridItem({
  card,
  isLoggedIn,
  isAdding,
  isFavorited,
  onSelect,
  onToggleFavorite,
}: {
  card: {
    id: string;
    name: string;
    imageUrl?: string | null;
    category?: string | null;
    description?: string | null;
  };
  isLoggedIn: boolean;
  isAdding: boolean;
  isFavorited: boolean;
  onSelect: () => void;
  onToggleFavorite: () => Promise<void>;
}) {
  return (
    <button
      type="button"
      onClick={() => isLoggedIn && !isAdding && onSelect()}
      disabled={!isLoggedIn || isAdding}
      className={cn(
        'group relative aspect-square w-full overflow-hidden rounded-lg bg-muted',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        isLoggedIn && !isAdding && 'cursor-pointer hover:scale-[1.02] transition-transform'
      )}
    >
      {card.imageUrl ? (
        <img
          src={card.imageUrl}
          alt={card.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      <div className="absolute inset-0 flex flex-col justify-end p-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="text-white">
          <div className="text-sm font-semibold truncate">{card.name}</div>
          {card.category && (
            <div className="flex items-center gap-1 mt-1">
              <Badge variant="secondary" className="text-xs h-5">
                {card.category}
              </Badge>
            </div>
          )}
        </div>
      </div>
      {isLoggedIn && (
        <div className="absolute top-2 right-2">
          <FavoriteButton isFavorited={isFavorited} onToggle={onToggleFavorite} size="sm" />
        </div>
      )}
    </button>
  );
}

// カードリストアイテム
function CardListItem({
  card,
  isLoggedIn,
  isAdding,
  isFavorited,
  onSelect,
  onToggleFavorite,
}: {
  card: {
    id: string;
    name: string;
    imageUrl?: string | null;
    category?: string | null;
    description?: string | null;
  };
  isLoggedIn: boolean;
  isAdding: boolean;
  isFavorited: boolean;
  onSelect: () => void;
  onToggleFavorite: () => Promise<void>;
}) {
  return (
    <Card
      className={cn(
        'transition-colors',
        isLoggedIn && !isAdding && 'cursor-pointer hover:bg-accent'
      )}
      onClick={() => isLoggedIn && !isAdding && onSelect()}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-muted">
            {card.imageUrl ? (
              <img src={card.imageUrl} alt={card.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{card.name}</div>
            {card.category && (
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {card.category}
                </Badge>
              </div>
            )}
            {card.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{card.description}</p>
            )}
          </div>
          {isLoggedIn && (
            <>
              <FavoriteButton isFavorited={isFavorited} onToggle={onToggleFavorite} size="sm" />
              <Plus className="h-4 w-4 text-muted-foreground" />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CardSearchPage() {
  return (
    <Suspense fallback={<div className="container mx-auto max-w-4xl px-4 py-6">読み込み中...</div>}>
      <CardSearchContent />
    </Suspense>
  );
}
