'use client';

import useSWR from 'swr';

import type { UserSubscription } from '@/modules/subscription/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * サブスクリプション状態を取得するフック
 */
export function useSubscription() {
  const { data, error, isLoading, mutate } = useSWR<UserSubscription>('/api/subscription', fetcher);

  return {
    subscription: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Checkout セッションを作成してリダイレクト
 */
export async function redirectToCheckout(plan: 'basic' | 'premium'): Promise<void> {
  const response = await fetch('/api/subscription/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan }),
  });

  const data = await response.json();

  if (data.url) {
    window.location.href = data.url;
  } else {
    throw new Error(data.error || 'Failed to create checkout session');
  }
}

/**
 * カスタマーポータルにリダイレクト
 */
export async function redirectToPortal(): Promise<void> {
  const response = await fetch('/api/subscription/portal', {
    method: 'POST',
  });

  const data = await response.json();

  if (data.url) {
    window.location.href = data.url;
  } else {
    throw new Error(data.error || 'Failed to create portal session');
  }
}
