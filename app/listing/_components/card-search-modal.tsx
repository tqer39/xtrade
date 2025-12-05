'use client'

import { useState } from 'react'
import { useCardSearch } from '@/hooks/use-card-search'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Plus, Loader2 } from 'lucide-react'

interface CardSearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'have' | 'want' | 'set'
  onAddCard: (cardId: string) => Promise<void>
}

export function CardSearchModal({ open, onOpenChange, mode, onAddCard }: CardSearchModalProps) {
  const { searchResults, isSearching, searchError, search, createCard, clearResults } =
    useCardSearch()
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewCardForm, setShowNewCardForm] = useState(false)
  const [newCardName, setNewCardName] = useState('')
  const [newCardCategory, setNewCardCategory] = useState('')
  const [newCardRarity, setNewCardRarity] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    search(value)
    setShowNewCardForm(false)
  }

  const handleSelectCard = async (cardId: string) => {
    setIsAdding(true)
    setAddError(null)
    try {
      await onAddCard(cardId)
      handleClose()
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsAdding(false)
    }
  }

  const handleCreateAndAdd = async () => {
    if (!newCardName.trim() || !newCardCategory.trim()) {
      setAddError('名前とカテゴリは必須です')
      return
    }

    setIsAdding(true)
    setAddError(null)
    try {
      const card = await createCard({
        name: newCardName.trim(),
        category: newCardCategory.trim(),
        rarity: newCardRarity.trim() || undefined,
      })
      await onAddCard(card.id)
      handleClose()
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsAdding(false)
    }
  }

  const handleClose = () => {
    setSearchQuery('')
    setShowNewCardForm(false)
    setNewCardName('')
    setNewCardCategory('')
    setNewCardRarity('')
    setAddError(null)
    clearResults()
    onOpenChange(false)
  }

  const modeLabel =
    mode === 'have' ? '持っているカード' : mode === 'want' ? '欲しいカード' : 'セットにカード'

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{modeLabel}を追加</DialogTitle>
          <DialogDescription>カードを検索するか、新しいカードを登録してください</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 検索入力 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="カード名で検索..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* エラー表示 */}
          {addError && <div className="text-sm text-destructive">{addError}</div>}
          {searchError && (
            <div className="text-sm text-destructive">検索エラー: {searchError.message}</div>
          )}

          {/* 検索結果 */}
          {isSearching ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : searchQuery && searchResults.length > 0 ? (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {searchResults.map((card) => (
                <Card
                  key={card.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => !isAdding && handleSelectCard(card.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{card.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {card.category}
                          </Badge>
                          {card.rarity && (
                            <Badge variant="outline" className="text-xs">
                              {card.rarity}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : searchQuery && searchResults.length === 0 && !isSearching ? (
            <div className="text-center py-4 text-muted-foreground">
              「{searchQuery}」に一致するカードが見つかりません
            </div>
          ) : null}

          {/* 新規登録ボタン */}
          {!showNewCardForm && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setShowNewCardForm(true)
                setNewCardName(searchQuery)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              新しいカードを登録
            </Button>
          )}

          {/* 新規登録フォーム */}
          {showNewCardForm && (
            <div className="space-y-3 p-4 border rounded-lg">
              <h4 className="font-medium">新しいカードを登録</h4>
              <div className="space-y-2">
                <Label htmlFor="new-card-name">カード名 *</Label>
                <Input
                  id="new-card-name"
                  value={newCardName}
                  onChange={(e) => setNewCardName(e.target.value)}
                  placeholder="カード名を入力"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-card-category">カテゴリ *</Label>
                <Input
                  id="new-card-category"
                  value={newCardCategory}
                  onChange={(e) => setNewCardCategory(e.target.value)}
                  placeholder="例: ポケモンカード、遊戯王、MTG"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-card-rarity">レアリティ (任意)</Label>
                <Input
                  id="new-card-rarity"
                  value={newCardRarity}
                  onChange={(e) => setNewCardRarity(e.target.value)}
                  placeholder="例: SR、UR、レア"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowNewCardForm(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleCreateAndAdd} disabled={isAdding}>
                  {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  登録して追加
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
