'use client';

import { Loader2, Plus, Search, Star } from 'lucide-react';
import { useState } from 'react';
import { FavoriteButton } from '@/components/favorites';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useCardSearch } from '@/hooks/use-card-search';
import { useFavorites } from '@/hooks/use-favorites';
import { usePhotocardSearch } from '@/hooks/use-photocard-search';

interface CardSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'have' | 'want' | 'set';
  onAddCard: (cardId: string) => Promise<void>;
}

export function CardSearchModal({ open, onOpenChange, mode, onAddCard }: CardSearchModalProps) {
  const { searchResults, isSearching, searchError, search, createCard, clearResults } =
    useCardSearch();
  const {
    searchResults: photocardResults,
    isSearching: isPhotocardSearching,
    search: searchPhotocard,
    clearResults: clearPhotocardResults,
  } = usePhotocardSearch();
  const { isCardFavorited, toggleFavoriteCard } = useFavorites();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [newCardName, setNewCardName] = useState('');
  const [newCardCategory, setNewCardCategory] = useState('');
  const [newCardRarity, setNewCardRarity] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    search(value);
    searchPhotocard(value); // マスターデータも検索
    setShowNewCardForm(false);
  };

  // フォトカードマスターを選択してカードを作成
  const handleSelectPhotocard = async (photocard: (typeof photocardResults)[0]) => {
    setIsAdding(true);
    setAddError(null);
    try {
      // フォトカードマスターからカードを作成
      const card = await createCard({
        name: photocard.name,
        category: photocard.groupName || 'INI',
        rarity: photocard.rarity || undefined,
      });
      await onAddCard(card.id);
      handleClose();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsAdding(false);
    }
  };

  const handleSelectCard = async (cardId: string) => {
    setIsAdding(true);
    setAddError(null);
    try {
      await onAddCard(cardId);
      handleClose();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsAdding(false);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newCardName.trim() || !newCardCategory.trim()) {
      setAddError('名前とカテゴリは必須です');
      return;
    }

    setIsAdding(true);
    setAddError(null);
    try {
      const card = await createCard({
        name: newCardName.trim(),
        category: newCardCategory.trim(),
        rarity: newCardRarity.trim() || undefined,
      });
      await onAddCard(card.id);
      handleClose();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setShowNewCardForm(false);
    setNewCardName('');
    setNewCardCategory('');
    setNewCardRarity('');
    setAddError(null);
    clearResults();
    clearPhotocardResults();
    onOpenChange(false);
  };

  const modeLabel =
    mode === 'have' ? '持っているカード' : mode === 'want' ? '欲しいカード' : 'セットにカード';

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
          {isSearching || isPhotocardSearching ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : searchQuery ? (
            <div className="max-h-60 space-y-2 overflow-y-auto">
              {/* フォトカードマスターの候補 */}
              {photocardResults.length > 0 && (
                <>
                  <div className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
                    <Star className="h-3 w-3" />
                    <span>おすすめ候補</span>
                  </div>
                  {photocardResults.map((photocard) => (
                    <Card
                      key={`master-${photocard.id}`}
                      className="cursor-pointer border-primary/20 transition-colors hover:bg-accent"
                      onClick={() => !isAdding && handleSelectPhotocard(photocard)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
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
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}

              {/* 既存のカード */}
              {searchResults.length > 0 && (
                <>
                  <div className="mt-2 flex items-center gap-2 py-1 text-sm text-muted-foreground">
                    <span>登録済みカード</span>
                  </div>
                  {searchResults.map((card) => (
                    <Card
                      key={card.id}
                      className="cursor-pointer transition-colors hover:bg-accent"
                      onClick={() => !isAdding && handleSelectCard(card.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{card.name}</div>
                            <div className="mt-1 flex items-center gap-2">
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
                          <FavoriteButton
                            isFavorited={isCardFavorited(card.id)}
                            onToggle={() => toggleFavoriteCard(card.id)}
                            size="sm"
                          />
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}

              {/* 結果なし */}
              {photocardResults.length === 0 && searchResults.length === 0 && (
                <div className="py-4 text-center text-muted-foreground">
                  「{searchQuery}」に一致するカードが見つかりません
                </div>
              )}
            </div>
          ) : null}

          {/* 新規登録ボタン */}
          {!showNewCardForm && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setShowNewCardForm(true);
                setNewCardName(searchQuery);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              新しいカードを登録
            </Button>
          )}

          {/* 新規登録フォーム */}
          {showNewCardForm && (
            <div className="space-y-3 rounded-lg border p-4">
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
                  {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  登録して追加
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
