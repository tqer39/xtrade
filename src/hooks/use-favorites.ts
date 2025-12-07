'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from '@/lib/auth-client';
import type {
  FavoriteCheckResult,
  UserFavoriteCard,
  UserFavoriteUser,
} from '@/modules/favorites/types';

const LOCAL_STORAGE_KEY_CARDS = 'xtrade_favorite_cards';
const LOCAL_STORAGE_KEY_USERS = 'xtrade_favorite_users';

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

// localStorage から読み込み
function getLocalStorageCards(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_CARDS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function getLocalStorageUsers(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_USERS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// localStorage に保存
function setLocalStorageCards(cardIds: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEY_CARDS, JSON.stringify(cardIds));
}

function setLocalStorageUsers(userIds: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEY_USERS, JSON.stringify(userIds));
}

// localStorage をクリア
function clearLocalStorage() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOCAL_STORAGE_KEY_CARDS);
  localStorage.removeItem(LOCAL_STORAGE_KEY_USERS);
}

export function useFavorites(): UseFavoritesReturn {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const syncedRef = useRef(false);

  const [favoriteCards, setFavoriteCards] = useState<UserFavoriteCard[]>([]);
  const [favoriteUsers, setFavoriteUsers] = useState<UserFavoriteUser[]>([]);
  const [localCardIds, setLocalCardIds] = useState<string[]>([]);
  const [localUserIds, setLocalUserIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // localStorage からの初期化（ゲスト用）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLocalCardIds(getLocalStorageCards());
      setLocalUserIds(getLocalStorageUsers());
    }
  }, []);

  const fetchFavorites = useCallback(async () => {
    if (!isLoggedIn) {
      // ゲストの場合は localStorage から読み込み済み
      setIsLoading(false);
      return;
    }

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
  }, [isLoggedIn]);

  // ログイン時に localStorage → DB 同期
  const syncLocalStorageToDB = useCallback(async () => {
    const localCards = getLocalStorageCards();
    const localUsers = getLocalStorageUsers();

    if (localCards.length === 0 && localUsers.length === 0) {
      return;
    }

    // カードを同期
    for (const cardId of localCards) {
      try {
        await fetch('/api/me/favorites/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardId }),
        });
      } catch {
        // エラーは無視（既に存在する場合など）
      }
    }

    // ユーザーを同期
    for (const userId of localUsers) {
      try {
        await fetch('/api/me/favorites/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
      } catch {
        // エラーは無視
      }
    }

    // 同期完了後に localStorage をクリア
    clearLocalStorage();
    setLocalCardIds([]);
    setLocalUserIds([]);
  }, []);

  useEffect(() => {
    if (isLoggedIn && !syncedRef.current) {
      syncedRef.current = true;
      syncLocalStorageToDB().then(() => fetchFavorites());
    } else if (isLoggedIn) {
      fetchFavorites();
    } else {
      setIsLoading(false);
    }
  }, [isLoggedIn, syncLocalStorageToDB, fetchFavorites]);

  // お気に入りカードIDのSet（高速な検索用）
  const favoriteCardIds = useMemo(() => {
    if (isLoggedIn) {
      return new Set(favoriteCards.map((fc) => fc.cardId));
    }
    return new Set(localCardIds);
  }, [isLoggedIn, favoriteCards, localCardIds]);

  // お気に入りユーザーIDのSet（高速な検索用）
  const favoriteUserIds = useMemo(() => {
    if (isLoggedIn) {
      return new Set(favoriteUsers.map((fu) => fu.favoriteUserId));
    }
    return new Set(localUserIds);
  }, [isLoggedIn, favoriteUsers, localUserIds]);

  // カード操作
  const addFavoriteCard = useCallback(
    async (cardId: string) => {
      if (!isLoggedIn) {
        // ゲスト: localStorage に保存
        const newIds = [...localCardIds, cardId];
        setLocalStorageCards(newIds);
        setLocalCardIds(newIds);
        return;
      }

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
    [isLoggedIn, localCardIds, fetchFavorites]
  );

  const removeFavoriteCard = useCallback(
    async (cardId: string) => {
      if (!isLoggedIn) {
        // ゲスト: localStorage から削除
        const newIds = localCardIds.filter((id) => id !== cardId);
        setLocalStorageCards(newIds);
        setLocalCardIds(newIds);
        return;
      }

      const res = await fetch(`/api/me/favorites/cards?cardId=${encodeURIComponent(cardId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove favorite card');
      }
      await fetchFavorites();
    },
    [isLoggedIn, localCardIds, fetchFavorites]
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
      if (!isLoggedIn) {
        // ゲスト: localStorage に保存
        const newIds = [...localUserIds, userId];
        setLocalStorageUsers(newIds);
        setLocalUserIds(newIds);
        return;
      }

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
    [isLoggedIn, localUserIds, fetchFavorites]
  );

  const removeFavoriteUser = useCallback(
    async (userId: string) => {
      if (!isLoggedIn) {
        // ゲスト: localStorage から削除
        const newIds = localUserIds.filter((id) => id !== userId);
        setLocalStorageUsers(newIds);
        setLocalUserIds(newIds);
        return;
      }

      const res = await fetch(`/api/me/favorites/users?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove favorite user');
      }
      await fetchFavorites();
    },
    [isLoggedIn, localUserIds, fetchFavorites]
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
      if (!isLoggedIn) {
        // ゲスト: localStorage から確認
        const cards: Record<string, boolean> = {};
        const users: Record<string, boolean> = {};
        for (const id of cardIds) {
          cards[id] = localCardIds.includes(id);
        }
        for (const id of userIds) {
          users[id] = localUserIds.includes(id);
        }
        return { cards, users };
      }

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
    [isLoggedIn, localCardIds, localUserIds]
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
