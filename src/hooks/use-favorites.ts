'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  FavoriteCheckResult,
  UserFavoriteCard,
  UserFavoriteUser,
} from '@/modules/favorites/types';

interface UseFavoritesReturn {
  favoriteCards: UserFavoriteCard[];
  favoriteUsers: UserFavoriteUser[];
  isLoading: boolean;
  error: Error | null;

  // カード操作
  addFavoriteCard: (cardId: string) => Promise<void>;
  removeFavoriteCard: (cardId: string) => Promise<void>;
  isCardFavorited: (cardId: string) => boolean;
  toggleFavoriteCard: (cardId: string) => Promise<void>;

  // ユーザー操作
  addFavoriteUser: (userId: string) => Promise<void>;
  removeFavoriteUser: (userId: string) => Promise<void>;
  isUserFavorited: (userId: string) => boolean;
  toggleFavoriteUser: (userId: string) => Promise<void>;

  // バッチチェック
  checkFavorites: (cardIds: string[], userIds: string[]) => Promise<FavoriteCheckResult>;

  refetch: () => Promise<void>;
}

export function useFavorites(): UseFavoritesReturn {
  const [favoriteCards, setFavoriteCards] = useState<UserFavoriteCard[]>([]);
  const [favoriteUsers, setFavoriteUsers] = useState<UserFavoriteUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFavorites = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [cardsRes, usersRes] = await Promise.all([
        fetch('/api/me/favorites/cards'),
        fetch('/api/me/favorites/users'),
      ]);

      if (!cardsRes.ok || !usersRes.ok) {
        throw new Error('Failed to fetch favorites');
      }

      const [cardsData, usersData] = await Promise.all([cardsRes.json(), usersRes.json()]);

      setFavoriteCards(cardsData.favoriteCards || []);
      setFavoriteUsers(usersData.favoriteUsers || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // お気に入りカードIDのSet（高速な検索用）
  const favoriteCardIds = useMemo(
    () => new Set(favoriteCards.map((fc) => fc.cardId)),
    [favoriteCards]
  );

  // お気に入りユーザーIDのSet（高速な検索用）
  const favoriteUserIds = useMemo(
    () => new Set(favoriteUsers.map((fu) => fu.favoriteUserId)),
    [favoriteUsers]
  );

  // カード操作
  const addFavoriteCard = useCallback(
    async (cardId: string) => {
      const res = await fetch('/api/me/favorites/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add favorite card');
      }
      await fetchFavorites();
    },
    [fetchFavorites]
  );

  const removeFavoriteCard = useCallback(
    async (cardId: string) => {
      const res = await fetch(`/api/me/favorites/cards?cardId=${encodeURIComponent(cardId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove favorite card');
      }
      await fetchFavorites();
    },
    [fetchFavorites]
  );

  const isCardFavorited = useCallback(
    (cardId: string) => favoriteCardIds.has(cardId),
    [favoriteCardIds]
  );

  const toggleFavoriteCard = useCallback(
    async (cardId: string) => {
      if (isCardFavorited(cardId)) {
        await removeFavoriteCard(cardId);
      } else {
        await addFavoriteCard(cardId);
      }
    },
    [isCardFavorited, addFavoriteCard, removeFavoriteCard]
  );

  // ユーザー操作
  const addFavoriteUser = useCallback(
    async (userId: string) => {
      const res = await fetch('/api/me/favorites/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add favorite user');
      }
      await fetchFavorites();
    },
    [fetchFavorites]
  );

  const removeFavoriteUser = useCallback(
    async (userId: string) => {
      const res = await fetch(`/api/me/favorites/users?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove favorite user');
      }
      await fetchFavorites();
    },
    [fetchFavorites]
  );

  const isUserFavorited = useCallback(
    (userId: string) => favoriteUserIds.has(userId),
    [favoriteUserIds]
  );

  const toggleFavoriteUser = useCallback(
    async (userId: string) => {
      if (isUserFavorited(userId)) {
        await removeFavoriteUser(userId);
      } else {
        await addFavoriteUser(userId);
      }
    },
    [isUserFavorited, addFavoriteUser, removeFavoriteUser]
  );

  // バッチチェック
  const checkFavorites = useCallback(
    async (cardIds: string[], userIds: string[]): Promise<FavoriteCheckResult> => {
      const res = await fetch('/api/me/favorites/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardIds, userIds }),
      });
      if (!res.ok) {
        throw new Error('Failed to check favorites');
      }
      return res.json();
    },
    []
  );

  return {
    favoriteCards,
    favoriteUsers,
    isLoading,
    error,
    addFavoriteCard,
    removeFavoriteCard,
    isCardFavorited,
    toggleFavoriteCard,
    addFavoriteUser,
    removeFavoriteUser,
    isUserFavorited,
    toggleFavoriteUser,
    checkFavorites,
    refetch: fetchFavorites,
  };
}
