import useSWR from 'swr';
import type { TradeStatus } from '@/modules/trades/types';
import type { TrustGrade } from '@/modules/trust/types';

interface TradePartner {
  id: string;
  name: string | null;
  image: string | null;
  trustGrade: TrustGrade | null;
}

export interface MyTrade {
  id: string;
  roomSlug: string;
  status: TradeStatus;
  partner: TradePartner | null;
  myItemCount: number;
  theirItemCount: number;
  isInitiator: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UseMyTradesResult {
  trades: MyTrade[];
  activeTrades: MyTrade[];
  completedTrades: MyTrade[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('取引一覧の取得に失敗しました');
  }
  return res.json();
};

export function useMyTrades(): UseMyTradesResult {
  const { data, error, isLoading, mutate } = useSWR<{ trades: MyTrade[] }>(
    '/api/me/trades',
    fetcher
  );

  const trades = data?.trades ?? [];
  const activeTrades = trades.filter((t) => ['draft', 'proposed', 'agreed'].includes(t.status));
  const completedTrades = trades.filter((t) =>
    ['completed', 'canceled', 'disputed', 'expired'].includes(t.status)
  );

  return {
    trades,
    activeTrades,
    completedTrades,
    isLoading,
    error: error ?? null,
    refetch: () => mutate(),
  };
}
