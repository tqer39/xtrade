'use client';

import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { LoginButton } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMyCards } from '@/hooks/use-my-cards';
import { useMySets } from '@/hooks/use-my-sets';
import { useSession } from '@/lib/auth-client';
import { CardListItem } from './card-list-item';
import { CardSearchModal } from './card-search-modal';
import { SetDetailModal } from './set-detail-modal';
import { SetListItem } from './set-list-item';

export function ListingPageClient() {
  const { data: session, isPending: isSessionPending } = useSession();
  const { haveCards, wantCards, isLoading, error, addHaveCard, addWantCard, refetch } =
    useMyCards();
  const {
    sets,
    isLoading: isSetsLoading,
    error: setsError,
    createSet,
    updateSet,
    deleteSet,
    getSetDetail,
    addCardToSet,
    removeCardFromSet,
    refetch: refetchSets,
  } = useMySets();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'have' | 'want'>('have');
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [isSetDetailOpen, setIsSetDetailOpen] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [isCreatingSet, setIsCreatingSet] = useState(false);
  const [addingToSetId, setAddingToSetId] = useState<string | null>(null);
  const [setDetailKey, setSetDetailKey] = useState(0);

  const handleOpenModal = (mode: 'have' | 'want') => {
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const handleAddCard = async (cardId: string) => {
    if (addingToSetId) {
      await addCardToSet(addingToSetId, cardId);
      // カード追加後にセット詳細モーダルを再度開く
      setSelectedSetId(addingToSetId);
      setAddingToSetId(null);
      setSetDetailKey((prev) => prev + 1);
      setIsSetDetailOpen(true);
    } else if (modalMode === 'have') {
      await addHaveCard(cardId);
    } else {
      await addWantCard(cardId);
    }
  };

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

  const handleAddCardToSet = (setId: string) => {
    setAddingToSetId(setId);
    setIsSetDetailOpen(false);
    setIsModalOpen(true);
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
        <h1 className="text-2xl font-bold mb-6">カード出品</h1>
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
        <h1 className="text-2xl font-bold">カード出品</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/">ホームに戻る</Link>
        </Button>
      </div>

      {/* 未ログイン時のカード検索ボタン */}
      {!isLoggedIn && (
        <div className="mb-6">
          <Button onClick={() => handleOpenModal('have')} className="gap-2" size="lg">
            <Search className="h-4 w-4" />
            カードを検索
          </Button>
          <p className="mt-2 text-sm text-muted-foreground">
            カードを追加・管理するにはログインが必要です
          </p>
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
            <Button onClick={() => handleOpenModal('have')} className="gap-2">
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
            <Button onClick={() => handleOpenModal('want')} className="gap-2">
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

      <CardSearchModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setAddingToSetId(null);
          }
        }}
        mode={addingToSetId ? 'set' : modalMode}
        onAddCard={handleAddCard}
        isLoggedIn={isLoggedIn}
      />

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
