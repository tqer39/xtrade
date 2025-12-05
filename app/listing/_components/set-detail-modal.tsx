'use client';

import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import type { CardSetWithItems } from '@/modules/cards/types';

interface SetDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setId: string | null;
  getSetDetail: (setId: string) => Promise<CardSetWithItems | null>;
  updateSet: (
    setId: string,
    data: { name?: string; description?: string; isPublic?: boolean }
  ) => Promise<void>;
  removeCardFromSet: (setId: string, cardId: string) => Promise<void>;
  onAddCard: (setId: string) => void;
}

export function SetDetailModal({
  open,
  onOpenChange,
  setId,
  getSetDetail,
  updateSet,
  removeCardFromSet,
  onAddCard,
}: SetDetailModalProps) {
  const [set, setSet] = useState<CardSetWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (open && setId) {
      setIsLoading(true);
      getSetDetail(setId)
        .then((data) => {
          setSet(data);
          if (data) {
            setEditName(data.name);
            setEditDescription(data.description || '');
            setEditIsPublic(data.isPublic);
          }
          setHasChanges(false);
        })
        .finally(() => setIsLoading(false));
    }
  }, [open, setId, getSetDetail]);

  const handleSave = async () => {
    if (!setId || !set) return;
    setIsSaving(true);
    try {
      await updateSet(setId, {
        name: editName,
        description: editDescription || undefined,
        isPublic: editIsPublic,
      });
      setHasChanges(false);
      // Refresh set data
      const updatedSet = await getSetDetail(setId);
      setSet(updatedSet);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveCard = async (cardId: string) => {
    if (!setId) return;
    await removeCardFromSet(setId, cardId);
    // Refresh set data
    const updatedSet = await getSetDetail(setId);
    setSet(updatedSet);
  };

  useEffect(() => {
    if (!set) return;
    const changed =
      editName !== set.name ||
      editDescription !== (set.description || '') ||
      editIsPublic !== set.isPublic;
    setHasChanges(changed);
  }, [editName, editDescription, editIsPublic, set]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            セット詳細
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : set ? (
          <div className="space-y-6">
            {/* 編集フォーム */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="set-name">セット名</Label>
                <Input
                  id="set-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="セット名"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="set-description">説明</Label>
                <Input
                  id="set-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="説明（任意）"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="set-public">公開する</Label>
                <Switch id="set-public" checked={editIsPublic} onCheckedChange={setEditIsPublic} />
              </div>
              {hasChanges && (
                <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2">
                  <Save className="h-4 w-4" />
                  保存
                </Button>
              )}
            </div>

            {/* カード一覧 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">カード ({set.items.length})</h3>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => onAddCard(set.id)}
                >
                  <Plus className="h-4 w-4" />
                  カードを追加
                </Button>
              </div>

              {set.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  まだカードを追加していません
                </div>
              ) : (
                <div className="space-y-2">
                  {set.items.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          {item.card?.imageUrl && (
                            <Image
                              src={item.card.imageUrl}
                              alt={item.card.name}
                              width={40}
                              height={40}
                              className="w-10 h-10 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate text-sm">{item.card?.name}</div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {item.card?.category}
                              </Badge>
                              {item.quantity > 1 && (
                                <span className="text-xs text-muted-foreground">
                                  ×{item.quantity}
                                </span>
                              )}
                            </div>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                aria-label="削除"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>カードを削除しますか？</AlertDialogTitle>
                                <AlertDialogDescription>
                                  「{item.card?.name}」をセットから削除します。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemoveCard(item.cardId)}>
                                  削除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">セットが見つかりません</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
