'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { UserHaveCard, UserWantCard } from '@/modules/cards/types';

interface CardListItemProps {
  item: UserHaveCard | UserWantCard;
  type: 'have' | 'want';
}

export function CardListItem({ item, type }: CardListItemProps) {
  const card = item.card;

  if (!card) {
    return null;
  }

  const isHave = type === 'have';
  const haveItem = isHave ? (item as UserHaveCard) : null;
  const wantItem = !isHave ? (item as UserWantCard) : null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {card.imageUrl && (
            <img src={card.imageUrl} alt={card.name} className="w-16 h-16 object-cover rounded" />
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
          <div className="text-right">
            {isHave && haveItem && (
              <div className="text-sm text-muted-foreground">
                数量: <span className="font-semibold">{haveItem.quantity}</span>
              </div>
            )}
            {!isHave && wantItem && wantItem.priority !== null && (
              <div className="text-sm text-muted-foreground">
                優先度: <span className="font-semibold">{wantItem.priority}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
