'use client';

import { ImageIcon, Loader2, Trash2 } from 'lucide-react';
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
  const [priority, setPriority] = useState<number | null>(null);

  // モーダルが開いたときに初期値をセット
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && item) {
      if (type === 'want') {
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
      const value = priority ?? 0;
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isHave ? '持っているアイテムを編集' : '欲しいアイテムを編集'}</DialogTitle>
          <DialogDescription>
            {isHave ? 'アイテムの削除ができます' : '優先度を変更できます'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* アイテム情報 */}
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

          {/* 優先度の編集（want のみ） */}
          {!isHave && (
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
          {!isHave && (
            <Button onClick={handleUpdate} disabled={isUpdating || isRemoving}>
              {isUpdating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              保存
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
