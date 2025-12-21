import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// SWR をモック
vi.mock('swr', () => ({
  default: vi.fn(),
}));

// fetch をモック
global.fetch = vi.fn();

// window.location をモック
const mockLocation = { href: '' };
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('useSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
  });

  it('サブスクリプション情報を取得', async () => {
    const mockSubscription = {
      plan: 'basic',
      status: 'active',
      currentPeriodEnd: '2024-12-31',
    };

    const mockUseSWR = (await import('swr')).default as ReturnType<typeof vi.fn>;
    mockUseSWR.mockReturnValue({
      data: mockSubscription,
      error: null,
      isLoading: false,
      mutate: vi.fn(),
    });

    const { useSubscription } = await import('../use-subscription');
    const { result } = renderHook(() => useSubscription());

    expect(result.current.subscription).toEqual(mockSubscription);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('ローディング状態を正しく返す', async () => {
    const mockUseSWR = (await import('swr')).default as ReturnType<typeof vi.fn>;
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: true,
      mutate: vi.fn(),
    });

    const { useSubscription } = await import('../use-subscription');
    const { result } = renderHook(() => useSubscription());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.subscription).toBeUndefined();
  });

  it('エラー状態を正しく返す', async () => {
    const mockError = new Error('Subscription error');
    const mockUseSWR = (await import('swr')).default as ReturnType<typeof vi.fn>;
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
      mutate: vi.fn(),
    });

    const { useSubscription } = await import('../use-subscription');
    const { result } = renderHook(() => useSubscription());

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(mockError);
  });
});

describe('redirectToCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
  });

  it('checkout URL にリダイレクト', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () => Promise.resolve({ url: 'https://checkout.stripe.com/session123' }),
    });

    const { redirectToCheckout } = await import('../use-subscription');
    await redirectToCheckout('basic');

    expect(global.fetch).toHaveBeenCalledWith('/api/subscription/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: 'basic' }),
    });
    expect(mockLocation.href).toBe('https://checkout.stripe.com/session123');
  });

  it('URL がない場合エラー', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () => Promise.resolve({ error: 'No active subscription' }),
    });

    const { redirectToCheckout } = await import('../use-subscription');

    await expect(redirectToCheckout('premium')).rejects.toThrow('No active subscription');
  });

  it('デフォルトエラーメッセージ', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () => Promise.resolve({}),
    });

    const { redirectToCheckout } = await import('../use-subscription');

    await expect(redirectToCheckout('basic')).rejects.toThrow('Failed to create checkout session');
  });
});

describe('redirectToPortal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
  });

  it('portal URL にリダイレクト', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () => Promise.resolve({ url: 'https://billing.stripe.com/portal123' }),
    });

    const { redirectToPortal } = await import('../use-subscription');
    await redirectToPortal();

    expect(global.fetch).toHaveBeenCalledWith('/api/subscription/portal', {
      method: 'POST',
    });
    expect(mockLocation.href).toBe('https://billing.stripe.com/portal123');
  });

  it('URL がない場合エラー', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () => Promise.resolve({ error: 'Portal error' }),
    });

    const { redirectToPortal } = await import('../use-subscription');

    await expect(redirectToPortal()).rejects.toThrow('Portal error');
  });

  it('デフォルトエラーメッセージ', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () => Promise.resolve({}),
    });

    const { redirectToPortal } = await import('../use-subscription');

    await expect(redirectToPortal()).rejects.toThrow('Failed to create portal session');
  });
});
