'use client'

import { useState } from 'react'
import { useSession } from '@/lib/auth-client'
import { useMyCards } from '@/hooks/use-my-cards'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { LoginButton } from '@/components/auth'
import { CardListItem } from './card-list-item'
import { CardSearchModal } from './card-search-modal'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export function ListingPageClient() {
  const { data: session, isPending: isSessionPending } = useSession()
  const {
    haveCards,
    wantCards,
    isLoading,
    error,
    addHaveCard,
    addWantCard,
    updateHaveCard,
    updateWantCard,
    deleteHaveCard,
    deleteWantCard,
    refetch,
  } = useMyCards()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'have' | 'want'>('have')

  const handleOpenModal = (mode: 'have' | 'want') => {
    setModalMode(mode)
    setIsModalOpen(true)
  }

  const handleAddCard = async (cardId: string) => {
    if (modalMode === 'have') {
      await addHaveCard(cardId)
    } else {
      await addWantCard(cardId)
    }
  }

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
    )
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">カード出品</h1>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">ログインして、カードを管理しましょう</p>
          <LoginButton />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">カード出品</h1>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">エラーが発生しました: {error.message}</p>
          <Button onClick={() => refetch()}>再読み込み</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">カード出品</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/">ホームに戻る</Link>
        </Button>
      </div>

      <Tabs defaultValue="have" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="have">持っているカード ({haveCards.length})</TabsTrigger>
          <TabsTrigger value="want">欲しいカード ({wantCards.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="have" className="mt-4">
          <div className="mb-4">
            <Button onClick={() => handleOpenModal('have')} className="gap-2">
              <Plus className="h-4 w-4" />
              カードを追加
            </Button>
          </div>
          {isLoading ? (
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
                <CardListItem
                  key={item.id}
                  item={item}
                  type="have"
                  onUpdate={updateHaveCard}
                  onDelete={deleteHaveCard}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="want" className="mt-4">
          <div className="mb-4">
            <Button onClick={() => handleOpenModal('want')} className="gap-2">
              <Plus className="h-4 w-4" />
              カードを追加
            </Button>
          </div>
          {isLoading ? (
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
                <CardListItem
                  key={item.id}
                  item={item}
                  type="want"
                  onUpdate={updateWantCard}
                  onDelete={deleteWantCard}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CardSearchModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        onAddCard={handleAddCard}
      />
    </div>
  )
}
