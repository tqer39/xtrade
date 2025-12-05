'use client';

import { Heart, User } from 'lucide-react';
import Image from 'next/image';
import { LoginButton } from '@/components/auth/login-button';
import { FavoriteButton } from '@/components/favorites';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFavorites } from '@/hooks/use-favorites';
import { useSession } from '@/lib/auth-client';
import type { UserFavoriteCard, UserFavoriteUser } from '@/modules/favorites/types';

function FavoriteCardItem({
  favoriteCard,
  onRemove,
}: {
  favoriteCard: UserFavoriteCard;
  onRemove: (cardId: string) => Promise<void>;
}) {
  const card = favoriteCard.card;

  if (!card) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {card.imageUrl ? (
            <Image
              src={card.imageUrl}
              alt={card.name}
              width={64}
              height={64}
              className="w-16 h-16 object-cover rounded"
            />
          ) : (
            <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
              <span className="text-2xl">🃏</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{card.name}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              <Badge variant="secondary">{card.category}</Badge>
              {card.rarity && <Badge variant="outline">{card.rarity}</Badge>}
            </div>
          </div>
          <FavoriteButton isFavorited={true} onToggle={() => onRemove(favoriteCard.cardId)} />
        </div>
      </CardContent>
    </Card>
  );
}

function FavoriteUserItem({
  favoriteUser,
  onRemove,
}: {
  favoriteUser: UserFavoriteUser;
  onRemove: (userId: string) => Promise<void>;
}) {
  const user = favoriteUser.favoriteUser;

  if (!user) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user.name}</p>
            {user.twitterUsername && (
              <p className="text-sm text-muted-foreground">@{user.twitterUsername}</p>
            )}
            {user.trustGrade && (
              <Badge variant="outline" className="mt-1">
                信頼度: {user.trustGrade}
              </Badge>
            )}
          </div>
          <FavoriteButton
            isFavorited={true}
            onToggle={() => onRemove(favoriteUser.favoriteUserId)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function FavoritesPageClient() {
  const { data: session, isPending: isSessionPending } = useSession();
  const { favoriteCards, favoriteUsers, isLoading, removeFavoriteCard, removeFavoriteUser } =
    useFavorites();

  if (isSessionPending) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-12 w-full mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">お気に入り</h1>
        <div className="text-center py-12">
          <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">ログインして、お気に入りを管理しましょう</p>
          <LoginButton />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">お気に入り</h1>

      <Tabs defaultValue="cards">
        <TabsList className="mb-4">
          <TabsTrigger value="cards" className="gap-2">
            <span>🃏</span>
            カード ({favoriteCards.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <User className="w-4 h-4" />
            ユーザー ({favoriteUsers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cards">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : favoriteCards.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">お気に入りのカードはまだありません</p>
              <p className="text-sm text-muted-foreground mt-2">
                検索結果やマッチング画面からカードをお気に入りに追加できます
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {favoriteCards.map((fc) => (
                <FavoriteCardItem key={fc.id} favoriteCard={fc} onRemove={removeFavoriteCard} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="users">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : favoriteUsers.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">お気に入りのユーザーはまだいません</p>
              <p className="text-sm text-muted-foreground mt-2">
                マッチング画面からユーザーをお気に入りに追加できます
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {favoriteUsers.map((fu) => (
                <FavoriteUserItem key={fu.id} favoriteUser={fu} onRemove={removeFavoriteUser} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
