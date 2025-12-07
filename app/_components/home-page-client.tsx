'use client';

import { ImageIcon, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoginButton, UserMenu } from '@/components/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLatestCards } from '@/hooks/use-latest-cards';
import { useMyCards } from '@/hooks/use-my-cards';
import { useMySets } from '@/hooks/use-my-sets';
import { useSession } from '@/lib/auth-client';
import { CardListItem } from './card-list-item';
import { CardOwnerList } from './card-owner-list';
import { SetDetailModal } from './set-detail-modal';
import { SetListItem } from './set-list-item';

export function HomePageClient() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();
  const { haveCards, wantCards, isLoading, error, refetch } = useMyCards();
  const {
    sets,
    isLoading: isSetsLoading,
    error: setsError,
    createSet,
    updateSet,
    deleteSet,
    getSetDetail,
    removeCardFromSet,
    refetch: refetchSets,
  } = useMySets();
  const { latestCards, isLoading: isLatestLoading } = useLatestCards(20);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [isSetDetailOpen, setIsSetDetailOpen] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [isCreatingSet, setIsCreatingSet] = useState(false);
  const [setDetailKey, setSetDetailKey] = useState(0);
  const [selectedCardForOwners, setSelectedCardForOwners] = useState<string | null>(null);

  const handleSelectSet = (setId: string) => {
    setSelectedSetId(setId);
    setIsSetDetailOpen(true);
  };

  const handleCreateSet = async () => {
    if (!newSetName.trim()) return;
    setIsCreatingSet(true);
    try {
      const newSet = await createSet(newSetName.trim());
      setNewSetName('');
      setSelectedSetId(newSet.id);
      setIsSetDetailOpen(true);
    } finally {
      setIsCreatingSet(false);
    }
  };

  // セットへのカード追加は検索ページへ遷移
  const handleAddCardToSet = (setId: string) => {
    router.push(`/cards/search?mode=set&setId=${setId}&returnTo=/`);
  };

  if (isSessionPending) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-10 w-full mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  const isLoggedIn = !!session?.user;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">xtrade</h1>
          <UserMenu />
        </div>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">エラーが発生しました: {error.message}</p>
          <Button onClick={() => refetch()}>再読み込み</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">xtrade</h1>
        <UserMenu />
      </div>

      {/* 未ログイン時のデフォルト表示 */}
      {!isLoggedIn && (
        <div className="mb-6 space-y-6">
          <div>
            <Button asChild className="gap-2" size="lg">
              <Link href="/cards/search">
                <Search className="h-4 w-4" />
                カードを検索
              </Link>
            </Button>
            <p className="mt-2 text-sm text-muted-foreground">
              カードを追加・管理するにはログインが必要です
            </p>
          </div>

          {/* カード所有者一覧表示 */}
          {selectedCardForOwners ? (
            <CardOwnerList
              cardId={selectedCardForOwners}
              onBack={() => setSelectedCardForOwners(null)}
              isLoggedIn={false}
            />
          ) : (
            <div>
              <h2 className="text-lg font-medium mb-3">最近登録されたカード</h2>
              {isLatestLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {Array.from({ length: 8 }, (_, i) => `skeleton-${i}`).map((key) => (
                    <Skeleton key={key} className="h-32 w-full" />
                  ))}
                </div>
              ) : latestCards.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  まだカードが登録されていません
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {latestCards.map((card) => (
                    <Card
                      key={card.id}
                      className="cursor-pointer transition-colors hover:bg-accent"
                      onClick={() => setSelectedCardForOwners(card.id)}
                    >
                      <CardContent className="p-3">
                        <div className="aspect-square overflow-hidden rounded-lg bg-muted mb-2">
                          {card.imageUrl ? (
                            <img
                              src={card.imageUrl}
                              alt={card.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <p className="font-medium text-sm truncate">{card.name}</p>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {card.category}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Tabs defaultValue="have" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="have">持っている {isLoggedIn && `(${haveCards.length})`}</TabsTrigger>
          <TabsTrigger value="want">欲しい {isLoggedIn && `(${wantCards.length})`}</TabsTrigger>
          <TabsTrigger value="sets">セット {isLoggedIn && `(${sets.length})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="have" className="mt-4">
          <div className="mb-4">
            <Button asChild className="gap-2">
              <Link href={isLoggedIn ? '/cards/search?mode=have&returnTo=/' : '/cards/search'}>
                {isLoggedIn ? (
                  <>
                    <Plus className="h-4 w-4" />
                    カードを追加
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    カードを検索
                  </>
                )}
              </Link>
            </Button>
          </div>
          {!isLoggedIn ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                ログインすると、持っているカードを登録・管理できます
              </p>
              <LoginButton />
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : haveCards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              まだカードを登録していません
            </div>
          ) : (
            <div className="space-y-3">
              {haveCards.map((item) => (
                <CardListItem key={item.id} item={item} type="have" />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="want" className="mt-4">
          <div className="mb-4">
            <Button asChild className="gap-2">
              <Link href={isLoggedIn ? '/cards/search?mode=want&returnTo=/' : '/cards/search'}>
                {isLoggedIn ? (
                  <>
                    <Plus className="h-4 w-4" />
                    カードを追加
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    カードを検索
                  </>
                )}
              </Link>
            </Button>
          </div>
          {!isLoggedIn ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                ログインすると、欲しいカードを登録・管理できます
              </p>
              <LoginButton />
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : wantCards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              まだ欲しいカードを登録していません
            </div>
          ) : (
            <div className="space-y-3">
              {wantCards.map((item) => (
                <CardListItem key={item.id} item={item} type="want" />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sets" className="mt-4">
          {!isLoggedIn ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                ログインすると、セットを作成・管理できます
              </p>
              <LoginButton />
            </div>
          ) : (
            <>
              <div className="mb-4 flex gap-2">
                <Input
                  placeholder="新しいセット名"
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateSet()}
                  className="max-w-xs"
                />
                <Button
                  onClick={handleCreateSet}
                  disabled={!newSetName.trim() || isCreatingSet}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  作成
                </Button>
              </div>
              {isSetsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : setsError ? (
                <div className="text-center py-8">
                  <p className="text-destructive mb-4">エラー: {setsError.message}</p>
                  <Button onClick={() => refetchSets()}>再読み込み</Button>
                </div>
              ) : sets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  まだセットを作成していません
                </div>
              ) : (
                <div className="space-y-3">
                  {sets.map((set) => (
                    <SetListItem
                      key={set.id}
                      set={set}
                      onSelect={handleSelectSet}
                      onDelete={deleteSet}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      <SetDetailModal
        key={setDetailKey}
        open={isSetDetailOpen}
        onOpenChange={setIsSetDetailOpen}
        setId={selectedSetId}
        getSetDetail={getSetDetail}
        updateSet={updateSet}
        removeCardFromSet={removeCardFromSet}
        onAddCard={handleAddCardToSet}
      />
    </div>
  );
}
