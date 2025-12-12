'use client';

import { ImageIcon, Minus, Plus } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UserHaveCard, UserWantCard } from '@/modules/cards/types';

interface CardDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: UserHaveCard | UserWantCard | null;
  type: 'have' | 'want';
  onUpdate?: (itemId: string, quantity?: number, priority?: number) => Promise<void>;
  onDelete?: (itemId: string) => Promise<void>;
}

export function CardDetailModal({
  open,
  onOpenChange,
  item,
  type,
  onUpdate,
  onDelete,
}: CardDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [priority, setPriority] = useState(1);

  // Note: useMemo/useEffect to sync with item prop values should be used if needed
  const card = item?.card;
  const isHave = type === 'have';
  const haveItem = isHave && item ? (item as UserHaveCard) : null;
  const wantItem = !isHave && item ? (item as UserWantCard) : null;

  // Initialize quantity and priority from props when item changes
  const itemQuantity = haveItem?.quantity ?? 1;
  const itemPriority = wantItem?.priority ?? 1;

  useEffect(() => {
    setQuantity(itemQuantity);
  }, [itemQuantity]);

  useEffect(() => {
    setPriority(itemPriority);
  }, [itemPriority]);

  if (!item || !card) {
    return null;
  }

  const handleUpdate = async () => {
    if (!onUpdate) return;
    setIsUpdating(true);
    try {
      if (isHave) {
        await onUpdate(item.id, quantity);
      } else {
        await onUpdate(item.id, undefined, priority);
      }
      onOpenChange(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(item.id);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>アイテム詳細</DialogTitle>
          <DialogDescription>
            {isHave ? '持っているアイテム' : '欲しいアイテム'}の情報を確認・編集できます
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* カード画像 */}
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
            {card.imageUrl ? (
              <Image
                src={card.imageUrl}
                alt={card.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* カード情報 */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold">{card.name}</h3>
              {card.category && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary">{card.category}</Badge>
                </div>
              )}
              {card.description && (
                <p className="mt-2 text-sm text-muted-foreground">{card.description}</p>
              )}
            </div>

            {/* 数量・優先度編集 */}
            {isHave && haveItem && (
              <div className="space-y-2">
                <Label htmlFor="quantity">数量</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, Number.parseInt(e.target.value, 10) || 1))
                    }
                    className="text-center"
                  />
                  <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {!isHave && wantItem && (
              <div className="space-y-2">
                <Label htmlFor="priority">優先度 (1-10)</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  max="10"
                  value={priority}
                  onChange={(e) =>
                    setPriority(Math.min(10, Math.max(1, Number.parseInt(e.target.value, 10) || 1)))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  1が最も優先度が低く、10が最も高い優先度です
                </p>
              </div>
            )}

            {/* メタ情報 */}
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>登録日: {new Date(item.createdAt).toLocaleDateString('ja-JP')}</p>
              <p>更新日: {new Date(item.updatedAt).toLocaleDateString('ja-JP')}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || isUpdating}
            className="w-full sm:w-auto"
          >
            {isDeleting ? '削除中...' : '削除'}
          </Button>
          <div className="flex gap-2 flex-1">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating || isDeleting}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating || isDeleting} className="flex-1">
              {isUpdating ? '更新中...' : '更新'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
