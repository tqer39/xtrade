'use client'

import { useState } from 'react'
import type { UserHaveCard, UserWantCard } from '@/modules/cards/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Minus, Plus, Trash2 } from 'lucide-react'

interface CardListItemProps {
  item: UserHaveCard | UserWantCard
  type: 'have' | 'want'
  onUpdate?: (cardId: string, value: number) => Promise<void>
  onDelete?: (cardId: string) => Promise<void>
}

export function CardListItem({ item, type, onUpdate, onDelete }: CardListItemProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const card = item.card

  if (!card) {
    return null
  }

  const isHave = type === 'have'
  const haveItem = isHave ? (item as UserHaveCard) : null
  const wantItem = !isHave ? (item as UserWantCard) : null

  const handleQuantityChange = async (delta: number) => {
    if (!onUpdate || !haveItem) return
    const newQuantity = Math.max(1, haveItem.quantity + delta)
    setIsUpdating(true)
    try {
      await onUpdate(card.id, newQuantity)
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePriorityChange = async (value: string) => {
    if (!onUpdate) return
    setIsUpdating(true)
    try {
      await onUpdate(card.id, parseInt(value, 10))
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setIsDeleting(true)
    try {
      await onDelete(card.id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {card.imageUrl && (
            <img
              src={card.imageUrl}
              alt={card.name}
              className="w-16 h-16 object-cover rounded"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{card.name}</div>
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
          <div className="flex items-center gap-2">
            {isHave && haveItem && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={isUpdating || haveItem.quantity <= 1}
                  aria-label="数量を減らす"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-semibold">{haveItem.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleQuantityChange(1)}
                  disabled={isUpdating}
                  aria-label="数量を増やす"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
            {!isHave && wantItem && (
              <Select
                value={wantItem.priority?.toString() ?? '5'}
                onValueChange={handlePriorityChange}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-24" aria-label="優先度">
                  <SelectValue placeholder="優先度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 (低)</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5 (中)</SelectItem>
                  <SelectItem value="6">6</SelectItem>
                  <SelectItem value="7">7</SelectItem>
                  <SelectItem value="8">8</SelectItem>
                  <SelectItem value="9">9</SelectItem>
                  <SelectItem value="10">10 (高)</SelectItem>
                </SelectContent>
              </Select>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  disabled={isDeleting}
                  aria-label="削除"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>カードを削除しますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    「{card.name}」を{isHave ? '持っているカード' : '欲しいカード'}から削除します。
                    この操作は取り消せません。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>削除</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
