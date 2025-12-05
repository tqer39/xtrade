'use client'

import { useState } from 'react'
import type { CardSet } from '@/modules/cards/types'
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
import { Trash2, Eye, EyeOff, ChevronRight } from 'lucide-react'

interface SetListItemProps {
  set: CardSet
  onSelect: (setId: string) => void
  onDelete: (setId: string) => Promise<void>
}

export function SetListItem({ set, onSelect, onDelete }: SetListItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(set.id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => onSelect(set.id)}
          >
            <div className="font-semibold truncate">{set.name}</div>
            {set.description && (
              <div className="text-sm text-muted-foreground truncate mt-1">
                {set.description}
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={set.isPublic ? 'default' : 'secondary'} className="text-xs">
                {set.isPublic ? (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    公開
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3 w-3 mr-1" />
                    非公開
                  </>
                )}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onSelect(set.id)}
              aria-label="詳細を見る"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
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
                  <AlertDialogTitle>セットを削除しますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    「{set.name}」を削除します。この操作は取り消せません。
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
