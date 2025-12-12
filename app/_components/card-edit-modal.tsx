'use client';

import { ImageIcon, Loader2, Minus, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
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

interface CardEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: UserHaveCard | UserWantCard | null;
  type: 'have' | 'want';
  onUpdate: (cardId: string, value: number) => Promise<void>;
  onRemove: (cardId: string) => Promise<void>;
}

export function CardEditModal({
  open,
  onOpenChange,
  item,
  type,
  onUpdate,
  onRemove,
}: CardEditModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [priority, setPriority] = useState<number | null>(null);

  // モーダルが開いたときに初期値をセット
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && item) {
      if (type === 'have') {
        setQuantity((item as UserHaveCard).quantity);
      } else {
        setPriority((item as UserWantCard).priority);
      }
    }
    onOpenChange(newOpen);
  };

  if (!item || !item.card) {
    return null;
  }

  const card = item.card;
  const isHave = type === 'have';

  const handleUpdate = async () => {
    if (!card) return;
    setIsUpdating(true);
    try {
      const value = isHave ? quantity : (priority ?? 0);
      await onUpdate(card.id, value);
      onOpenChange(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (!card) return;
    setIsRemoving(true);
    try {
      await onRemove(card.id);
      onOpenChange(false);
    } finally {
      setIsRemoving(false);
    }
  };

  const incrementQuantity = () => setQuantity((q) => Math.min(99, q + 1));
  const decrementQuantity = () => setQuantity((q) => Math.max(1, q - 1));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isHave ? '持っているカードを編集' : '欲しいカードを編集'}</DialogTitle>
          <DialogDescription>数量や優先度を変更できます</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* カード情報 */}
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
              {card.imageUrl ? (
                <Image
                  src={card.imageUrl}
                  alt={card.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold truncate">{card.name}</div>
              {card.category && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {card.category}
                  </Badge>
                </div>
              )}
              {card.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {card.description}
                </p>
              )}
            </div>
          </div>

          {/* 数量または優先度の編集 */}
          {isHave ? (
            <div className="space-y-2">
              <Label>数量</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1 || isUpdating}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))
                  }
                  className="w-20 text-center"
                  disabled={isUpdating}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={incrementQuantity}
                  disabled={quantity >= 99 || isUpdating}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>優先度 (任意)</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={priority ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setPriority(val === '' ? null : Math.max(1, Math.min(10, parseInt(val) || 1)));
                }}
                placeholder="1-10"
                className="w-32"
                disabled={isUpdating}
              />
              <p className="text-xs text-muted-foreground">数字が小さいほど優先度が高くなります</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={isUpdating || isRemoving}
            className="w-full sm:w-auto"
          >
            {isRemoving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            削除
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating || isRemoving}
          >
            キャンセル
          </Button>
          <Button onClick={handleUpdate} disabled={isUpdating || isRemoving}>
            {isUpdating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
